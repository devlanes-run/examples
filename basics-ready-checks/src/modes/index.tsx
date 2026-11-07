import type { Mode } from "../mode.js";
import { IndexPage } from "../views/IndexPage.js";

/** The lane's home page, linking to every other service. */
export const index: Mode = {
  behaviour: "Lists every service and the ready check it uses.",
  page: (info) => <IndexPage info={info} />,
};
