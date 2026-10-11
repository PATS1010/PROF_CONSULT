// Student Profile JS
document.addEventListener("DOMContentLoaded", () => {

  function emptyStudentDetails() {
    return {
      course: "",
      yearLevel: "",
      section: "",
      email: "",
      phone: "",
    };
  }

  let studentDetails = emptyStudentDetails();

  function sanitizeNamePart(value) {
    return (value || "").replace(/[,.\-]/g, "");
  }

  function capitalizeNamePart(value) {
    return sanitizeNamePart(value)
      .trim()
      .toLowerCase()
      .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  }

  function formatMiddleInitial(value) {
    const letter = sanitizeNamePart(value).trim().slice(0, 1).toUpperCase();
    return letter ? `${letter}.` : "";
  }

  function editMiddleInitial(value) {
    return sanitizeNamePart(value).trim().slice(0, 1).toUpperCase();
  }

  function buildFullName(firstName, middleInitial, lastName, suffix) {
    return [capitalizeNamePart(firstName), formatMiddleInitial(middleInitial), capitalizeNamePart(lastName), suffix]
      .map((part) => (part || "").trim())
      .filter((part) => part.length > 0)
      .join(" ");
  }

  let studentName = {
    firstName: "",
    middleInitial: "",
    lastName: "",
    suffix: "",
  };

  const fullNameViewGroup = document.getElementById("profileFullNameView");
  const fullNameDisplay = document.getElementById("profileFullNameDisplay");
  const fullNameEditGroup = document.getElementById("profileFullNameEdit");
  const firstNameInput = document.getElementById("profileFirstName");
  const middleInitialInput = document.getElementById("profileMiddleInitial");
  const lastNameInput = document.getElementById("profileLastName");
  const suffixSelect = document.getElementById("profileSuffix");

  function renderFullNameDisplay() {
    if (fullNameDisplay) {
      fullNameDisplay.textContent = buildFullName(
        studentName.firstName,
        studentName.middleInitial,
        studentName.lastName,
        studentName.suffix
      );
    }
  }

  function populateNameEditInputs() {
    if (firstNameInput) firstNameInput.value = capitalizeNamePart(studentName.firstName);
    if (middleInitialInput) middleInitialInput.value = editMiddleInitial(studentName.middleInitial);
    if (lastNameInput) lastNameInput.value = capitalizeNamePart(studentName.lastName);
    if (suffixSelect) suffixSelect.value = studentName.suffix || "";
  }

  renderFullNameDisplay();
  populateNameEditInputs();

  [firstNameInput, lastNameInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      const sanitized = sanitizeNamePart(input.value);
      if (sanitized !== input.value) input.value = sanitized;
    });
  });

  if (middleInitialInput) {
    middleInitialInput.addEventListener("input", () => {
      middleInitialInput.value = editMiddleInitial(middleInitialInput.value);
    });
  }

  const studentNumberInput = document.getElementById("profileStudentNumber");
  const courseSelect = document.getElementById("profileCourse");
  const yearLevelSelect = document.getElementById("profileYearLevel");
  const sectionSelect = document.getElementById("profileSection");
  const emailInput = document.getElementById("profileEmail");
  const emailError = document.getElementById("emailError");
  const phoneInput = document.getElementById("profilePhone");
  const phoneError = document.getElementById("phoneError");
  const phoneGroup = document.getElementById("profilePhoneGroup");

  if (studentNumberInput) studentNumberInput.value = "";
  if (courseSelect) courseSelect.value = studentDetails.course;
  if (yearLevelSelect) yearLevelSelect.value = studentDetails.yearLevel;
  if (sectionSelect) sectionSelect.value = studentDetails.section;
  if (emailInput) emailInput.value = studentDetails.email;
  if (phoneInput) phoneInput.value = studentDetails.phone;

  function splitFullName(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: "", middleInitial: "", lastName: "", suffix: "" };
    if (parts.length === 1) return { firstName: parts[0], middleInitial: "", lastName: "", suffix: "" };
    const lastName = parts.pop();
    let middleInitial = "";
    if (parts.length > 1 && /^[A-Za-z]\.?$/.test(parts[parts.length - 1])) {
      middleInitial = editMiddleInitial(parts.pop());
    }
    return { firstName: capitalizeNamePart(parts.join(" ")), middleInitial, lastName: capitalizeNamePart(lastName), suffix: "" };
  }

  function normalizeProgramValue(value) {
    const raw = String(value || "").toLowerCase();
    if (raw.includes("computer")) return "computer-engineering";
    return value || "";
  }

  function normalizeYearLevel(value) {
    const match = String(value || "").match(/\d/);
    return match ? match[0] : String(value || "");
  }

  function applySessionProfile(result) {
    const user = result.user || {};
    const profile = result.profile || {};

    studentName = splitFullName(user.name || "");
    studentDetails = {
      course: normalizeProgramValue(profile.Program || profile.program || ""),
      yearLevel: normalizeYearLevel(profile.Year_Level || profile.year_level || ""),
      section: profile.Section || profile.section || "",
      email: user.email || "",
      phone: formatPhoneInput(user.phone || ""),
    };

    if (studentNumberInput) studentNumberInput.value = user.username || "";
    if (courseSelect) courseSelect.value = studentDetails.course;
    if (yearLevelSelect) yearLevelSelect.value = studentDetails.yearLevel;
    if (sectionSelect) sectionSelect.value = studentDetails.section;
    if (emailInput) emailInput.value = studentDetails.email;
    if (phoneInput) phoneInput.value = studentDetails.phone;
    renderFullNameDisplay();
    populateNameEditInputs();
  }

  fetch("api/session.php?role=student", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then(applySessionProfile)
    .catch(() => {
      window.location.href = "login.html";
    });

  function formatPhoneInput(rawValue) {
    const digits = rawValue.replace(/\D/g, "").slice(0, 10);
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6, 10);
    return [part1, part2, part3].filter(Boolean).join("-");
  }

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatPhoneInput(phoneInput.value);
    });
  }

  function showFieldError(inputEl, errorEl, message, wrapEl) {
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }
    if (inputEl) inputEl.classList.add("has-error");
    if (wrapEl) wrapEl.classList.add("has-error");
  }

  function clearFieldError(inputEl, errorEl, wrapEl) {
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.hidden = true;
    }
    if (inputEl) inputEl.classList.remove("has-error");
    if (wrapEl) wrapEl.classList.remove("has-error");
  }

  function validateEmail() {
    const value = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (value === "" || !emailPattern.test(value)) {
      showFieldError(emailInput, emailError, "Enter a valid email address.");
      return false;
    }
    clearFieldError(emailInput, emailError);
    return true;
  }

  function validatePhone() {
    const value = phoneInput.value.trim();
    const phonePattern = /^9\d{2}-\d{3}-\d{4}$/;
    if (!phonePattern.test(value)) {
      showFieldError(
        phoneInput,
        phoneError,
        "Enter a valid Philippine mobile number (e.g. 912-345-6789).",
        phoneGroup
      );
      return false;
    }
    clearFieldError(phoneInput, phoneError, phoneGroup);
    return true;
  }

  const hamburgerButton = document.getElementById("hamburgerButton");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarClose = document.getElementById("sidebarClose");

  function openSidebar() {
    sidebar.classList.add("is-open");
    sidebarOverlay.hidden = false;
    requestAnimationFrame(() => sidebarOverlay.classList.add("is-open"));
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarOverlay.classList.remove("is-open");
    window.setTimeout(() => {
      sidebarOverlay.hidden = true;
    }, 250);
  }

  if (hamburgerButton) hamburgerButton.addEventListener("click", openSidebar);
  if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

  const quickActionButton = document.getElementById("quickActionButton");
  const quickActionPanel = document.getElementById("quickActionPanel");

  function openQuickAction() {
    quickActionPanel.hidden = false;
    requestAnimationFrame(() => quickActionPanel.classList.add("is-open"));
    quickActionButton.setAttribute("aria-expanded", "true");
  }

  function closeQuickAction() {
    quickActionPanel.classList.remove("is-open");
    quickActionButton.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      quickActionPanel.hidden = true;
    }, 200);
  }

  if (quickActionButton) {
    quickActionButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = quickActionPanel.classList.contains("is-open");
      if (isOpen) {
        closeQuickAction();
      } else {
        openQuickAction();
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (
      quickActionPanel &&
      !quickActionPanel.hidden &&
      !quickActionPanel.contains(event.target) &&
      event.target !== quickActionButton
    ) {
      closeQuickAction();
    }
  });

  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
    if (window.ProfConsultNotifications) {
      window.ProfConsultNotifications.renderBellIndicator(notificationBellButton);
    }
  }

  const editProfileButton = document.getElementById("editProfileButton");
  const profileInfoCard = document.querySelector(".profile-info-card");
  const profilePhotoEdit = document.getElementById("profilePhotoEdit");

  const editableFields = [courseSelect, yearLevelSelect, sectionSelect, emailInput, phoneInput];

  let isEditing = false;
  if (profilePhotoEdit) profilePhotoEdit.hidden = true;
  [emailInput, phoneInput].forEach((field) => {
    if (!field) return;
    field.readOnly = true;
    field.disabled = true;
  });

  function enterEditMode() {
    isEditing = true;
    editableFields.forEach((field) => {
      if (!field) return;
      field.readOnly = false;
      field.disabled = false;
    });

    populateNameEditInputs();
    if (fullNameViewGroup) fullNameViewGroup.hidden = true;
    if (fullNameEditGroup) fullNameEditGroup.hidden = false;

    clearFieldError(emailInput, emailError);
    clearFieldError(phoneInput, phoneError, phoneGroup);

    profileInfoCard.classList.add("is-editing");
    profilePhotoEdit.hidden = false;
    editProfileButton.textContent = "Save Changes";
  }

  async function saveStudentProfileToApi() {
    const fullName = buildFullName(
      capitalizeNamePart(firstNameInput ? firstNameInput.value.trim() : studentName.firstName),
      sanitizeNamePart(middleInitialInput ? middleInitialInput.value.trim() : studentName.middleInitial),
      capitalizeNamePart(lastNameInput ? lastNameInput.value.trim() : studentName.lastName),
      suffixSelect ? suffixSelect.value : studentName.suffix
    );

    const response = await fetch("api/student-profile.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email: emailInput ? emailInput.value.trim() : "",
        phone: phoneInput ? phoneInput.value.trim() : "",
        program: courseSelect ? courseSelect.options[courseSelect.selectedIndex].textContent : "",
        year_level: yearLevelSelect ? `${yearLevelSelect.value}${yearLevelSelect.value ? " Year" : ""}` : "",
        section: sectionSelect ? sectionSelect.value : "",
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to update the student profile.");
    }
    applySessionProfile(result);
  }

  async function exitEditMode() {
    isEditing = false;
    editableFields.forEach((field) => {
      if (!field) return;
      field.disabled = true;
      if (field.tagName !== "SELECT") field.readOnly = true;
    });

    studentName = {
      firstName: capitalizeNamePart(firstNameInput ? firstNameInput.value.trim() : studentName.firstName),
      middleInitial: editMiddleInitial(middleInitialInput ? middleInitialInput.value.trim() : studentName.middleInitial),
      lastName: capitalizeNamePart(lastNameInput ? lastNameInput.value.trim() : studentName.lastName),
      suffix: suffixSelect ? suffixSelect.value : studentName.suffix,
    };
    renderFullNameDisplay();

    studentDetails = {
      course: courseSelect ? courseSelect.value : studentDetails.course,
      yearLevel: yearLevelSelect ? yearLevelSelect.value : studentDetails.yearLevel,
      section: sectionSelect ? sectionSelect.value : studentDetails.section,
      email: emailInput ? emailInput.value.trim() : studentDetails.email,
      phone: phoneInput ? phoneInput.value.trim() : studentDetails.phone,
    };
    await saveStudentProfileToApi();

    if (fullNameEditGroup) fullNameEditGroup.hidden = true;
    if (fullNameViewGroup) fullNameViewGroup.hidden = false;

    profileInfoCard.classList.remove("is-editing");
    profilePhotoEdit.hidden = true;
    editProfileButton.textContent = "Edit Profile";

  }

  if (editProfileButton) {
    editProfileButton.addEventListener("click", () => {
      if (isEditing) {
        const isEmailValid = validateEmail();
        const isPhoneValid = validatePhone();
        if (!isEmailValid || !isPhoneValid) {
          return;
        }
        exitEditMode().catch((error) => {
          showFieldError(emailInput, emailError, error.message || "Unable to save profile.");
        });
      } else {
        enterEditMode();
      }
    });
  }

  const profilePhotoInput = document.getElementById("profilePhotoInput");
  const profilePhoto = document.getElementById("profilePhoto");

  if (profilePhotoInput && profilePhoto) {
    profilePhotoInput.addEventListener("change", () => {
      const file = profilePhotoInput.files && profilePhotoInput.files[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      profilePhoto.src = previewUrl;

    });
  }

});
// Logout confirmation modal
document.addEventListener("DOMContentLoaded", () => {

  const logoutLink = document.getElementById("logoutLink");
  if (!logoutLink) return;

  const overlay = document.createElement("div");
  overlay.className = "pc-logout-overlay";
  overlay.hidden = true;

  overlay.innerHTML = `
    <div class="pc-logout-modal" role="dialog" aria-modal="true" aria-label="Log out of your account?">
      <div class="pc-logout-modal-header">
        <button type="button" class="pc-logout-modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="pc-logout-modal-body">
        <p class="pc-logout-modal-title">Log out of your account?</p>
        <div class="pc-logout-modal-actions">
          <button type="button" class="pc-logout-cancel-button">Cancel</button>
          <button type="button" class="pc-logout-yes-button">Yes</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector(".pc-logout-modal-close");
  const cancelButton = overlay.querySelector(".pc-logout-cancel-button");
  const yesButton = overlay.querySelector(".pc-logout-yes-button");

  function openModal() {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("is-open"));
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    window.setTimeout(() => {
      overlay.hidden = true;
    }, 200);
  }

  closeButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  yesButton.addEventListener("click", () => {
    const redirectPage = logoutLink.getAttribute("href") || "login.html";
    if (window.ProfConsultAuth && window.ProfConsultAuth.logout) {
      window.ProfConsultAuth.logout(redirectPage);
      return;
    }
    window.location.href = redirectPage;
  });

  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    openModal();
  });

});
