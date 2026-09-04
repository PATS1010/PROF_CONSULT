// SYSTEM NOTE: Controls client-side behavior for the script page, including UI events and API calls.

document.addEventListener("DOMContentLoaded", () => {
  const loadingText = document.getElementById("loadingText");
  const continueButton = document.getElementById("continueButton");

  const LOADING_DURATION_MS = 2000;

  window.setTimeout(() => {
    // Completely remove the loading text
    if (loadingText) {
      loadingText.remove();
    }

    // Reveal the continue button in the same spot
    if (continueButton) {
      continueButton.classList.add("is-visible");
    }
  }, LOADING_DURATION_MS);
});