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
}

type Session struct {
	sessionUUID string
	userID      string
	email       string
}
