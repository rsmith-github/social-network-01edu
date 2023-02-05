package functions

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"text/template"

	_ "github.com/mattn/go-sqlite3"
)

// Get user from forms.
func GetUser(r *http.Request) User {

	var userToRegister User
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&userToRegister)
	if err != nil {
		fmt.Println("GetUser in helper.go: ", err)
	}

	return userToRegister
}

// Get user from sqlite db.
func QueryUser(rows *sql.Rows, err error) User {
	// Variables for line after for rows.Next() (8 lines from this line.)
	var id int
	var email string
	var password string
	var firstname string
	var lastname string
	var dob string
	var avatar string
	var nickname string
	var aboutme string

	var usr User
	// Scan all the data from that row.
	for rows.Next() {
		err = rows.Scan(&id, &email, &password, &firstname, &lastname, &dob, &avatar, &nickname, &aboutme)
		temp := User{
			Id:        id,
			Email:     email,
			Password:  password,
			Firstname: firstname,
			Lastname:  lastname,
			DOB:       dob,
			Avatar:    avatar,
			Nickname:  nickname,
			Aboutme:   aboutme,
		}
		// currentUser = &username
		CheckErr(err, "-------LINE 56")
		usr = temp
	}
	rows.Close() //good habit to close
	return usr
}

func CheckErr(err error, line string) {
	if err != nil {
		fmt.Print(line)
		fmt.Println(err.Error())
	}
}

func OpenDB() *sql.DB {
	db, err := sql.Open("sqlite3", "backend/pkg/db/sqlite/sNetwork.db")
	if err != nil {
		log.Fatal(err)
	}
	return db

}
func CheckIfPrivateExistsBasedOnUsers(chatFields ChatRoomFields) bool {
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM chatroom WHERE type = '%v'", chatFields.Type)
	fmt.Println(chatFields)
	row, err := db.Query(s)
	sameNameGroups := []ChatRoomFields{}
	if err != nil {
		log.Fatal(err)
	}

	var id, name, description, chatType, users string
	for row.Next() { // Iterate and fetch the records from result cursor
		row.Scan(&id, &name, &description, &chatType, &users)
		groupChat := ChatRoomFields{
			Id:          id,
			Name:        name,
			Description: description,
			Type:        chatType,
			Users:       users,
		}
		sameNameGroups = append(sameNameGroups, groupChat)
	}
	row.Close()
	var lengthOfUsers = len(strings.Split(chatFields.Users, ","))
	for _, group := range sameNameGroups {
		var sameUsers = 0
		for _, storedUser := range strings.Split(group.Users, ",") {
			for _, incomingUser := range strings.Split(chatFields.Users, ",") {
				if storedUser == incomingUser {
					sameUsers++
				}
			}

		}
		if sameUsers == lengthOfUsers {
			return true
		}
	}
	return false
}

func AddChat(chatFields ChatRoomFields) error {
	sliceOfUsers := strings.Split(chatFields.Users, ",")
	sort.Strings(sliceOfUsers)
	chatFields.Users = strings.Join(sliceOfUsers, ",")

	db := OpenDB()
	stmt, err := db.Prepare(`INSERT INTO "chatroom" (id,name,description,type,users) values (?, ?, ?, ?, ?)`)
	if err != nil {
		fmt.Println("error preparing table:", err)
		return err
	}
	_, errorWithTable := stmt.Exec(chatFields.Id, chatFields.Name, chatFields.Description, chatFields.Type, chatFields.Users)
	if errorWithTable != nil {
		fmt.Println("error adding to table:", errorWithTable)
		return errorWithTable
	}
	return nil
}

func GetUserChats(username string) ChatroomType {
	db := OpenDB()
	row, err := db.Query("SELECT * FROM chatroom")
	var involvedChats ChatroomType
	if err != nil {
		log.Fatal(err)
	}

	var id, name, description, chatType, users string
	for row.Next() { // Iterate and fetch the records from result cursor
		row.Scan(&id, &name, &description, &chatType, &users)
		groupChat := ChatRoomFields{
			Id:          id,
			Name:        name,
			Description: description,
			Type:        chatType,
			Users:       users,
		}
		sliceOfUsers := strings.Split(groupChat.Users, ",")
		for i, involved := range sliceOfUsers {
			if involved == username {
				groupChat.Users = strings.Join(removeUserFromChatButton(sliceOfUsers, i), ",")
				if groupChat.Type == "group" {
					involvedChats.Group = append(involvedChats.Group, groupChat)
				} else if groupChat.Type == "private" {
					involvedChats.Private = append(involvedChats.Private, groupChat)
				}
			}
		}
	}
	row.Close()
	return involvedChats
}

func GetChatRoom(chatroom string, user string) ChatRoomFields {
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM chatroom WHERE id = '%v'", chatroom)
	row, err := db.Query(s)
	if err != nil {
		fmt.Println("Could Not Find Chatroom", err)
	}

	var groupChat ChatRoomFields
	var id, name, description, chatType, users string
	for row.Next() {
		row.Scan(&id, &name, &description, &chatType, &users)
		groupChat = ChatRoomFields{
			Id:          id,
			Name:        name,
			Description: description,
			Type:        chatType,
			Users:       users,
		}
		sliceOfUsers := strings.Split(groupChat.Users, ",")
		for i := range sliceOfUsers {
			if sliceOfUsers[i] == user {
				groupChat.Users = strings.Join(removeUserFromChatButton(sliceOfUsers, i), ",")
			}
		}
	}
	return groupChat
}

func removeUserFromChatButton(slice []string, s int) []string {
	return append(slice[:s], slice[s+1:]...)
}

func LoggedInUser(r *http.Request) User {
	cookie, err := r.Cookie("session")
	if err != nil {
		// err
	}
	db := OpenDB()
	// Compare session to users in database
	sessionRows, err := PreparedQuery("SELECT * FROM sessions WHERE sessionUUID = ?", cookie.Value, db, "GetUserFromSessions")
	session := QuerySession(sessionRows, err)
	// Secure sql query and get user based on session
	rows, err := PreparedQuery("SELECT * FROM users WHERE id = ?", session.userID, db, "GetUserFromSessions")
	user := QueryUser(rows, err)
	defer rows.Close()
	db.Close()
	return user
}

func CreateSqlTables() {

	db := OpenDB()

	// if you need to delete a table rather than delete a whole database
	// _, deleteTblErr := db.Exec(`DROP TABLE IF EXISTS chatroom`)
	// CheckErr(deleteTblErr, "-------Error deleting table")

	// Create user table if it doen't exist.
	var _, usrTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `users` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `email` VARCHAR(64) NOT NULL UNIQUE, `password` VARCHAR(255) NOT NULL, `firstname` VARCHAR(64) NOT NULL, `lastname` VARCHAR(64) NOT NULL, `dob` VARCHAR(255) NOT NULL, `avatar` VARCHAR(255), `nickname` VARCHAR(64), `aboutme` VARCHAR(255))")
	CheckErr(usrTblErr, "-------Error creating table")

	// Create sessions table if doesn't exist.
	var _, sessTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `sessions` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `sessionUUID` VARCHAR(255) NOT NULL UNIQUE, `userID` VARCHAR(64) NOT NULL UNIQUE, `email` VARCHAR(255) NOT NULL UNIQUE)")
	CheckErr(sessTblErr, "-------Error creating table")

	// Create chatroom table if doesn't exist.
	var _, chatRoomTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `chatroom` (`id` TEXT NOT NULL, `name` TEXT, `description` TEXT, `type` TEXT NOT NULL, `users` VARCHAR(255) NOT NULL)")
	CheckErr(chatRoomTblErr, "-------Error creating table")

	// Create chats table if doesn't exist.
	var _, messagesTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `messages` ( `id` TEXT NOT NULL, `sender` VARCHAR(255) NOT NULL, `messageId` TEXT NOT NULL UNIQUE, `message` TEXT, `date` NUMBER)")
	CheckErr(messagesTblErr, "-------Error creating table")

	// Create posts table if doesn't exist.
	// var _, postTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `posts` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `user_ID` VARCHAR(64) NOT NULL, `username` VARCHAR(64) NOT NULL, `content` TEXT NOT NULL, `time_posted` TEXT NOT NULL, `category` VARCHAR(64), `category_2` VARCHAR(64))")
	// CheckErr(postTblErr, "-------Error creating table")

	// Create comments table if not exists
	// var _, commentError = db.Exec("CREATE TABLE IF NOT EXISTS `comments` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `username` VARCHAR(64), `comment` TEXT NOT NULL, `post_ID` INTEGER NOT NULL )")
	// CheckErr(commentError, "-------Error creating table")

	// Create messages table if not exists
	// var _, msgErr = db.Exec("CREATE TABLE IF NOT EXISTS `messages` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `sender` VARCHAR(64), `receiver` VARCHAR(64), `message` TEXT, `time` TEXT NOT NULL, `status` VARCHAR(64))")
	// CheckErr(msgErr, "-------Error creating table")

	db.Close()

}

func RenderTmpl(w http.ResponseWriter) {
	t, err := template.ParseFiles("static/index.html")
	if err != nil {
		http.Error(w, "500 Internal error", http.StatusInternalServerError)
		return
	}
	if err := t.Execute(w, ""); err != nil {
		http.Error(w, "500 Internal error", http.StatusInternalServerError)
		return
	}
}

// Redirect if no cookie. (user not logged in)
func ValidateCookie(w http.ResponseWriter, r *http.Request) {
	_, er := r.Cookie("session")
	if er != nil {
		http.Redirect(w, r, "/login", http.StatusSeeOther)
		return
	}
}

// Return list of bytes based on string.
func JsonMessage(message string) []byte {

	// Mimic json structure using map
	messageMap := make(map[string]string)
	messageMap["message"] = message
	jsonified, err := json.Marshal(messageMap) //marshal json. (returning list of bytes)

	// Check for errors.
	if err != nil {
		return []byte(err.Error())
	}

	// return list of bytes
	return jsonified

}

// More secure sql query. Return rows.
func PreparedQuery(query string, input string, db *sql.DB, functionName string) (*sql.Rows, error) {
	stmt, err := db.Prepare(query)
	if err != nil {
		fmt.Println(functionName, " -- ", err.Error())
	}
	defer stmt.Close()

	rows, err := stmt.Query(input)
	if err != nil {
		fmt.Println(err.Error())
	}

	return rows, err
}

func QuerySession(rows *sql.Rows, err error) Session {
	// Variables for line after for rows.Next()
	var id int
	var sessionID, userID, email string

	var sess Session
	// Scan all the data from that row.
	for rows.Next() {
		err = rows.Scan(&id, &sessionID, &userID, &email)
		temp := Session{
			sessionUUID: *&sessionID,
			userID:      *&userID,
			email:       *&email,
		}
		// currentUser = &username
		CheckErr(err, "-------LINE 146")
		sess = temp
	}
	rows.Close() //good habit to close
	return sess
}
