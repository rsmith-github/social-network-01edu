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
	var notifFields NotifFields
	errReadingNotif := json.Unmarshal(dataFromWs, &notifFields)
	if errReadingNotif != nil {
		return errReadingNotif
	} else if notifFields != (NotifFields{}) {
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
					fmt.Println(loggedInUsers)
					if Contains(usersInChat, loggedInUsers) {
						//+1 because the client's name is removed from the button
						if loggedInUsers != chatSubs.name && len(usersInChat)+1 > len(H.rooms[s.room]) {
							fmt.Println("users aren't in chat.")
							for userSub := range H.user[loggedInUsers] {
								checkIfNotifExists := GetChatNotif(userSub.name, chatData.Sender, s.room)
								if checkIfNotifExists != (NotifFields{}) {
									checkIfNotifExists.NumOfMessages++
									SqlExec.notifData <- checkIfNotifExists
									sendNotif := message{incomingData: checkIfNotifExists}
									userSub.conn.send <- sendNotif
									notifSent[userSub.name] = true
									fmt.Println("sending an exsisting notification in db")
								} else {
									newNotification := NotifFields{
										ChatId:        chatData.Id,
										Sender:        chatData.Sender,
										Date:          chatData.Date,
										Receiver:      userSub.name,
										NumOfMessages: 1,
									}
									SqlExec.notifData <- newNotification
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
						if checkIfNotifExists != (NotifFields{}) {
							checkIfNotifExists.NumOfMessages++
							SqlExec.notifData <- checkIfNotifExists
						} else {
							newNotification := NotifFields{
								ChatId:        chatData.Id,
								Sender:        chatData.Sender,
								Date:          chatData.Date,
								Receiver:      users,
								NumOfMessages: 1,
							}
							SqlExec.notifData <- newNotification
						}
					}
				}
			}

			//update the incomingData
			data.incomingData = chatData
			H.broadcast <- data
			SqlExec.chatData <- chatData
		case NotifFields:
			//update notification because user opened chat
			notifData := data.incomingData.(NotifFields)
			sliceOfNotifications := GetChatNotifications(notifData.Receiver, notifData.ChatId)
			for _, resetNotification := range sliceOfNotifications {
				resetNotification.NumOfMessages = 0
				SqlExec.notifData <- resetNotification
			}
		case followMessage:
			H.broadcast <- data
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
		case NotifFields:
			//wait for sql to execute functions...
			wg.Wait()
			notif := message.incomingData.(NotifFields)
			notif.TotalNumber = GetTotalNotifs(s.name)
			fmt.Println("wrote notification", notif, s.name)
			err := c.ws.WriteJSON(notif)
			if err != nil {
				fmt.Println("error writing to websocket:", err)
				return
			}
		case []NotifFields:
			notifications := message.incomingData.([]NotifFields)
			err := c.ws.WriteJSON(notifications)
			if err != nil {
				fmt.Println("error writing to notifications to websocket:", err)
			}
			fmt.Println("notifications exist for user", notifications)
		case followMessage:
			// Unmarshal message received from front end.
			followMessage := message.incomingData.(followMessage)
			if err := c.ws.WriteJSON(followMessage); err != nil {
				log.Printf("error sending follow message: %v", err)
			}
		case followNotification:
			followNotification := message.incomingData.(followNotification)
			if err := c.ws.WriteJSON(followNotification); err != nil {
				log.Printf("error sending update message: %v", err)
			}
		}

	}
}

// serveWs handles websocket requests from the peer.
func ServeWs(w http.ResponseWriter, r *http.Request) {
	var id string
	var user string
	var notifExists []NotifFields
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
		notifExists = GetAllNotifs(user)
	}
	fmt.Println("ws id", id)
	fmt.Println("ws opened", user)
	c := &connection{send: make(chan message), ws: ws}
	s := subscription{c, id, user, cookie.Value}
	H.register <- &s
	go s.writePump()
	go s.readPump()
	if len(notifExists) > 0 {
		message := message{incomingData: notifExists}
		c.send <- message
	}
}
