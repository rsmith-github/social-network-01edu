package functions

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}
var wg sync.WaitGroup

// connection is an middleman between the websocket connection and the hub.
type connection struct {
	// The websocket connection.
	ws *websocket.Conn

	// Buffered channel of outbound messages.
	send chan message
}

func (data *message) setFieldType(dataFromWs []byte) error {
	//chat data
	var chatFields ChatFields
	errReadingChat := json.Unmarshal(dataFromWs, &chatFields)
	if errReadingChat != nil {
		return errReadingChat
	} else if chatFields != (ChatFields{}) {
		data.incomingData = chatFields
		return nil
	}
	//notification data
	var notifFields ChatNotifcationFields
	errReadingNotif := json.Unmarshal(dataFromWs, &notifFields)
	if errReadingNotif != nil {
		return errReadingNotif
	} else if notifFields != (ChatNotifcationFields{}) {
		data.incomingData = notifFields
		return nil
	}
	var followFields followMessage
	errReadingFollow := json.Unmarshal(dataFromWs, &followFields)
	if errReadingFollow != nil {
		return errReadingFollow
	} else if followFields != (followMessage{}) {
		data.incomingData = followFields
		return nil
	}
	var groupFields GroupFields
	errReadingGroup := json.Unmarshal(dataFromWs, &groupFields)
	if errReadingGroup != nil {
		return errReadingGroup
	} else if groupFields != (GroupFields{}) {
		data.incomingData = groupFields
		return nil
	}
	var groupPostFields GroupPostFields
	errReadingGroupPost := json.Unmarshal(dataFromWs, &groupPostFields)
	if errReadingGroupPost != nil {
		return errReadingGroupPost
	} else if groupPostFields != (GroupPostFields{}) {
		data.incomingData = groupPostFields
		return nil
	}
	var resetRequest RequestNotifcationFields
	errReadingResetRequest := json.Unmarshal(dataFromWs, &resetRequest)
	if errReadingResetRequest != nil {
		return errReadingResetRequest
	} else if resetRequest != (RequestNotifcationFields{}) {
		data.incomingData = resetRequest
		return nil
	}
	//add else if conditions for other fields like notification, followers etc...
	return nil
}

// readPump pumps messages from the websocket connection to the hub.
func (s *subscription) readPump() {
	c := s.conn
	defer func() {
		H.unregister <- s
		c.ws.Close()
	}()
	for {
		var data message
		_, wsMessage, err := c.ws.ReadMessage()
		errorSettingType := data.setFieldType(wsMessage)

		if err != nil || errorSettingType != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
				log.Printf("error: %v", err)
			} else {
				fmt.Println(errorSettingType, err)
			}
			return
		}

		switch data.incomingData.(type) {
		case ChatFields:
			chatData := data.incomingData.(ChatFields)
			chatData.Id = s.room
			chatData.MessageId = Generate()

			//send notifications to online users
			chatRoom := GetChatRoom(s.room, s.name)
			usersInChat := strings.Split(chatRoom.Users, ",")
			notifSent := make(map[string]bool)
			for loggedInUsers := range H.user {
				for chatSubs := range H.rooms[s.room] {
					if Contains(usersInChat, loggedInUsers) {
						//+1 because the client's name is removed from the button
						if loggedInUsers != chatSubs.name && len(usersInChat)+1 > len(H.rooms[s.room]) {
							for userSub := range H.user[loggedInUsers] {
								checkIfNotifExists := GetChatNotif(userSub.name, chatData.Sender, s.room)
								if checkIfNotifExists != (ChatNotifcationFields{}) {
									checkIfNotifExists.NumOfMessages++
									checkIfNotifExists.Date = chatData.Date
									SqlExec.chatNotifData <- checkIfNotifExists
									sendNotif := message{incomingData: checkIfNotifExists}
									userSub.conn.send <- sendNotif
									notifSent[userSub.name] = true
									fmt.Println("sending an exsisting notification in db")
								} else {
									newNotification := ChatNotifcationFields{
										ChatId:        chatData.Id,
										Sender:        chatData.Sender,
										Date:          chatData.Date,
										Receiver:      userSub.name,
										NumOfMessages: 1,
									}
									SqlExec.chatNotifData <- newNotification
									sendNotif := message{incomingData: newNotification}
									userSub.conn.send <- sendNotif
									notifSent[userSub.name] = true
									fmt.Println("sending new notification.")
								}

							}
						}
					}
				}
			}

			//send notifications to sql table if user is offline
			if len(usersInChat)+1 > len(H.rooms[s.room]) {
				for _, users := range usersInChat {
					if !notifSent[users] {
						checkIfNotifExists := GetChatNotif(users, chatData.Sender, s.room)
						if checkIfNotifExists != (ChatNotifcationFields{}) {
							checkIfNotifExists.NumOfMessages++
							checkIfNotifExists.Date = chatData.Date
							SqlExec.chatNotifData <- checkIfNotifExists
						} else {
							newNotification := ChatNotifcationFields{
								ChatId:        chatData.Id,
								Sender:        chatData.Sender,
								Date:          chatData.Date,
								Receiver:      users,
								NumOfMessages: 1,
							}
							SqlExec.chatNotifData <- newNotification
						}
					}
				}
			}

			//update the incomingData
			data.incomingData = chatData
			H.broadcast <- data
			SqlExec.chatData <- chatData
		case ChatNotifcationFields:
			//update notification because user opened chat
			notifData := data.incomingData.(ChatNotifcationFields)
			sliceOfNotifications := GetChatNotifications(notifData.Receiver, notifData.ChatId)
			for _, resetNotification := range sliceOfNotifications {
				resetNotification.NumOfMessages = 0
				SqlExec.chatNotifData <- resetNotification
			}
		case followMessage:
			//use the followMessage's data to go into SQL table of users and check if user is private.
			//if the user is private then send a request notification directly to their ws by accessing their subscription from H.user[toFollow]
			followData := data.incomingData.(followMessage)
			sender := GetUserFromFollowMessage(followData.FollowRequest)
			user := GetUserFromFollowMessage(followData.ToFollow)
			followData.FollowRequestUsername = sender.Nickname
			followData.FolloweeUsername = user.Nickname
			data.incomingData = followData
			if user.Status == "private" && !followData.FollowRequestAccepted {
				userSub := H.user[user.Nickname]
				followerRequestInTable := GetRequestNotifByType(user.Nickname, sender.Nickname, "followRequest")
				followerRequestExist := len(followerRequestInTable) > 0
				for s, online := range userSub {
					//check if request notification exsists and user is
					if !online && !followerRequestExist {
						SqlExec.followMessageData <- followData
					} else {
						if !followerRequestExist {
							SqlExec.followMessageData <- followData
							s.conn.send <- message{incomingData: RequestNotifcationFields{FollowRequest: followData}}
						}
					}
				}
			} else {
				H.broadcast <- data
			}
		case GroupFields:
			fmt.Println("data", data)
			H.broadcast <- data
		case GroupPostFields:
			H.broadcast <- data
		case RequestNotifcationFields:
			//delete request notifications.
			fmt.Println("request client", data)
			requestNotifcationFields := data.incomingData.(RequestNotifcationFields)
			SqlExec.RequestNotificationData <- requestNotifcationFields
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
func (s *subscription) writePump() {
	c := s.conn
	defer func() {
		c.ws.Close()
	}()
	for {
		message, ok := <-c.send
		if !ok {
			c.ws.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}
		switch message.incomingData.(type) {
		case ChatFields:
			err := c.ws.WriteJSON(message.incomingData)
			if err != nil {
				fmt.Println("error writing to websocket:", err)
				return
			}
		case ChatNotifcationFields:
			//wait for sql to execute functions...
			wg.Wait()
			notif := message.incomingData.(ChatNotifcationFields)
			notif.TotalNumber = GetTotalChatNotifs(s.name)
			err := c.ws.WriteJSON(notif)
			if err != nil {
				fmt.Println("error writing to websocket:", err)
				return
			}
		case []ChatNotifcationFields:
			notifications := message.incomingData.([]ChatNotifcationFields)
			for i := range notifications {
				notifications[i].TotalNumber = GetTotalChatNotifs(s.name)
			}
			err := c.ws.WriteJSON(notifications)
			if err != nil {
				fmt.Println("error writing to notifications to websocket:", err)
			}
		case followMessage:
			followMessage := message.incomingData.(followMessage)
			if err := c.ws.WriteJSON(followMessage); err != nil {
				log.Printf("error sending follow message: %v", err)
			}
		case followNotification:
			followNotification := message.incomingData.(followNotification)
			if err := c.ws.WriteJSON(followNotification); err != nil {
				log.Printf("error sending update message: %v", err)
			}
		case RequestNotifcationFields:
			request := message.incomingData.(RequestNotifcationFields)
			if err := c.ws.WriteJSON(request); err != nil {
				log.Printf("error sending update message: %v", err)
			}
		case GroupPostFields:
			request := message.incomingData.(GroupPostFields)
			if err := c.ws.WriteJSON(request); err != nil {
				log.Printf("error sending update message: %v", err)
			}
		case GroupFields:
			request := message.incomingData.(GroupFields)
			if err := c.ws.WriteJSON(request); err != nil {
				log.Printf("error sending update message: %v", err)
			}
		}

	}
}

// serveWs handles websocket requests from the peer.
func ServeWs(w http.ResponseWriter, r *http.Request) {
	var id string
	var user string
	var groupId string
	var chatNotifExist []ChatNotifcationFields
	var requestNotifExist []RequestNotifcationFields
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err.Error())
		return
	}
	cookie, _ := r.Cookie("session")
	if r.URL.Path == "/ws/chat" {
		id = <-chatroomId
		user = <-loggedInUsername
		groupId = ""
	} else if r.URL.Path == "/ws/group" {
		fmt.Println("here")
		id = ""
		user = LoggedInUser(r).Nickname
		groupId = <-groupRoomId
		fmt.Println("beloooww")
	} else {
		id = ""
		user = LoggedInUser(r).Nickname
		groupId = ""
		chatNotifExist = GetAllChatNotifs(user)
		requestNotifExist = GetAllRequestNotifs(user)
	}
	c := &connection{send: make(chan message), ws: ws}
	s := subscription{c, id, groupId, user, cookie.Value}
	fmt.Println(s)

	H.register <- &s
	go s.writePump()
	go s.readPump()
	if len(chatNotifExist) > 0 {
		message := message{incomingData: chatNotifExist}
		c.send <- message
	}
	if len(requestNotifExist) > 0 {
		for _, requestNotif := range requestNotifExist {
			fmt.Println(requestNotif.GroupId)
			if requestNotif.GroupId == "" {
				//get the follower's email
				db := OpenDB()
				row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", requestNotif.Sender, db, "GetUserFromFollowers")
				//...
				sender := QueryUser(row, err)
				user := LoggedInUser(r)
				followMessage := followMessage{
					ToFollow:      user.Email,
					FollowRequest: sender.Email,
					IsFollowing:   false, Followers: GetTotalFollowers(user.Email),
					FollowRequestUsername: sender.Nickname,
					FolloweeUsername:      user.Nickname,
				}
				message := message{incomingData: RequestNotifcationFields{FollowRequest: followMessage}}
				c.send <- message
			} else {
				if requestNotif.TypeOfAction == "accepted-group-request" {
					groupFields := GetGroup(requestNotif.GroupId)
					message := message{incomingData: RequestNotifcationFields{GroupAction: GroupAcceptNotification{
						User:        user,
						Admin:       groupFields.Admin,
						Action:      true,
						GroupName:   groupFields.Name,
						GroupAvatar: groupFields.Avatar,
					}}}
					c.send <- message
				} else if requestNotif.TypeOfAction == "remove-group-request" {
					groupFields := GetGroup(requestNotif.GroupId)
					message := message{incomingData: RequestNotifcationFields{GroupAction: GroupAcceptNotification{
						User:        user,
						Admin:       groupFields.Admin,
						Action:      false,
						GroupName:   groupFields.Name,
						GroupAvatar: groupFields.Avatar,
					}}}
					c.send <- message
				} else if requestNotif.TypeOfAction == "groupRequest" {
					groupFields := GetGroup(requestNotif.GroupId)
					message := message{incomingData: RequestNotifcationFields{GroupRequest: groupFields}}
					c.send <- message
				}

			}
		}
	}
}
