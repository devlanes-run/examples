/** Fetches the API from this page's origin and shows its answer, or why it failed. */
async function showApiAnswer(output: HTMLElement): Promise<void> {
  const url = output.dataset.url;
  if (!url) throw new Error("#api-answer has no data-url");
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) throw new Error(`${url} answered ${res.status}`);
    output.textContent = JSON.stringify(await res.json(), null, 2);
    output.className = "dl-ok";
  } catch (err) {
    // A CORS refusal lands here as a TypeError, with the reason only in the browser console.
    output.textContent = String(err);
    output.className = "dl-bad";
  }
}

const output = document.getElementById("api-answer");
if (output) void showApiAnswer(output);
