// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package websocket

import (
	"encoding/json"
	"log"
	"social-network/backend/functions"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

type followMessage struct {
	FollowRequest string `json:"followRequest"`
	ToFollow      string `json:"toFollow"`
	IsFollowing   bool   `json:"isFollowing"`
	Followers     int    `json:"followers"`
}

type followNotification struct {
	UpdateUser string `json:"updateUser"`
	Followers  int    `json:"followers"`
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {

		select {
		case client := <-h.register:
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			updateCount := 0 // Checking if follower count has been updated before. If it has, don't update.
			for client := range h.clients {
				select {
				case client.send <- message:

					updateCount++ // increment updateFollowerCount.

					// Unmarshal message received from front end.
					var msg followMessage
					json.Unmarshal(message, &msg)

					// Only increment or decrement once. Otherwise since inside a for loop it will increment
					// for each client.
					if updateCount <= 1 {

						// Update the follower count
						followerCount, err := updateFollowerCount(msg.FollowRequest, msg.ToFollow, msg.IsFollowing)
						if err != nil {
							log.Printf("error updating follower count: %v", err)
							continue
						}

						// Send an update message to the client with the new follower count
						updateMsg := followNotification{UpdateUser: msg.ToFollow, Followers: *&followerCount}
						if err := client.conn.WriteJSON(updateMsg); err != nil {
							log.Printf("error sending update message: %v", err)
							continue
						}
					} else {
						break
					}

				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

func updateFollowerCount(followerEmail string, followeeEmail string, isFollowing bool) (int, error) {
	// Update the follower count in the database.

	db := functions.OpenDB()

	// Create a map representing the follow object to update the db.
	follow := make(map[string]string)
	follow["follower"] = followerEmail
	follow["followee"] = followeeEmail

	// Increment if follow button pressed otherwise decrement.
	if isFollowing {
		db.Exec("UPDATE users SET followers=followers+1 WHERE email=?", followeeEmail)
		functions.PreparedExec("INSERT INTO followers (follower, followee) values (?,?)", follow, db, "updateFollowerCount")
	} else {
		db.Exec("UPDATE users SET followers=followers-1 WHERE email=?", followeeEmail) 
		functions.PreparedExec("DELETE FROM followers WHERE follower=? AND followee=?", follow, db, "updateFollowerCount")
	}

	// Secure sql query and get user based on session
	rows, err := functions.PreparedQuery("SELECT * FROM users WHERE email = ?", followeeEmail, db, "updateFollowerCount")
	user := functions.QueryUser(rows, err)

	db.Close()
	// Return the new follower count
	return user.Followers, nil
}

/*



Follow means one more follower for profile being viewed.
usr = User.objects.get(username=username)
usr.followers = usr.followers + 1
follow_status = 1
usr.save()

# Also means one more following for current user.
crnt_usr = User.objects.get(username=request.user.username)
crnt_usr.following += 1
crnt_usr.save()

# Create a record of the follow in Follower model.
follow = Follow.objects.create(
	follower=request.user.username, following=username)
	follow.save()

*/
