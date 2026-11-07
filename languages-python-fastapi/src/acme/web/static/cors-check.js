// Calls quotes from the page's origin, so the browser enforces the CORS headers quotes sends.
const result = document.getElementById("cors-result");

try {
  const response = await fetch(result.dataset.url, { signal: AbortSignal.timeout(5000) });
  const quotes = await response.json();
  result.className = "dl-ok";
  result.textContent = `${quotes.length} quotes, CORS allowed this origin`;
} catch (error) {
  result.className = "dl-bad";
  result.textContent = `blocked: ${error.message}`;
}
