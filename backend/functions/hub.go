package functions

import (
	"fmt"
	"log"
	"strings"
)

type message struct {
	incomingData interface{}
	// add other fields with respective struct
	//  for follower,notifications, friend request etc
}

type subscription struct {
	conn      *connection
	room      string
	groupRoom string
	name      string
	sessionId string
}

// hub maintains the set of active connections and broadcasts messages to the
// connections.
type hub struct {
	// Registered connections.
	rooms map[string]map[*subscription]bool

	groupRooms map[string]map[*subscription]bool

	// all the active users online
	user map[string]map[*subscription]bool

	// Inbound messages from the connections.
	broadcast chan message

	// Register requests from the connections.
	register chan *subscription

	// Unregister requests from connections.
	unregister chan *subscription
}

var H = hub{
	broadcast:  make(chan message),
	register:   make(chan *subscription),
	unregister: make(chan *subscription),
	rooms:      make(map[string]map[*subscription]bool),
	groupRooms: make(map[string]map[*subscription]bool),
	user:       make(map[string]map[*subscription]bool),
}

func (h *hub) Run() {
	for {
		select {
		case s := <-h.register:
			if s.room != "" {
				roomConnections := h.rooms[s.room]
				if roomConnections == nil {
					roomConnections = make(map[*subscription]bool)
					h.rooms[s.room] = roomConnections
				}
				h.rooms[s.room][s] = true
			} else if s.groupRoom != "" {
				roomConnections := h.groupRooms[s.groupRoom]
				if roomConnections == nil {
					roomConnections = make(map[*subscription]bool)
					h.groupRooms[s.groupRoom] = roomConnections
				}
				h.groupRooms[s.groupRoom][s] = true
			} else {
				userConnections := h.user[s.name]
				if userConnections == nil {
					userConnections = make(map[*subscription]bool)
					h.user[s.name] = userConnections
				}
				h.user[s.name][s] = true
			}
		case s := <-h.unregister:
			if s.room != "" {
				roomConnections := h.rooms[s.room]
				if roomConnections != nil {
					if _, ok := roomConnections[s]; ok {
						fmt.Println(s.name, "this user closed the ws connection for chat.")
						delete(roomConnections, s)
						close(s.conn.send)
						if len(roomConnections) == 0 {
							delete(h.rooms, s.room)
						}
					}
				}
			} else if s.groupRoom != "" {
				roomConnections := h.groupRooms[s.groupRoom]
				if roomConnections != nil {
					if _, ok := roomConnections[s]; ok {
						fmt.Println(s.name, "this user closed the ws connection for group.")
						delete(roomConnections, s)
						close(s.conn.send)
						if len(roomConnections) == 0 {
							delete(h.groupRooms, s.groupRoom)
						}
					}
				}
			} else {
				userConnections := h.user[s.name]
				if userConnections != nil {
					if _, ok := userConnections[s]; ok {
						fmt.Println(s.name, "this user closed or logged out browser.")
						delete(userConnections, s)
						close(s.conn.send)
						if len(userConnections) == 0 {
							delete(h.user, s.name)
						}
					}
				}
			}
		case m := <-h.broadcast:
			switch m.incomingData.(type) {
			case ChatFields:
				chatData := m.incomingData.(ChatFields)
				subscriptions := h.rooms[chatData.Id]
				for s := range subscriptions {
					select {
					case s.conn.send <- m:
					default:
						close(s.conn.send)
						delete(subscriptions, s)
						if len(subscriptions) == 0 {
							delete(h.rooms, chatData.Id)
						}
					}
				}
			case followMessage:
				followData := m.incomingData.(followMessage)
				username := GetUserFromFollowMessage(followData.FollowRequest).Nickname
				follower := h.user[username]
				followData.FollowRequestUsername = username
				//update count and all dat...
				followeeFollowerCount, followerFollwingCount, err := updateFollowerCount(followData.FollowRequest, followData.ToFollow, followData.IsFollowing)
				if err != nil {
					log.Printf("error updating follower count: %v", err)
				}
				updateMsg := followNotification{UpdateUser: followData.ToFollow, Followers: followeeFollowerCount, FollowerFollowingCount: followerFollwingCount}
				for name, userSubsMap := range h.user {
					if name != username {
						for s := range userSubsMap {
							s.conn.send <- m
						}
					}
				}
				for s := range follower {
					s.conn.send <- message{incomingData: updateMsg}
					s.conn.send <- m
				}
			case GroupFields:
				groupFieldsData := m.incomingData.(GroupFields)
				potentialMembers := strings.Split(groupFieldsData.Users, ",")
				for _, member := range potentialMembers {
					var groupRequestInTable []RequestNotifcationFields
					if groupFieldsData.Action == "add user" {
						groupRequestInTable = GetRequestNotifByType(member, groupFieldsData.Admin, "groupRequest")
					} else if groupFieldsData.Action == "remove" {
						groupRequestInTable = GetRequestNotifByType(member, groupFieldsData.Admin, "remove-group-request")
					} else {
						groupRequestInTable = GetRequestNotifByType(member, groupFieldsData.Admin, "accepted-group-request")
					}

					var groupRequestExists bool
					for i := 0; i < len(groupRequestInTable); i++ {
						if groupRequestInTable[i].GroupId == groupFieldsData.Id {
							groupRequestExists = true
						}
					}
					loggedInMember := h.user[member]
					for userSub, online := range loggedInMember {
						if !online && !groupRequestExists {
							notifyMemberWithGroupFieldData := groupFieldsData
							notifyMemberWithGroupFieldData.Users = member
							SqlExec.GroupFieldsData <- notifyMemberWithGroupFieldData
						} else {
							if !groupRequestExists {
								groupFieldsData.Users = member
								SqlExec.GroupFieldsData <- groupFieldsData
								userSub.conn.send <- message{incomingData: RequestNotifcationFields{GroupRequest: groupFieldsData}}
							}
						}
					}
				}
				groupFieldsData.Action = ""
			case GroupPostFields:
				groupPostData := m.incomingData.(GroupPostFields)
				subscriptions := h.groupRooms[groupPostData.Id]
				for s := range subscriptions {
					select {
					case s.conn.send <- m:
					default:
						close(s.conn.send)
						delete(subscriptions, s)
						if len(subscriptions) == 0 {
							delete(h.groupRooms, groupPostData.Id)
						}
					}
				}
			}
		}
	}
}

type sqlExecute struct {
	chatData                chan ChatFields
	chatNotifData           chan ChatNotifcationFields
	followMessageData       chan followMessage
	GroupFieldsData         chan GroupFields
	RequestNotificationData chan RequestNotifcationFields
}

var SqlExec = sqlExecute{
	chatData:                make(chan ChatFields),
	chatNotifData:           make(chan ChatNotifcationFields),
	followMessageData:       make(chan followMessage),
	GroupFieldsData:         make(chan GroupFields),
	RequestNotificationData: make(chan RequestNotifcationFields),
}

func (d *sqlExecute) ExecuteStatements() {
	for {
		select {
		case chat := <-SqlExec.chatData:
			AddMessage(chat)
		case chatNotif := <-SqlExec.chatNotifData:
			wg.Add(1)
			checkIfNotifExists := GetChatNotif(chatNotif.Receiver, chatNotif.Sender, chatNotif.ChatId)
			if chatNotif.Sender != "" && checkIfNotifExists == (ChatNotifcationFields{}) {
				fmt.Println(chatNotif.Receiver, "this is the chatNotification added to table.")
				AddChatNotif(chatNotif)
				wg.Done()
				fmt.Println("added new chatNotification to table")
			} else {
				UpdateNotif(chatNotif)
				wg.Done()
				fmt.Println("updated chatNotification")
			}
		case followNotif := <-SqlExec.followMessageData:
			user := GetUserFromFollowMessage(followNotif.ToFollow)
			sender := GetUserFromFollowMessage(followNotif.FollowRequest)
			AddRequestNotif(sender.Nickname, user.Nickname, "followRequest", "")
			fmt.Println("added request notification for follow")
		case groupFieldsData := <-SqlExec.GroupFieldsData:
			if groupFieldsData.Action == "remove" {
				// get notification. If notification already exists, do nothing. Else add
				AddRequestNotif(groupFieldsData.Admin, groupFieldsData.Users, "remove-group-request", groupFieldsData.Id)
				fmt.Println("added remove from group request notification for group")
			} else {
				// get notification. If notification already exists, do nothing. Else add
				AddRequestNotif(groupFieldsData.Admin, groupFieldsData.Users, "groupRequest", groupFieldsData.Id)
				fmt.Println("added request notification for group")
			}
		case requestNotif := <-SqlExec.RequestNotificationData:
			DeleteRequestNotif(requestNotif)
			fmt.Println("deleted request notification")
		}
	}
}
