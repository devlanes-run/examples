// The api service, run by devlanes with `go run ./cmd/api`.
package main

import (
	"log"

	"github.com/devlanes-run/examples/languages-go-api/internal/api"
	"github.com/devlanes-run/examples/languages-go-api/internal/config"
	"github.com/devlanes-run/examples/languages-go-api/internal/server"
)

func main() {
	c, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}
	if err := server.Serve(c, api.Routes(c)); err != nil {
		log.Fatal(err)
	}
}
