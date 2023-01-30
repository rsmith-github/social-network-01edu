package functions

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"
)

const SECRET_KEY = "DonaldTrump_Dumpling"

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
			w.Write([]byte(JsonMessage("User not found")))
			return
		}

		// Compare and check if password matches the user in database.
		if err := bcrypt.CompareHashAndPassword([]byte(foundUser.Password), []byte(userToLogin.Password)); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(JsonMessage("Incorrect password")))
			return
		}

		// Getting claims to return jwt token. Claims transfers user data.
		claims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.StandardClaims{
			Issuer:    strconv.Itoa(foundUser.Id),
			ExpiresAt: time.Now().Add(time.Hour * 24).Unix(),
		})

		token, err := claims.SignedString([]byte(SECRET_KEY))

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(JsonMessage("Could not log in")))
			return
		}

		// Check if session cookie exists. If not, create one, and give the user a session.
		cookie, cookieErr := r.Cookie("session")
		if cookieErr != nil {
			cookie = &http.Cookie{
				Name:  "session",
				Value: token,

				// Ideally these cookies should be http only and secure but verifying the user
				// on the client side will be difficult.
				HttpOnly: true,
				// Secure:   true,
				Path:   "/",
				MaxAge: 60 * 86400,
			}
			http.SetCookie(w, cookie)
		}

		// Marshal user to send back to front end.
		jsn, mrshlErr := json.Marshal(foundUser)
		if mrshlErr != nil {
			fmt.Println("Error marshalling user: ", err.Error())
		} else {
			w.Write(jsn) // Write user data
		}

		return
	}
	// Remder template on reload
	RenderTmpl(w)
}

// Get user details using jwtoken
func GetUserWithJWT(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err != nil {
		fmt.Println("GetUserWithJWT -- http: named cookie not present")
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(JsonMessage("unauthorized")))
		return
	}

	// Standard procedure.
	// parse JWT token stored in an HTTP cookie.
	token, claimsErr := jwt.ParseWithClaims(cookie.Value, &jwt.StandardClaims{}, func(t *jwt.Token) (interface{}, error) {
		return []byte(SECRET_KEY), nil
	})

	if claimsErr != nil {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(JsonMessage("unauthorized")))
		return
	}

	// Return claims as json.
	claims := token.Claims.(*jwt.StandardClaims)

	// Look for user in database
	db := OpenDB()
	rows, er := db.Query("SELECT * FROM users WHERE id = ?", claims.Issuer)
	user := QueryUser(rows, er)

	db.Close()
	jsn, _ := json.Marshal(user)
	w.Write(jsn)

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

	// {
	// 	// Open database.
	// 	db := OpenDB()
	// 	// delete session from sessions table.
	// 	db.Exec("DELETE FROM sessions WHERE sessionUUID=?;", c.Value)
	// 	defer db.Close()
	// }

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
