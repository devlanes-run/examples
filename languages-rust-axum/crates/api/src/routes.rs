use std::sync::Arc;

use axum::extract::{Request, State};
use axum::http::header::{ACCESS_CONTROL_ALLOW_ORIGIN, ORIGIN, VARY};
use axum::http::{HeaderMap, HeaderValue};
use axum::middleware::{self, Next};
use axum::response::Response;
use axum::routing::get;
use axum::{Json, Router};
use serde::Serialize;
use shared::{Config, LaneInfo};

use crate::items::{ITEMS, Item};

/// The answer to `/`: the lane values with the items next to them.
#[derive(Serialize)]
struct Index {
    #[serde(flatten)]
    lane: LaneInfo,
    items: &'static [Item],
}

/// `/`, `/api/items`, `/lane` and `/healthz`, with CORS for the lane's origins.
pub fn router(config: Config) -> Router {
    let config = Arc::new(config);
    Router::new()
        .route("/", get(index))
        .route("/api/items", get(items))
        .route("/lane", get(lane))
        .route("/healthz", get(healthz))
        .layer(middleware::from_fn_with_state(config.clone(), cors))
        .with_state(config)
}

async fn index(State(config): State<Arc<Config>>, headers: HeaderMap) -> Json<Index> {
    Json(Index {
        lane: LaneInfo::new(&config, &headers),
        items: &ITEMS,
    })
}

async fn items() -> Json<&'static [Item]> {
    Json(&ITEMS)
}

async fn lane(State(config): State<Arc<Config>>, headers: HeaderMap) -> Json<LaneInfo> {
    Json(LaneInfo::new(&config, &headers))
}

async fn healthz() -> &'static str {
    "ok"
}

/// Allows the lane's own https origins, which devlanes lists in `DEVLANES_ORIGINS`.
async fn cors(State(config): State<Arc<Config>>, request: Request, next: Next) -> Response {
    let origin = request
        .headers()
        .get(ORIGIN)
        .filter(|origin| {
            config
                .origins
                .iter()
                .any(|allowed| allowed.as_bytes() == origin.as_bytes())
        })
        .cloned();
    let mut response = next.run(request).await;
    let headers = response.headers_mut();
    if let Some(origin) = origin {
        headers.insert(ACCESS_CONTROL_ALLOW_ORIGIN, origin);
    }
    headers.insert(VARY, HeaderValue::from_static("origin"));
    response
}
