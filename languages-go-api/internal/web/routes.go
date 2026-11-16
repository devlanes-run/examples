// Package web is the web service: a page that calls the api over HTTPS.
package web

import (
	"log"
	"net/http"

	"github.com/devlanes-run/examples/languages-go-api/internal/config"
	"github.com/devlanes-run/examples/languages-go-api/internal/lane"
	"github.com/devlanes-run/examples/languages-go-api/internal/server"
)

// example is this folder in the examples repository, for the GitHub link.
const example = "languages-go-api"

// Routes returns the handler for the page, /lane, /healthz and the brand files.
func Routes(c config.Config, api *APIClient) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		call := api.Items(r.Context())
		logCall(call)
		render(w, "home.html", homePage{
			Info:        lane.FromRequest(c, r),
			Example:     example,
			API:         newAPICard(api.BaseURL(), call),
			SSLCertFile: c.SSLCertFile,
		})
	})
	mux.HandleFunc("GET /lane", func(w http.ResponseWriter, r *http.Request) {
		server.JSON(w, lane.FromRequest(c, r))
	})
	mux.HandleFunc("GET /healthz", server.Healthz)
	// brand links to _internal/brand. go:embed refuses symbolic links, so the files are read
	// at run time from the module folder, where both go run and air start the program.
	mux.Handle("GET /brand/", http.StripPrefix("/brand/", http.FileServer(http.Dir("brand"))))
	return mux
}

// logCall prints one line per page load, so `devlanes logs web` shows each call to the api.
func logCall(call APICall) {
	ms := call.Elapsed.Milliseconds()
	if call.Err != nil {
		log.Printf("GET / called %s: failed after %d ms: %v", call.URL, ms, call.Err)
		return
	}
	log.Printf("GET / called %s: %d in %d ms", call.URL, call.Status, ms)
}
