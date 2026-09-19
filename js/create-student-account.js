// SYSTEM NOTE: Controls client-side behavior for the create student account page, including UI events and API calls.
// =========================================================
// CREATE STUDENT ACCOUNT (PAGE 1) INTERACTIONS
// - Back -> student-login.html
// - Student Number field: numbers only
// - Name fields: First Name / Middle Initial / Last Name (separate)
// - Restores previously entered information when returning here
//   via Back from create-student-account2.html
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
  // Name fields: First Name / Middle Initial / Last Name
  // - Each field is stored exactly as entered; nothing is split
  //   or merged automatically (multi-word first names such as
  //   "Juan Carlos" stay intact in First Name).
  // - Middle Initial: one letter only, uppercased, and no period
  //   is ever added.
  // ---------------------------------------------------------
  const firstNameInput = document.getElementById("firstName");
  const middleInitialInput = document.getElementById("middleInitial");
  const lastNameInput = document.getElementById("lastName");

  // Trims the ends and collapses repeated spaces to one.
  // Internal single spaces are preserved.
  function normalizeName(value) {
    return value.replace(/\s+/g, " ").trim();
  }

  if (middleInitialInput) {
    middleInitialInput.addEventListener("input", () => {
      middleInitialInput.value = middleInitialInput.value
        .replace(/[^\p{L}]/gu, "")
        .toUpperCase()
        .slice(0, 1);
    });
  }

  // ---------------------------------------------------------
  // Custom dropdowns (Course/Program, Year Level, Section)
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
  // Programmatically select a custom-dropdown option by its
  // data-value -- same end state as a real click on that
  // option (label text, hidden input, is-active), used below
  // to restore a previously chosen Program / Year / Section.
  // ---------------------------------------------------------
  function setCustomSelectValue(selectId, value) {
    if (!value) return;

    const select = document.getElementById(selectId);
    if (!select) return;

    const valueLabel = select.querySelector(".custom-select-value");
    const hiddenInput = select.querySelector('input[type="hidden"]');
    const options = select.querySelectorAll("li[role='option']");

    const matchingOption = Array.from(options).find(
      (option) => option.getAttribute("data-value") === value
    );

    if (!matchingOption) return;

    options.forEach((option) => option.classList.remove("is-active"));
    matchingOption.classList.add("is-active");

    valueLabel.textContent = matchingOption.textContent;
    valueLabel.removeAttribute("data-is-placeholder");
    hiddenInput.value = value;
  }

  // ---------------------------------------------------------
  // Restore previously entered information
  //
  // So clicking Back from create-student-account2.html shows
  // what was already filled in here instead of a blank form.
  // Only restores when the saved step-one data actually
  // belongs to the student flow (not a leftover faculty
  // registration attempt).
  // ---------------------------------------------------------
  function restoreSavedInformation() {
    let saved = {};

    try {
      saved = JSON.parse(sessionStorage.getItem("findprof_registration") || "{}");
    } catch (error) {
      saved = {};
    }

    if (saved.role !== "student") return;

    if (saved.id_number) {
      studentNumberInput.value = saved.id_number;
    }

    if (saved.firstName) {
      firstNameInput.value = saved.firstName;
    }

    if (saved.middleInitial) {
      middleInitialInput.value = saved.middleInitial;
    }

    if (saved.lastName) {
      lastNameInput.value = saved.lastName;
    }

    setCustomSelectValue("courseProgramSelect", saved.program);
    setCustomSelectValue("yearLevelSelect", saved.year_level);
    setCustomSelectValue("sectionSelect", saved.section);
  }

  restoreSavedInformation();

  // ---------------------------------------------------------
  // Form submit -> create-student-account2.html
  // (page not built yet -- this link will 404 until it exists)
  // ---------------------------------------------------------
  const form = document.getElementById("createStudentAccountForm");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      // Clean the name fields first so whitespace-only input
      // is treated as empty by the required check below.
      firstNameInput.value = normalizeName(firstNameInput.value);
      lastNameInput.value = normalizeName(lastNameInput.value);

      if (!form.checkValidity() || !document.getElementById("courseProgram").value || !document.getElementById("yearLevel").value) {
        form.reportValidity();
        return;
      }

      const firstName = firstNameInput.value;
      const middleInitial = middleInitialInput.value;
      const lastName = lastNameInput.value;

      sessionStorage.setItem("findprof_registration", JSON.stringify({
        role: "student",
        id_number: studentNumberInput.value.trim(),
        firstName: firstName,
        middleInitial: middleInitial,
        lastName: lastName,
        // Legacy field kept only so create-student-account2 keeps working
        // until it reads the three fields above. Plain space-joined: no
        // commas, periods or dashes are added.
        full_name: [firstName, middleInitial, lastName].filter(Boolean).join(" "),
        program: document.getElementById("courseProgram").value,
        year_level: document.getElementById("yearLevel").value,
        // Was previously collected but never saved, so Section
        // could never be restored on Back -- included now so
        // restoreSavedInformation() above has something to read.
        section: document.getElementById("section").value
      }));
      window.location.href = "create-student-account2.html";
    });
  }

});