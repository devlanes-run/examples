// Package api is the api service: JSON with the lane values and mock items.
package api

import (
	"net/http"

	"github.com/devlanes-run/examples/languages-go-api/internal/config"
	"github.com/devlanes-run/examples/languages-go-api/internal/lane"
	"github.com/devlanes-run/examples/languages-go-api/internal/server"
)

// index is the answer to /: the lane values with the items next to them.
type index struct {
	lane.Info
	Items []Item `json:"items"`
}

// Routes returns the handler for /, /items, /lane and /healthz.
func Routes(c config.Config) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		server.JSON(w, index{Info: lane.FromRequest(c, r), Items: items})
	})
	mux.HandleFunc("GET /items", func(w http.ResponseWriter, _ *http.Request) {
		server.JSON(w, items)
	})
	mux.HandleFunc("GET /lane", func(w http.ResponseWriter, r *http.Request) {
		server.JSON(w, lane.FromRequest(c, r))
	})
	mux.HandleFunc("GET /healthz", server.Healthz)
	return mux
}
