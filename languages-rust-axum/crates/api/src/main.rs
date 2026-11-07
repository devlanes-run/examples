//! The api service: JSON with the lane values and mock items.

mod items;
mod routes;

use std::error::Error;

use shared::Config;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let config = Config::from_env()?;
    shared::serve(&config, routes::router(config.clone())).await?;
    Ok(())
}
