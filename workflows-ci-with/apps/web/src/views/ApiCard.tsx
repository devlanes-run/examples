/** The card src/client/main.ts fills with the API's answer to a cross-origin fetch of `url`. */
export function ApiCard({ url }: { url: string }) {
  return (
    <div class="dl-card">
      <div class="dl-bar">
        <span class="dl-dots">
          <i />
          <i />
          <i />
        </span>
        <span>fetch {url}</span>
        <span />
      </div>
      <pre id="api-answer" data-url={url}>
        loading...
      </pre>
    </div>
  );
}
