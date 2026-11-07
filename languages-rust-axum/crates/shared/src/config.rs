//! Every environment variable the services read, parsed once at startup.

use std::env;
use std::error::Error;
use std::fmt;
use std::str::FromStr;

/// The values devlanes sets on every unit.
#[derive(Clone, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub project: String,
    pub lane: u32,
    pub lane_name: String,
    pub service: String,
    /// Set in devlanes.yaml from `${{ lane.label }}`.
    pub branch: String,
    /// The lane's own https origins, which the api allows for CORS.
    pub origins: Vec<String>,
    /// The CA bundle the `rust` platform sets, shown on the page.
    pub ssl_cert_file: Option<String>,
}

impl Config {
    /// Reads the variables devlanes sets, failing when the binary runs outside devlanes.
    pub fn from_env() -> Result<Self, ConfigError> {
        Ok(Self {
            host: optional("HOST").unwrap_or_else(|| "127.0.0.1".to_owned()),
            port: parse("PORT")?,
            project: required("DEVLANES_LANE_PROJECT")?,
            lane: parse("DEVLANES_LANE")?,
            lane_name: required("DEVLANES_LANE_NAME")?,
            service: required("DEVLANES_SERVICE")?,
            branch: required("LANE_LABEL")?,
            origins: optional("DEVLANES_ORIGINS")
                .map(|list| list.split(',').map(str::to_owned).collect())
                .unwrap_or_default(),
            ssl_cert_file: optional("SSL_CERT_FILE"),
        })
    }
}

/// Reads a variable that must be set, such as one devlanes.yaml sets for a single service.
pub fn required(name: &'static str) -> Result<String, ConfigError> {
    optional(name).ok_or(ConfigError::Missing(name))
}

fn optional(name: &str) -> Option<String> {
    env::var(name).ok().filter(|value| !value.is_empty())
}

fn parse<T: FromStr>(name: &'static str) -> Result<T, ConfigError> {
    let value = required(name)?;
    value
        .parse()
        .map_err(|_| ConfigError::Invalid { name, value })
}

/// A variable that is missing or does not parse.
pub enum ConfigError {
    Missing(&'static str),
    Invalid { name: &'static str, value: String },
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Missing(name) => {
                write!(
                    f,
                    "{name} is not set; start this service with devlanes start"
                )
            }
            Self::Invalid { name, value } => write!(f, "{name} is {value:?}, not a number"),
        }
    }
}

// A main that returns an error prints it with Debug, so Debug gives the readable message.
impl fmt::Debug for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(self, f)
    }
}

impl Error for ConfigError {}
