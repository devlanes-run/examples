use serde::Serialize;

/// One part of the desktop window, with the action that exercises it.
#[derive(Debug, Serialize)]
pub struct Surface {
    id: u32,
    name: &'static str,
    try_it: &'static str,
}

/// The records `/` returns: the surfaces the desktop window has.
pub static SURFACES: [Surface; 6] = [
    Surface {
        id: 1,
        name: "text input",
        try_it: "type a note",
    },
    Surface {
        id: 2,
        name: "long list",
        try_it: "scroll 500 rows",
    },
    Surface {
        id: 3,
        name: "menu bar",
        try_it: "open File, Edit or View",
    },
    Surface {
        id: 4,
        name: "context menu",
        try_it: "right-click a row",
    },
    Surface {
        id: 5,
        name: "file dialog",
        try_it: "pick a file",
    },
    Surface {
        id: 6,
        name: "second window",
        try_it: "open and close it",
    },
];
