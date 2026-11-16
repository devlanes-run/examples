package api

// Item is one mock inventory item.
type Item struct {
	ID    int    `json:"id"`
	SKU   string `json:"sku"`
	Name  string `json:"name"`
	Stock int    `json:"stock"`
}

// items is what / and /items return.
var items = []Item{
	{ID: 1, SKU: "KTL-100", Name: "Kettle", Stock: 12},
	{ID: 2, SKU: "LMP-200", Name: "Desk lamp", Stock: 3},
	{ID: 3, SKU: "UMB-300", Name: "Umbrella", Stock: 7},
}
