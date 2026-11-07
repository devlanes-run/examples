import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev locks its output folder, so a second lane in the same folder
  // (devlanes lane new) needs its own. Unset, Next uses .next.
  distDir: process.env.NEXT_DIST_DIR || undefined,
  // next dev writes an AGENTS.md into the project when it detects a coding
  // agent, which devlanes started under an agent would otherwise leave behind.
  agentRules: false,
  // Turbopack refuses symlinks that leave its root, and brand/ links to
  // _internal/brand at the repository root.
  turbopack: { root: fileURLToPath(new URL("../../..", import.meta.url)) },
};

export default nextConfig;
