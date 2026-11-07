use serde::Serialize;

/// One mock inventory item.
#[derive(Debug, Serialize)]
pub struct Item {
    id: u32,
    sku: &'static str,
    name: &'static str,
    stock: u32,
}

/// The items `/` and `/api/items` return.
pub static ITEMS: [Item; 3] = [
    Item {
        id: 1,
        sku: "ANV-100",
        name: "Anvil",
        stock: 12,
    },
    Item {
        id: 2,
        sku: "RKT-200",
        name: "Rocket skates",
        stock: 3,
    },
    Item {
        id: 3,
        sku: "MAG-300",
        name: "Giant magnet",
        stock: 7,
    },
];
