package functions

import (
	"encoding/json"
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

func createApi(table string, w http.ResponseWriter, r *http.Request) {

	var str string
	// Build query string
	if table == "users" {
		str = "SELECT email, firstname, lastname, dob, avatar, aboutme FROM " + table + ";"
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