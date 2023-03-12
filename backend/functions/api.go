package functions

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func UsersApi(w http.ResponseWriter, r *http.Request) {

	if r.Method == "GET" {
		return
	}

	// Send everything but password from users.
	createApi("users", w, r)

}

// This api helper function checks whether the current user is following the followee.
func FollowersApi(w http.ResponseWriter, r *http.Request) {

	// Get user from front end.
	var follow Follow
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&follow)
	if err != nil {
		fmt.Println("Error in FollowersApi function:  ", err)
	}
	// Try to find row where follower=currentUser and followee=toFollow
	bytes := ExecuteSQL(`SELECT * FROM followers WHERE follower="` + follow.Follower + `" AND followee="` + follow.Followee + `";`)

	// Make sure content type is json not plain text.
	w.Header().Set("Content-Type", "application/json")
	// Write json as from bytes.
	w.Write(bytes)

}

// This endpoint returns all followers.
func AllFollowersApi(w http.ResponseWriter, r *http.Request) {

	// all followers and all following based on user.
	var user User
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&user)
	if err != nil {
		fmt.Println("Error in FollowersApi function:  ", err)
	}

	// Try to find rows where follower=user.Email or followee=user.Email, in order to see who is following when clicking on the follower/following count.
	bytes := ExecuteSQL(`SELECT * FROM followers WHERE follower="` + user.Email + `" OR followee="` + user.Email + `";`)

	// Map followers and following of the user.
	userFollowingAndFollowersMap := make(map[string][]string)

	// Unmarshal becasue it returns a list of bytes. Put json into a list of follows.
	userFollowerFollowingList := make([]Follow, 0)
	err1 := json.Unmarshal(bytes, &userFollowerFollowingList)
	if err1 != nil {
		panic(err)
	}

	// Filter followers and followees of user.
	for _, followObj := range userFollowerFollowingList {
		if followObj.Followee == user.Email {
			userFollowingAndFollowersMap["followers"] = append(userFollowingAndFollowersMap["followers"], followObj.Follower)
		} else if followObj.Follower == user.Email {
			userFollowingAndFollowersMap["following"] = append(userFollowingAndFollowersMap["following"], followObj.Followee)

		}
	}

	userFollowersBytes, _ := json.Marshal(userFollowingAndFollowersMap)

	// Make sure content type is json not plain text.
	w.Header().Set("Content-Type", "application/json")
	// Write json as from bytes.
	w.Write(userFollowersBytes)

}

func createApi(table string, w http.ResponseWriter, r *http.Request) {

	// fmt.Println(table)

	var str string
	// Build query string
	if table == "users" {
		str = "SELECT email, firstname, lastname, dob, avatar, nickname, aboutme, followers, following, status FROM " + table + ";"
	} else {
		str = "SELECT * FROM " + table + ";"
	}

	// Get everything from db based on query string.
	jsn := ExecuteSQL(str)

	// Make sure content type is json not plain text.
	w.Header().Set("Content-Type", "application/json")
	// Return promise
	w.Write(jsn)

}

func UpdateUserStatus(w http.ResponseWriter, r *http.Request) {

	// Create variable to store json body
	var request UpdateStatus

	// Decode json
	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&request)
	if err != nil {
		fmt.Println(err)
	}

	db := OpenDB()

	// Create data obj to store status and email of user to update in db.
	data := make(map[string]string)
	data["user"] = request.User
	data["status"] = request.SetStatus

	// Update user status.
	PreparedExec("UPDATE users SET status=? WHERE email=?", data, db, "UpdateUserStatus")

	db.Close()
}

// Function that queryies database and returns list of bytes to unmarshal.
// https://stackoverflow.com/questions/43367505/function-in-go-to-execute-select-query-on-database-and-return-json-output
func ExecuteSQL(queryStr string) []byte {
	db := OpenDB()
	defer db.Close()

	rows, err := db.Query(queryStr)
	if err != nil {
		log.Fatal("Query failed:", err.Error())
	}
	defer rows.Close()

	columns, _ := rows.Columns()
	count := len(columns)

	var v struct {
		Data []interface{} // `json:"data"`
	}

	for rows.Next() {
		values := make([]interface{}, count)
		valuePtrs := make([]interface{}, count)
		for i := range columns {
			valuePtrs[i] = &values[i]
		}
		if err := rows.Scan(valuePtrs...); err != nil {
			log.Fatal(err)
		}

		//Created a map to handle the issue
		var m map[string]interface{}
		m = make(map[string]interface{})
		for i := range columns {
			m[columns[i]] = values[i]
		}
		v.Data = append(v.Data, m)
	}

	// Put into list.
	data := v.Data
	jsonMsg, err := json.Marshal(data)
	return jsonMsg
}
