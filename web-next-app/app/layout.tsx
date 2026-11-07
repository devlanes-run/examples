import type { CSSProperties, ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  const lane = Number(process.env.DEVLANES_LANE ?? 0);
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.svg" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Overpass:wght@400;600;900&family=JetBrains+Mono:wght@400;700&display=swap"
        />
      </head>
      <body style={{ "--dl-lane": `var(--dl-lane-${lane % 4})` } as CSSProperties}>
        {children}
      </body>
    </html>
  );
}
