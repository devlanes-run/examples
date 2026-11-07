//! Code the web and api binaries share: their config, the lane values, the listener and the
//! devlanes brand.

pub mod brand;
pub mod config;
mod lane;
mod server;

pub use config::{Config, ConfigError};
pub use lane::LaneInfo;
pub use server::serve;
