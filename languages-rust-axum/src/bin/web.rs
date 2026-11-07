use std::env;
use std::error::Error;
use std::sync::Arc;
use std::time::{Duration, Instant};

use axum::extract::State;
use axum::http::HeaderMap;
use axum::response::Html;
use axum::routing::get;
use axum::{Json, Router};
use rust_axum::{Lane, listen};

const CSS: &str = include_str!("../../devlanes.css");
const LOGO: &str = include_str!("../../logo.svg");
const FONTS: &str = "https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap";
const SOURCE: &str = "https://github.com/devlanes-run/examples/tree/main/languages-rust-axum";

struct App {
    client: reqwest::Client,
    api_url: String,
}

#[tokio::main]
async fn main() {
    let api_url = env::var("API_URL").expect("API_URL is not set; devlanes.yaml sets it");
    // rustls-native-certs reads SSL_CERT_FILE when the client is built, so a CA
    // that changes later needs `devlanes restart web`.
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .expect("build the HTTPS client");
    let app = Router::new()
        .route("/", get(index))
        .route(
            "/lane",
            get(|headers: HeaderMap| async move { Json(Lane::from_request(&headers).json()) }),
        )
        .route("/healthz", get(|| async { "ok" }))
        .with_state(Arc::new(App { client, api_url }));
    axum::serve(listen().await, app).await.expect("serve");
}

async fn index(State(app): State<Arc<App>>, headers: HeaderMap) -> Html<String> {
    let lane = Lane::from_request(&headers);
    let target = format!("{}/api/items", app.api_url);
    let started = Instant::now();
    let answer = fetch(&app.client, &target).await;
    let ms = started.elapsed().as_millis();
    match &answer {
        Ok((status, _)) => println!("GET / called {target}: {status} in {ms} ms"),
        Err(error) => println!("GET / called {target}: failed after {ms} ms: {error}"),
    }
    Html(page(&lane, &app.api_url, &target, ms, &answer))
}

/// GETs `url` and returns the status with the body pretty-printed, or the whole error chain.
async fn fetch(client: &reqwest::Client, url: &str) -> Result<(u16, String), String> {
    let response = client.get(url).send().await.map_err(|e| chain(&e))?;
    let status = response.status().as_u16();
    let text = response.text().await.map_err(|e| chain(&e))?;
    let body = serde_json::from_str::<serde_json::Value>(&text)
        .and_then(|json| serde_json::to_string_pretty(&json))
        .unwrap_or(text);
    Ok((status, body))
}

/// reqwest's own message hides the TLS cause in its sources; print them all.
fn chain(error: &dyn Error) -> String {
    let mut text = error.to_string();
    let mut source = error.source();
    while let Some(cause) = source {
        text.push_str(": ");
        text.push_str(&cause.to_string());
        source = cause.source();
    }
    text
}

fn page(
    lane: &Lane,
    api_url: &str,
    target: &str,
    ms: u128,
    answer: &Result<(u16, String), String>,
) -> String {
    let (status, body) = match answer {
        Ok((code, body)) if (200..300).contains(code) => {
            (format!(r#"<span class="dl-ok">{code}</span>"#), esc(body))
        }
        Ok((code, body)) => (format!(r#"<span class="dl-bad">{code}</span>"#), esc(body)),
        Err(error) => (
            r#"<span class="dl-bad">request failed</span>"#.to_owned(),
            esc(error),
        ),
    };
    let ca = env::var("SSL_CERT_FILE").unwrap_or_else(|_| "not set".to_owned());
    format!(
        r#"<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lane {index} of {project}</title>
<link rel="stylesheet" href="{FONTS}">
<style>{CSS}</style>
</head>
<body>
<div class="dl-page">
  <header class="dl-header">
    <a class="dl-brand" href="/">{LOGO} devlanes</a>
    <nav class="dl-nav"><a href="{SOURCE}">languages-rust-axum on GitHub</a></nav>
  </header>
  <main class="dl-main">
    <h1 class="dl-title">This is lane {index} of {project}.</h1>
    <p class="dl-lede">The <code>{service}</code> service, an axum binary that <code>cargo run</code> built in the <code>{branch}</code> worktree.</p>
    <div class="dl-card" style="--dl-lane: var(--dl-lane-{colour})">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>GET /lane</span><span></span></div>
      <dl class="dl-rows">
        <dt>lane</dt><dd>{index} ({name})</dd>
        <dt>branch</dt><dd>{branch}</dd>
        <dt>service</dt><dd>{service}</dd>
        <dt>port</dt><dd>{port}</dd>
        <dt>url</dt><dd><a href="{url}">{url}</a></dd>
      </dl>
    </div>
    <h2 class="dl-h2">The api over HTTPS</h2>
    <p class="dl-lede">reqwest calls <a href="{api_url}">{api_url}</a> through the devlanes proxy and trusts its certificate through <code>SSL_CERT_FILE</code>.</p>
    <div class="dl-card" style="--dl-lane: var(--dl-lane-{colour})">
      <div class="dl-bar"><span class="dl-dots"><i></i><i></i><i></i></span><span>GET /api/items</span><span></span></div>
      <dl class="dl-rows">
        <dt>request</dt><dd class="dl-url">{target}</dd>
        <dt>status</dt><dd>{status}</dd>
        <dt>latency</dt><dd>{ms} ms</dd>
        <dt>SSL_CERT_FILE</dt><dd>{ca}</dd>
      </dl>
      <pre>{body}</pre>
    </div>
  </main>
  <footer class="dl-footer">devlanes examples: languages-rust-axum</footer>
</div>
</body>
</html>
"#,
        index = esc(&lane.index),
        project = esc(&lane.project),
        service = esc(&lane.service),
        branch = esc(&lane.branch),
        name = esc(&lane.name),
        port = esc(&lane.port),
        url = esc(&lane.url),
        colour = lane.colour(),
        api_url = esc(api_url),
        target = esc(target),
        ca = esc(&ca),
    )
}

fn esc(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}
