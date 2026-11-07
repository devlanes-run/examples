use std::sync::Arc;

use axum::extract::State;
use axum::http::{HeaderMap, header};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use shared::{Config, LaneInfo, brand};

use crate::api::{ApiCall, ApiClient};
use crate::views::{self, HomePage};

struct AppState {
    config: Config,
    api: ApiClient,
}

/// The page, `/lane`, `/healthz` and the brand files the page links to.
pub fn router(config: Config, api: ApiClient) -> Router {
    Router::new()
        .route("/", get(home))
        .route("/lane", get(lane))
        .route("/healthz", get(healthz))
        .route("/brand/devlanes.css", get(css))
        .route("/brand/logo.svg", get(logo))
        .with_state(Arc::new(AppState { config, api }))
}

async fn home(State(state): State<Arc<AppState>>, headers: HeaderMap) -> Response {
    let call = state.api.items().await;
    log(&call);
    let info = LaneInfo::new(&state.config, &headers);
    views::render(&HomePage::new(
        &info,
        &state.config,
        state.api.base_url(),
        &call,
    ))
}

/// One line per page load, so `devlanes logs web` shows each call to the api.
fn log(call: &ApiCall) {
    let ms = call.elapsed.as_millis();
    match &call.result {
        Ok(answer) => println!("GET / called {}: {} in {ms} ms", call.url, answer.status),
        Err(error) => println!("GET / called {}: failed after {ms} ms: {error}", call.url),
    }
}

async fn lane(State(state): State<Arc<AppState>>, headers: HeaderMap) -> Json<LaneInfo> {
    Json(LaneInfo::new(&state.config, &headers))
}

async fn healthz() -> &'static str {
    "ok"
}

async fn css() -> impl IntoResponse {
    (
        [(header::CONTENT_TYPE, "text/css; charset=utf-8")],
        brand::CSS,
    )
}

async fn logo() -> impl IntoResponse {
    ([(header::CONTENT_TYPE, "image/svg+xml")], brand::LOGO)
}
