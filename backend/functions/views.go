package functions

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
)

func Homepage(w http.ResponseWriter, r *http.Request) {

	// Redirect if no cookie. (user not logged in)
	ValidateCookie(w, r)

	RenderTmpl(w)
}

func Profile(w http.ResponseWriter, r *http.Request) {

	// Redirect if no cookie. (user not logged in)
	ValidateCookie(w, r)

	RenderTmpl(w)
}

// Redundant function at the moment. May use to handle dynamic url patterns..
func DynamicPath(w http.ResponseWriter, r *http.Request) {

	var profileRegex = regexp.MustCompile(`^/public-profiles\?user+=[A-Za-z]+-[A-Za-z]+`) // use query string
	match := profileRegex.FindStringSubmatch(r.URL.String())
	fmt.Println(r.URL.String())

	if match == nil {

	} else {
		fmt.Println(match)
	}

	// Need to refactor this.
	if r.Method == "POST" {
		split := strings.Split(match[1], "/") // split user
		firstName := strings.Split(split[1], "-")[0]
		lastName := strings.Split(split[1], "-")[1]
		fmt.Println(firstName, lastName)
		userBytes := ExecuteSQL("SELECT email, firstname, lastname, dob, avatar, nickname, aboutme FROM users WHERE firstname=" + "\"" + firstName + "\"" + " AND " + "lastname=" + "\"" + lastName + "\"")
		fmt.Println(string(userBytes))

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		jsn, err := json.Marshal(userBytes)
		if err != nil {
			fmt.Println(err)
			return
		}
		w.Write(jsn)
	}

	ValidateCookie(w, r)
	RenderTmpl(w)

}
