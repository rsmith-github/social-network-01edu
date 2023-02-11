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
	// Serve files within static and public
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	http.Handle("/public/", http.StripPrefix("/public/", http.FileServer(http.Dir("public"))))

	// Endpoint handlers
	http.HandleFunc("/", functions.Homepage)
	http.HandleFunc("/login", functions.Login)
	http.HandleFunc("/logout", functions.Logout)
	http.HandleFunc("/register", functions.Register)
	http.HandleFunc("/api/user", functions.GetUserFromSessions)
	http.HandleFunc("/api/users", functions.UsersApi)
	http.HandleFunc("/profile", functions.Profile)
	// http.HandleFunc("/public-profiles", functions.DynamicPath)
	http.HandleFunc("/create-chat", functions.CreateChat)
	http.HandleFunc("/get-chatrooms", functions.GetChatRooms)

	fmt.Printf("SOCIAL-NETWORK serving at http://localhost:8080\n")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
