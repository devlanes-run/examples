package web

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"
)

// APIClient calls the api service over HTTPS through the devlanes proxy.
type APIClient struct {
	http    *http.Client
	baseURL string
}

// APICall is one call to the api: what was requested, how long it took and what came back.
type APICall struct {
	URL     string
	Elapsed time.Duration
	Status  int
	Body    string
	// Err is the whole error, TLS or DNS cause included, when the request failed.
	Err error
}

// NewAPIClient builds the client for baseURL, the api's public_url.
func NewAPIClient(baseURL string) *APIClient {
	// The default transport verifies certificates against the system store, or on Linux
	// against the file in SSL_CERT_FILE, which the go platform points at the devlanes CA.
	return &APIClient{
		http:    &http.Client{Timeout: 5 * time.Second},
		baseURL: strings.TrimRight(baseURL, "/"),
	}
}

// BaseURL is the api's URL, for links on the page.
func (c *APIClient) BaseURL() string {
	return c.baseURL
}

// Items GETs /items. A failure is part of the result, so the page can show it.
func (c *APIClient) Items(ctx context.Context) APICall {
	call := APICall{URL: c.baseURL + "/items"}
	started := time.Now()
	call.Status, call.Body, call.Err = c.get(ctx, call.URL)
	call.Elapsed = time.Since(started)
	return call
}

func (c *APIClient) get(ctx context.Context, url string) (int, string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return 0, "", err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(io.LimitReader(resp.Body, 64<<10))
	if err != nil {
		return resp.StatusCode, "", err
	}
	var pretty bytes.Buffer
	if json.Indent(&pretty, body, "", "  ") != nil {
		return resp.StatusCode, string(body), nil
	}
	return resp.StatusCode, pretty.String(), nil
}
