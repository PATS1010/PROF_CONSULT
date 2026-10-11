// Create Faculty Account JS
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

  const facultyIdInput = document.getElementById("facultyIdNumber");
  const facultyIdError = document.getElementById("facultyIdError");
  let facultyIdCheckTimer = null;
  let lastCheckedFacultyId = "";
  let lastFacultyIdExists = false;

  function showFacultyIdError(message) {
    if (facultyIdError) {
      facultyIdError.textContent = message;
      facultyIdError.hidden = false;
    }
    if (facultyIdInput) {
      facultyIdInput.classList.add("input-error");
      facultyIdInput.setCustomValidity(message);
    }
  }

  function clearFacultyIdError() {
    if (facultyIdError) {
      facultyIdError.textContent = "";
      facultyIdError.hidden = true;
    }
    if (facultyIdInput) {
      facultyIdInput.classList.remove("input-error");
      facultyIdInput.setCustomValidity("");
    }
  }

  async function checkFacultyIdExists(facultyId) {
    if (!facultyId || facultyId.length < 8) {
      lastCheckedFacultyId = "";
      lastFacultyIdExists = false;
      clearFacultyIdError();
      return false;
    }

    if (facultyId === lastCheckedFacultyId) {
      if (lastFacultyIdExists) {
        showFacultyIdError(
          "This faculty ID already has an account. Faculty cannot create a second account."
        );
      }
      return lastFacultyIdExists;
    }

    const response = await fetch("api/check-account.php", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        role: "faculty",
        id_number: facultyId,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to check faculty ID right now.");
    }

    lastCheckedFacultyId = facultyId;
    lastFacultyIdExists = !!result.username_exists;

    if (lastFacultyIdExists) {
      showFacultyIdError(
        "This faculty ID already has an account. Faculty cannot create a second account."
      );
    } else {
      clearFacultyIdError();
    }

    return lastFacultyIdExists;
  }

  if (facultyIdInput) {
    facultyIdInput.addEventListener("input", () => {
      const digitsOnly = facultyIdInput.value.replace(/\D/g, "").slice(0, 7);

      const formatted = digitsOnly.length > 2
        ? `${digitsOnly.slice(0, 2)}-${digitsOnly.slice(2)}`
        : digitsOnly;

      facultyIdInput.value = formatted;
      window.clearTimeout(facultyIdCheckTimer);
      lastCheckedFacultyId = "";
      lastFacultyIdExists = false;

      if (formatted.length === 8) {
        facultyIdCheckTimer = window.setTimeout(() => {
          checkFacultyIdExists(formatted).catch((error) => {
            showFacultyIdError(error.message || "Unable to check faculty ID right now.");
          });
        }, 450);
      } else {
        clearFacultyIdError();
      }
    });

    facultyIdInput.addEventListener("blur", () => {
      checkFacultyIdExists(facultyIdInput.value.trim()).catch((error) => {
        showFacultyIdError(error.message || "Unable to check faculty ID right now.");
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

    if (saved.role !== "faculty") return;

    if (saved.id_number) {
      facultyIdInput.value = saved.id_number;
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
    setCustomSelectValue("departmentSelect", saved.department);
  }

  restoreSavedInformation();

  const form = document.getElementById("createFacultyAccountForm");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      firstNameInput.value = normalizeName(firstNameInput.value);
      lastNameInput.value = normalizeName(lastNameInput.value);

      if (!form.checkValidity() || !document.getElementById("department").value) {
        form.reportValidity();
        return;
      }

      try {
        const facultyIdExists = await checkFacultyIdExists(facultyIdInput.value.trim());
        if (facultyIdExists) {
          facultyIdInput.focus();
          return;
        }
      } catch (error) {
        showFacultyIdError(
          error.message ||
          "Unable to check faculty ID right now."
        );
        facultyIdInput.focus();
        return;
      }

      const firstName = firstNameInput.value;
      const middleInitial = middleInitialInput.value;
      const lastName = lastNameInput.value;
      const suffix = document.getElementById("suffix").value;

      sessionStorage.setItem("findprof_registration", JSON.stringify({
        role: "faculty",
        id_number: document.getElementById("facultyIdNumber").value.trim(),
        firstName: firstName,
        middleInitial: middleInitial,
        lastName: lastName,
        suffix: suffix,
        full_name: [firstName, middleInitial, lastName, suffix].filter(Boolean).join(" "),
        department: document.getElementById("department").value
      }));
      window.location.href = "create-faculty-account2.html";
    });
  }

});
