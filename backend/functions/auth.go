package functions

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"sort"
	"strings"

	uuid "github.com/satori/go.uuid"
	"golang.org/x/crypto/bcrypt"
)

const SECRET_KEY = "DonaldTrump_Dumpling"

var chatroomId = make(chan string)
var loggedInUsername = make(chan string)
var groupRoomId = make(chan string)

func Login(w http.ResponseWriter, r *http.Request) {

	if r.Method == "POST" {

		// Create new user struct based on user input.
		var userToLogin User
		userToLogin = GetUser(r)

		// Try to find user from database
		db := OpenDB()
		defer db.Close()
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
			return
		}
		return
	}
	// Remder template on reload
	RenderTmpl(w)
}

// Get user details from sessions table
func GetUserFromSessions(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err != nil {
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
		fmt.Println(string(jsonified))
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
	_, err2 := db.Exec("INSERT INTO users(email, password, firstname, lastname, dob, avatar, nickname, aboutme, status) values(?,?,?,?,?,?,?,?,?)", newUser.Email, newUser.Password, newUser.Firstname, newUser.Lastname, newUser.DOB, newUser.Avatar, newUser.Nickname, newUser.Aboutme, newUser.Status)

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

func GetFriends(w http.ResponseWriter, r *http.Request) {
	user := LoggedInUser(r)
	friends := GetFollowers(user)
	content, _ := json.Marshal(friends)
	w.Header().Set("Content-Type", "application/json")
	w.Write(content)

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
		user := LoggedInUser(r).Nickname
		data.Users += "," + user
		if data.Type == "private" {
			// check if private chat already exists
			if !CheckIfPrivateExistsBasedOnUsers(data) {
				data.Id = Generate()
				data.Name = ""
				AddChat(data, "")
				var returnedUserDisplay []string
				for _, u := range strings.Split(data.Users, ",") {
					if u != user {
						returnedUserDisplay = append(returnedUserDisplay, u)
					}
				}
				chatroom := data
				chatroom.Users = strings.Join(returnedUserDisplay, ",")
				content, _ := json.Marshal(chatroom)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			} else {
				content, _ := json.Marshal("Private Chat Already Exists")
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			}
		} else if data.Type == "group" {
			data.Id = Generate()
			data.Admin = user
			// add admin and addmin should be the LoggedInUser.Nickname
			AddChat(data, user)
			var returnedUserDisplay []string
			for _, u := range strings.Split(data.Users, ",") {
				if u != user {
					returnedUserDisplay = append(returnedUserDisplay, u)
				}
			}
			chatroom := data
			chatroom.Users = strings.Join(returnedUserDisplay, ",")
			content, _ := json.Marshal(chatroom)
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
func Chat(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}
		groupChatId := string(body)
		fmt.Println(groupChatId)
		var openedChat OpenChatInfo
		openedChat.User = LoggedInUser(r).Nickname
		openedChat.Chatroom = GetChatRoom(groupChatId, openedChat.User)
		openedChat.PreviousMessages = GetPreviousMessages(openedChat.Chatroom.Id)
		content, _ := json.Marshal(openedChat)
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)

		go func() {
			chatroomId <- groupChatId
			loggedInUsername <- openedChat.User
		}()
	} else {
		totalChats := GetUserChats(LoggedInUser(r).Nickname)
		sort.Slice(totalChats.Group, func(i, j int) bool {
			return totalChats.Group[i].Name < totalChats.Group[j].Name
		})
		sort.Slice(totalChats.Private, func(i, j int) bool {
			return totalChats.Private[i].Name < totalChats.Private[j].Name
		})
		sort.Slice(totalChats.Group, func(i, j int) bool {
			return totalChats.Group[i].Date > totalChats.Group[j].Date
		})
		sort.Slice(totalChats.Private, func(i, j int) bool {
			return totalChats.Private[i].Date > totalChats.Private[j].Date
		})
		content, _ := json.Marshal(totalChats)
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)

	}
}

func EditChatroom(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		var data ChatRoomFields
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}

		err = json.Unmarshal(body, &data)
		if err != nil {
			panic(err)
		}
		loggedInUser := LoggedInUser(r).Nickname
		currentChatroom := GetChatRoom(data.Id, loggedInUser)
		fmt.Println("from sql", currentChatroom)
		currentUsers := strings.Split(currentChatroom.Users, ",")
		var check ChatRoomFields
		if data.Action == "leave" {

			check = UpdateChatroom(currentChatroom, data.Action, loggedInUser)

		} else {
			check = UpdateChatroom(data, "", loggedInUser)
		}

		users := strings.Split(check.Users, ",")
		fmt.Println("current users", currentUsers)
		var removed []string
		for _, kicked := range currentUsers {
			if !Contains(users, kicked) {
				removed = append(removed, kicked)
			}
		}
		fmt.Println("remove user", removed)
		if len(removed) != 0 {
			for _, member := range removed {
				for id, mapOfSub := range H.rooms {
					if id == check.Id {
						for s := range mapOfSub {
							fmt.Println("subscription", s)
							if s.name == member {
								fmt.Println("subscription", s)
								// s.conn.ws.WriteJSON()
								// write a message saying this person leave the chat
								s.conn.ws.Close()
							}
						}
					}
				}
			}

		}
		content, _ := json.Marshal(check)
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)

	}
}

func ViewPrivatePosts(w http.ResponseWriter, r *http.Request) {
	allPosts := GetUserPosts(LoggedInUser(r).Nickname, "private")
	content, _ := json.Marshal(allPosts)
	w.Header().Set("Content-Type", "application/json")
	w.Write(content)

}

func ViewPublicPosts(w http.ResponseWriter, r *http.Request) {
	allPosts := GetUserPosts(LoggedInUser(r).Nickname, "public")
	content, _ := json.Marshal(allPosts)
	w.Header().Set("Content-Type", "application/json")
	w.Write(content)

}

func CreatePost(w http.ResponseWriter, r *http.Request) {
	var postData PostFields

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}

	err = json.Unmarshal(body, &postData)
	if err != nil {
		panic(err)
	}
	user := LoggedInUser(r).Nickname
	if user == "" {
		postData.Error = "Cannot Add Post, please Sign Up or Log In"
		content, _ := json.Marshal(postData)
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)

	} else if (len(postData.Thread) == 0) && (postData.Image == "") && (postData.Text == "") {
		postData.Error = "please add content or close"
		content, _ := json.Marshal(postData)
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)

	} else {
		postData.Id = Generate()
		postData.Author = user
		AddPost(postData)
		content, _ := json.Marshal("Post Added Successfully")
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)

	}
}

func PostInteractions(w http.ResponseWriter, r *http.Request) {
	var likeData LikesFields

	if r.Method != "POST" {
		//bad request
	} else {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}
		err = json.Unmarshal(body, &likeData)
		if err != nil {
			panic(err)
		}
		user := LoggedInUser(r).Nickname
		if likeData.Type == "like/dislike" {
			likeData.Username = user
			err := AddPostLikes(likeData)
			if err != nil {
				postLikes := GetPost(likeData.PostId, user)
				postLikes.Error = "Please Try Again Later"
				content, _ := json.Marshal(postLikes)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			} else {
				postLikes := GetPost(likeData.PostId, user)
				content, _ := json.Marshal(postLikes)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			}
		} else if likeData.Type == "delete" {
			postData := GetPost(likeData.PostId, user)
			if user != postData.Author {
				postData.Error = "you are NOT the author"
				content, _ := json.Marshal(postData)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			} else {
				err = RemovePost(postData.Id)
				if err != nil {
					postData.Error = "Error Deleting Post please try again later"
				}
				content, _ := json.Marshal(postData)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			}
		} else if likeData.Type == "comments" {
			commentData := GetPostComments(likeData.PostId, user)
			content, _ := json.Marshal(commentData)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)

		}
	}
}

func EditPost(w http.ResponseWriter, r *http.Request) {
	var postData PostFields

	if r.Method != "POST" {
		// error
	} else {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}

		err = json.Unmarshal(body, &postData)
		if err != nil {
			panic(err)
		}
		user := LoggedInUser(r).Nickname
		currentPost := GetPost(postData.Id, user)
		if user == "" {
			postData.Error = "Cannot Edit Post, please Sign Up or Log In"

		} else if (len(postData.Thread) == 0) && (postData.Image == "") && (postData.Text == "") {
			postData.Error = "Cannot submit empty edit"
			content, _ := json.Marshal(postData)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)

		} else if user != currentPost.Author {
			postData.Error = "you are NOT the author"
			content, _ := json.Marshal(postData)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)

		} else {
			fmt.Println("post", postData)
			if postData.Image == "" {
				postData.Image = currentPost.Image
			}
			err = UpdatePost(postData)
			if err != nil {
				postData.Error = "Error Editing Post please try again later"
				content, _ := json.Marshal(postData)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			}

		}
		// get that specific post and return
		post := GetPost(postData.Id, user)
		// fmt.Println(post)
		content, _ := json.Marshal(post)
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)

	}
}

func CreateComment(w http.ResponseWriter, r *http.Request) {
	var commentData CommentFields
	if r.Method != "POST" {
		// bad request
	} else {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}

		err = json.Unmarshal(body, &commentData)
		if err != nil {
			panic(err)
		}
		fmt.Println("check comment-id", commentData)
		user := LoggedInUser(r).Nickname
		commentData.CommentId = Generate()
		commentData.Author = user
		AddCommentErr := AddComment(commentData)
		if AddCommentErr != nil {
			commentData.Error = "Error Adding Comment! Please Try Again Later!"
			content, _ := json.Marshal(commentData.Error)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)

		} else {
			allComments := ReturnComments{
				TotalComments: GetPostComments(commentData.PostId, user),
				Post:          GetPost(commentData.PostId, user),
			}
			content, _ := json.Marshal(allComments)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)

		}
	}
}

func CommentInteractions(w http.ResponseWriter, r *http.Request) {
	var likeData CommentsAndLikesFields

	if r.Method != "POST" {
		//bad request
	} else {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}
		err = json.Unmarshal(body, &likeData)
		if err != nil {
			panic(err)
		}

		user := LoggedInUser(r).Nickname
		comment := GetComment(likeData.CommentId, user)
		if likeData.Type == "like/dislike" {
			likeData.Username = user
			err := AddCommentLike(likeData)
			if err != nil {
				postLikes := GetComment(likeData.CommentId, user)
				postLikes.Error = "Please Try Again Later"
				content, _ := json.Marshal(postLikes)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			} else {
				postLikes := GetComment(likeData.CommentId, user)
				content, _ := json.Marshal(postLikes)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			}

		} else if likeData.Type == "delete" {
			err = RemoveComment(likeData.CommentId)
			if err != nil {
				comment.Error = "Error Deleting Comment please try again later"
				content, _ := json.Marshal(comment)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			} else {
				content, _ := json.Marshal(comment)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			}

		}
	}
}
func GetAllGroups(w http.ResponseWriter, r *http.Request) {
	// get all groups that you re not involved in
	user := LoggedInUser(r).Nickname
	groups := SearchGroups(user)
	content, _ := json.Marshal(groups)
	w.Header().Set("Content-Type", "application/json")
	w.Write(content)
}
func CreateGroup(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		user := LoggedInUser(r).Nickname
		groups := GetUserGroups(user)
		sort.Slice(groups, func(i, j int) bool {
			return strings.ToLower(groups[i].Name) < strings.ToLower(groups[j].Name)
		})
		sort.Slice(groups, func(i, j int) bool {
			return groups[i].Date > groups[j].Date
		})
		content, _ := json.Marshal(groups)

		// Empty message to prevent sending invalid Json.
		var emptyMessage = make(map[string]string)
		emptyMessage["message"] = "nothing to see here"
		empty, _ := json.Marshal(emptyMessage)
		if string(content) != "null" {
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)
		} else {
			w.Header().Set("Content-Type", "application/json")
			w.Write(empty)
		}

	} else {
		var data GroupFields
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}

		err = json.Unmarshal(body, &data)
		if err != nil {
			panic(err)
		}

		user := LoggedInUser(r).Nickname
		data.Users += "," + user

		data.Id = Generate()
		data.Admin = user
		// add admin and addmin should be the LoggedInUser.Nickname
		AddGroup(data, user)
		var returnedUserDisplay []string
		for _, u := range strings.Split(data.Users, ",") {
			if u != user {
				returnedUserDisplay = append(returnedUserDisplay, u)
			}
		}
		groupRoom := data
		groupRoom.Users = strings.Join(returnedUserDisplay, ",")
		content, _ := json.Marshal(groupRoom)
		// Empty message to prevent sending invalid Json.
		var emptyMessage = make(map[string]string)
		emptyMessage["message"] = "nothing to see here"
		empty, _ := json.Marshal(emptyMessage)
		if string(content) != "null" {
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)
		} else {
			w.Header().Set("Content-Type", "application/json")
			w.Write(empty)
		}

	}
}

func SendGroupRequest(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}

	groupId := string(body)
	user := LoggedInUser(r).Nickname
	if !ConfirmGroupMember(user, groupId) {
		group := GetGroup(groupId)
		admin := group.Admin
		adminSess := H.user[admin]
		if !GetRequestNotif(admin, user, "send-group-request", groupId) {
			AddRequestNotif(user, admin, "send-group-request", groupId)
			if len(adminSess) != 0 {
				for userSub := range adminSess {
					userSub.conn.send <- message{incomingData: RequestNotifcationFields{GroupAction: GroupAcceptNotification{
						User:        user,
						Admin:       admin,
						Action:      "send-group-request",
						GroupName:   group.Name,
						GroupAvatar: group.Avatar,
						GroupId:     group.Id,
					}}}
				}
			}
		}
	}
}

func AddMemberToGroup(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}

	groupId := string(body)
	user := LoggedInUser(r).Nickname
	if !ConfirmGroupMember(user, groupId) {
		err = AddUserToGroup(groupId, user)
		// add to request notification that user accepted request and send message to the admin
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte("error"))
		} else {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte("accepted"))
			group := GetGroup(groupId)
			admin := group.Admin
			adminSess := H.user[admin]
			if len(adminSess) != 0 {
				for userSub := range adminSess {
					userSub.conn.send <- message{incomingData: RequestNotifcationFields{GroupAction: GroupAcceptNotification{
						User:        user,
						Admin:       admin,
						Action:      "accepted-group-request",
						GroupName:   group.Name,
						GroupAvatar: group.Avatar,
						GroupId:     group.Id,
					}}}
				}
			} else {
				if !GetRequestNotif(admin, user, "accepted-group-request", groupId) {
					AddRequestNotif(user, admin, "accepted-group-request", groupId)
				}
			}
		}
	}
}

func RemoveMemberFromGroup(w http.ResponseWriter, r *http.Request) {
	var data GroupFields
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}

	err = json.Unmarshal(body, &data)
	if err != nil {
		panic(err)
	}
	members := strings.Split(data.Users, ",")
	var removeMessage string
	for _, mem := range members {
		err := RemoveUserFromGroup(data.Id, mem)
		if err != nil {
			removeMessage = "Error Removing User, Please Try Again Later"
		} else {
			removeMessage = "Users have been successfully removed"
		}
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(removeMessage))
}

func GroupMembers(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}

	group := GetGroup(string(body))
	members := strings.Split(group.Users, ",")
	fmt.Println(members)
	content, _ := json.Marshal(members)
	w.Header().Set("Content-Type", "application/json")
	w.Write(content)

}

func GroupPosts(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}

	groupId := string(body)
	user := LoggedInUser(r).Nickname
	go func() {
		groupRoomId <- groupId
	}()

	groupPosts := GetGroupPosts(user, groupId)
	content, _ := json.Marshal(groupPosts)
	w.Header().Set("Content-Type", "application/json")
	w.Write(content)

	GetUserGroups(user)
}

func CreateGroupPost(w http.ResponseWriter, r *http.Request) {
	var postData GroupPostFields
	if r.Method != "POST" {
		// bad request
	} else {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}

		err = json.Unmarshal(body, &postData)
		if err != nil {
			panic(err)
		}
		user := LoggedInUser(r).Nickname
		if user == "" {
			postData.Error = "Cannot Add Post, please Sign Up or Log In"
			content, _ := json.Marshal(postData)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)

		} else if (len(postData.Thread) == 0) && (postData.Image == "") && (postData.Text == "") {
			postData.Error = "please add content or close"
			content, _ := json.Marshal(postData)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)

		} else {
			postData.PostId = Generate()
			postData.Author = user

			if ConfirmGroupMember(user, postData.Id) {
				err := AddGroupPost(postData)
				if err != nil {
					postData.Error = "Could Not Add Post, Please Try Again Later"
					content, _ := json.Marshal(postData)
					w.Header().Set("Content-Type", "application/json")
					w.Write(content)

				} else {
					// get all posts and return
					group := GetGroup(postData.Id)
					potentialMember := strings.Split(group.Users, ",")
					for _, member := range potentialMember {
						if member != user {
							loggedInMember := H.user[member]
							for userSub := range loggedInMember {
								postData.Group = group
								userSub.conn.send <- message{incomingData: postData}
							}
						}
					}
					allPosts := GetGroupPosts(user, postData.Id)
					content, _ := json.Marshal(allPosts[len(allPosts)-1])
					w.Header().Set("Content-Type", "application/json")
					w.Write(content)

				}
			} else {
				postData.Error = "You No Longer Have Access To This Group!"
				content, _ := json.Marshal(postData)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			}

		}
	}
}

func GroupPostInteractions(w http.ResponseWriter, r *http.Request) {
	var likeData GroupsAndLikesFields

	if r.Method != "POST" {
		//bad request
	} else {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}
		err = json.Unmarshal(body, &likeData)
		if err != nil {
			panic(err)
		}
		user := LoggedInUser(r).Nickname
		if likeData.Type == "like/dislike" {
			likeData.Username = user
			err := AddGroupLike(likeData)
			if err != nil {
				postLikes := GetGroupPost(likeData.PostId, user)
				postLikes.Error = "Please Try Again Later"
				content, _ := json.Marshal(postLikes)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			} else {
				postLikes := GetGroupPost(likeData.PostId, user)
				fmt.Println(postLikes)
				content, _ := json.Marshal(postLikes)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			}
		} else if likeData.Type == "delete" {
			postData := GetGroupPost(likeData.PostId, user)
			if user != postData.Author {
				postData.Error = "you are NOT the author"
				content, _ := json.Marshal(postData)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			} else {
				err = RemoveGroupPost(postData.PostId)
				if err != nil {
					postData.Error = "Error Deleting Post please try again later"
				}
				content, _ := json.Marshal(postData)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			}
		} else if likeData.Type == "comments" {
			commentData := GetGroupPostComments(likeData.PostId, user)
			content, _ := json.Marshal(commentData)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)
		}
	}
}

func EditGroupPost(w http.ResponseWriter, r *http.Request) {
	var postData GroupPostFields

	if r.Method != "POST" {
		// error
	} else {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}

		err = json.Unmarshal(body, &postData)
		if err != nil {
			panic(err)
		}
		user := LoggedInUser(r).Nickname
		currentPost := GetGroupPost(postData.PostId, user)
		if user == "" {
			postData.Error = "Cannot Edit Post, please Sign Up or Log In"

		} else if (len(postData.Thread) == 0) && (postData.Image == "") && (postData.Text == "") {
			postData.Error = "Cannot submit empty edit"
			content, _ := json.Marshal(postData)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)

		} else if user != currentPost.Author {
			postData.Error = "you are NOT the author"
			content, _ := json.Marshal(postData)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)

		} else {
			fmt.Println("post", postData)
			if postData.Image == "" {
				postData.Image = currentPost.Image
			}
			err = UpdateGroupPost(postData)
			if err != nil {
				postData.Error = "Error Editing Post please try again later"
				content, _ := json.Marshal(postData)
				w.Header().Set("Content-Type", "application/json")
				w.Write(content)

			}

		}
		post := GetGroupPost(postData.PostId, user)
		content, _ := json.Marshal(post)
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)

	}
}

func CreateGroupPostComment(w http.ResponseWriter, r *http.Request) {
	var commentData CommentFields
	if r.Method != "POST" {
		// bad request
	} else {
		body, err := ioutil.ReadAll(r.Body)
		if err != nil {
			panic(err)
		}

		err = json.Unmarshal(body, &commentData)
		if err != nil {
			panic(err)
		}
		fmt.Println("check comment-id", commentData)
		user := LoggedInUser(r).Nickname
		commentData.CommentId = Generate()
		commentData.Author = user
		AddCommentErr := AddGroupPostComment(commentData)
		if AddCommentErr != nil {
			commentData.Error = "Error Adding Comment! Please Try Again Later!"
			content, _ := json.Marshal(commentData.Error)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)
		} else {
			allComments := ReturnGroupComments{
				TotalComments: GetGroupPostComments(commentData.PostId, user),
				Post:          GetGroupPost(commentData.PostId, user),
			}
			content, _ := json.Marshal(allComments)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)
		}
	}
}

func GroupPostCommentInteractions(w http.ResponseWriter, r *http.Request) {
	var likeData CommentsAndLikesFields
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	err = json.Unmarshal(body, &likeData)
	if err != nil {
		panic(err)
	}
	user := LoggedInUser(r).Nickname
	if likeData.Type == "delete" {
		commentData := GetGroupPostComment(likeData.CommentId, user)
		if user != commentData.Author {
			commentData.Error = "you are NOT the author"
			content, _ := json.Marshal(commentData)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)
		} else {
			err = RemoveGroupPostComment(commentData.CommentId)
			if err != nil {
				commentData.Error = "Error Deleting comment please try again later"
			}
			content, _ := json.Marshal(commentData)
			w.Header().Set("Content-Type", "application/json")
			w.Write(content)
		}
	}
}

func CreateGroupEvent(w http.ResponseWriter, r *http.Request) {
	var eventData GroupEventFields
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	err = json.Unmarshal(body, &eventData)
	if err != nil {
		panic(err)
	}
	user := LoggedInUser(r).Nickname
	eventData.EventId = Generate()
	eventData.Organiser = user
	err = AddGroupEvent(eventData)
	if err != nil {
		eventData.Error = "Error Adding Event. Please Try Again Later!"

	}
	eventData.EventOrganiser = true
	content, _ := json.Marshal(eventData)
	w.Header().Set("Content-Type", "application/json")
	w.Write(content)
}

func GetGroupEvents(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	groupId := string(body)
	user := LoggedInUser(r).Nickname
	allEvents := GetEvents(groupId, user)
	content, _ := json.Marshal(allEvents)
	w.Header().Set("Content-Type", "application/json")
	w.Write(content)
}

func EventInteractions(w http.ResponseWriter, r *http.Request) {
	var eventData EventAttendanceFields
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	err = json.Unmarshal(body, &eventData)
	if err != nil {
		panic(err)
	}
	user := LoggedInUser(r).Nickname
	if eventData.Status == "attendance" {
		attendanceData := GetEventAttendees(eventData.EventId)
		var sliceOfAttendees []User
		db := OpenDB()
		for _, attendee := range attendanceData {
			row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", attendee.User, db, "GetUserFromEventsInteraction")
			sliceOfAttendees = append(sliceOfAttendees, QueryUser(row, err))

		}
		db.Close()
		fmt.Println(sliceOfAttendees)
		content, _ := json.Marshal(sliceOfAttendees)
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)
	} else if eventData.Status == "delete" {
		removedEvent := GetEvent(eventData.EventId, user)
		err := DeleteGroupEvent(eventData.EventId)
		if err != nil {
			removedEvent.Error = "Error Removing Event, Please Try Again Later"
		}
		content, _ := json.Marshal(removedEvent)
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)
	} else {
		eventData.User = user
		err := AddEventAttendee(eventData)
		event := GetEvent(eventData.EventId, user)
		if err != nil {
			event.Error = "Error! Please Try Again Later !"
		}
		content, _ := json.Marshal(event)
		w.Header().Set("Content-Type", "application/json")
		w.Write(content)
	}
}
