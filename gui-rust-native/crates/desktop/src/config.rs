//! Every environment variable the desktop reads, parsed once at startup.

use std::env;
use std::error::Error;
use std::fmt;
use std::path::PathBuf;
use std::str::FromStr;

/// The values devlanes and devlanes.yaml set on the desktop service.
#[derive(Clone, Debug)]
pub struct Config {
    pub project: String,
    pub lane: u32,
    pub lane_name: String,
    pub service: String,
    /// Every service gets a port from the lane's block; a window does not listen on it.
    pub port: u16,
    /// Set in devlanes.yaml from `${{ lane.label }}`.
    pub branch: String,
    /// The api's `public_url`, so the call goes through the devlanes proxy.
    pub api_url: String,
    /// The lane's data folder, where the window keeps its state.
    pub state_dir: PathBuf,
}

impl Config {
    /// Reads the variables devlanes sets, failing when the binary runs outside devlanes.
    pub fn from_env() -> Result<Self, ConfigError> {
        Ok(Self {
            project: required("DEVLANES_LANE_PROJECT")?,
            lane: parse("DEVLANES_LANE")?,
            lane_name: required("DEVLANES_LANE_NAME")?,
            service: required("DEVLANES_SERVICE")?,
            port: parse("PORT")?,
            branch: required("LANE_LABEL")?,
            api_url: required("API_URL")?,
            state_dir: required("STATE_DIR")?.into(),
        })
    }
}

fn required(name: &'static str) -> Result<String, ConfigError> {
    env::var(name)
        .ok()
        .filter(|value| !value.is_empty())
        .ok_or(ConfigError::Missing(name))
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
