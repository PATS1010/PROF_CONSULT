// SYSTEM NOTE: Controls client-side behavior for the create student account page, including UI events and API calls.
// =========================================================
// CREATE STUDENT ACCOUNT (PAGE 1) INTERACTIONS
// - Back -> student-login.html
// - Student Number field: numbers only
// - Form submit -> create-student-account2.html
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Back -> student-login.html
  // ---------------------------------------------------------
  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "student-login.html";
    });
  });

  // ---------------------------------------------------------
  // Student Number: auto-formats to 00-00000 as the user types.
  // - Strips any non-numeric character.
  // - Caps input at 7 digits total (excluding the dash).
  // - Automatically inserts the dash after the first 2 digits.
  // ---------------------------------------------------------
  const studentNumberInput = document.getElementById("studentNumber");
  if (studentNumberInput) {
    studentNumberInput.addEventListener("input", () => {
      const digitsOnly = studentNumberInput.value.replace(/\D/g, "").slice(0, 7);

      const formatted = digitsOnly.length > 2
        ? `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`
        : digitsOnly;

      studentNumberInput.value = formatted;
    });
  }

  // ---------------------------------------------------------
  // Custom dropdowns (Course/Program, Year Level)
  // Replaces native <select> so the options list is a normal
  // HTML element we fully control -- it can never be sized or
  // positioned by the browser/OS in a way that overflows the
  // screen, which native <select> popups can do on mobile.
  // ---------------------------------------------------------
  const customSelects = document.querySelectorAll(".custom-select");

  function closeAllDropdowns(except) {
    customSelects.forEach((select) => {
      if (select === except) return;
      select.classList.remove("is-open");
      select.querySelector(".custom-select-options").hidden = true;
      select.querySelector(".custom-select-trigger").setAttribute("aria-expanded", "false");
    });
  }

  customSelects.forEach((select) => {
    const trigger = select.querySelector(".custom-select-trigger");
    const valueLabel = select.querySelector(".custom-select-value");
    const optionsList = select.querySelector(".custom-select-options");
    const hiddenInput = select.querySelector('input[type="hidden"]');
    const options = select.querySelectorAll("li[role='option']");

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = select.classList.contains("is-open");
      closeAllDropdowns(select);

      if (isOpen) {
        select.classList.remove("is-open");
        optionsList.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      } else {
        select.classList.add("is-open");
        optionsList.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    options.forEach((option) => {
      option.addEventListener("click", () => {
        options.forEach((opt) => opt.classList.remove("is-active"));
        option.classList.add("is-active");

        valueLabel.textContent = option.textContent;
        valueLabel.removeAttribute("data-is-placeholder");
        hiddenInput.value = option.getAttribute("data-value");

        select.classList.remove("is-open");
        optionsList.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      });
    });
  });

  // Close any open dropdown when clicking/tapping outside of it
  document.addEventListener("click", () => closeAllDropdowns());

  // ---------------------------------------------------------
  // Form submit -> create-student-account2.html
  // (page not built yet -- this link will 404 until it exists)
  // ---------------------------------------------------------
  const form = document.getElementById("createStudentAccountForm");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.checkValidity() || !document.getElementById("courseProgram").value || !document.getElementById("yearLevel").value) {
        form.reportValidity();
        return;
      }
      sessionStorage.setItem("findprof_registration", JSON.stringify({
        role: "student",
        id_number: studentNumberInput.value.trim(),
        full_name: document.getElementById("fullName").value.trim(),
        program: document.getElementById("courseProgram").value,
        year_level: document.getElementById("yearLevel").value
      }));
      window.location.href = "create-student-account2.html";
    });
  }

});
