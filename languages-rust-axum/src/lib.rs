//! Code both binaries share: the listen address and the `/lane` answer.

use std::env;

use axum::http::HeaderMap;
use serde_json::{Value, json};

/// Binds `HOST:PORT`, the address devlanes gives every service.
pub async fn listen() -> tokio::net::TcpListener {
    let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_owned());
    let port = env::var("PORT").expect("PORT is not set; run this binary with devlanes start");
    let listener = tokio::net::TcpListener::bind(format!("{host}:{port}"))
        .await
        .expect("bind HOST:PORT");
    println!("listening on http://{host}:{port}");
    listener
}

/// The lane values devlanes passes to each service, read per request.
pub struct Lane {
    pub project: String,
    pub index: String,
    pub name: String,
    pub branch: String,
    pub service: String,
    pub port: String,
    pub url: String,
}

impl Lane {
    pub fn from_request(headers: &HeaderMap) -> Self {
        // The devlanes proxy sets X-Forwarded-Host; a request straight to the port has none.
        let url = headers
            .get("x-forwarded-host")
            .and_then(|host| host.to_str().ok())
            .map(|host| format!("https://{host}"))
            .unwrap_or_default();
        Self {
            project: var("DEVLANES_LANE_PROJECT"),
            index: var("DEVLANES_LANE"),
            name: var("DEVLANES_LANE_NAME"),
            branch: var("LANE_LABEL"),
            service: var("DEVLANES_SERVICE"),
            port: var("PORT"),
            url,
        }
    }

    /// Lane index modulo 4, which picks the lane colour on pages.
    pub fn colour(&self) -> u32 {
        self.index.parse::<u32>().unwrap_or(0) % 4
    }

    pub fn json(&self) -> Value {
        json!({
            "project": self.project,
            "lane": self.index.parse::<u32>().ok(),
            "lane_name": self.name,
            "branch": self.branch,
            "service": self.service,
            "port": self.port.parse::<u16>().ok(),
            "url": self.url,
        })
    }
}

fn var(key: &str) -> String {
    env::var(key).unwrap_or_default()
}
