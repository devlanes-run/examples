use askama::Template;
use axum::http::StatusCode;
use axum::response::{Html, IntoResponse, Response};
use shared::{Config, LaneInfo};

use crate::api::ApiCall;

/// The home page: the lane card and the api's answer.
#[derive(Template)]
#[template(path = "home.html")]
pub struct HomePage<'a> {
    info: &'a LaneInfo,
    api: ApiCard<'a>,
    ssl_cert_file: &'a str,
}

/// The api call as the page shows it.
struct ApiCard<'a> {
    base_url: &'a str,
    url: &'a str,
    ms: u128,
    status: String,
    status_class: &'static str,
    body: &'a str,
}

impl<'a> HomePage<'a> {
    /// The page for one request and the api call it made.
    pub fn new(
        info: &'a LaneInfo,
        config: &'a Config,
        api_url: &'a str,
        call: &'a ApiCall,
    ) -> Self {
        let (status, status_class, body) = match &call.result {
            Ok(answer) if (200..300).contains(&answer.status) => {
                (answer.status.to_string(), "dl-ok", answer.body.as_str())
            }
            Ok(answer) => (answer.status.to_string(), "dl-bad", answer.body.as_str()),
            Err(error) => ("request failed".to_owned(), "dl-bad", error.as_str()),
        };
        Self {
            info,
            api: ApiCard {
                base_url: api_url,
                url: &call.url,
                ms: call.elapsed.as_millis(),
                status,
                status_class,
                body,
            },
            ssl_cert_file: config.ssl_cert_file.as_deref().unwrap_or("not set"),
        }
    }
}

/// Renders a page, or answers 500 with the template error.
pub fn render(page: &impl Template) -> Response {
    match page.render() {
        Ok(html) => Html(html).into_response(),
        Err(error) => (StatusCode::INTERNAL_SERVER_ERROR, error.to_string()).into_response(),
    }
}
