//! The api service: JSON with the lane values and the surfaces the desktop window shows.

mod config;
mod lane;
mod routes;
mod surfaces;

use std::error::Error;

use tokio::net::TcpListener;

use crate::config::Config;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let config = Config::from_env()?;
    let listener = TcpListener::bind((config.host.as_str(), config.port)).await?;
    println!("api listening on http://{}", listener.local_addr()?);
    axum::serve(listener, routes::router(config)).await?;
    Ok(())
}
