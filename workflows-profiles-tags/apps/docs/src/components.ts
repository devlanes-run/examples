/** A documented UI component and the app that uses it. */
export type Component = {
  name: string;
  usedBy: string;
};

/** The components the docs site lists. */
export const COMPONENTS: Component[] = [
  { name: "Button", usedBy: "shop-web, admin-web" },
  { name: "PriceTag", usedBy: "shop-web" },
  { name: "CartDrawer", usedBy: "shop-web" },
  { name: "InvoiceTable", usedBy: "admin-web" },
  { name: "SignInForm", usedBy: "shop-web, admin-web" },
];
