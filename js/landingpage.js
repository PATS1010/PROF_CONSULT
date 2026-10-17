// Landing Page JS
document.addEventListener("DOMContentLoaded", () => {

  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

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
    });
  });

  document.querySelectorAll('[data-nav="home"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      document.getElementById("hero")?.scrollIntoView({ behavior: "smooth" });
      if (navLinks) navLinks.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll('[data-nav="register"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "choose-account.html";
    });
  });

  document.querySelectorAll('[data-nav="login"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "login.html";
    });
  });

});
