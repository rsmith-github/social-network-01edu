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
	rooms map[string]map[*connection]bool

	// all the active users online
	user map[string]map[*connection]bool

	// Inbound messages from the connections.
	broadcast chan data

	// Register requests from the connections.
	register chan subscription

	// Unregister requests from connections.
	unregister chan subscription
}

var h = hub{
	broadcast:  make(chan data),
	register:   make(chan subscription),
	unregister: make(chan subscription),
	rooms:      make(map[string]map[*connection]bool),
	user:       make(map[string]map[*connection]bool),
}

func (h *hub) run() {
	for {
		select {
		case s := <-h.register:
			if s.room != "" {
				roomConnections := h.rooms[s.room]
				if roomConnections == nil {
					roomConnections = make(map[*connection]bool)
					h.rooms[s.room] = roomConnections
				}
				h.rooms[s.room][s.conn] = true
			} else {
				userConnections := h.user[s.name]
				if userConnections == nil {
					userConnections = make(map[*connection]bool)
					h.user[s.name] = userConnections
				}
				h.user[s.name][s.conn] = true
			}
		case s := <-h.unregister:
			if s.room != "" {
				roomConnections := h.rooms[s.room]
				if roomConnections != nil {
					if _, ok := roomConnections[s.conn]; ok {
						fmt.Println(s.name, "this user closed the ws connection for chat.")
						delete(roomConnections, s.conn)
						close(s.conn.send)
						if len(roomConnections) == 0 {
							delete(h.rooms, s.room)
						}
					}
				}
			} else {
				userConnections := h.user[s.name]
				if userConnections != nil {
					if _, ok := userConnections[s.conn]; ok {
						fmt.Println(s.name, "this user closed browser.")
						delete(userConnections, s.conn)
						close(s.conn.send)
						if len(userConnections) == 0 {
							delete(h.user, s.name)
						}
					}
				}
			}
		case m := <-h.broadcast:
			if m.message.MessageId != "" {
				connections := h.rooms[m.message.Id]
				for c := range connections {
					select {
					case c.send <- m.message:
					default:
						close(c.send)
						delete(connections, c)
						if len(connections) == 0 {
							delete(h.rooms, m.message.Id)
						}
					}
				}
			}
			// else if etc

		}
	}
}

// type statusHub struct {
// 	// Registered clients.
// 	onlineClients map[*onlineClients]bool

// 	//write notification when a message is recieved
// 	// notify chan map[string]*notif.NotifFields

// 	// Register requests from the clients.
// 	register chan *onlineClients

// 	// Unregister requests from clients.
// 	unregister chan *onlineClients

// 	//post data
// 	// postArray chan posts.PostFields
// }

// var statusH = &statusHub{
// 	onlineClients: make(map[*onlineClients]bool),
// 	// notify:        make(chan map[string]*notif.NotifFields),
// 	register:      make(chan *onlineClients),
// 	unregister:    make(chan *onlineClients),
// 	// postArray:     make(chan posts.PostFields),
// }

// func (statusH *statusHub) run() {
// 	for {
// 		select {
// 		case client := <-statusH.register:
// 			statusH.onlineClients[client] = true
// 			fmt.Println("added client to map.")
// 		case client := <-statusH.unregister:
// 			if _, ok := statusH.onlineClients[client]; ok {
// 				delete(statusH.onlineClients, client)
// 				// close(client.sendNotification)
// 				// close(client.sendPostArray)
// 				fmt.Println("deleted this client off the maps:", client.name)
// 			}
// 		// case notif := <-statusH.notify:
// 		// 	for name := range notif {
// 		// 		for onlineClient := range statusH.onlineClients {
// 		// 			if name == onlineClient.name {
// 		// 				onlineClient.sendNotification <- notif[onlineClient.name]
// 		// 			}
// 		// 		}
// 		// 	}
// 		}
// 	}
// }
