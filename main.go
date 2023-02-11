package main

import (
	"fmt"
	"log"
	"net/http"
	"social-network/backend/functions"
)

func main() {
	// Create tabless
	functions.CreateSqlTables()

	// Endpoint handlers
	http.HandleFunc("/", functions.Homepage)
	http.HandleFunc("/login", functions.Login)
	http.HandleFunc("/logout", functions.Logout)
	http.HandleFunc("/register", functions.Register)
	http.HandleFunc("/api/user", functions.GetUserFromSessions)
	http.HandleFunc("/api/users", functions.UsersApi)
	http.HandleFunc("/profile", functions.Profile)
	http.HandleFunc("/create-chat", functions.CreateChat)
	http.HandleFunc("/edit-chatroom", functions.EditChatroom)
	http.HandleFunc("/leave-chatroom", functions.LeaveChatroom)
	http.HandleFunc("/get-chatrooms", functions.GetChatRooms)
	http.HandleFunc("/get-chat", functions.Chat)
	http.HandleFunc("/ws/chat", functions.ServeWs)
	go functions.H.Run()
	go functions.SqlExec.ExecuteStatements()

	// Serve files within static and public
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	http.Handle("/public/", http.StripPrefix("/public/", http.FileServer(http.Dir("public"))))

	fmt.Printf("SOCIAL-NETWORK serving at http://localhost:8080\n")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
