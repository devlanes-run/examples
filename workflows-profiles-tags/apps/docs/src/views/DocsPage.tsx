import { LanePage, type LaneInfo } from "@profiles-tags/shared";
import type { Component } from "../components.js";

/** The component docs, a stand-in for a Storybook that starts only on demand. */
export function DocsPage({ info, components }: { info: LaneInfo; components: Component[] }) {
  return (
    <LanePage info={info}>
      <h2 class="dl-h2">Components</h2>
      <p class="dl-lede">
        This service has <code>autostart: false</code>, so it runs only when a command or profile
        names <code>docs</code> or <code>+docs</code>.
      </p>
      <div class="dl-card">
        <dl class="dl-rows">
          {components.map((component) => (
            <>
              <dt>{component.name}</dt>
              <dd>{component.usedBy}</dd>
            </>
          ))}
        </dl>
      </div>
    </LanePage>
  );
}
