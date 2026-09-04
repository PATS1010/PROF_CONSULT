// SYSTEM NOTE: Controls client-side behavior for the faculty profile page, including UI events and API calls.
// =========================================================
// FACULTY PROFILE -- PAGE-SPECIFIC INTERACTIONS
// - View/Edit mode toggle
// - Custom Program dropdown (data-driven, not a native <select>)
// - Name / Email / Phone validation on Save
// - Faculty ID always read-only, never editable
// - Profile photo upload and persistent saved image rendering
//
// Represents the currently logged-in faculty account. It is loaded
// from api/session.php so this page shows the signed-in faculty
// member instead of prototype profile data.
//
// Shared shell behavior (navbar, sidebar, quick action,
// notification bell) lives in faculty-shared.js.
// =========================================================

// ---------------------------------------------------------
const FACULTY_ACCOUNT = {
  name: "",
  facultyId: "",
  program: "",
  email: "",
  phone: "", // local part only; +63 prefix is fixed in the UI
  profilePhoto: "",
};

// Structured so more programs can be added later without
// touching any markup or logic -- just extend this array.
const PROGRAM_OPTIONS = ["Computer Engineering"];
const PROGRAM_LABELS = {
  "computer-engineering": "Computer Engineering",
};

function displayProgramName(value) {
  return PROGRAM_LABELS[value] || value || "";
}

function formatPhoneInput(rawValue) {
  const digits = String(rawValue || "").replace(/\D/g, "").slice(0, 10);
  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 10);
  return [part1, part2, part3].filter(Boolean).join("-");
}

function applySessionProfile(sessionData) {
  const user = sessionData && sessionData.user ? sessionData.user : {};
  const profile = sessionData && sessionData.profile ? sessionData.profile : {};
  const department = displayProgramName(profile.Department || profile.department || "");

  FACULTY_ACCOUNT.name = user.name || "";
  FACULTY_ACCOUNT.facultyId = user.username || "";
  FACULTY_ACCOUNT.program = department || "Computer Engineering";
  FACULTY_ACCOUNT.email = user.email || "";
  FACULTY_ACCOUNT.phone = formatPhoneInput(user.phone || "");
  FACULTY_ACCOUNT.profilePhoto = user.profile_photo || "";

  if (FACULTY_ACCOUNT.program && !PROGRAM_OPTIONS.includes(FACULTY_ACCOUNT.program)) {
    PROGRAM_OPTIONS.push(FACULTY_ACCOUNT.program);
  }
}

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Element references
  // ---------------------------------------------------------
  const editProfileButton = document.getElementById("editProfileButton");

  const viewSection = document.getElementById("facultyProfileView");
  const editForm = document.getElementById("facultyProfileEdit");

  const viewName = document.getElementById("viewFacultyName");
  const viewId = document.getElementById("viewFacultyId");
  const viewProgram = document.getElementById("viewFacultyProgram");
  const viewEmail = document.getElementById("viewFacultyEmail");
  const viewPhone = document.getElementById("viewFacultyPhone");

  const nameInput = document.getElementById("editFacultyName");
  const nameError = document.getElementById("nameError");
  const idInput = document.getElementById("editFacultyId");
  const emailInput = document.getElementById("editFacultyEmail");
  const emailError = document.getElementById("emailError");
  const phoneInput = document.getElementById("editFacultyPhone");
  const phoneError = document.getElementById("phoneError");
  const phoneWrap = phoneInput ? phoneInput.closest(".faculty-phone-input-wrap") : null;
  const facultyProfilePhoto = document.getElementById("facultyProfilePhoto");
  const facultyProfilePhotoEdit = document.getElementById("facultyProfilePhotoEdit");
  const facultyProfilePhotoInput = document.getElementById("facultyProfilePhotoInput");

  const programDropdown = document.getElementById("programDropdown");
  const programTrigger = document.getElementById("programDropdownTrigger");
  const programValueEl = document.getElementById("programDropdownValue");
  const programList = document.getElementById("programDropdownList");

  const saveButton = document.getElementById("saveProfileButton");
  const saveSuccessMessage = document.getElementById("saveSuccessMessage");

  let selectedProgram = FACULTY_ACCOUNT.program;

  // ---------------------------------------------------------
  // Render the account's current data into view mode
  // ---------------------------------------------------------
  function renderViewMode() {
    viewName.textContent = FACULTY_ACCOUNT.name;
    viewId.textContent = FACULTY_ACCOUNT.facultyId;
    viewProgram.textContent = FACULTY_ACCOUNT.program;
    viewEmail.textContent = FACULTY_ACCOUNT.email;
    viewPhone.textContent = FACULTY_ACCOUNT.phone ? `+63 ${FACULTY_ACCOUNT.phone}` : "";
    if (facultyProfilePhoto && FACULTY_ACCOUNT.profilePhoto) {
      facultyProfilePhoto.src = `${FACULTY_ACCOUNT.profilePhoto}?v=${Date.now()}`;
    }
  }

  async function uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append("profile_photo", file);

    const response = await fetch("api/profile-photo.php", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.ok || !data.profile_photo) {
      throw new Error(data.message || "Unable to save profile photo.");
    }

    return data.profile_photo;
  }

  async function loadCurrentFacultyProfile() {
    try {
      const response = await fetch("api/session.php?role=faculty", {
        cache: "no-store",
        headers: { "Accept": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Session unavailable");
      }

      const data = await response.json();
      if (!data.ok || !data.user || data.user.role !== "faculty") {
        throw new Error("Faculty session unavailable");
      }

      applySessionProfile(data);
      selectedProgram = FACULTY_ACCOUNT.program;
      renderViewMode();
    } catch (error) {
      window.location.href = "faculty-login.html";
    }
  }

  loadCurrentFacultyProfile();

  // ---------------------------------------------------------
  // Program dropdown -- built from PROGRAM_OPTIONS so future
  // programs can be added just by extending that array.
  // ---------------------------------------------------------
  function renderProgramOptions() {
    programList.innerHTML = "";
    PROGRAM_OPTIONS.forEach((program) => {
      const li = document.createElement("li");
      li.className = "faculty-dropdown-option";
      li.setAttribute("role", "option");
      li.dataset.value = program;
      li.textContent = program;
      if (program === selectedProgram) {
        li.classList.add("is-selected");
        li.setAttribute("aria-selected", "true");
      } else {
        li.setAttribute("aria-selected", "false");
      }
      programList.appendChild(li);
    });
  }

  function openProgramDropdown() {
    renderProgramOptions();
    programList.hidden = false;
    requestAnimationFrame(() => programList.classList.add("is-open"));
    programTrigger.setAttribute("aria-expanded", "true");
  }

  function closeProgramDropdown() {
    programList.classList.remove("is-open");
    programTrigger.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      programList.hidden = true;
    }, 150); // matches the dropdown's CSS transition duration
  }

  if (programTrigger) {
    programTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = programList.classList.contains("is-open");
      if (isOpen) {
        closeProgramDropdown();
      } else {
        openProgramDropdown();
      }
    });
  }

  if (programList) {
    programList.addEventListener("click", (event) => {
      const option = event.target.closest(".faculty-dropdown-option");
      if (!option) return;
      selectedProgram = option.dataset.value;
      programValueEl.textContent = selectedProgram;
      closeProgramDropdown();
    });
  }

  document.addEventListener("click", (event) => {
    if (
      programDropdown &&
      !programList.hidden &&
      !programDropdown.contains(event.target)
    ) {
      closeProgramDropdown();
    }
  });

  // ---------------------------------------------------------
  // Phone number formatting -- digits only, auto-hyphenated
  // as 3-3-4 (matches the Philippine mobile format used
  // elsewhere in Prof Consult, e.g. 912-345-6789).
  // ---------------------------------------------------------
  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatPhoneInput(phoneInput.value);
    });
  }

  // ---------------------------------------------------------
  // Validation
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

  function validateName() {
    const value = nameInput.value.trim();
    if (value === "") {
      showFieldError(nameInput, nameError, "Faculty name cannot be empty.");
      return false;
    }
    clearFieldError(nameInput, nameError);
    return true;
  }

  function validateEmail() {
    const value = emailInput.value.trim();
    // Requires a non-empty local part, an @, a domain with at
    // least one dot, and a TLD of 2+ letters -- rejects
    // "john.example.com", "john@", "@gmail.com", and empty values.
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
    // starts with 9 -- the digit that follows the +63 prefix
    // on a standard PH mobile number).
    const phonePattern = /^9\d{2}-\d{3}-\d{4}$/;
    if (!phonePattern.test(value)) {
      showFieldError(
        phoneInput,
        phoneError,
        "Enter a valid Philippine mobile number (e.g. 912-345-6789).",
        phoneWrap
      );
      return false;
    }
    clearFieldError(phoneInput, phoneError, phoneWrap);
    return true;
  }

  // ---------------------------------------------------------
  // Enter / exit edit mode
  // ---------------------------------------------------------
  function enterEditMode() {
    // Populate the edit form from the current account data
    nameInput.value = FACULTY_ACCOUNT.name;
    idInput.value = FACULTY_ACCOUNT.facultyId; // display only, never submitted as editable
    selectedProgram = FACULTY_ACCOUNT.program;
    programValueEl.textContent = selectedProgram;
    emailInput.value = FACULTY_ACCOUNT.email;
    phoneInput.value = FACULTY_ACCOUNT.phone;

    clearFieldError(nameInput, nameError);
    clearFieldError(emailInput, emailError);
    clearFieldError(phoneInput, phoneError, phoneWrap);

    if (saveSuccessMessage) {
      saveSuccessMessage.classList.remove("is-visible");
      saveSuccessMessage.hidden = true;
    }

    viewSection.hidden = true;
    editForm.hidden = false;
    editProfileButton.hidden = true;
    if (facultyProfilePhotoEdit) facultyProfilePhotoEdit.hidden = false;
  }

  function exitEditMode() {
    editForm.hidden = true;
    viewSection.hidden = false;
    editProfileButton.hidden = false;
    if (facultyProfilePhotoEdit) facultyProfilePhotoEdit.hidden = true;
    closeProgramDropdown();
  }

  if (editProfileButton) {
    editProfileButton.addEventListener("click", enterEditMode);
  }

  // ---------------------------------------------------------
  // Save -- validates all fields; only applies and exits edit
  // mode if everything passes. Faculty ID is never read from
  // the form (it's read-only and never changes).
  // ---------------------------------------------------------
  function handleSave() {
    // Do nothing if not currently editing -- Save only acts on
    // the edit form's values.
    if (editForm.hidden) return;

    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPhoneValid = validatePhone();

    if (!isNameValid || !isEmailValid || !isPhoneValid) {
      // Keep edit mode active; validation feedback is already
      // shown inline on the offending field(s).
      return;
    }

    FACULTY_ACCOUNT.name = nameInput.value.trim();
    FACULTY_ACCOUNT.program = selectedProgram;
    FACULTY_ACCOUNT.email = emailInput.value.trim();
    FACULTY_ACCOUNT.phone = phoneInput.value.trim();
    // FACULTY_ACCOUNT.facultyId intentionally left untouched --
    // the Faculty ID field is never a source of updates.

    renderViewMode();
    exitEditMode();

    if (saveSuccessMessage) {
      saveSuccessMessage.hidden = false;
      requestAnimationFrame(() => saveSuccessMessage.classList.add("is-visible"));
      window.setTimeout(() => {
        saveSuccessMessage.classList.remove("is-visible");
        window.setTimeout(() => {
          saveSuccessMessage.hidden = true;
        }, 250);
      }, 2500);
    }
  }

  if (saveButton) {
    saveButton.addEventListener("click", handleSave);
  }

  if (facultyProfilePhotoInput && facultyProfilePhoto) {
    facultyProfilePhotoInput.addEventListener("change", async () => {
      const file = facultyProfilePhotoInput.files && facultyProfilePhotoInput.files[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      facultyProfilePhoto.src = previewUrl;

      try {
        const savedPhoto = await uploadProfilePhoto(file);
        FACULTY_ACCOUNT.profilePhoto = savedPhoto;
        facultyProfilePhoto.src = `${savedPhoto}?v=${Date.now()}`;
      } catch (error) {
        alert(error.message);
        renderViewMode();
      } finally {
        URL.revokeObjectURL(previewUrl);
        facultyProfilePhotoInput.value = "";
      }
    });
  }

});
