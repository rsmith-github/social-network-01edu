package functions

import (
	"fmt"
	"log"
	"net/http"

	// "regexp"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}
var mutex = &sync.RWMutex{}

// connection is an middleman between the websocket connection and the hub.
type connection struct {
	// The websocket connection.
	ws *websocket.Conn

	// Buffered channel of outbound messages.
	send chan ChatFields
	
}

// readPump pumps messages from the websocket connection to the hub.
func (s subscription) readPump() {
	c := s.conn
	defer func() {
		h.unregister <- s
		c.ws.Close()
	}()
	// var notifMap = make(map[string]*notif.NotifFields)
	for {
		var chatFields ChatFields
		err := c.ws.ReadJSON(&chatFields)
		chatFields.Id = s.room
		chatFields.MessageId = Generate()
		fmt.Println(chatFields)

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
				log.Printf("error: %v", err)
			}
			// filter.delete(s.sessionId)
			return
		}
		m := data{chatFields}
		// AddMessage(chatFields)
		h.broadcast <- m

		// //send notifications if only one user has opened a chat and messaging
		// receiverNotif := NotifTable.Get(chatFields.User1, chatFields.User2)
		// if len(h.rooms[s.room]) == 2 || s.name == receiverNotif.Receiver {
		// 	receiverNotif.NumOfMessages = 0
		// 	NotifTable.Update(receiverNotif, mutex)
		// }
		// if len(h.rooms[s.room]) == 1 {
		// 	receiverNotif.NumOfMessages++
		// 	receiverNotif.Date = chatFields.Date
		// 	NotifTable.Update(receiverNotif, mutex)
		// 	receiverNotif.TotalNumber = NotifTable.TotalNotifs(receiverNotif.Receiver)
		// 	time.Sleep(1000)
		// 	mutex.Lock()
		// 	notifMap[chatFields.User2] = &receiverNotif
		// 	mutex.Unlock()
		// 	statusH.notify <- notifMap
		// }

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
			// filter.delete(s.sessionId)
			c.ws.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}
		err := c.ws.WriteJSON(message)
		if err != nil {
			// filter.delete(s.sessionId)
			fmt.Println("error writing to chat:", err)
			return
		}
	}
}

// serveWs handles websocket requests from the peer.
func ServeWs(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err.Error())
		return
	}

	cookie, _ := r.Cookie("session")
	c := &connection{send: make(chan ChatFields, 1), ws: ws}
	s := subscription{c, <-chatroomId, <-loggedInUsername, cookie.Value}
	h.register <- s
	go s.writePump()
	go s.readPump()
}

// type onlineClients struct {
// 	ws               *websocket.Conn
// 	name             string
// 	sessionId        string
// 	// sendNotification chan *notif.NotifFields
// 	// sendPostArray    chan posts.PostFields
// 	// deletePost       chan posts.DeletePost
// 	// sendLikes        chan likes.ReturnLikesFields
// 	// sendCommentLikes chan commentsAndLikes.ReturnCommentLikesFields
// }

// // find the user connected on the websocket.
// func (onlineC *onlineClients) readPump() {
// 	defer func() {
// 		statusH.unregister <- onlineC
// 		onlineC.ws.Close()
// 	}()
// 	for {
// 		var loginData users.UserFields
// 		err := onlineC.ws.ReadJSON(&loginData)
// 		loginData = UserTable.GetUser(loginData.Username)

// 		if err != nil || websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
// 			fmt.Println("closed ws because:", err)

// 			//convert the error type into a string type then find the number
// 			//in the error and check if it is a normal closure number from client side.
// 			errorString := fmt.Sprint(err)
// 			re := regexp.MustCompile("[0-9]+")
// 			if re.FindAllString(errorString, -1)[0] == "1000" {
// 				for key, currentSess := range sessions.SessionMap.Data {
// 					if currentSess.Id == onlineC.sessionId {
// 						delete(sessions.SessionMap.Data, key)
// 					}
// 				}
// 			}

// 			return
// 		}
// 	}
// }

// // writePump pumps messages from the hub to the websocket connection.
// func (onlineC *onlineClients) writePump() {
// 	defer func() {
// 		onlineC.ws.Close()
// 	}()
// 	for {
// 		select {
// 		case notif, ok := <-onlineC.sendNotification:
// 			if !ok {
// 				fmt.Println("user is offline.")
// 				return
// 			}
// 			onlineC.ws.WriteJSON(notif)
// 		case post, ok := <-onlineC.sendPostArray:
// 			if !ok {
// 				fmt.Println("user is offline.")
// 				return
// 			}
// 			onlineC.ws.WriteJSON(post)

// 		case deletedPost, ok := <-onlineC.deletePost:
// 			if !ok {
// 				fmt.Println("user is offline.")
// 				return
// 			}
// 			onlineC.ws.WriteJSON(deletedPost)

// 		case like, ok := <-onlineC.sendLikes:
// 			if !ok {
// 				fmt.Println("user is offline.")
// 				return
// 			}
// 			onlineC.ws.WriteJSON(like)

// 		case commentLike, ok := <-onlineC.sendCommentLikes:
// 			if !ok {
// 				fmt.Println("user is offline.")
// 				return
// 			}
// 			onlineC.ws.WriteJSON(commentLike)
// 		}
// 	}
// }

// func serveOnline(w http.ResponseWriter, r *http.Request, session *sessions.Session) {
// 	if session.IsAuthorized {
// 		ws, err := upgrader.Upgrade(w, r, nil)
// 		if err != nil {
// 			log.Println(err.Error())
// 			return
// 		}
// 		sessionOnline := &onlineClients{ws: ws, name: session.Username, sendNotification: make(chan *notif.NotifFields), sendPostArray: make(chan posts.PostFields), deletePost: make(chan posts.DeletePost), sendLikes: make(chan likes.ReturnLikesFields), sendCommentLikes: make(chan commentsAndLikes.ReturnCommentLikesFields), sessionId: session.Id}
// 		statusH.register <- sessionOnline
// 		go sessionOnline.readPump()
// 		go sessionOnline.writePump()
// 	}
// }
