use std::env;

use axum::extract::Request;
use axum::http::header::{ACCESS_CONTROL_ALLOW_ORIGIN, ORIGIN, VARY};
use axum::http::{HeaderMap, HeaderValue};
use axum::middleware::{self, Next};
use axum::response::Response;
use axum::routing::get;
use axum::{Json, Router};
use rust_axum::{Lane, listen};
use serde_json::{Value, json};

fn items() -> Value {
    json!([
        { "id": 1, "sku": "ANV-100", "name": "Anvil", "stock": 12 },
        { "id": 2, "sku": "RKT-200", "name": "Rocket skates", "stock": 3 },
        { "id": 3, "sku": "MAG-300", "name": "Giant magnet", "stock": 7 },
    ])
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(index))
        .route("/api/items", get(|| async { Json(items()) }))
        .route(
            "/lane",
            get(|headers: HeaderMap| async move { Json(Lane::from_request(&headers).json()) }),
        )
        .route("/healthz", get(|| async { "ok" }))
        .layer(middleware::from_fn(cors));
    axum::serve(listen().await, app).await.expect("serve");
}

async fn index(headers: HeaderMap) -> Json<Value> {
    let mut body = Lane::from_request(&headers).json();
    body["items"] = items();
    Json(body)
}

/// Allows the lane's own https origins, which devlanes lists in DEVLANES_ORIGINS.
async fn cors(request: Request, next: Next) -> Response {
    let allowed = env::var("DEVLANES_ORIGINS").unwrap_or_default();
    let origin = request
        .headers()
        .get(ORIGIN)
        .filter(|origin| {
            allowed
                .split(',')
                .any(|o| o.as_bytes() == origin.as_bytes())
        })
        .cloned();
    let mut response = next.run(request).await;
    if let Some(origin) = origin {
        response
            .headers_mut()
            .insert(ACCESS_CONTROL_ALLOW_ORIGIN, origin);
    }
    response
        .headers_mut()
        .insert(VARY, HeaderValue::from_static("origin"));
    response
}
