package functions

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// connection is an middleman between the websocket connection and the hub.
type connection struct {
	// The websocket connection.
	ws *websocket.Conn

	// Buffered channel of outbound messages.
	send chan ChatFields
}

// readPump pumps messages from the websocket connection to the hub.
func (s *subscription) readPump() {
	c := s.conn
	defer func() {
		H.unregister <- s
		c.ws.Close()
	}()

	for {

		var chatFields ChatFields
		err := c.ws.ReadJSON(&chatFields)
		chatFields.Id = s.room
		chatFields.MessageId = Generate()

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
				log.Printf("error: %v", err)
			}
			return
		}
		m := data{chatFields}
		H.broadcast <- m
		SqlExec.messages <- chatFields
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
		fmt.Println(message)
		err := c.ws.WriteJSON(message)
		if err != nil {
			// filter.delete(s.sessionId)
			fmt.Println("error writing to chat:", err)
			return
		}
	}
}

// serveWs handles websocket requests from the peer.
// serveWs handles websocket requests from the peer.
func ServeWs(w http.ResponseWriter, r *http.Request) {
	var id string
	var user string
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err.Error())
		return
	}
	cookie, _ := r.Cookie("session")
	if r.URL.Path == "/ws/chat" {
		id = <-chatroomId
		user = <-loggedInUsername
	} else {
		id = ""
		user = LoggedInUser(r).Nickname
	}
	fmt.Println("ws id", id)
	fmt.Println("ws opened", user)
	c := &connection{send: make(chan ChatFields, 1), ws: ws}
	s := subscription{c, id, user, cookie.Value}
	H.register <- &s
	go s.writePump()
	go s.readPump()
}
