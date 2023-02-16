package functions

import (
	"fmt"
)

type data struct {
	message ChatFields
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
	broadcast chan data

	// Register requests from the connections.
	register chan subscription

	// Unregister requests from connections.
	unregister chan subscription
}

var H = hub{
	broadcast:  make(chan data),
	register:   make(chan subscription),
	unregister: make(chan subscription),
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
				h.rooms[s.room][&s] = true
			} else {
				userConnections := h.user[s.name]
				if userConnections == nil {
					userConnections = make(map[*subscription]bool)
					h.user[s.name] = userConnections
				}
				h.user[s.name][&s] = true
			}
		case s := <-h.unregister:
			if s.room != "" {
				roomConnections := h.rooms[s.room]
				if roomConnections != nil {
					if _, ok := roomConnections[&s]; ok {
						fmt.Println(s.name, "this user closed the ws connection for chat.")
						delete(roomConnections, &s)
						close(s.conn.send)
						if len(roomConnections) == 0 {
							delete(h.rooms, s.room)
						}
					}
				}
			} else {
				userConnections := h.user[s.name]
				if userConnections != nil {
					if _, ok := userConnections[&s]; ok {
						fmt.Println(s.name, "this user closed browser.")
						delete(userConnections, &s)
						close(s.conn.send)
						if len(userConnections) == 0 {
							delete(h.user, s.name)
						}
					}
				}
			}
		case m := <-h.broadcast:
			if m.message.MessageId != "" {
				subscriptions := h.rooms[m.message.Id]
				for c := range subscriptions {
					select {
					case c.conn.send <- m.message:
					default:
						close(c.conn.send)
						delete(subscriptions, c)
						if len(subscriptions) == 0 {
							delete(h.rooms, m.message.Id)
						}
					}
				}
			}
			// else if etc

		}
	}
}

type sqlExecute struct {
	messages chan ChatFields
	//notifications chan NotifcationFields

	//followers chan FollowersFields

	//delete&add users from groupchat.

	//add  otherfields like followers, sessions
}

var SqlExec = sqlExecute{
	messages: make(chan ChatFields),
}

func (d *sqlExecute) ExecuteStatements() {
	for {
		select {
		case messages := <-SqlExec.messages:
			fmt.Println(messages)
			AddMessage(messages)
		}
	}
	//for notifications := range SqlExec.followers{
	//run the updateNotification from sql here...
	//}
}
