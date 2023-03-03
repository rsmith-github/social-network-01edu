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
	Avatar      string `json:"chat-avatar"`
	Name        string `json:"chat-name"`
	Description string `json:"chat-description"`
	Type        string `json:"chat-type"`
	Users       string `json:"users"`
	Admin       string `json:"admin"`
	Action      string `json:"action"`
	Date        int    `json:"last-message-date"`
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

type followMessage struct {
	FollowRequest string `json:"followRequest"`
	ToFollow      string `json:"toFollow"`
	IsFollowing   bool   `json:"isFollowing"`
	Followers     int    `json:"followers"`
}

type followNotification struct {
	UpdateUser             string `json:"updateUser"`
	Followers              int    `json:"followers"`
	FollowerFollowingCount int    `json:"followerFollowingCount"`
}

type RequestNotifcationFields struct {
	FollowRequest followMessage `json:"notification-followRequest"`
	GroupRequest  GroupFields   `json:"notification-groupRequest"`
}
type ChatNotifcationFields struct {
	ChatId        string `json:"notification-chatId"`
	Sender        string `json:"notification-sender"`
	Receiver      string `json:"notification-receiver"`
	NumOfMessages int    `json:"notification-numOfMessages"`
	Date          int    `json:"notification-date"`
	TotalNumber   int    `json:"notification-totalNotifs"`
}

type OpenChatInfo struct {
	User             string         `json:"user"`
	Chatroom         ChatRoomFields `json:"chatroom"`
	PreviousMessages []ChatFields   `json:"previous-messages"`
}

type PostFields struct {
	Id           string `json:"post-id"`
	Author       string `json:"author"`
	AuthorImg    string `json:"author-img"`
	Image        string `json:"post-image"`
	Text         string `json:"post-text-content"`
	Thread       string `json:"post-threads"`
	Likes        int    `json:"post-likes"`
	PostLiked    bool   `json:"post-liked"`
	Dislikes     int    `json:"post-dislikes"`
	PostDisliked bool   `json:"post-disliked"`
	PostComments int    `json:"post-comments"`
	PostAuthor   bool   `json:"post-author"`
	Time         int    `json:"post-time"`
	Error        string `json:"error"`
}

type LikesFields struct {
	PostId   string `json:"post-id"`
	Username string `json:"username"`
	Like     string `json:"like"`
	Type     string `json:"type"`
}

type CommentFields struct {
	CommentId       string `json:"comment-id"`
	PostId          string `json:"post-id"`
	Author          string `json:"author"`
	AuthorImg       string `json:"author-img"`
	Image           string `json:"comment-image"`
	Text            string `json:"comment-text"`
	Thread          string `json:"comment-threads"`
	Time            int    `json:"comment-time"`
	CommentLiked    bool   `json:"comment-liked"`
	Likes           int    `json:"comment-likes"`
	CommentDisliked bool   `json:"comment-disliked"`
	Dislikes        int    `json:"comment-dislikes"`
	CommentAuthor   bool   `json:"comment-author"`
	Error           string `json:"error"`
}

type ReturnComments struct {
	TotalComments []CommentFields `json:"total-comments"`
	Post          PostFields      `json:"post-comment"`
}

type CommentsAndLikesFields struct {
	CommentId string `json:"comment-id"`
	Username  string `json:"username"`
	Like      string `json:"like"`
	Type      string `json:"type"`
}

type GroupFields struct {
	Id          string `json:"group-id"`
	Avatar      string `json:"group-avatar"`
	Name        string `json:"group-name"`
	Description string `json:"group-description"`
	Users       string `json:"users"`
	Admin       string `json:"admin"`
	Action      string `json:"action"`
}

type GroupPostFields struct {
	Id           string `json:"group-id"`
	PostId       string `json:"post-id"`
	Author       string `json:"author"`
	AuthorImg    string `json:"author-img"`
	Image        string `json:"post-image"`
	Text         string `json:"post-text-content"`
	Thread       string `json:"post-threads"`
	Likes        int    `json:"post-likes"`
	PostLiked    bool   `json:"post-liked"`
	Dislikes     int    `json:"post-dislikes"`
	PostDisliked bool   `json:"post-disliked"`
	PostAuthor   bool   `json:"post-author"`
	Time         int    `json:"post-time"`
	Error        string `json:"error"`
}

type GroupsAndLikesFields struct {
	PostId   string `json:"post-id"`
	Username string `json:"username"`
	Like     string `json:"like"`
	Type     string `json:"type"`
}
