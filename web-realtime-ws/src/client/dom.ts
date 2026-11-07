/** The element with `id`, which the server-rendered page always contains. */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`#${id} is missing from the page`);
  return element as T;
}

/** Shows `text` in `element`, coloured as healthy or failing. */
export function setState(element: HTMLElement, text: string, ok: boolean): void {
  element.textContent = text;
  element.className = ok ? "dl-ok" : "dl-bad";
}
