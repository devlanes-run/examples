import {
  ApiCard,
  ApiSection,
  LanePage,
  type ApiResult,
  type LaneInfo,
} from "@profiles-tags/shared";
import { env } from "../env.js";

type AdminPageProps = {
  info: LaneInfo;
  accounts: ApiResult;
  billing: ApiResult;
  catalog: ApiResult;
};

/** The back office: every API's records, each with a button that adds one. */
export function AdminPage({ info, accounts, billing, catalog }: AdminPageProps) {
  return (
    <LanePage info={info}>
      <ApiSection>
        <ApiCard
          api={env.accounts}
          result={accounts}
          add={{ action: "/users", label: "Add a user" }}
        />
        <ApiCard
          api={env.billing}
          result={billing}
          add={{ action: "/invoices", label: "Add an invoice" }}
        />
        <ApiCard
          api={env.catalog}
          result={catalog}
          add={{ action: "/products", label: "Add a product" }}
        />
      </ApiSection>
    </LanePage>
  );
}
