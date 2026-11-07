import type { Child } from "hono/jsx";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap";

const EXAMPLE = "web-provider-stubs";

type LayoutProps = {
  title: string;
  lane: number;
  children: Child;
};

/**
 * The devlanes page shell: header, logo, fonts, the shared stylesheet and the app's own
 * `/styles.css`, which each app serves next to `/brand/*`.
 */
export function Layout({ title, lane, children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="icon" href="/brand/logo.svg" />
        <link rel="stylesheet" href={FONTS} />
        <link rel="stylesheet" href="/brand/devlanes.css" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body style={`--dl-lane: var(--dl-lane-${lane % 4})`}>
        <div class="dl-page">
          <header class="dl-header">
            <a class="dl-brand" href="https://devlanes.run">
              <img src="/brand/logo.svg" alt="" width="32" height="32" />
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
