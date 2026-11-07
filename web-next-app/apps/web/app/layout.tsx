import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import logo from "@/brand/logo.svg";
import { Header } from "@/components/Header";
import { env } from "@/lib/env";
// brand/ links to _internal/brand, the CSS and logo every example shares.
import "@/brand/devlanes.css";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap";

// Every page shows the lane's values, which exist only at request time, so nothing is prerendered.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const { lane, project } = env();
  return { title: `Lane ${lane} of ${project}`, icons: logo.src };
}

/** The devlanes page shell: fonts, the shared stylesheet, the header and the lane colour. */
export default function RootLayout({ children }: { children: ReactNode }) {
  const laneColour = { "--dl-lane": `var(--dl-lane-${env().lane % 4})` } as CSSProperties;
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body style={laneColour}>
        <div className="dl-page">
          <Header example="web-next-app" />
          <main className="dl-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
