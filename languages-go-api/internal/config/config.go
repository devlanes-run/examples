// Package config reads every environment variable the services use, once at startup.
package config

import (
	"cmp"
	"fmt"
	"os"
	"strconv"
)

// Config holds the values devlanes sets on every unit.
type Config struct {
	Host     string
	Port     int
	Project  string
	Lane     int
	LaneName string
	Service  string
	// Branch comes from LANE_LABEL, which devlanes.yaml sets from ${{ lane.label }}.
	Branch string
	// SSLCertFile is the CA bundle the go platform sets, shown on the page.
	SSLCertFile string
}

// Load reads the variables devlanes sets, failing when the program runs outside devlanes.
func Load() (Config, error) {
	r := reader{}
	c := Config{
		Host:        cmp.Or(os.Getenv("HOST"), "127.0.0.1"),
		Port:        r.number("PORT"),
		Project:     r.text("DEVLANES_LANE_PROJECT"),
		Lane:        r.number("DEVLANES_LANE"),
		LaneName:    r.text("DEVLANES_LANE_NAME"),
		Service:     r.text("DEVLANES_SERVICE"),
		Branch:      r.text("LANE_LABEL"),
		SSLCertFile: os.Getenv("SSL_CERT_FILE"),
	}
	return c, r.err
}

// Web is the web service's configuration: the common values plus the api it calls.
type Web struct {
	Config
	// APIURL comes from API_URL, which devlanes.yaml sets from ${{ services.api.public_url }}.
	APIURL string
}

// LoadWeb reads the common values and API_URL.
func LoadWeb() (Web, error) {
	c, err := Load()
	if err != nil {
		return Web{}, err
	}
	apiURL, err := required("API_URL")
	return Web{Config: c, APIURL: apiURL}, err
}

// reader keeps the first error, so Load reads every field in one expression.
type reader struct {
	err error
}

func (r *reader) text(name string) string {
	value, err := required(name)
	if r.err == nil {
		r.err = err
	}
	return value
}

func (r *reader) number(name string) int {
	value := r.text(name)
	if value == "" {
		return 0
	}
	n, err := strconv.Atoi(value)
	if err != nil && r.err == nil {
		r.err = fmt.Errorf("%s is %q, not a number", name, value)
	}
	return n
}

// required reads a variable that must be set, such as one devlanes.yaml sets for a single service.
func required(name string) (string, error) {
	value := os.Getenv(name)
	if value == "" {
		return "", fmt.Errorf("%s is not set; start this service with devlanes start", name)
	}
	return value, nil
}
