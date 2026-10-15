// Create Student Account JS
document.addEventListener("DOMContentLoaded", () => {

  const urlParams = new URLSearchParams(window.location.search);
  const cameFromChooseAccount = urlParams.get("from") === "choose-account";
  const backDestination = cameFromChooseAccount ? "choose-account.html" : "login.html";

  document.querySelectorAll('[data-nav="back"]').forEach((link) => {
    link.href = backDestination;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = backDestination;
    });
  });

  const studentNumberInput = document.getElementById("studentNumber");
  const studentNumberError = document.getElementById("studentNumberError");
  let studentNumberCheckTimer = null;
  let lastCheckedStudentNumber = "";
  let lastStudentNumberExists = false;

  function showStudentNumberError(message) {
    if (!studentNumberError) return;

    studentNumberError.textContent = message;
    studentNumberError.hidden = false;
    studentNumberInput.classList.add("input-error");
  }

  function clearStudentNumberError() {
    if (!studentNumberError) return;

    studentNumberError.textContent = "";
    studentNumberError.hidden = true;
    studentNumberInput.classList.remove("input-error");
  }

  function isCompleteStudentNumber(value) {
    return /^\d{2}-\d{5}$/.test(value.trim());
  }

  async function checkStudentNumberExists(studentNumber) {
    if (!isCompleteStudentNumber(studentNumber)) {
      lastCheckedStudentNumber = "";
      lastStudentNumberExists = false;
      clearStudentNumberError();
      return false;
    }

    if (lastCheckedStudentNumber === studentNumber) {
      if (lastStudentNumberExists) {
        showStudentNumberError(
          "This student ID already has an account. Students cannot create a second account."
        );
      }

      return lastStudentNumberExists;
    }

    const response = await fetch("api/check-account-exists.php", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        role: "student",
        id_number: studentNumber,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to check student ID right now.");
    }

    lastCheckedStudentNumber = studentNumber;
    lastStudentNumberExists = !!result.username_exists;

    if (lastStudentNumberExists) {
      showStudentNumberError(
        "This student ID already has an account. Students cannot create a second account."
      );
    } else {
      clearStudentNumberError();
    }

    return lastStudentNumberExists;
  }

  if (studentNumberInput) {
    studentNumberInput.addEventListener("input", () => {
      const digitsOnly = studentNumberInput.value.replace(/\D/g, "").slice(0, 7);

      const formatted = digitsOnly.length > 2
        ? `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`
        : digitsOnly;

      studentNumberInput.value = formatted;
      lastCheckedStudentNumber = "";
      lastStudentNumberExists = false;

      window.clearTimeout(studentNumberCheckTimer);
      if (isCompleteStudentNumber(formatted)) {
        studentNumberCheckTimer = window.setTimeout(() => {
          checkStudentNumberExists(formatted).catch((error) => {
            showStudentNumberError(error.message || "Unable to check student ID right now.");
          });
        }, 450);
      } else {
        clearStudentNumberError();
      }
    });

    studentNumberInput.addEventListener("blur", () => {
      checkStudentNumberExists(studentNumberInput.value.trim()).catch((error) => {
        showStudentNumberError(error.message || "Unable to check student ID right now.");
      });
    });
  }

  const firstNameInput = document.getElementById("firstName");
  const middleInitialInput = document.getElementById("middleInitial");
  const lastNameInput = document.getElementById("lastName");

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

  document.addEventListener("click", () => closeAllDropdowns());

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

    setCustomSelectValue("suffixSelect", saved.suffix);
    setCustomSelectValue("courseProgramSelect", saved.program);
    setCustomSelectValue("yearLevelSelect", saved.year_level);
    setCustomSelectValue("sectionSelect", saved.section);
  }

  restoreSavedInformation();

  const form = document.getElementById("createStudentAccountForm");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      firstNameInput.value = normalizeName(firstNameInput.value);
      lastNameInput.value = normalizeName(lastNameInput.value);

      if (!form.checkValidity() || !document.getElementById("courseProgram").value || !document.getElementById("yearLevel").value) {
        form.reportValidity();
        return;
      }

      try {
        const studentExists =
          await checkStudentNumberExists(
            studentNumberInput.value.trim()
          );

        if (studentExists) {
          studentNumberInput.focus();
          return;
        }
      } catch (error) {
        showStudentNumberError(
          error.message ||
          "Unable to check student ID right now."
        );
        studentNumberInput.focus();
        return;
      }

      const firstName = firstNameInput.value;
      const middleInitial = middleInitialInput.value;
      const lastName = lastNameInput.value;
      const suffix = document.getElementById("suffix").value;

      sessionStorage.setItem("findprof_registration", JSON.stringify({
        role: "student",
        id_number: studentNumberInput.value.trim(),
        firstName: firstName,
        middleInitial: middleInitial,
        lastName: lastName,
        suffix: suffix,
        full_name: [firstName, middleInitial, lastName, suffix].filter(Boolean).join(" "),
        program: document.getElementById("courseProgram").value,
        year_level: document.getElementById("yearLevel").value,
        section: document.getElementById("section").value
      }));
      window.location.href = "create-student-account2.html";
    });
  }

});
