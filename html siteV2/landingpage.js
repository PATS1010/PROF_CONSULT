// =========================================================
// LANDING PAGE INTERACTIONS
// - Mobile nav toggle
// - Smooth scrolling for About / Contact / Learn More
//   (Contact safely no-ops until Rectangle 5 exists with id="contact")
// - Home -> index.html
// - Login -> choose-account.html
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Mobile nav toggle
  // ---------------------------------------------------------
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // ---------------------------------------------------------
  // Smooth scrolling for in-page section links
  // Applies to About, Contact, and Learn More.
  // If the target section doesn't exist yet (e.g. #contact
  // before Rectangle 5 is built), this safely does nothing.
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="scroll"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        event.preventDefault();
        targetSection.scrollIntoView({ behavior: "smooth" });

        if (navLinks && navLinks.classList.contains("is-open")) {
          navLinks.classList.remove("is-open");
          navToggle.setAttribute("aria-expanded", "false");
        }
      }
      // If the section doesn't exist yet, let the default anchor
      // behavior happen (harmless no-op / jumps nowhere useful),
      // rather than breaking the click entirely.
    });
  });

  // ---------------------------------------------------------
  // Home -> index.html (splash screen)
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="home"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "index.html";
    });
  });

  // ---------------------------------------------------------
  // Login -> choose-account.html
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="login"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "choose-account.html";
    });
  });

});