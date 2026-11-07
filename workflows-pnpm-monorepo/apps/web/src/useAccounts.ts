import { useEffect, useState } from "react";
import { type AccountsResponse, fetchAccounts } from "./api";

/** The accounts request: in flight, answered, or failed with a message. */
export type AccountsState =
  | { status: "loading" }
  | { status: "ok"; data: AccountsResponse }
  | { status: "error"; error: string };

/** Fetches the accounts once, on mount. */
export function useAccounts(): AccountsState {
  const [state, setState] = useState<AccountsState>({ status: "loading" });
  useEffect(() => {
    fetchAccounts().then(
      (data) => setState({ status: "ok", data }),
      (error: unknown) =>
        setState({
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        }),
    );
  }, []);
  return state;
}
