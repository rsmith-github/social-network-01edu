package functions

type User struct {
	Id        int    `json:"-"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Firstname string `json:"first"`
	Lastname  string `json:"last"`
	DOB       string `json:"dob"`
	Avatar    string `json:"avatar"`
	Nickname  string `json:"nickname"`
	Aboutme   string `json:"about"`
	Followers int    `json:"followers"`
	Following int    `json:"following"`
}

type Session struct {
	sessionUUID string
	userID      string
	email       string
}

type ChatRoomFields struct {
	Id          string `json:"chatroom-id"`
	Name        string `json:"chat-name"`
	Description string `json:"chat-description"`
	Type        string `json:"chat-type"`
	Users       string `json:"users"`
}

type ChatroomType struct {
	Private []ChatRoomFields `json:"private-chatrooms"`
	Group   []ChatRoomFields `json:"group-chatrooms"`
}

type ChatFields struct {
	Id        string `json:"id"`
	Sender    string `json:"sender"`
	MessageId string `json:"message-id"`
	Message   string `json:"message"`
	Date      int    `json:"date"`
}

type Follow struct {
	Follower string `json:"follower"`
	Followee string `json:"followee"`
}
