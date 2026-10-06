// Script JS
document.addEventListener("DOMContentLoaded", () => {
  const loadingText = document.getElementById("loadingText");
  const continueButton = document.getElementById("continueButton");

  const LOADING_DURATION_MS = 2000;

  window.setTimeout(() => {
    if (loadingText) {
      loadingText.remove();
    }

    if (continueButton) {
      continueButton.classList.add("is-visible");
    }
  }, LOADING_DURATION_MS);
});