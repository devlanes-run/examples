import type { Outcome, Store } from "../stores/index.js";

type StoreCardProps = {
  store: Store;
  health: Outcome<string>;
  /** The write-then-read output, on the page that answers the card's form. */
  result?: Outcome<string[]>;
};

/** One store: this lane's namespace in it, its health and the write-then-read button. */
export function StoreCard({ store, health, result }: StoreCardProps) {
  return (
    <section class="dl-card" id={store.key}>
      <div class="dl-bar">
        <span class="dl-dots">
          <i />
          <i />
          <i />
        </span>
        <span>{store.title}</span>
        <span />
      </div>
      <dl class="dl-rows">
        <dt>{store.kind}</dt>
        <dd class="dl-key">{store.namespace}</dd>
        <dt>container</dt>
        <dd>{store.container}</dd>
        <dt>env</dt>
        <dd>{store.envVar}</dd>
        <dt>health</dt>
        <dd class={health.ok ? "dl-ok" : "dl-bad"}>{health.ok ? health.value : health.error}</dd>
        <Access access={store.access} />
      </dl>
      {/* The fragment brings the browser back to this card after the post. */}
      <form class="store-try" method="post" action={`/stores/${store.key}/try#${store.key}`}>
        <button class="dl-button" type="submit">
          Write and read
        </button>
      </form>
      {result && (
        <pre class={result.ok ? "dl-ok" : "dl-bad"}>
          {result.ok ? result.value.join("\n") : result.error}
        </pre>
      )}
    </section>
  );
}

function Access({ access }: { access: Store["access"] }) {
  if ("console" in access) {
    return (
      <>
        <dt>console</dt>
        <dd>
          <a href={access.console}>{access.console}</a>
        </dd>
      </>
    );
  }
  return (
    <>
      <dt>shell</dt>
      <dd>
        <code>{access.shell}</code>
      </dd>
    </>
  );
}
