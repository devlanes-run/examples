// Package lane builds the lane values every example shows on its page and returns from /lane.
package lane

import (
	"net/http"

	"github.com/devlanes-run/examples/languages-go-api/internal/config"
)

// Info is the JSON shape of /lane.
type Info struct {
	Project  string `json:"project"`
	Lane     int    `json:"lane"`
	LaneName string `json:"lane_name"`
	Branch   string `json:"branch"`
	Service  string `json:"service"`
	Port     int    `json:"port"`
	// URL is nil when the request skipped the proxy.
	URL *string `json:"url"`
}

// FromRequest returns the lane values for one request.
func FromRequest(c config.Config, r *http.Request) Info {
	info := Info{
		Project:  c.Project,
		Lane:     c.Lane,
		LaneName: c.LaneName,
		Branch:   c.Branch,
		Service:  c.Service,
		Port:     c.Port,
	}
	// Only requests that came through the devlanes proxy carry X-Forwarded-Host.
	if host := r.Header.Get("X-Forwarded-Host"); host != "" {
		url := "https://" + host
		info.URL = &url
	}
	return info
}
