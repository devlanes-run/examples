use axum::http::HeaderMap;
use serde::Serialize;

use crate::Config;

/// The lane values every example shows on its page and returns from `/lane`.
#[derive(Clone, Debug, Serialize)]
pub struct LaneInfo {
    pub project: String,
    pub lane: u32,
    pub lane_name: String,
    pub branch: String,
    pub service: String,
    pub port: u16,
    pub url: Option<String>,
}

impl LaneInfo {
    /// The values for one request; `url` is `None` when the request skipped the proxy.
    pub fn new(config: &Config, headers: &HeaderMap) -> Self {
        // Only requests that came through the devlanes proxy carry X-Forwarded-Host.
        let url = headers
            .get("x-forwarded-host")
            .and_then(|host| host.to_str().ok())
            .map(|host| format!("https://{host}"));
        Self {
            project: config.project.clone(),
            lane: config.lane,
            lane_name: config.lane_name.clone(),
            branch: config.branch.clone(),
            service: config.service.clone(),
            port: config.port,
            url,
        }
    }
}
