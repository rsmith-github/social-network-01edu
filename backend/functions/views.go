package functions

import (
	"net/http"
)

func Homepage(w http.ResponseWriter, r *http.Request) {

	// Redirect if no cookie. (user not logged in)
	ValidateCookie(w, r)

	RenderTmpl(w)
}
