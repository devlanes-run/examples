import {
  ApiCard,
  ApiSection,
  LanePage,
  type ApiResult,
  type LaneInfo,
} from "@profiles-tags/shared";
import { env } from "../env.js";

type ShopPageProps = {
  info: LaneInfo;
  catalog: ApiResult;
  accounts: ApiResult;
};

/** The storefront: the products on sale and the customer accounts. */
export function ShopPage({ info, catalog, accounts }: ShopPageProps) {
  return (
    <LanePage info={info}>
      <ApiSection>
        <ApiCard api={env.catalog} result={catalog} />
        <ApiCard
          api={env.accounts}
          result={accounts}
          add={{ action: "/users", label: "Add a user" }}
        />
      </ApiSection>
    </LanePage>
  );
}
