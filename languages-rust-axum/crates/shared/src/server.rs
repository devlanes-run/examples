use std::io;

use axum::Router;
use tokio::net::TcpListener;

use crate::Config;

/// Serves `app` on `HOST:PORT`, the address devlanes gives every service.
pub async fn serve(config: &Config, app: Router) -> io::Result<()> {
    let listener = TcpListener::bind((config.host.as_str(), config.port)).await?;
    println!(
        "{} listening on http://{}",
        config.service,
        listener.local_addr()?
    );
    axum::serve(listener, app).await
}
