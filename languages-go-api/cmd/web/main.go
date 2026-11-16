// The web service, built and restarted by air through the dev:web task in Taskfile.yml.
package main

import (
	"log"

	"github.com/devlanes-run/examples/languages-go-api/internal/config"
	"github.com/devlanes-run/examples/languages-go-api/internal/server"
	"github.com/devlanes-run/examples/languages-go-api/internal/web"
)

func main() {
	c, err := config.LoadWeb()
	if err != nil {
		log.Fatal(err)
	}
	if err := server.Serve(c.Config, web.Routes(c.Config, web.NewAPIClient(c.APIURL))); err != nil {
		log.Fatal(err)
	}
}
