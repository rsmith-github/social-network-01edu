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

// add img
type ChatRoomFields struct {
	Id          string `json:"chatroom-id"`
	Name        string `json:"chat-name"`
	Description string `json:"chat-description"`
	Type        string `json:"chat-type"`
	Users       string `json:"users"`
	Admin       string `json:"admin"`
	Action      string `json:"action"`
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

type OpenChatInfo struct {
	User             string         `json:"user"`
	Chatroom         ChatRoomFields `json:"chatroom"`
	PreviousMessages []ChatFields   `json:"previous-messages"`
}

type PostFields struct {
	Id         string `json:"post-id"`
	Author     string `json:"author"`
	AuthorImg  string `json:"author-img"`
	Image      string `json:"post-image"`
	Text       string `json:"post-text-content"`
	Thread     string `json:"post-threads"`
	Likes      int    `json:"post-likes"`
	Dislikes   int    `json:"post-dislikes"`
	PostAuthor bool   `json:"post-author"`
	Time       int    `json:"post-time"`
	Error      string `json:"error"`
}

type LikesFields struct {
	PostId   string `json:"post-id"`
	Username string `json:"username"`
	Like     string `json:"like"`
	Type     string `json:"type"`
}

type ReturnLikesFields struct {
	PostId  string `json:"post-id"`
	Like    int    `json:"post-likes"`
	Dislike int    `json:"post-dislikes"`
	Error   string `json:"error"`
}
