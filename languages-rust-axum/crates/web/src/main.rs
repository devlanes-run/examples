//! The web service: a page that calls the api over HTTPS.

mod api;
mod routes;
mod views;

use std::error::Error;

use shared::{Config, config};

use crate::api::ApiClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let config = Config::from_env()?;
    let api = ApiClient::new(&config::required("API_URL")?)?;
    shared::serve(&config, routes::router(config.clone(), api)).await?;
    Ok(())
}
