use std::error::Error;
use std::time::{Duration, Instant};

/// Calls the api service over HTTPS through the devlanes proxy.
pub struct ApiClient {
    client: reqwest::Client,
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
}

impl ApiClient {
    /// Builds the client for `base_url`, the api's `public_url`.
    pub fn new(base_url: &str) -> reqwest::Result<Self> {
        // rustls-native-certs reads SSL_CERT_FILE here, once, so a CA that changes later
        // needs `devlanes restart web`.
        let client = reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(5))
            .timeout(Duration::from_secs(10))
            .build()?;
        Ok(Self {
            client,
            base_url: base_url.trim_end_matches('/').to_owned(),
        })
    }

    /// The api's base URL, for links on the page.
    pub fn base_url(&self) -> &str {
        &self.base_url
    }

    /// GETs `/api/items`. A failure is part of the result, so the page can show it.
    pub async fn items(&self) -> ApiCall {
        let url = format!("{}/api/items", self.base_url);
        let started = Instant::now();
        let result = self.get(&url).await;
        ApiCall {
            url,
            elapsed: started.elapsed(),
            result,
        }
    }

    async fn get(&self, url: &str) -> Result<Answer, String> {
        let response = self.client.get(url).send().await.map_err(|e| chain(&e))?;
        let status = response.status().as_u16();
        let text = response.text().await.map_err(|e| chain(&e))?;
        let body = serde_json::from_str::<serde_json::Value>(&text)
            .and_then(|json| serde_json::to_string_pretty(&json))
            .unwrap_or(text);
        Ok(Answer { status, body })
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
