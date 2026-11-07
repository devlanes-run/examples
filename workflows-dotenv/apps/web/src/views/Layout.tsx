import type { Child } from "hono/jsx";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap";

const EXAMPLE = "workflows-dotenv";

type LayoutProps = {
  title: string;
  lane: number;
  /** The origin the shared CSS and logo load from, `https://assets.<domain>`. */
  assets: string;
  children: Child;
};

/** The devlanes page shell: header, logo, fonts, the shared stylesheet and the session check. */
export function Layout({ title, lane, assets, children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="icon" href={`${assets}/brand/logo.svg`} />
        <link rel="stylesheet" href={FONTS} />
        <link rel="stylesheet" href={`${assets}/brand/devlanes.css`} />
        {/* Same origin as the page: a module script from assets.<domain> would need CORS. */}
        <script type="module" src="/client/session.js" />
      </head>
      <body style={`--dl-lane: var(--dl-lane-${lane % 4})`}>
        <div class="dl-page">
          <header class="dl-header">
            <a class="dl-brand" href="https://devlanes.run">
              <img src={`${assets}/brand/logo.svg`} alt="" width="32" height="32" />
              devlanes
            </a>
            <nav class="dl-nav">
              <a href={`https://github.com/devlanes-run/examples/tree/main/${EXAMPLE}`}>
                {EXAMPLE} on GitHub
              </a>
            </nav>
          </header>
          <main class="dl-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
