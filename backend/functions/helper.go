package functions

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sort"
	"strings"
	"text/template"
	"time"

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
	var followers int
	var following int
	var status string

	var usr User
	// Scan all the data from that row.
	for rows.Next() {
		err = rows.Scan(&id, &email, &password, &firstname, &lastname, &dob, &avatar, &nickname, &aboutme, &followers, &following, &status)
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
			Followers: followers,
			Following: following,
			Status:    status,
		}
		// currentUser = &username
		CheckErr(err, "-------LINE 56")
		usr = temp
	}
	rows.Close() //good habit to close
	return usr
}
func UpdateUserPrivacy(user User) error {
	db := OpenDB()
	stmt, err := db.Prepare("UPDATE users SET status=? WHERE email=?")
	if err != nil {
		fmt.Println(err, "error preparing stmt")
		return err
	}
	_, errExecuting := stmt.Exec(user.Status, user.Email)
	if errExecuting != nil {
		fmt.Println(errExecuting, "error cookin stmt")
		return errExecuting
	}
	return nil
}

func CheckErr(err error, line string) {
	if err != nil {
		fmt.Print(line)
		fmt.Println(err.Error())
	}
}

//
// Group
//

func AddGroup(groupFields GroupFields, creator string) error {
	groupFields.Users = creator
	groupFields.Admin = creator
	db := OpenDB()
	stmt, err := db.Prepare(`INSERT INTO "groups" (id,name,description,users,admin,avatar) values (?, ?, ?, ?, ?, ?)`)
	if err != nil {
		fmt.Println("error preparing table:", err)
		return err
	}
	_, errorWithTable := stmt.Exec(groupFields.Id, groupFields.Name, groupFields.Description, groupFields.Users, groupFields.Admin, groupFields.Avatar)
	if errorWithTable != nil {
		fmt.Println("error adding to table:", errorWithTable)
		return errorWithTable
	}
	return nil
}

func AddUserToGroup(groupId, user string) error {
	db := OpenDB()
	s := fmt.Sprintf("SELECT users FROM groups WHERE id = '%v'", groupId)
	row, err := db.Query(s)
	if err != nil {
		return err
	}
	var group GroupFields
	var users string
	for row.Next() { // Iterate and fetch the records from result cursor
		row.Scan(&users)
		group = GroupFields{
			Users: users,
		}
	}
	row.Close()
	group.Users += "," + user
	stmt, err := db.Prepare("UPDATE groups SET users = ? WHERE id = ?")
	if err != nil {
		fmt.Println("error updating group", err)
		return err
	}
	stmt.Exec(group.Users, groupId)
	return nil
}

func RemoveUserFromGroup(groupId, user string) error {
	db := OpenDB()
	s := fmt.Sprintf("SELECT users FROM groups WHERE id = '%v'", groupId)
	row, err := db.Query(s)
	if err != nil {
		return err
	}
	var group GroupFields
	var users string
	for row.Next() { // Iterate and fetch the records from result cursor
		row.Scan(&users)
		group = GroupFields{
			Users: users,
		}
	}
	row.Close()
	var groupMembers []string
	for i := range strings.Split(group.Users, ",") {
		if strings.Split(group.Users, ",")[i] == user {
			groupMembers = removeFromGroup(strings.Split(group.Users, ","), i)
		}

	}
	group.Users = strings.Join(groupMembers, ",")
	fmt.Println(group.Users)
	stmt, err := db.Prepare("UPDATE groups SET users = ? WHERE id = ?")
	if err != nil {
		fmt.Println("error updating group", err)
		return err
	}
	stmt.Exec(group.Users, groupId)
	return nil
}

func removeFromGroup(slice []string, s int) []string {
	return append(slice[:s], slice[s+1:]...)
}

func SearchGroups(username string) []GroupFields {
	db := OpenDB()
	row, err := db.Query("SELECT * FROM groups")
	involvedGroups := GetUserGroups(username)
	var involveGroupIds []string
	for _, group := range involvedGroups {
		involveGroupIds = append(involveGroupIds, group.Id)
	}
	var otherGroups []GroupFields
	if err != nil {
		log.Fatal(err)
	}
	var id, name, description, users, admin, avatar string
	for row.Next() { // Iterate and fetch the records from result cursor
		row.Scan(&id, &name, &description, &users, &admin, &avatar)
		group := GroupFields{
			Id:          id,
			Name:        name,
			Description: description,
			Users:       users,
			Admin:       admin,
			Avatar:      avatar,
		}
		if !Contains(involveGroupIds, group.Id) {
			otherGroups = append(otherGroups, group)
		}
	}
	row.Close()
	return otherGroups
}

func GetUserGroups(username string) []GroupFields {
	db := OpenDB()
	row, err := db.Query("SELECT * FROM groups")
	var involvedGroups []GroupFields
	if err != nil {
		log.Fatal(err)
	}
	var adminGroup []GroupFields
	var id, name, description, users, admin, avatar string
	for row.Next() { // Iterate and fetch the records from result cursor
		row.Scan(&id, &name, &description, &users, &admin, &avatar)
		group := GroupFields{
			Id:          id,
			Name:        name,
			Description: description,
			Users:       users,
			Admin:       admin,
			Avatar:      avatar,
		}
		sliceOfUsers := strings.Split(group.Users, ",")
		posts := GetGroupPosts(username, group.Id)
		if len(posts) > 0 {
			date := posts[len(posts)-1].Time
			group.Date = date
		}
		if !Contains(sliceOfUsers, group.Admin) {
			sliceOfUsers = append(sliceOfUsers, group.Admin)
			adminGroup = append(adminGroup, group)
		}

		for i, involved := range sliceOfUsers {
			if involved == username {
				group.Users = strings.Join(removeUserFromChatButton(sliceOfUsers, i), ",")
				involvedGroups = append(involvedGroups, group)
			}
		}

	}
	row.Close()
	for _, groups := range adminGroup {
		UpdateGroup(groups, "", username)
	}
	return involvedGroups
}

func GetGroup(groupId string) GroupFields {
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM groups WHERE id = '%v'", groupId)
	row, err := db.Query(s)
	if err != nil {
		log.Fatal(err)
	}
	var group GroupFields
	var id, name, description, users, admin, avatar string
	for row.Next() { // Iterate and fetch the records from result cursor
		row.Scan(&id, &name, &description, &users, &admin, &avatar)
		group = GroupFields{
			Id:          id,
			Name:        name,
			Description: description,
			Users:       users,
			Admin:       admin,
			Avatar:      avatar,
		}
	}
	row.Close()
	return group
}

func ConfirmGroupMember(username, groupId string) bool {
	db := OpenDB()
	s := fmt.Sprintf("SELECT users FROM groups WHERE id = '%v'", groupId)
	row, err := db.Query(s)
	if err != nil {
		log.Fatal(err)
	}
	var sliceOfUsers []string
	var users string
	for row.Next() { // Iterate and fetch the records from result cursor
		row.Scan(&users)
		group := GroupFields{
			Users: users,
		}
		sliceOfUsers = strings.Split(group.Users, ",")

	}
	row.Close()
	return Contains(sliceOfUsers, username)
}

func UpdateGroup(groupRoom GroupFields, action string, user string) GroupFields {
	db := OpenDB()
	users := strings.Split(groupRoom.Users, ",")
	sort.Strings(users)
	if action == "leave" {
		if user == groupRoom.Admin {
			randomIndex := rand.Intn(len(users))
			groupRoom.Admin = users[randomIndex]
		}
		var returnedUserDisplay []string
		for _, u := range users {
			if u != user {
				returnedUserDisplay = append(returnedUserDisplay, u)
			}
		}
		fmt.Println(users)
		groupRoom.Users = strings.Join(returnedUserDisplay, ",")
	} else {
		groupRoom.Admin = user
		if groupRoom.Users == "" {
			groupRoom.Users = user
		} else {
			groupRoom.Users += strings.Join(users, ",") + "," + user
		}
	}
	stmt, err := db.Prepare("UPDATE groups SET users=? , admin = ? WHERE id = ?")
	if err != nil {
		fmt.Println("error updating group", err)
	}
	stmt.Exec(groupRoom.Users, groupRoom.Admin, groupRoom.Id)
	return groupRoom
}

//
// Group Posts
//

func AddGroupPost(postFields GroupPostFields) error {
	db := OpenDB()
	stmt, err := db.Prepare(`INSERT into "groupposts" (id, postid , author, image, text, thread, time) VALUES (?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		fmt.Println("error add group-post to table", err)
		return err
	}
	stmt.Exec(postFields.Id, postFields.PostId, postFields.Author, postFields.Image, postFields.Text, postFields.Thread, postFields.Time)
	return nil
}

func UpdateGroupPost(postFields GroupPostFields) error {
	db := OpenDB()
	stmt, err := db.Prepare(`UPDATE "groupposts" SET "text" = ?, "thread" = ?, "image" = ? WHERE "postid" = ?`)
	if err != nil {
		fmt.Println("Cannot update post")
	}
	stmt.Exec(postFields.Text, postFields.Thread, postFields.Image, postFields.PostId)
	return err
}

func RemoveGroupPost(id string) error {
	db := OpenDB()
	stmt, err := db.Prepare("DELETE FROM groupposts WHERE postid = ?")
	if err != nil {
		fmt.Println("error removing post from posts table", err)
	}
	stmt.Exec(id)
	return err
}
func GetGroupPosts(user, groupId string) []GroupPostFields {
	db := OpenDB()
	sliceOfPostTableRows := []GroupPostFields{}
	s := fmt.Sprintf("SELECT * FROM groupposts WHERE id = '%v'", groupId)
	rows, err := db.Query(s)
	if err != nil {
		fmt.Println("error retrieving group posts", err)
	}
	var id string
	var postId string
	var author string
	var image string
	var text string
	var thread string
	var time int

	for rows.Next() {
		rows.Scan(&id, &postId, &author, &image, &text, &thread, &time)
		postTableRows := GroupPostFields{
			Id:           id,
			PostId:       postId,
			Author:       author,
			Image:        image,
			Text:         text,
			Thread:       thread,
			Time:         time,
			PostComments: len(GetGroupPostComments(postId, user)),
		}

		row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", postTableRows.Author, db, "GetUserFromPosts")
		postTableRows.AuthorImg = QueryUser(row, err).Avatar
		if postTableRows.Author == user {
			postTableRows.PostAuthor = true
		}
		postTableRows.PostComments = len(GetGroupPostComments(postTableRows.PostId, user))
		postTableRows.Likes = len(GetGroupPostLikes(postTableRows.PostId, "l"))
		postTableRows.Dislikes = len(GetGroupPostLikes(postTableRows.PostId, "d"))
		postLike := GetGroupLike(postTableRows.PostId, user)
		if postLike != (GroupsAndLikesFields{}) {
			if postLike.Like == "l" {
				postTableRows.PostLiked = true
			} else if postLike.Like == "d" {
				postTableRows.PostDisliked = true
			}
		}
		sliceOfPostTableRows = append(sliceOfPostTableRows, postTableRows)
	}
	rows.Close()
	return sliceOfPostTableRows
}

func GetGroupPost(postId string, user string) GroupPostFields {
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM groupposts WHERE postid ='%v'", postId)
	var post GroupPostFields
	rows, _ := db.Query(s)
	var id string
	var postid string
	var author string
	var image string
	var text string
	var thread string
	var time int

	for rows.Next() {
		rows.Scan(&id, &postid, &author, &image, &text, &thread, &time)
		post = GroupPostFields{
			Id:         id,
			PostId:     postid,
			Author:     author,
			Image:      image,
			Text:       text,
			Thread:     thread,
			Time:       time,
			PostAuthor: false,
		}
		postLike := GetGroupLike(post.PostId, user)
		if postLike.Like == "l" {
			post.PostLiked = true
		} else if postLike.Like == "d" {
			post.PostDisliked = true
		}
		fmt.Println()
		post.Likes = len(GetGroupPostLikes(post.PostId, "l"))
		post.Dislikes = len(GetGroupPostLikes(post.PostId, "d"))
		post.PostComments = len(GetGroupPostComments(post.PostId, user))
		row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", post.Author, db, "GetUserFromPosts")
		post.AuthorImg = QueryUser(row, err).Avatar
		if post.Author == user {
			post.PostAuthor = true
		}
	}
	rows.Close()
	return post
}

//
// Group Post Likes
//

func AddGroupLike(GroupLikes GroupsAndLikesFields) error {
	LikedGroup := GetGroupLike(GroupLikes.PostId, GroupLikes.Username)
	db := OpenDB()
	var s string
	if LikedGroup.Like == "" {
		s = "INSERT INTO likesgroup (like, id, username) values (?, ?, ?)"
	} else if GroupLikes.Like != LikedGroup.Like {
		s = "UPDATE likesgroup SET like = ? WHERE id = ? AND username = ?"
	} else {
		s = "DELETE FROM likesgroup WHERE like = ? AND id = ? AND username = ?"
	}
	stmt, _ := db.Prepare(s)
	_, err := stmt.Exec(GroupLikes.Like, GroupLikes.PostId, GroupLikes.Username)
	if err != nil {
		fmt.Println(err)
	}
	return err
}

func GetGroupLike(id, user string) GroupsAndLikesFields {
	GroupLikeRow := GroupsAndLikesFields{}
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM likesgroup WHERE id = '%v' AND username = '%v'", id, user)
	rows, _ := db.Query(s)
	var postId string
	var author string
	var like string
	if rows.Next() {
		err := rows.Scan(&postId, &author, &like)
		if err != nil {
			fmt.Println("error getting group post like", err)
		}
		GroupLikeRow = GroupsAndLikesFields{
			PostId:   postId,
			Username: author,
			Like:     like,
		}
	}
	rows.Close()
	return GroupLikeRow
}

func GetGroupPostLikes(id, l string) []GroupsAndLikesFields {
	sliceOfGroupLikesRow := []GroupsAndLikesFields{}
	db := OpenDB()
	var s string
	if l == "all" {
		s = fmt.Sprintf("SELECT * FROM likesgroup WHERE username = '%v' AND like = '%v'", id, "l")

	} else {
		s = fmt.Sprintf("SELECT * FROM likesgroup WHERE id = '%v' AND like = '%v'", id, l)

	}

	rows, _ := db.Query(s)
	var postId string
	var author string
	var like string
	if rows.Next() {
		err := rows.Scan(&postId, &author, &like)
		if err != nil {
			fmt.Println("error getting group post likes", err)
		}
		likedRows := GroupsAndLikesFields{
			PostId:   postId,
			Username: author,
			Like:     like,
		}
		sliceOfGroupLikesRow = append(sliceOfGroupLikesRow, likedRows)
	}
	rows.Close()
	return sliceOfGroupLikesRow
}

//
// Group Post Comments
//

func AddGroupPostComment(commentFields CommentFields) error {
	db := OpenDB()
	stmt, err := db.Prepare(`INSERT INTO "groupComments" (id, postid, author, image, text, thread, time) values(?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		log.Fatal("error preparing to comment table:= ", err)
		return err
	}
	_, err = stmt.Exec(commentFields.CommentId, commentFields.PostId, commentFields.Author, commentFields.Image, commentFields.Text, commentFields.Thread, commentFields.Time)
	if err != nil {
		log.Fatal("Error adding comment to groupComment table", err)
		return err
	}
	fmt.Println("added comment to groupComment table")
	return err
}

func GetGroupPostComments(postId, user string) []CommentFields {
	// fmt.Println(user, "postId", postId)
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM groupComments WHERE postid = '%v'", postId)

	sliceOfCommentRows := []CommentFields{}
	rows, _ := db.Query(s)
	var commentid, postid, author, image, thread, text string
	var time int

	for rows.Next() {
		rows.Scan(&commentid, &postid, &author, &image, &text, &thread, &time)
		commentRows := CommentFields{
			CommentId:     commentid,
			PostId:        postid,
			Author:        author,
			Image:         image,
			Text:          text,
			Thread:        thread,
			Time:          time,
			CommentAuthor: false,
		}

		row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", commentRows.Author, db, "GetUserFromPosts")
		commentRows.AuthorImg = QueryUser(row, err).Avatar

		if commentRows.Author == user {
			commentRows.CommentAuthor = true
		}
		sliceOfCommentRows = append(sliceOfCommentRows, commentRows)
	}
	rows.Close()
	return sliceOfCommentRows
}

func RemoveGroupPostComment(id string) error {
	db := OpenDB()
	stmt, err := db.Prepare(`DELETE FROM "groupComments" WHERE "id" = ?`)
	if err != nil {
		fmt.Println("error removing comment from groupComment table", err)
	}
	stmt.Exec(id)
	return err
}

func GetGroupPostComment(commentId, user string) CommentFields {
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM groupComments WHERE id = '%v'", commentId)
	rows, _ := db.Query(s)
	var commentid, postid, author, image, thread, text string
	var time int
	var commentPost CommentFields

	for rows.Next() {
		rows.Scan(&commentid, &postid, &author, &image, &text, &thread, &time)
		commentPost = CommentFields{
			CommentId: commentid,
			PostId:    postid,
			Author:    author,
			Image:     image,
			Text:      text,
			Thread:    thread,
			Time:      time,
		}
		row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", commentPost.Author, db, "GetUserFromPosts")
		commentPost.AuthorImg = QueryUser(row, err).Avatar
		if commentPost.Author == user {
			commentPost.CommentAuthor = true
		}
	}
	rows.Close()
	return commentPost
}

//
// Chats
//

func CheckIfPrivateExistsBasedOnUsers(chatFields ChatRoomFields) bool {
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM chatroom WHERE type = '%v'", chatFields.Type)
	row, err := db.Query(s)
	sameNameGroups := []ChatRoomFields{}
	if err != nil {
		log.Fatal(err)
	}

	var id, name, description, chatType, users, admin, avatar string
	for row.Next() { // Iterate and fetch the records from result cursor
		row.Scan(&id, &name, &description, &chatType, &users, &admin, &avatar)
		groupChat := ChatRoomFields{
			Id:          id,
			Name:        name,
			Description: description,
			Type:        chatType,
			Users:       users,
			Admin:       admin,
			Avatar:      avatar,
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

func AddChat(chatFields ChatRoomFields, creator string) error {
	sliceOfUsers := strings.Split(chatFields.Users, ",")
	sort.Strings(sliceOfUsers)
	chatFields.Users = strings.Join(sliceOfUsers, ",")
	chatFields.Admin = creator
	db := OpenDB()
	stmt, err := db.Prepare(`INSERT INTO "chatroom" (id, name,description,type,users,admin,avatar) values (?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		fmt.Println("error preparing table:", err)
		return err
	}
	_, errorWithTable := stmt.Exec(chatFields.Id, chatFields.Name, chatFields.Description, chatFields.Type, chatFields.Users, chatFields.Admin, chatFields.Avatar)
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

	var id, name, description, chatType, users, admin, avatar string
	for row.Next() { // Iterate and fetch the records from result cursor
		row.Scan(&id, &name, &description, &chatType, &users, &admin, &avatar)
		groupChat := ChatRoomFields{
			Id:          id,
			Name:        name,
			Description: description,
			Type:        chatType,
			Users:       users,
			Admin:       admin,
			Avatar:      avatar,
		}
		sliceOfUsers := strings.Split(groupChat.Users, ",")
		for i, involved := range sliceOfUsers {
			if involved == username {
				groupChat.Users = strings.Join(removeUserFromChatButton(sliceOfUsers, i), ",")
				if groupChat.Type == "group" {
					messages := GetPreviousMessages(groupChat.Id)
					if len(messages) > 0 {
						date := messages[len(messages)-1].Date
						fmt.Println(date)
						groupChat.Date = date
					}
					involvedChats.Group = append(involvedChats.Group, groupChat)
				} else if groupChat.Type == "private" {
					row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", groupChat.Users, db, "GetUserFromPrivateChatroom")
					groupChat.Avatar = QueryUser(row, err).Avatar
					messages := GetPreviousMessages(groupChat.Id)
					if len(messages) > 0 {
						date := messages[len(messages)-1].Date
						fmt.Println(date)
						groupChat.Date = date
					}
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
	var id, name, description, chatType, users, admin, avatar string
	for row.Next() {
		row.Scan(&id, &name, &description, &chatType, &users, &admin, &avatar)
		groupChat = ChatRoomFields{
			Id:          id,
			Name:        name,
			Description: description,
			Type:        chatType,
			Users:       users,
			Admin:       admin,
			Avatar:      avatar,
		}
		sliceOfUsers := strings.Split(groupChat.Users, ",")
		for i := range sliceOfUsers {
			if sliceOfUsers[i] == user {
				groupChat.Users = strings.Join(removeUserFromChatButton(sliceOfUsers, i), ",")
			}
		}
		if groupChat.Type == "private" {
			row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", groupChat.Users, db, "GetUserFromPrivateChatroom")
			groupChat.Avatar = QueryUser(row, err).Avatar
		}
	}
	return groupChat
}

func removeUserFromChatButton(slice []string, s int) []string {
	return append(slice[:s], slice[s+1:]...)
}

func Contains(s []string, e string) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

func UpdateChatroom(chatroom ChatRoomFields, action string, user string) ChatRoomFields {
	db := OpenDB()
	users := strings.Split(chatroom.Users, ",")
	sort.Strings(users)
	if action == "leave" {
		if user == chatroom.Admin {
			randomIndex := rand.Intn(len(users))
			chatroom.Admin = users[randomIndex]
		}
		var returnedUserDisplay []string
		for _, u := range users {
			if u != user {
				returnedUserDisplay = append(returnedUserDisplay, u)
			}
		}
		fmt.Println(users)
		chatroom.Users = strings.Join(returnedUserDisplay, ",")
	} else {
		chatroom.Admin = user

		chatroom.Users += strings.Join(users, ",") + "," + user
	}
	stmt, err := db.Prepare("UPDATE chatroom SET name = ?, description = ?, users=? , admin =? WHERE id = ?")
	if err != nil {
		fmt.Println("error updating chatroom", err)
	}
	stmt.Exec(chatroom.Name, chatroom.Description, chatroom.Users, chatroom.Admin, chatroom.Id)
	return chatroom
}

func AddMessage(chatFields ChatFields) error {
	db := OpenDB()
	stmt, err := db.Prepare(`INSERT INTO "messages" (id,sender,messageId,message,date) values (?, ?, ?, ?, ?)`)
	if err != nil {
		fmt.Println("error preparing table:", err)
		return err
	}
	_, errorWithTable := stmt.Exec(chatFields.Id, chatFields.Sender, chatFields.MessageId, chatFields.Message, chatFields.Date)
	if errorWithTable != nil {
		fmt.Println("error adding to table:", errorWithTable)
		return errorWithTable
	}
	return nil
}
func GetPreviousMessages(chatroomId string) []ChatFields {
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM messages WHERE id = '%v'", chatroomId)
	row, err := db.Query(s)
	if err != nil {
		fmt.Println("Could Not Find Chatroom", err)
	}

	var messages []ChatFields
	var id, sender, messageId, message string
	var date int
	for row.Next() {
		row.Scan(&id, &sender, &messageId, &message, &date)
		m := ChatFields{
			Id:        id,
			Sender:    sender,
			MessageId: messageId,
			Message:   message,
			Date:      date,
		}
		messages = append(messages, m)
	}
	row.Close()
	return messages
}

//
// Posts
//

func AddPost(postFields PostFields) {
	db := OpenDB()
	stmt, err := db.Prepare(`INSERT into "posts"(id,author,image,text,thread,time,privacy,viewers) VALUES (?,?,?,?,?,?,?,?)`)
	if err != nil {
		fmt.Println("error add post to table", err)
	}
	stmt.Exec(postFields.Id, postFields.Author, postFields.Image, postFields.Text, postFields.Thread, postFields.Time, postFields.Privacy, postFields.Viewers)
}

func UpdatePost(postFields PostFields) error {
	db := OpenDB()
	stmt, err := db.Prepare(`UPDATE "posts" SET "text" = ?, "thread" = ?, "image" = ? WHERE "id" = ?`)
	if err != nil {
		fmt.Println("Cannot update post")
	}
	stmt.Exec(postFields.Text, postFields.Thread, postFields.Image, postFields.Id)
	return err
}

func RemovePost(id string) error {
	db := OpenDB()
	stmt, err := db.Prepare("DELETE FROM posts WHERE id = ?")
	if err != nil {
		fmt.Println("error removing post from posts table", err)
	}
	stmt.Exec(id)
	return err
}
func GetUserPosts(user, privateness string) []PostFields {
	db := OpenDB()
	sliceOfPostTableRows := []PostFields{}
	rows, _ := db.Query(`SELECT * FROM "posts"`)
	var id string
	var author string
	var image string
	var text string
	var privacy string
	var viewers string
	var time int
	var thread string

	for rows.Next() {
		rows.Scan(&id, &author, &image, &text, &thread, &time, &privacy, &viewers)
		postTableRows := PostFields{
			Id:           id,
			Author:       author,
			Image:        image,
			Text:         text,
			Thread:       thread,
			Time:         time,
			Privacy:      privacy,
			Viewers:      viewers,
			PostAuthor:   false,
			PostComments: len(GetPostComments(id, user)),
			Likes:        len(GetPostLikes(id, "l")),
			Dislikes:     len(GetPostLikes(id, "d")),
		}
		row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", postTableRows.Author, db, "GetUserFromPosts")
		postTableRows.AuthorImg = QueryUser(row, err).Avatar
		if postTableRows.Author == user {
			postTableRows.PostAuthor = true
		}
		postTableRows.Likes = len(GetPostLikes(postTableRows.Id, "l"))
		postLike := GetPostLike(postTableRows.Id, user)
		if postLike.Like == "l" {
			postTableRows.PostLiked = true
		} else if postLike.Like == "d" {
			postTableRows.PostDisliked = true
		}
		postTableRows.Dislikes = len(GetPostLikes(postTableRows.Id, "d"))
		postTableRows.PostComments = len(GetPostComments(postTableRows.Id, user))
		if privateness == "public" {
			if postTableRows.Privacy == "public" {
				sliceOfPostTableRows = append(sliceOfPostTableRows, postTableRows)
			}
		} else {
			if postTableRows.Privacy == "private" {
				row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", user, db, "GetUserFromPosts")
				friends := GetFollowing(QueryUser(row, err))
				friends = append(friends, user)
				if Contains(friends, postTableRows.Author) {
					sliceOfPostTableRows = append(sliceOfPostTableRows, postTableRows)
				}
			} else if postTableRows.Privacy == "almost-private" {
				viewPost := strings.Split(postTableRows.Viewers, ",")
				viewPost = append(viewPost, postTableRows.Author)
				if Contains(viewPost, user) {
					sliceOfPostTableRows = append(sliceOfPostTableRows, postTableRows)
				}
			}

		}
	}
	rows.Close()
	return sliceOfPostTableRows
}

func GetPost(postId string, user string) PostFields {
	fmt.Println(user, "get post", postId)
	db := OpenDB()
	s := fmt.Sprintf(`SELECT * FROM "posts" WHERE id ='%v'`, postId)
	var post PostFields
	rows, _ := db.Query(s)
	var id string
	var author string
	var image string
	var text string
	var thread string
	var time int
	var privacy string
	var viewers string

	for rows.Next() {
		rows.Scan(&id, &author, &image, &text, &thread, &time, &privacy, &viewers)
		post = PostFields{
			Id:           id,
			Author:       author,
			Image:        image,
			Text:         text,
			Thread:       thread,
			Time:         time,
			PostAuthor:   false,
			PostComments: len(GetPostComments(postId, user)),
			Likes:        len(GetPostLikes(postId, "l")),
			Dislikes:     len(GetPostLikes(postId, "d")),
			Privacy:      privacy,
			Viewers:      viewers,
		}
		row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", post.Author, db, "GetUserFromPosts")
		post.AuthorImg = QueryUser(row, err).Avatar
		if post.Author == user {
			post.PostAuthor = true
		}
		postLike := GetPostLike(post.Id, user)
		if postLike.Like == "l" {
			post.PostLiked = true
		} else if postLike.Like == "d" {
			post.PostDisliked = true
		}
	}
	rows.Close()
	return post
}

//
// Likes
//

func GetPostLike(id, user string) LikesFields {
	sliceOfLikeRows := LikesFields{}
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM likes WHERE id = '%v' AND username = '%v'", id, user)
	rows, _ := db.Query(s)
	var postid string
	var author string
	var like string
	if rows.Next() {
		rows.Scan(&postid, &author, &like)
		sliceOfLikeRows = LikesFields{
			PostId:   postid,
			Username: author,
			Like:     like,
		}
	}
	rows.Close()
	return sliceOfLikeRows
}

func AddPostLikes(postLiked LikesFields) error {
	LikedPost := GetPostLike(postLiked.PostId, postLiked.Username)
	db := OpenDB()
	var s string
	if LikedPost.Like == "" {
		s = "INSERT INTO likes (like, id, username) values (?, ?, ?)"
	} else if postLiked.Like != LikedPost.Like {
		s = "UPDATE likes SET like = ? WHERE id = ? AND username = ?"
	} else {
		s = "DELETE FROM likes WHERE like = ? AND id = ? AND username = ?"
	}
	stmt, _ := db.Prepare(s)
	_, err := stmt.Exec(postLiked.Like, postLiked.PostId, postLiked.Username)
	if err != nil {
		fmt.Println(err)
	}
	return err
}

func GetPostLikes(id, l string) []LikesFields {
	sliceOfLikedRows := []LikesFields{}
	db := OpenDB()
	var s string
	if l == "all" {
		s = fmt.Sprintf("SELECT * FROM likes WHERE username = '%v' AND like = '%v'", id, "l")

	} else {
		s = fmt.Sprintf("SELECT * FROM likes WHERE id = '%v' AND like = '%v'", id, l)

	}

	rows, _ := db.Query(s)
	var postid string
	var author string
	var like string
	for rows.Next() {
		rows.Scan(&postid, &author, &like)
		likedRows := LikesFields{
			PostId:   postid,
			Username: author,
			Like:     like,
		}
		sliceOfLikedRows = append(sliceOfLikedRows, likedRows)
	}
	rows.Close()
	return sliceOfLikedRows
}

//
// Comments
//

func AddComment(commentFields CommentFields) error {
	fmt.Println("comments", commentFields)
	db := OpenDB()
	stmt, err := db.Prepare(`INSERT INTO "comments" (id, postid, author, image, text, thread, time) values(?, ?, ?, ?, ?, ?, ?)`)
	if err != nil {
		log.Fatal("error preparing to comment table:= ", err)
		return err
	}
	_, err = stmt.Exec(commentFields.CommentId, commentFields.PostId, commentFields.Author, commentFields.Image, commentFields.Text, commentFields.Thread, commentFields.Time)
	if err != nil {
		log.Fatal("Error adding comment to table", err)
		return err
	}
	fmt.Println("added comment to table")
	return err
}

func GetPostComments(postId, user string) []CommentFields {
	// fmt.Println(user, "postId", postId)
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM comments WHERE postid = '%v'", postId)

	sliceOfCommentRows := []CommentFields{}
	rows, _ := db.Query(s)
	var commentid, postid, author, image, thread, text string
	var time int

	for rows.Next() {
		rows.Scan(&commentid, &postid, &author, &image, &text, &thread, &time)
		commentRows := CommentFields{
			CommentId:     commentid,
			PostId:        postid,
			Author:        author,
			Image:         image,
			Text:          text,
			Thread:        thread,
			Time:          time,
			CommentAuthor: false,
			Likes:         len(GetCommentLikes(commentid, "l")),
			Dislikes:      len(GetCommentLikes(commentid, "d")),
		}

		row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", commentRows.Author, db, "GetUserFromPosts")
		commentRows.AuthorImg = QueryUser(row, err).Avatar

		if commentRows.Author == user {
			commentRows.CommentAuthor = true
		}
		commentLike := GetCommentLike(commentRows.CommentId, user)
		if commentLike.Like == "l" {
			commentRows.CommentLiked = true
		} else if commentLike.Like == "d" {
			commentRows.CommentDisliked = true
		}
		sliceOfCommentRows = append(sliceOfCommentRows, commentRows)
	}
	rows.Close()
	return sliceOfCommentRows
}

func RemoveComment(id string) error {
	db := OpenDB()
	stmt, err := db.Prepare(`DELETE FROM "comments" WHERE "id" = ?`)
	if err != nil {
		fmt.Println("error removing post from posts table", err)
	}
	stmt.Exec(id)
	return err
}

func GetComment(commentId, user string) CommentFields {
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM comments WHERE id = '%v'", commentId)
	rows, _ := db.Query(s)
	var commentid, postid, author, image, thread, text string
	var time int
	var commentPost CommentFields

	for rows.Next() {
		rows.Scan(&commentid, &postid, &author, &image, &text, &thread, &time)
		commentPost = CommentFields{
			CommentId: commentid,
			PostId:    postid,
			Author:    author,
			Image:     image,
			Text:      text,
			Thread:    thread,
			Time:      time,
			Likes:     len(GetCommentLikes(commentid, "l")),
			Dislikes:  len(GetCommentLikes(commentid, "d")),
		}
		row, err := PreparedQuery("SELECT * FROM users WHERE nickname = ?", commentPost.Author, db, "GetUserFromPosts")
		commentPost.AuthorImg = QueryUser(row, err).Avatar
		if commentPost.Author == user {
			commentPost.CommentAuthor = true
		}
		commentLike := GetCommentLike(commentPost.CommentId, user)
		if commentLike.Like == "l" {
			commentPost.CommentLiked = true
		} else if commentLike.Like == "d" {
			commentPost.CommentDisliked = true
		}
	}
	rows.Close()
	return commentPost
}

//
// Comment Likes
//

func AddCommentLike(commentLikes CommentsAndLikesFields) error {
	LikedComment := GetCommentLike(commentLikes.CommentId, commentLikes.Username)
	db := OpenDB()
	var s string
	if LikedComment.Like == "" {
		s = "INSERT INTO likescom (like, id, username) values (?, ?, ?)"
	} else if commentLikes.Like != LikedComment.Like {
		s = "UPDATE likescom SET like = ? WHERE id = ? AND username = ?"
	} else {
		s = "DELETE FROM likescom WHERE like = ? AND id = ? AND username = ?"
	}
	stmt, _ := db.Prepare(s)
	_, err := stmt.Exec(commentLikes.Like, commentLikes.CommentId, commentLikes.Username)
	if err != nil {
		fmt.Println(err)
	}
	return err
}

func GetCommentLike(id, user string) CommentsAndLikesFields {
	CommentLikeRow := CommentsAndLikesFields{}
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM likescom WHERE id = '%v' AND username = '%v'", id, user)
	rows, _ := db.Query(s)
	var commentId string
	var author string
	var like string
	if rows.Next() {
		rows.Scan(&commentId, &author, &like)
		CommentLikeRow = CommentsAndLikesFields{
			CommentId: commentId,
			Username:  author,
			Like:      like,
		}
	}
	rows.Close()
	return CommentLikeRow
}

func GetCommentLikes(id, l string) []CommentsAndLikesFields {
	sliceOfCommentLikesRow := []CommentsAndLikesFields{}
	db := OpenDB()
	var s string
	if l == "all" {
		s = fmt.Sprintf("SELECT * FROM likescom WHERE username = '%v' AND like = '%v'", id, "l")

	} else {
		s = fmt.Sprintf("SELECT * FROM likescom WHERE id = '%v' AND like = '%v'", id, l)

	}

	rows, _ := db.Query(s)
	var commentId string
	var author string
	var like string
	for rows.Next() {
		rows.Scan(&commentId, &author, &like)
		likedRows := CommentsAndLikesFields{
			CommentId: commentId,
			Username:  author,
			Like:      like,
		}
		sliceOfCommentLikesRow = append(sliceOfCommentLikesRow, likedRows)
	}
	rows.Close()
	return sliceOfCommentLikesRow
}

// Followers

func GetUserFromFollowMessage(email string) User {
	db := OpenDB()
	//get the users who have interacted
	row, err := PreparedQuery("SELECT * FROM users WHERE email = ?", email, db, "GetUserFromFollowers")
	return QueryUser(row, err)
}

func updateFollowerCount(followerEmail string, followeeEmail string, isFollowing bool) (int, int, error) {
	// Update the follower count in the database.

	db := OpenDB()

	// Create a map representing the follow object to update the db.
	follow := make(map[string]string)
	follow["follower"] = followerEmail
	follow["followee"] = followeeEmail

	// Increment if follow button pressed otherwise decrement.
	if isFollowing {
		db.Exec("UPDATE users SET followers=followers+1 WHERE email=?", followeeEmail)
		db.Exec("UPDATE users SET following=following+1 WHERE email=?", followerEmail)
		PreparedExec("INSERT INTO followers (follower, followee) values (?,?)", follow, db, "updateFollowerCount")
	} else {
		db.Exec("UPDATE users SET followers=followers-1 WHERE email=?", followeeEmail)
		db.Exec("UPDATE users SET following=following-1 WHERE email=?", followerEmail)
		PreparedExec("DELETE FROM followers WHERE follower=? AND followee=?", follow, db, "updateFollowerCount")
	}

	// Secure sql query and get user based on session, get followee updated following/followers details
	rows, err := PreparedQuery("SELECT * FROM users WHERE email = ?", followeeEmail, db, "updateFollowerCount")
	followee := QueryUser(rows, err)

	// get follower updated following/followers details
	rows1, err1 := PreparedQuery("SELECT * FROM users WHERE email = ?", followerEmail, db, "updateFollowerCount")
	follower := QueryUser(rows1, err1)

	// Return the new follower count
	return followee.Followers, follower.Following, nil
}

func GetFollowers(user User) []string {
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM followers WHERE follower = '%v' OR followee = '%v'", user.Email, user.Email)
	rows, _ := db.Query(s)
	var id int
	var follower, followee string
	var friends []string
	for rows.Next() {
		err := rows.Scan(&id, &follower, &followee)
		if err != nil {
			fmt.Println("error getting friends", err)
		} else {
			if follower == user.Email {
				row, err := PreparedQuery("SELECT * FROM users WHERE email = ?", followee, db, "GetUserFromFollowers")
				name := QueryUser(row, err).Nickname
				if !Contains(friends, name) {
					friends = append(friends, name)
				}

			} else {
				row, err := PreparedQuery("SELECT * FROM users WHERE email = ?", follower, db, "GetUserFromFollowers")
				name := QueryUser(row, err).Nickname
				if !Contains(friends, name) {
					friends = append(friends, name)
				}
			}
		}

	}
	friends = append(friends, user.Nickname)
	rows.Close()
	return friends
}

func GetFollowing(user User) []string {
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM followers WHERE follower = '%v'", user.Email)
	rows, err := db.Query(s)
	if err != nil {
		fmt.Println("error selecting followees", err)
	}
	var id int
	var follower, followee string
	var friends []string
	for rows.Next() {
		err := rows.Scan(&id, &follower, &followee)
		if err != nil {
			fmt.Println("error getting friends", err)
		} else {
			row, err := PreparedQuery("SELECT * FROM users WHERE email = ?", followee, db, "GetUserFromFollowers")
			name := QueryUser(row, err).Nickname
			if !Contains(friends, name) {
				friends = append(friends, name)
			}
		}

	}
	friends = append(friends, user.Nickname)
	rows.Close()
	return friends
}

func GetTotalFollowers(email string) int {
	db := OpenDB()
	s := fmt.Sprintf("SELECT * FROM followers WHERE follower = '%v'", email)
	rows, _ := db.Query(s)
	var id int
	var follower, followee string
	var totalFollowers []Follow
	for rows.Next() {
		err := rows.Scan(&id, &follower, &followee)
		if err != nil {
			fmt.Println("error getting friends", err)
		}
		followField := Follow{
			Follower: follower,
			Followee: followee,
		}
		totalFollowers = append(totalFollowers, followField)
	}
	rows.Close()

	return len(totalFollowers)
}

//
// notifications
//

func AddChatNotif(notifFields ChatNotifcationFields) error {
	db := OpenDB()
	stmt, err := db.Prepare(`
	INSERT INTO "chatNotification" (chatId,sender,receiver,numOfMessages,date) values (?,?,?,?,?)
	`)
	if err != nil {
		fmt.Println("error preparing table:", err)
		return err
	}
	defer stmt.Close()
	_, errorWithTable := stmt.Exec(notifFields.ChatId, notifFields.Sender, notifFields.Receiver, notifFields.NumOfMessages, notifFields.Date)
	if errorWithTable != nil {
		fmt.Println("error adding to table:", errorWithTable)
		return errorWithTable
	}
	return nil
}

func GetChatNotif(receiverName, senderName, chatRoomId string) ChatNotifcationFields {
	db := OpenDB()
	var chatNotif ChatNotifcationFields
	n := fmt.Sprintf(`SELECT * FROM chatNotification WHERE receiver = '%v' AND sender ='%v' AND chatId ='%v'`, receiverName, senderName, chatRoomId)
	rows, err := db.Query(n)
	var sender, receiver, chatId string
	var notifNum, date int
	if err != nil {
		fmt.Println(err, "error finding chatNotification in table.")
		return chatNotif
	}
	defer rows.Close()
	for rows.Next() {
		err := rows.Scan(&sender, &receiver, &chatId, &notifNum, &date)
		if err != nil {
			fmt.Println("error finding chatNotification", err)
		}
		chatNotif = ChatNotifcationFields{
			ChatId:        chatId,
			Sender:        sender,
			Receiver:      receiver,
			NumOfMessages: notifNum,
			Date:          date,
		}
	}
	return chatNotif
}

func GetChatNotifications(receiverName, chatRoomId string) []ChatNotifcationFields {
	db := OpenDB()
	var sliceOfNotification []ChatNotifcationFields
	n := fmt.Sprintf(`SELECT * FROM chatNotification WHERE receiver = '%v' AND chatId ='%v'`, receiverName, chatRoomId)
	rows, err := db.Query(n)
	var sender, receiver, chatId string
	var notifNum, date int
	if err != nil {
		fmt.Println(err, "error finding chatNotification in table.")
		return nil
	}
	defer rows.Close()
	for rows.Next() {
		err := rows.Scan(&sender, &receiver, &chatId, &notifNum, &date)
		if err != nil {
			fmt.Println("error finding chatNotification", err)
		}
		chatNotif := ChatNotifcationFields{
			ChatId:        chatId,
			Sender:        sender,
			Receiver:      receiver,
			NumOfMessages: notifNum,
			Date:          date,
		}
		sliceOfNotification = append(sliceOfNotification, chatNotif)
	}
	return sliceOfNotification
}

func GetTotalChatNotifs(user string) int {
	db := OpenDB()
	sliceOfNotifFields := []ChatNotifcationFields{}
	n := fmt.Sprintf(`SELECT * FROM chatNotification WHERE receiver = '%v'`, user)
	rows, err := db.Query(n)
	var sender, receiver, chatId string
	var notifNum, date int
	if err != nil {
		fmt.Println(err, "error getting TotalNs")
	}

	for rows.Next() {
		rows.Scan(&sender, &receiver, &chatId, &notifNum, &date)
		notifTableRows := ChatNotifcationFields{
			ChatId:        chatId,
			Sender:        sender,
			Receiver:      receiver,
			NumOfMessages: notifNum,
			Date:          date,
		}
		sliceOfNotifFields = append(sliceOfNotifFields, notifTableRows)
	}
	rows.Close()
	var totalNotifsCounter int
	for i := range sliceOfNotifFields {
		totalNotifsCounter += sliceOfNotifFields[i].NumOfMessages
	}
	fmt.Println(totalNotifsCounter)
	return totalNotifsCounter
}

func GetAllChatNotifs(user string) []ChatNotifcationFields {
	db := OpenDB()
	sliceOfNotifFields := []ChatNotifcationFields{}
	n := fmt.Sprintf(`SELECT * FROM chatNotification WHERE receiver = '%v'`, user)
	rows, err := db.Query(n)
	var sender, receiver, chatId string
	var notifNum, date int
	if err != nil {
		fmt.Println(err, "error getting TotalNs")
	}

	for rows.Next() {
		rows.Scan(&sender, &receiver, &chatId, &notifNum, &date)
		if notifNum > 0 {
			notifTableRows := ChatNotifcationFields{
				ChatId:        chatId,
				Sender:        sender,
				Receiver:      receiver,
				NumOfMessages: notifNum,
				Date:          date,
			}
			sliceOfNotifFields = append(sliceOfNotifFields, notifTableRows)
		}
	}
	rows.Close()
	return sliceOfNotifFields
}

func UpdateNotif(item ChatNotifcationFields) {
	db := OpenDB()
	stmt, _ := db.Prepare("UPDATE chatNotification SET numOfMessages = ?, date = ? WHERE sender = ? AND receiver = ? AND chatId = ?")
	defer stmt.Close()
	_, err := stmt.Exec(item.NumOfMessages, item.Date, item.Sender, item.Receiver, item.ChatId)
	if err != nil {
		fmt.Println(err, "error executing update chatNotification.")
	}
}

//
// requestNotif
//

func DeleteRequestNotif(item RequestNotifcationFields) {
	db := OpenDB()
	defer db.Close()
	if item.GroupId == "" {
		stmt, error2 := db.Prepare("DELETE FROM requestNotification WHERE sender = ? AND receiver = ? AND typeOfRequest = ?")
		if error2 != nil {
			fmt.Println(error2)
			return
		}
		_, err := stmt.Exec(item.Sender, item.Receiver, "followRequest")
		if err != nil {
			fmt.Println(err, "error executing delete followRequestNotif.")
			return
		}
		fmt.Println("removed follow req")
		return
	} else {
		stmt, error2 := db.Prepare("DELETE FROM requestNotification WHERE sender = ? AND receiver = ?  AND typeOfRequest = ? AND groupId = ?")
		if error2 != nil {
			fmt.Println(error2)
			return
		}
		_, err := stmt.Exec(item.Sender, item.Receiver, item.TypeOfAction, item.GroupId)
		if err != nil {
			fmt.Println(err, "error executing delete groupRequestNotif.")
			return
		}
		fmt.Println("removed group req")
		return
	}

}

func AddRequestNotif(senderName, receiverName, requestType, id string) error {
	db := OpenDB()
	if id == "" {
		stmt, err := db.Prepare(`
		INSERT INTO requestNotification (sender,receiver,typeOfRequest) values (?,?,?)
		`)
		if err != nil {
			fmt.Println("error preparing table:", err)
			return err
		}
		_, errorWithTable := stmt.Exec(senderName, receiverName, requestType)
		if errorWithTable != nil {
			fmt.Println("error adding to table:", errorWithTable)
			return errorWithTable
		}
		return nil
	} else {
		stmt, err := db.Prepare(`
	INSERT INTO requestNotification (sender,receiver,typeOfRequest, groupId) values (?,?,?,?)
	`)
		if err != nil {
			fmt.Println("error preparing table:", err)
			return err
		}
		_, errorWithTable := stmt.Exec(senderName, receiverName, requestType, id)
		if errorWithTable != nil {
			fmt.Println("error adding to table:", errorWithTable)
			return errorWithTable
		}
	}
	return nil
}

func GetAllRequestNotifs(user string) []RequestNotifcationFields {
	db := OpenDB()
	sliceOfRequestFields := []RequestNotifcationFields{}
	n := fmt.Sprintf(`SELECT * FROM requestNotification WHERE receiver = '%v'`, user)
	rows, err := db.Query(n)
	var sender, receiver, typeOfRequest, groupId string
	if err != nil {
		fmt.Println(err, "error getting TotalRequestNotifciations")
	}
	for rows.Next() {
		rows.Scan(&sender, &receiver, &typeOfRequest, &groupId)
		requestTableRows := RequestNotifcationFields{
			Sender:       sender,
			Receiver:     receiver,
			TypeOfAction: typeOfRequest,
			GroupId:      groupId,
		}
		sliceOfRequestFields = append(sliceOfRequestFields, requestTableRows)
	}
	rows.Close()
	return sliceOfRequestFields
}

func GetRequestNotifByType(receiverName, senderName, requestType string) []RequestNotifcationFields {
	db := OpenDB()
	sliceOfrequestNotif := []RequestNotifcationFields{}
	n := fmt.Sprintf(`SELECT * FROM requestNotification WHERE receiver = '%v' AND sender ='%v' AND typeOfRequest ='%v'`, receiverName, senderName, requestType)
	rows, err := db.Query(n)
	var sender, receiver, typeOfRequest, groupId string
	if err != nil {
		fmt.Println(err, "error getting follow request")
	}
	for rows.Next() {
		rows.Scan(&sender, &receiver, &typeOfRequest, &groupId)
		requestNotif := RequestNotifcationFields{
			Sender:       sender,
			Receiver:     receiver,
			TypeOfAction: typeOfRequest,
			GroupId:      groupId,
		}
		sliceOfrequestNotif = append(sliceOfrequestNotif, requestNotif)
	}
	rows.Close()
	return sliceOfrequestNotif
}

func GetRequestNotif(receiverName, senderName, requestType, id string) bool {
	fmt.Println(receiverName,senderName , requestType, id)
	db := OpenDB()
	var requestNotif RequestNotifcationFields
	n := fmt.Sprintf(`SELECT * FROM requestNotification WHERE sender = '%v' AND receiver ='%v' AND typeOfRequest ='%v' AND groupId='%v'`, senderName, receiverName, requestType, id)
	rows, err := db.Query(n)
	var sender, receiver, typeOfRequest, groupId string
	if err != nil {
		fmt.Println(err, "error getting follow request")
	}
	if rows.Next() {
		err := rows.Scan(&sender, &receiver, &typeOfRequest, &groupId)
		if err != nil {
			fmt.Println("Error confirming request", err)
		}
		requestNotif = RequestNotifcationFields{
			Sender:       sender,
			Receiver:     receiver,
			TypeOfAction: typeOfRequest,
			GroupId:      groupId,
		}

	}
	rows.Close()
	db.Close()
	fmt.Println(requestNotif)
	if requestNotif.Sender == "" {
		return false
	}
	return true
}

//
// Event
//

func AddGroupEvent(eventData GroupEventFields) error {
	db := OpenDB()
	defer db.Close()
	stmt, err := db.Prepare(`INSERT INTO "events" (groupId, eventId, organiser, title, description, time) values(?, ?, ?, ?, ?, ?)`)
	if err != nil {
		log.Fatal("error preparing to events table:= ", err)
		return err
	}
	_, err = stmt.Exec(eventData.GroupId, eventData.EventId, eventData.Organiser, eventData.Title, eventData.Description, eventData.Time)
	if err != nil {
		log.Fatal("Error adding event to events table", err)
		return err
	}
	fmt.Println("added event to events table")
	return err
}

func DeleteGroupEvent(id string) error {
	db := OpenDB()
	defer db.Close()
	stmt, err := db.Prepare(`DELETE FROM "events" WHERE "eventId" = ?`)
	if err != nil {
		fmt.Println("error removing event from events table", err)
	}
	stmt.Exec(id)
	return err
}

func GetEvents(id, user string) []GroupEventFields {
	db := OpenDB()
	defer db.Close()
	sliceOfEvents := []GroupEventFields{}
	n := fmt.Sprintf(`SELECT * FROM events WHERE groupId = '%v'`, id)
	rows, err := db.Query(n)
	var groupId, eventId, organiser, title, description string
	var date int
	if err != nil {
		fmt.Println(err, "error getting all events")
	}
	for rows.Next() {
		err := rows.Scan(&groupId, &eventId, &organiser, &title, &description, &date)
		if err != nil {
			fmt.Println("error with getting events", err)
		}
		event := GroupEventFields{
			GroupId:     groupId,
			EventId:     eventId,
			Organiser:   organiser,
			Title:       title,
			Description: description,
			Time:        date,
			Attendees:   len(GetEventAttendees(eventId)),
		}
		if user == event.Organiser {
			event.EventOrganiser = true
		}
		now := time.Now()
		timestamp := int64(event.Time)
		t := time.Unix(timestamp, 0)

		if t.Before(now) && t.After(time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())) {
			fmt.Println("The time has passed today.")
			event.ActiveEvent = false
		} else {
			fmt.Println("The time has not passed today.")
			event.ActiveEvent = true
		}
		attendee := GetEventAttendee(event.EventId, user)
		if attendee.Status == "y" {
			event.Attending = true
		}

		sliceOfEvents = append(sliceOfEvents, event)
	}
	rows.Close()
	return sliceOfEvents
}

func GetEvent(id, user string) GroupEventFields {
	db := OpenDB()
	defer db.Close()
	var event GroupEventFields
	n := fmt.Sprintf(`SELECT * FROM events WHERE eventId = '%v'`, id)
	rows, err := db.Query(n)
	var groupId, eventId, organiser, title, description string
	var date int
	if err != nil {
		fmt.Println(err, "error getting all events")
	}
	if rows.Next() {
		err := rows.Scan(&groupId, &eventId, &organiser, &title, &description, &date)
		if err != nil {
			fmt.Println("error with getting events", err)
		}
		event = GroupEventFields{
			GroupId:     groupId,
			EventId:     eventId,
			Organiser:   organiser,
			Title:       title,
			Description: description,
			Time:        date,
			Attendees:   len(GetEventAttendees(eventId)),
		}

		if user == event.Organiser {
			event.EventOrganiser = true
		}

		now := time.Now()
		timestamp := int64(event.Time)
		t := time.Unix(timestamp, 0)

		if t.Before(now) && t.After(time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())) {
			fmt.Println("The time has passed today.")
			event.ActiveEvent = false
		} else {
			fmt.Println("The time has not passed today.")
			event.ActiveEvent = true
		}
		attendee := GetEventAttendee(event.EventId, user)
		if attendee.Status == "y" {
			event.Attending = true
		}
	}
	rows.Close()
	return event
}

func AddEventAttendee(eventAttendee EventAttendanceFields) error {
	attending := GetEventAttendee(eventAttendee.EventId, eventAttendee.User)
	db := OpenDB()
	defer db.Close()
	var s string
	if attending.Status == "" {
		s = "INSERT INTO eventAttendance (status, eventId, user) values (?, ?, ?)"
	} else if eventAttendee.Status != attending.Status {
		s = "UPDATE eventAttendance SET status = ? WHERE eventId = ? AND user = ?"
	} else {
		s = "DELETE FROM eventAttendance WHERE status = ? AND eventId = ? AND user = ?"
	}
	stmt, _ := db.Prepare(s)
	_, err := stmt.Exec(eventAttendee.Status, eventAttendee.EventId, eventAttendee.User)
	if err != nil {
		fmt.Println(err)
	}
	return err
}

func GetEventAttendee(id, user string) EventAttendanceFields {
	var attendingRow EventAttendanceFields
	db := OpenDB()
	defer db.Close()
	s := fmt.Sprintf("SELECT * FROM eventAttendance WHERE eventId = '%v' AND user = '%v'", id, user)
	rows, _ := db.Query(s)
	var eventId, attendee, status string
	if rows.Next() {
		err := rows.Scan(&eventId, &attendee, &status)
		if err != nil {
			fmt.Println("error getting group attendee", err)
		}
		attendingRow = EventAttendanceFields{
			EventId: eventId,
			User:    attendee,
			Status:  status,
		}
	}
	rows.Close()
	return attendingRow
}

func GetEventAttendees(id string) []EventAttendanceFields {
	db := OpenDB()
	defer db.Close()
	var eventAttending []EventAttendanceFields
	n := fmt.Sprintf(`SELECT * FROM eventAttendance WHERE eventId = '%v'`, id)
	rows, err := db.Query(n)
	var eventId, user, status string
	if err != nil {
		fmt.Println(err, "error getting all events")
	}
	for rows.Next() {
		err := rows.Scan(&eventId, &user, &status)
		if err != nil {
			fmt.Println("error with getting events", err)
		}
		attending := EventAttendanceFields{
			EventId: eventId,
			User:    user,
			Status:  status,
		}
		if attending.Status == "y" {
			eventAttending = append(eventAttending, attending)
		}
	}
	rows.Close()
	return eventAttending
}

//
// DB
//

func OpenDB() *sql.DB {
	db, err := sql.Open("sqlite3", "backend/pkg/db/sqlite/sNetwork.db")
	if err != nil {
		log.Fatal(err)
	}
	return db

}

func CreateSqlTables() {

	db := OpenDB()

	// if you need to delete a table rather than delete a whole database
	_, deleteTblErr := db.Exec(`DROP TABLE IF EXISTS "likesgroup"`)
	CheckErr(deleteTblErr, "-------Error deleting table")

	// Create user table if it doen't exist.
	var _, usrTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `users` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `email` VARCHAR(64) NOT NULL UNIQUE, `password` VARCHAR(255) NOT NULL, `firstname` VARCHAR(64) NOT NULL, `lastname` VARCHAR(64) NOT NULL, `dob` VARCHAR(255) NOT NULL, `avatar` VARCHAR(255), `nickname` VARCHAR(64), `aboutme` VARCHAR(255), `followers` INTEGER DEFAULT 0, `following` INTEGER DEFAULT 0, 'status' TEXT)")
	CheckErr(usrTblErr, "-------Error creating table")

	// Create sessions table if doesn't exist.
	var _, sessTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `sessions` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `sessionUUID` VARCHAR(255) NOT NULL UNIQUE, `userID` VARCHAR(64) NOT NULL UNIQUE, `email` VARCHAR(255) NOT NULL UNIQUE)")
	CheckErr(sessTblErr, "-------Error creating table")

	// Create chatroom table if doesn't exist.
	// add and avatar
	var _, chatRoomTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `chatroom` (`id` TEXT NOT NULL, `name` TEXT, `description` TEXT, `type` TEXT NOT NULL, `users` VARCHAR(255) NOT NULL,`admin` TEXT NOT NULL, avatar TEXT)")
	CheckErr(chatRoomTblErr, "-------Error creating table")

	// Create chats table if doesn't exist.
	var _, messagesTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `messages` ( `id` TEXT NOT NULL, `sender` VARCHAR(255) NOT NULL, `messageId` TEXT NOT NULL UNIQUE, `message` TEXT COLLATE NOCASE, `date` NUMBER)")
	CheckErr(messagesTblErr, "-------Error creating table")

	// Create posts table if doesn't exist. , `privacy` TEXT NOT NULL, `viewers` TEXT
	var _, postTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `posts` ( `id` TEXT NOT NULL UNIQUE, `author` TEXT NOT NULL, `image` TEXT,`text` TEXT,`thread` TEXT, `time` NUMBER,`privacy` TEXT NOT NULL, `viewers` TEXT)")
	CheckErr(postTblErr, "-------Error creating table")

	// Create Likes table if not exists
	var _, likesTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `likes` (`id` TEXT NOT NULL, `username` TEXT NOT NULL, `like` TEXT)")
	CheckErr(likesTblErr, "-------Error creating table")

	// Create comments table if not exists
	var _, commentError = db.Exec("CREATE TABLE IF NOT EXISTS `comments` (`id` TEXT NOT NULL UNIQUE, `postid` TEXT NOT NULL, `author` TEXT NOT NULL, `image` TEXT, `text` TEXT, `thread` TEXT, `time` NUMBER)")
	CheckErr(commentError, "-------Error creating table")

	// Create  Comment Likes table if not exists
	var _, CommentLikesTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `likescom` (`id` TEXT NOT NULL, `username` TEXT NOT NULL, `like` TEXT)")
	CheckErr(CommentLikesTblErr, "-------Error creating table")

	// Create followers table if not exists
	var _, followErr = db.Exec("CREATE TABLE IF NOT EXISTS `followers` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `follower` VARCHAR(64), `followee` VARCHAR(64))")
	CheckErr(followErr, "-------Error creating table")

	//Create chat notifications table if not exists
	var _, chatNotifErr = db.Exec("CREATE TABLE IF NOT EXISTS `chatNotification` (`sender` TEXT NOT NULL, `receiver` TEXT NOT NULL, `chatId` TEXT NOT NULL, `numOfMessages` NUMBER, `date` NUMBER)")
	CheckErr(chatNotifErr, "-------Error creating table")

	//Create  request-notifications table if not exists
	var _, requestNotifErr = db.Exec("CREATE TABLE IF NOT EXISTS `requestNotification` (`sender` TEXT NOT NULL, `receiver` TEXT NOT NULL, `typeOfRequest` TEXT NOT NULL, `groupId` TEXT)")
	CheckErr(requestNotifErr, "-------Error creating table")

	//Create Groups table if not exists
	var _, GroupTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `groups` (`id` TEXT NOT NULL, `name` TEXT, `description` TEXT, `users` VARCHAR(255) NOT NULL,`admin` TEXT NOT NULL, avatar TEXT)")
	CheckErr(GroupTblErr, "-------Error creating table")

	// Create Group Posts table if doesn't exist.
	var _, GroupPostTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `groupposts` ( `id` TEXT, `postid` TEXT NOT NULL UNIQUE, `author` TEXT NOT NULL, `image` TEXT,`text` TEXT,`thread` TEXT, `time` NUMBER)")
	CheckErr(GroupPostTblErr, "-------Error creating table")

	// Create  Group Post Likes table if not exists
	var _, GroupPostLikesTblErr = db.Exec("CREATE TABLE IF NOT EXISTS `likesgroup` (`id` TEXT NOT NULL, `username` TEXT NOT NULL, `like` TEXT)")
	CheckErr(GroupPostLikesTblErr, "-------Error creating table")

	// Create group post comments table if not exists
	var _, groupCommentError = db.Exec("CREATE TABLE IF NOT EXISTS `groupComments` (`id` TEXT NOT NULL UNIQUE, `postid` TEXT NOT NULL, `author` TEXT NOT NULL, `image` TEXT, `text` TEXT, `thread` TEXT, `time` NUMBER)")
	CheckErr(groupCommentError, "-------Error creating table")

	// Create group events  table if not exists
	var _, groupEventsError = db.Exec("CREATE TABLE IF NOT EXISTS `events` (`groupId` TEXT, `eventId` TEXT NOT NULL, `organiser` TEXT NOT NULL, `title` TEXT, `description` TEXT, `time` NUMBER)")
	CheckErr(groupEventsError, "-------Error creating table")

	var _, eventAttendanceError = db.Exec("CREATE TABLE IF NOT EXISTS `eventAttendance` (`eventId` TEXT, `user` TEXT NOT NULL, `status` TEXT)")
	CheckErr(eventAttendanceError, "-------Error creating table")
	db.Close()

}

//
// Misc
//

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

// More secure sql execute. Insert etc. pass data in through m which is a map and query via first arg.
func PreparedExec(query string, m map[string]string, db *sql.DB, functionName string) {
	stmt, err := db.Prepare(query)
	if err != nil {
		fmt.Println(functionName, " -- ", err.Error())
	}
	defer stmt.Close()

	if functionName == "updateFollowerCount" {
		stmt.Exec(m["follower"], m["followee"])
		if err != nil {
			fmt.Println(err.Error())
		}
	}
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
			sessionUUID: sessionID,
			userID:      userID,
			email:       email,
		}
		// currentUser = &username
		CheckErr(err, "-------LINE 146")
		sess = temp
	}
	rows.Close() //good habit to close
	return sess
}

func LoggedInUser(r *http.Request) User {
	cookie, err := r.Cookie("session")
	if err != nil {
		fmt.Println("no session in place")
		return User{}
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
