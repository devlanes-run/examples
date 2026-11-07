//! The devlanes look, compiled in from the `brand` link to `_internal/brand`.

/// The stylesheet every example shares.
pub const CSS: &str = include_str!("../brand/devlanes.css");

/// The devlanes logo, used in the header and as the favicon.
pub const LOGO: &str = include_str!("../brand/logo.svg");
