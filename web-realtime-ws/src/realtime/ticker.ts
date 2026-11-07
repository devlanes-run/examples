import { env } from "../env.js";
import type { Tick } from "../messages.js";

type Listener = (tick: Tick) => void;

/** Counts one tick per second and hands each tick to every open `/events` stream. */
class Ticker {
  #count = 0;
  #listeners = new Set<Listener>();

  /** Starts the one-second interval; call once at startup. */
  start(): void {
    setInterval(() => {
      this.#count += 1;
      const tick = this.current();
      for (const listener of this.#listeners) listener(tick);
    }, 1000);
  }

  /** The latest tick, sent to a new stream right away so it does not wait a second. */
  current(): Tick {
    return { lane: env.lane, tick: this.#count, time: new Date().toISOString() };
  }

  /** Calls `listener` on every tick until the returned function is called. */
  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Open `/events` streams. */
  get subscribers(): number {
    return this.#listeners.size;
  }

  /** Ticks since startup; it trails the uptime by however long the lane was frozen. */
  get count(): number {
    return this.#count;
  }
}

/** The process-wide ticker the SSE route and the admin view share. */
export const ticker = new Ticker();
