package functions

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	
	uuid "github.com/satori/go.uuid"
	"golang.org/x/crypto/bcrypt"
)

const SECRET_KEY = "DonaldTrump_Dumpling"
var chatroomId = make(chan string)
var loggedInUsername = make(chan string)

func Login(w http.ResponseWriter, r *http.Request) {

	if r.Method == "POST" {

		// Create new user struct based on user input.
		var userToLogin User
		userToLogin = GetUser(r)

		// Try to find user from database
		db := OpenDB()
		rows, err := db.Query("SELECT * FROM users WHERE email=?", userToLogin.Email)
		foundUser := QueryUser(rows, err)


		// Check if user exists
		if foundUser.Email != userToLogin.Email {
			w.WriteHeader(http.StatusNotFound)
			w.Write(JsonMessage("User not found"))
			return
		}

		// Compare and check if password matches the user in database.
		if err := bcrypt.CompareHashAndPassword([]byte(foundUser.Password), []byte(userToLogin.Password)); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(JsonMessage("Incorrect password")))
			return
		}

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(JsonMessage("Could not log in")))
			return
		}

		_, delErr := db.Exec("DELETE FROM sessions WHERE userID=?", foundUser.Id)
		if delErr != nil {
			log.Fatal(delErr.Error())
		}

		// Check if session cookie exists. If not, create one, and give the user a session.
		cookie, cookieErr := r.Cookie("session")
		if cookieErr != nil {
			id := uuid.NewV4()
			cookie = &http.Cookie{
				Name:  "session",
				Value: id.String(),

				// Ideally these cookies should be http only and secure but verifying the user
				// on the client side will be difficult.
				HttpOnly: true,
				// Secure:   true,
				Path:   "/",
				MaxAge: 60 * 86400,
			}
			http.SetCookie(w, cookie)
		}

		if _, err2 := db.Exec("INSERT INTO sessions(sessionUUID, userID, email) values(?,?,?)", cookie.Value, foundUser.Id, foundUser.Email); err2 != nil {
			fmt.Println(err2.Error() + "\033[31m")
			db.Exec("DELETE FROM sessions WHERE userID=?", foundUser.Id)
		}

		// Marshal user to send back to front end.
		jsn, mrshlErr := json.Marshal(foundUser)
		if mrshlErr != nil {
			fmt.Println("Error marshalling user: ", err.Error())
		} else {
			w.Write(jsn) // Write user data
		}
		go func() {
			chatroomId <- ""
			loggedInUsername <- foundUser.Nickname
		}()
		return
	}
	// Remder template on reload
	RenderTmpl(w)
}

// Get user details from sessions table
func GetUserFromSessions(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err != nil {
		// fmt.Println("GetUserWithJWT --  ", err.Error())
		w.WriteHeader(http.StatusUnauthorized)
		w.Write(JsonMessage("unauthorized"))
		return
	}

	db := OpenDB()

	// Compare session to users in database
	sessionRows, err := PreparedQuery("SELECT * FROM sessions WHERE sessionUUID = ?", cookie.Value, db, "GetUserFromSessions")
	session := QuerySession(sessionRows, err)

	// Secure sql query and get user based on session
	rows, err := PreparedQuery("SELECT * FROM users WHERE id = ?", session.userID, db, "GetUserFromSessions")
	user := QueryUser(rows, err)
	defer rows.Close()

	// Marshal and return user.
	jsn, _ := json.Marshal(user)
	w.Write(jsn)
	db.Close()

}

func Register(w http.ResponseWriter, r *http.Request) {
	// If post request, get the users details and save it to the database.
	if r.Method == "POST" {

		// Get the user based off of the users input. (JSON from form input and store in db)
		newUser := GetUser(r)

		// Log registering status
		fmt.Println("Registering new user:  ", newUser)

		// Create new user, checking for error. If no error, user will be stored in db.
		err := CreateUser(newUser)

		// If theres an error, log it.
		if err != nil {
			fmt.Println("Line 141, This username or email already exists.", err.Error())
		} else {
			fmt.Println("Registration success! Welcome: ", newUser.Email)
		}

		// Return json to front end.
		jsonified, _ := json.Marshal(newUser)
		w.WriteHeader(http.StatusAccepted)
		w.Write([]byte(jsonified))
		return
	}

	// Render HTML on get request.
	RenderTmpl(w)

}

// Should be post request.
func Logout(w http.ResponseWriter, r *http.Request) {

	c, err := r.Cookie("session")
	if err != nil {
		return
	}

	{
		// Open database.
		db := OpenDB()
		// delete session from sessions table.
		db.Exec("DELETE FROM sessions WHERE sessionUUID=?;", c.Value)
		defer db.Close()
	}

	// set cookie max age to negative value to expire the cookie.
	c.MaxAge = -1
	c.Value = ""
	http.SetCookie(w, c)

}

func CreateUser(newUser User) error {

	db := OpenDB()
	defer db.Close()

	// Get password hash.
	passwordHash, err := getPasswordHash(newUser.Password)
	if err != nil {
		return err
	}
	CheckErr(err, "-------LINE 95")

	// Ppdate password to password hash.
	newUser.Password = passwordHash

	// Try to insert user into database.
	_, err2 := db.Exec("INSERT INTO users(email, password, firstname, lastname, dob, avatar, nickname, aboutme) values(?,?,?,?,?,?,?,?)", newUser.Email, newUser.Password, newUser.Firstname, newUser.Lastname, newUser.DOB, newUser.Avatar, newUser.Nickname, newUser.Aboutme)

	CheckErr(err2, "-------LINE 58  ") // check line
	if err2 != nil {
		return err2
	}

	return nil
}

// Generates a password hash from string.
func getPasswordHash(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 0)
	return string(hash), err
}

func Generate() string {
	u2 := uuid.NewV4()
	return fmt.Sprintf("%x", u2)
}

func CreateChat(w http.ResponseWriter, r *http.Request) {
	var data ChatRoomFields
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}

	err = json.Unmarshal(body, &data)
	if err != nil {
		panic(err)
	}

	if data.Users != "" {
		data.Users += "," + LoggedInUser(r).Nickname
		if data.Type == "private" {
			// check if private chat already exists
			if !CheckIfPrivateExistsBasedOnUsers(data) {
				data.Id = Generate()
				data.Name = ""
				AddChat(data)
				content, _ := json.Marshal(data)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)
			} else {
				content, _ := json.Marshal("Private Chat Already Exists")
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)
			}
		} else if data.Type == "group" {
			data.Id = Generate()
			AddChat(data)
			content, _ := json.Marshal(data)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)
		} else {
			content, _ := json.Marshal("Please Select Type of Chat Created")
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)
		}
	} else {
		content, _ := json.Marshal("Please Select Users To Chat To!!!!!")
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)
	}
}

func GetChatRooms(w http.ResponseWriter, r *http.Request) {
	totalChats := GetUserChats(LoggedInUser(r).Nickname)
	content, _ := json.Marshal(totalChats)
	w.Header().Set("Content-Type", "application/json")
	w.Write(content)
}


func Chat(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}
		groupChatId := string(body)
		// get the session username and previous messages of that chat
		var openedChat OpenChatInfo
		openedChat.User=LoggedInUser(r).Nickname
		openedChat.Chatroom=GetChatRoom(groupChatId, openedChat.User)
		// openChat.PreviousMessage= function to get previous messages from message table
		content, _ := json.Marshal(openedChat)
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)
		go func() {
			chatroomId <- groupChatId
			loggedInUsername <- openedChat.User
		}()
	} else {
		// error
		fmt.Println("you tried it")
	}
}
