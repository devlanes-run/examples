use std::sync::Arc;

use axum::extract::State;
use axum::http::HeaderMap;
use axum::routing::get;
use axum::{Json, Router};
use serde::Serialize;

use crate::config::Config;
use crate::lane::LaneInfo;
use crate::surfaces::{SURFACES, Surface};

/// The answer to `/`: the lane values with the surfaces next to them.
#[derive(Serialize)]
struct Index {
    #[serde(flatten)]
    lane: LaneInfo,
    surfaces: &'static [Surface],
}

/// `/`, `/lane` and `/healthz`. No CORS: the caller is a native window, not a browser.
pub fn router(config: Config) -> Router {
    Router::new()
        .route("/", get(index))
        .route("/lane", get(lane))
        .route("/healthz", get(healthz))
        .with_state(Arc::new(config))
}

async fn index(State(config): State<Arc<Config>>, headers: HeaderMap) -> Json<Index> {
    Json(Index {
        lane: LaneInfo::new(&config, &headers),
        surfaces: &SURFACES,
    })
}

async fn lane(State(config): State<Arc<Config>>, headers: HeaderMap) -> Json<LaneInfo> {
    Json(LaneInfo::new(&config, &headers))
}

async fn healthz() -> &'static str {
    "ok"
}
