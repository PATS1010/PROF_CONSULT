// =========================================================
// STUDENT PROFILE PAGE INTERACTIONS
// - Burger menu + Quick Action: same behavior as the Dashboard
// - Populates profile fields from sample student data
//   (will come from the logged-in student's real record,
//   structured so it's easy to swap for real backend data)
// - Edit Profile: toggles all fields except Student Number
//   into an editable state; "Save Changes" exits edit mode.
//   No backend yet, so this only updates the page's own state.
// - Profile photo: clicking the edit badge (visible only in
//   edit mode) opens a file picker and previews the chosen image
// - Notification bell: navigates to notifications.html and
//   renders the shared unread-indicator badge (see
//   notification-state.js / window.ProfConsultNotifications)
//
// UPDATED: Course/Year Level/Section/Email/Phone are now
// persisted to localStorage (same idea as the existing name
// persistence below) so edits survive a page refresh instead
// of resetting back to SAMPLE_STUDENT. Email and Phone are now
// validated on Save -- invalid values show an inline error and
// keep the page in edit mode instead of saving.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Sample student account -- used as the DEFAULT/fallback
  // values only. Replace with real session/user data once
  // backend authentication exists.
  // ---------------------------------------------------------
  const SAMPLE_STUDENT = {
    studentNumber: "24-00001",
    course: "computer-engineering",
    yearLevel: "3",
    section: "A",
    email: "john.delacruz@example.com",
    phone: "912-345-6789",
  };

  // ---------------------------------------------------------
  // Course/Year Level/Section/Email/Phone -- persisted to
  // localStorage so edits survive a refresh, the same way the
  // Full Name fields already do below. Student Number is never
  // included here since it's always read-only/never editable.
  // ---------------------------------------------------------
  const STUDENT_DETAILS_STORAGE_KEY = "profconsult_student_details";

  function loadStudentDetails() {
    try {
      const stored = localStorage.getItem(STUDENT_DETAILS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          return {
            course: parsed.course || SAMPLE_STUDENT.course,
            yearLevel: parsed.yearLevel || SAMPLE_STUDENT.yearLevel,
            section: parsed.section || SAMPLE_STUDENT.section,
            email: parsed.email || SAMPLE_STUDENT.email,
            phone: parsed.phone || SAMPLE_STUDENT.phone,
          };
        }
      }
    } catch (error) {
      // fall through to defaults
    }
    return {
      course: SAMPLE_STUDENT.course,
      yearLevel: SAMPLE_STUDENT.yearLevel,
      section: SAMPLE_STUDENT.section,
      email: SAMPLE_STUDENT.email,
      phone: SAMPLE_STUDENT.phone,
    };
  }

  function saveStudentDetails(details) {
    try {
      localStorage.setItem(STUDENT_DETAILS_STORAGE_KEY, JSON.stringify(details));
    } catch (error) {
      // Storage unavailable -- the change just won't persist/sync
    }
  }

  let studentDetails = loadStudentDetails();

  // ---------------------------------------------------------
  // Name -- stored as three independent parts (First Name,
  // Middle Initial, Last Name) rather than one combined string,
  // so the dashboard greeting can use First Name alone without
  // ever having to guess which word of a full name is the first
  // name. Persisted to localStorage under the SAME key the
  // Student Dashboard reads from, so the two pages can never
  // drift out of sync and the saved name survives a refresh.
  // ---------------------------------------------------------
  const STUDENT_NAME_STORAGE_KEY = "profconsult_student_name";

  const DEFAULT_STUDENT_NAME = {
    firstName: "John",
    middleInitial: "D",
    lastName: "Cruz",
  };

  function loadStudentName() {
    try {
      const stored = localStorage.getItem(STUDENT_NAME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          return {
            firstName: parsed.firstName || "",
            middleInitial: parsed.middleInitial || "",
            lastName: parsed.lastName || "",
          };
        }
      }
    } catch (error) {
      // fall through to defaults
    }
    return { ...DEFAULT_STUDENT_NAME };
  }

  function saveStudentName(nameParts) {
    try {
      localStorage.setItem(STUDENT_NAME_STORAGE_KEY, JSON.stringify(nameParts));
    } catch (error) {
      // Storage unavailable -- the change just won't persist/sync
    }
  }

  // Name display/data must never contain commas, periods, or
  // dashes -- strip them as the person types, not just on save.
  function sanitizeNamePart(value) {
    return (value || "").replace(/[,.\-]/g, "");
  }

  // Joins the three parts with plain spaces only -- no punctuation
  // added, and a multi-word First Name ("Mary Jane") keeps its
  // internal space since only the ends are trimmed.
  function buildFullName(firstName, middleInitial, lastName) {
    return [firstName, middleInitial, lastName]
      .map((part) => (part || "").trim())
      .filter((part) => part.length > 0)
      .join(" ");
  }

  let studentName = loadStudentName();

  const fullNameViewGroup = document.getElementById("profileFullNameView");
  const fullNameDisplay = document.getElementById("profileFullNameDisplay");
  const fullNameEditGroup = document.getElementById("profileFullNameEdit");
  const firstNameInput = document.getElementById("profileFirstName");
  const middleInitialInput = document.getElementById("profileMiddleInitial");
  const lastNameInput = document.getElementById("profileLastName");

  function renderFullNameDisplay() {
    if (fullNameDisplay) {
      fullNameDisplay.textContent = buildFullName(
        studentName.firstName,
        studentName.middleInitial,
        studentName.lastName
      );
    }
  }

  function populateNameEditInputs() {
    if (firstNameInput) firstNameInput.value = studentName.firstName;
    if (middleInitialInput) middleInitialInput.value = studentName.middleInitial;
    if (lastNameInput) lastNameInput.value = studentName.lastName;
  }

  renderFullNameDisplay();
  populateNameEditInputs();

  [firstNameInput, middleInitialInput, lastNameInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      const sanitized = sanitizeNamePart(input.value);
      if (sanitized !== input.value) input.value = sanitized;
    });
  });

  const studentNumberInput = document.getElementById("profileStudentNumber");
  const courseSelect = document.getElementById("profileCourse");
  const yearLevelSelect = document.getElementById("profileYearLevel");
  const sectionSelect = document.getElementById("profileSection");
  const emailInput = document.getElementById("profileEmail");
  const emailError = document.getElementById("emailError");
  const phoneInput = document.getElementById("profilePhone");
  const phoneError = document.getElementById("phoneError");
  const phoneGroup = document.getElementById("profilePhoneGroup");

  if (studentNumberInput) studentNumberInput.value = SAMPLE_STUDENT.studentNumber;
  if (courseSelect) courseSelect.value = studentDetails.course;
  if (yearLevelSelect) yearLevelSelect.value = studentDetails.yearLevel;
  if (sectionSelect) sectionSelect.value = studentDetails.section;
  if (emailInput) emailInput.value = studentDetails.email;
  if (phoneInput) phoneInput.value = studentDetails.phone;

  // ---------------------------------------------------------
  // Phone number formatting -- digits only, auto-hyphenated as
  // 3-3-4 (matches the Philippine mobile format used elsewhere
  // in Prof Consult, e.g. 912-345-6789).
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Field error helpers (same pattern used on Faculty Profile)
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Validation -- required before Save Changes is allowed to
  // apply and exit edit mode.
  // ---------------------------------------------------------
  function validateEmail() {
    const value = emailInput.value.trim();
    // Requires a non-empty local part, an @, a domain with at
    // least one dot, and a TLD of 2+ letters.
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
    // Philippine mobile local part: 9XX-XXX-XXXX (10 digits,
    // starts with 9 -- the digit that follows the +63 prefix).
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

  // ---------------------------------------------------------
  // Burger sidebar (same behavior as the Student Dashboard)
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Quick Action popup (same behavior as the Student Dashboard)
  // ---------------------------------------------------------
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

 

  // ---------------------------------------------------------
  // Notification bell -- navigates to notifications.html, and
  // renders the shared unread-indicator badge (read-only here;
  // only notifications.js clears the state).
  // ---------------------------------------------------------
  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
    if (window.ProfConsultNotifications) {
      window.ProfConsultNotifications.renderBellIndicator(notificationBellButton);
    }
  }

  // ---------------------------------------------------------
  // Edit Profile: toggles all fields except Student Number
  // between read-only and editable. No backend yet, so
  // "Save Changes" validates Email/Phone, then persists the
  // updated values to localStorage and exits edit mode -- the
  // values are ready for a real save call to be wired in later.
  // ---------------------------------------------------------
  const editProfileButton = document.getElementById("editProfileButton");
  const profileInfoCard = document.querySelector(".profile-info-card");
  const profilePhotoEdit = document.getElementById("profilePhotoEdit");

  // Every editable field except Student Number (which stays
  // read-only/disabled at all times, per spec) and the name
  // parts (handled separately below via the view/edit group toggle)
  const editableFields = [courseSelect, yearLevelSelect, sectionSelect, emailInput, phoneInput];

  let isEditing = false;

  function enterEditMode() {
    isEditing = true;
    editableFields.forEach((field) => {
      if (!field) return;
      field.readOnly = false;
      field.disabled = false;
    });

    // Full Name: swap the connected display for the three
    // independently-editable First/Middle/Last inputs, repopulated
    // from the current stored values (not derived by splitting text)
    populateNameEditInputs();
    if (fullNameViewGroup) fullNameViewGroup.hidden = true;
    if (fullNameEditGroup) fullNameEditGroup.hidden = false;

    // Clear any leftover validation state from a previous attempt
    clearFieldError(emailInput, emailError);
    clearFieldError(phoneInput, phoneError, phoneGroup);

    profileInfoCard.classList.add("is-editing");
    profilePhotoEdit.hidden = false;
    editProfileButton.textContent = "Save Changes";
  }

  function exitEditMode() {
    isEditing = false;
    editableFields.forEach((field) => {
      if (!field) return;
      // <select> elements use disabled to lock them (readOnly
      // isn't meaningful on selects); text/email/tel inputs use readOnly
      if (field.tagName === "SELECT") {
        field.disabled = true;
      } else {
        field.readOnly = true;
      }
    });

    // Full Name: save the three parts as the single source of
    // truth, persist them (so the Dashboard greeting stays in
    // sync and this survives a refresh), then rebuild the
    // connected display name from them -- never store a combined
    // string directly.
    studentName = {
      firstName: sanitizeNamePart(firstNameInput ? firstNameInput.value.trim() : studentName.firstName),
      middleInitial: sanitizeNamePart(middleInitialInput ? middleInitialInput.value.trim() : studentName.middleInitial),
      lastName: sanitizeNamePart(lastNameInput ? lastNameInput.value.trim() : studentName.lastName),
    };
    saveStudentName(studentName);
    renderFullNameDisplay();

    // Course/Year Level/Section/Email/Phone: persist so the
    // change survives a refresh (same reasoning as the name above).
    studentDetails = {
      course: courseSelect ? courseSelect.value : studentDetails.course,
      yearLevel: yearLevelSelect ? yearLevelSelect.value : studentDetails.yearLevel,
      section: sectionSelect ? sectionSelect.value : studentDetails.section,
      email: emailInput ? emailInput.value.trim() : studentDetails.email,
      phone: phoneInput ? phoneInput.value.trim() : studentDetails.phone,
    };
    saveStudentDetails(studentDetails);

    if (fullNameEditGroup) fullNameEditGroup.hidden = true;
    if (fullNameViewGroup) fullNameViewGroup.hidden = false;

    profileInfoCard.classList.remove("is-editing");
    profilePhotoEdit.hidden = true;
    editProfileButton.textContent = "Edit Profile";

    // Future: send the updated field values to the backend here
  }

  if (editProfileButton) {
    editProfileButton.addEventListener("click", () => {
      if (isEditing) {
        // Validate before allowing Save Changes to apply and
        // exit edit mode. Invalid fields show an inline error
        // and the page stays in edit mode.
        const isEmailValid = validateEmail();
        const isPhoneValid = validatePhone();
        if (!isEmailValid || !isPhoneValid) {
          return;
        }
        exitEditMode();
      } else {
        enterEditMode();
      }
    });
  }

  // ---------------------------------------------------------
  // Profile photo upload preview -- only reachable while in
  // edit mode, since the edit badge is hidden otherwise
  // ---------------------------------------------------------
  const profilePhotoInput = document.getElementById("profilePhotoInput");
  const profilePhoto = document.getElementById("profilePhoto");

  if (profilePhotoInput && profilePhoto) {
    profilePhotoInput.addEventListener("change", () => {
      const file = profilePhotoInput.files && profilePhotoInput.files[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      profilePhoto.src = previewUrl;

      // Future: upload `file` to the backend and use the
      // returned URL instead of this local preview
    });
  }

});