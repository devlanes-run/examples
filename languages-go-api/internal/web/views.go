package web

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"log"
	"net/http"

	"github.com/devlanes-run/examples/languages-go-api/internal/lane"
)

//go:embed templates/*.html
var templateFiles embed.FS

var templates = template.Must(template.New("").Funcs(template.FuncMap{
	"mod": func(a, b int) int { return a % b },
}).ParseFS(templateFiles, "templates/*.html"))

// homePage is the data home.html renders: the lane card and the api's answer.
type homePage struct {
	Info        lane.Info
	Example     string
	API         apiCard
	SSLCertFile string
}

// apiCard is the api call as the page shows it.
type apiCard struct {
	BaseURL     string
	URL         string
	Ms          int64
	Status      string
	StatusClass string
	Body        string
}

func newAPICard(baseURL string, call APICall) apiCard {
	card := apiCard{BaseURL: baseURL, URL: call.URL, Ms: call.Elapsed.Milliseconds()}
	if call.Err != nil {
		card.Status, card.StatusClass, card.Body = "request failed", "dl-bad", call.Err.Error()
		return card
	}
	card.Status = fmt.Sprintf("%d %s", call.Status, http.StatusText(call.Status))
	card.StatusClass = "dl-bad"
	if call.Status >= 200 && call.Status < 300 {
		card.StatusClass = "dl-ok"
	}
	card.Body = call.Body
	return card
}

// render writes a template into a buffer first, so a template error becomes a clean 500.
func render(w http.ResponseWriter, name string, data any) {
	var page bytes.Buffer
	if err := templates.ExecuteTemplate(&page, name, data); err != nil {
		log.Printf("rendering %s: %v", name, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = page.WriteTo(w)
}
