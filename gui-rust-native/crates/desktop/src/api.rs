use std::error::Error;
use std::sync::mpsc::{self, Receiver};
use std::thread;
use std::time::{Duration, Instant};

use eframe::egui;
use reqwest::blocking::Client;

/// Calls the api service over HTTPS through the devlanes proxy, off the UI thread.
pub struct ApiClient {
    client: Client,
    base_url: String,
}

/// One call to the api: what was requested, how long it took and what came back.
pub struct ApiCall {
    pub url: String,
    pub elapsed: Duration,
    /// The answer, or the whole error chain when the request failed.
    pub result: Result<Answer, String>,
}

/// The status and body of an answer, the body pretty-printed when it is JSON.
pub struct Answer {
    pub status: u16,
    pub body: String,
    /// The `url` the api built from `X-Forwarded-Host`, present when the proxy carried the call.
    pub proxied_url: Option<String>,
}

impl ApiClient {
    /// Builds the client for `base_url`, the api's `public_url`.
    pub fn new(base_url: &str) -> reqwest::Result<Self> {
        // rustls-native-certs reads SSL_CERT_FILE here, once, so a CA that changes later
        // needs `devlanes restart desktop`.
        let client = Client::builder()
            .connect_timeout(Duration::from_secs(5))
            .timeout(Duration::from_secs(10))
            .build()?;
        Ok(Self {
            client,
            base_url: base_url.trim_end_matches('/').to_owned(),
        })
    }

    /// GETs `/` on a thread and repaints the window when the answer arrives.
    ///
    /// Up to `attempts` tries, a second apart, while the api is down: at the first start
    /// both services compile, and the window can open before the api listens.
    pub fn fetch(&self, ctx: &egui::Context, attempts: u32) -> Receiver<ApiCall> {
        let (sender, receiver) = mpsc::channel();
        let client = self.client.clone();
        let url = format!("{}/", self.base_url);
        let ctx = ctx.clone();
        thread::spawn(move || {
            let call = call_with_retries(&client, url, attempts);
            log(&call);
            // The window may have closed meanwhile; then nobody waits for the answer.
            let _ = sender.send(call);
            ctx.request_repaint();
        });
        receiver
    }
}

fn call_with_retries(client: &Client, url: String, attempts: u32) -> ApiCall {
    let mut attempt = 1;
    loop {
        let started = Instant::now();
        let result = get(client, &url);
        let failed = result.as_ref().map_or(true, |answer| answer.status >= 500);
        if !failed || attempt >= attempts {
            return ApiCall {
                url,
                elapsed: started.elapsed(),
                result,
            };
        }
        attempt += 1;
        thread::sleep(Duration::from_secs(1));
    }
}

fn get(client: &Client, url: &str) -> Result<Answer, String> {
    let response = client.get(url).send().map_err(|e| chain(&e))?;
    let status = response.status().as_u16();
    let text = response.text().map_err(|e| chain(&e))?;
    let json = serde_json::from_str::<serde_json::Value>(&text).ok();
    let proxied_url = json
        .as_ref()
        .and_then(|json| json.get("url"))
        .and_then(|url| url.as_str())
        .map(str::to_owned);
    let body = json
        .and_then(|json| serde_json::to_string_pretty(&json).ok())
        .unwrap_or(text);
    Ok(Answer {
        status,
        body,
        proxied_url,
    })
}

/// One line per call, so `devlanes logs desktop` shows each one.
fn log(call: &ApiCall) {
    let ms = call.elapsed.as_millis();
    match &call.result {
        Ok(answer) => println!("called {}: {} in {ms} ms", call.url, answer.status),
        Err(error) => println!("called {}: failed after {ms} ms: {error}", call.url),
    }
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
