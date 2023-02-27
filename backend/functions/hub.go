package functions

import (
	"fmt"
)

type message struct {
	incomingData interface{}
	// add other fields with respective struct
	//  for follower,notifications, friend request etc
}

type subscription struct {
	conn      *connection
	room      string
	name      string
	sessionId string
}

// hub maintains the set of active connections and broadcasts messages to the
// connections.
type hub struct {
	// Registered connections.
	rooms map[string]map[*subscription]bool

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
				db := OpenDB()
				row, err := PreparedQuery("SELECT * FROM users WHERE email = ?", followData.ToFollow, db, "GetUserFromFollowers")
				followee := h.user[QueryUser(row, err).Nickname]
				for s := range followee {
					s.conn.send <- m
				}
			}
			// else if etc
		}
	}
}

type sqlExecute struct {
	chatData  chan ChatFields
	notifData chan NotifFields
	//notifications chan NotifcationFields

	//followers chan FollowersFields

	//delete&add users from groupchat.

	//add  otherfields like followers, sessions
}

var SqlExec = sqlExecute{
	chatData:  make(chan ChatFields),
	notifData: make(chan NotifFields),
}

func (d *sqlExecute) ExecuteStatements() {
	for {
		select {
		case chat := <-SqlExec.chatData:
			AddMessage(chat)
		case notif := <-SqlExec.notifData:
			wg.Add(1)
			checkIfNotifExists := GetChatNotif(notif.Receiver, notif.Sender, notif.ChatId)
			if notif.Sender != "" && checkIfNotifExists == (NotifFields{}) {
				fmt.Println(notif.Receiver, "this is the notif added to table.")
				AddNotif(notif)
				wg.Done()
				fmt.Println("added new notifications to table")
			} else {
				UpdateNotif(notif)
				wg.Done()
				fmt.Println("updated Notification")
			}
		}
	}
	//for notifications := range SqlExec.followers{
	//run the updateNotification from sql here...
	//}
}
