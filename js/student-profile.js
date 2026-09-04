// SYSTEM NOTE: Controls client-side behavior for the student profile page, including UI events and API calls.
// =========================================================
// STUDENT PROFILE PAGE INTERACTIONS
// - Burger menu + Quick Action: same behavior as the Dashboard
// - Populates profile fields from api/session.php so the page
//   shows the currently logged-in student.
// - Edit Profile: toggles all fields except Student Number
//   into an editable state; "Save Changes" exits edit mode.
// - Profile photo: clicking the edit badge (visible only in
//   edit mode) opens a file picker, uploads it, and shows the
//   saved image returned by the backend.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Current student profile state. The loader below fills this
  // object from the PHP session response, then the renderer copies
  // it into the visible form fields.
  // ---------------------------------------------------------
  const CURRENT_STUDENT = {
    fullName: "",
    studentNumber: "",
    course: "",
    yearLevel: "",
    email: "",
    phone: "",
    profilePhoto: "",
  };

  const COURSE_LABELS = {
    "computer-engineering": "BSCPE (Computer Engineering)",
  };

  function formatPhoneInput(rawValue) {
    const digits = String(rawValue || "").replace(/\D/g, "").slice(0, 10);
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6, 10);
    return [part1, part2, part3].filter(Boolean).join("-");
  }

  function ensureCourseOption(courseValue) {
    if (!courseSelect || !courseValue) return;

    const hasOption = Array.from(courseSelect.options).some((option) => {
      return option.value === courseValue;
    });

    if (!hasOption) {
      const option = document.createElement("option");
      option.value = courseValue;
      option.textContent = COURSE_LABELS[courseValue] || courseValue;
      courseSelect.appendChild(option);
    }
  }

  const fullNameInput = document.getElementById("profileFullName");
  const studentNumberInput = document.getElementById("profileStudentNumber");
  const courseSelect = document.getElementById("profileCourse");
  const yearLevelSelect = document.getElementById("profileYearLevel");
  const emailInput = document.getElementById("profileEmail");
  const phoneInput = document.getElementById("profilePhone");
  const profilePhoto = document.getElementById("profilePhoto");

  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatPhoneInput(phoneInput.value);
    });
  }

  function applySessionProfile(sessionData) {
    const user = sessionData && sessionData.user ? sessionData.user : {};
    const profile = sessionData && sessionData.profile ? sessionData.profile : {};

    CURRENT_STUDENT.fullName = user.name || "";
    CURRENT_STUDENT.studentNumber = user.username || "";
    CURRENT_STUDENT.course = profile.Program || profile.program || "";
    CURRENT_STUDENT.yearLevel = String(profile.Year_Level || profile.year_level || "");
    CURRENT_STUDENT.email = user.email || "";
    CURRENT_STUDENT.phone = formatPhoneInput(user.phone || "");
    CURRENT_STUDENT.profilePhoto = user.profile_photo || "";
  }

  function renderStudentProfile() {
    ensureCourseOption(CURRENT_STUDENT.course);

    if (fullNameInput) fullNameInput.value = CURRENT_STUDENT.fullName;
    if (studentNumberInput) studentNumberInput.value = CURRENT_STUDENT.studentNumber;
    if (courseSelect) courseSelect.value = CURRENT_STUDENT.course;
    if (yearLevelSelect) yearLevelSelect.value = CURRENT_STUDENT.yearLevel;
    if (emailInput) emailInput.value = CURRENT_STUDENT.email;
    if (phoneInput) phoneInput.value = CURRENT_STUDENT.phone;
    if (profilePhoto && CURRENT_STUDENT.profilePhoto) {
      profilePhoto.src = `${CURRENT_STUDENT.profilePhoto}?v=${Date.now()}`;
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

  async function loadCurrentStudentProfile() {
    try {
      // api/session.php reads the active PHP session and returns
      // both the shared user row and the student-specific profile row.
      const response = await fetch("api/session.php?role=student", {
        cache: "no-store",
        headers: { "Accept": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Session unavailable");
      }

      const data = await response.json();
      if (!data.ok || !data.user || data.user.role !== "student") {
        throw new Error("Student session unavailable");
      }

      // Convert the API fields into the shape used by this page,
      // then render the current student in every profile input.
      applySessionProfile(data);
      renderStudentProfile();
    } catch (error) {
      window.location.href = "student-login.html";
    }
  }

  loadCurrentStudentProfile();

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

  // "Send Request" doesn't have a destination page yet --
  // left wired up but intentionally not navigating anywhere
  const requestConsultationButton = document.getElementById("requestConsultationButton");
  if (requestConsultationButton) {
    requestConsultationButton.addEventListener("click", (event) => {
      event.preventDefault();
      // Future: navigate to the consultation request page once it exists
    });
  }

  // ---------------------------------------------------------
  // Notification bell -- clickable placeholder, no
  // functionality implemented yet
  // ---------------------------------------------------------
  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      // Intentionally left empty -- functionality comes later
    });
  }

  // ---------------------------------------------------------
  // Edit Profile: toggles all fields except Student Number
  // between read-only and editable. No backend yet, so
  // "Save Changes" just exits edit mode -- the values already
  // live on the page's own inputs, ready for a real save call
  // to be wired in later.
  // ---------------------------------------------------------
  const editProfileButton = document.getElementById("editProfileButton");
  const profileInfoCard = document.querySelector(".profile-info-card");
  const profilePhotoEdit = document.getElementById("profilePhotoEdit");

  // Every editable field except Student Number (which stays
  // read-only/disabled at all times, per spec)
  const editableFields = [fullNameInput, courseSelect, yearLevelSelect, emailInput, phoneInput];

  let isEditing = false;

  function enterEditMode() {
    isEditing = true;
    editableFields.forEach((field) => {
      if (!field) return;
      field.readOnly = false;
      field.disabled = false;
    });
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
    profileInfoCard.classList.remove("is-editing");
    profilePhotoEdit.hidden = true;
    editProfileButton.textContent = "Edit Profile";

    // Keep the in-page state aligned with edits. A later backend
    // update endpoint can use this same object as its request body.
    CURRENT_STUDENT.fullName = fullNameInput ? fullNameInput.value.trim() : CURRENT_STUDENT.fullName;
    CURRENT_STUDENT.course = courseSelect ? courseSelect.value : CURRENT_STUDENT.course;
    CURRENT_STUDENT.yearLevel = yearLevelSelect ? yearLevelSelect.value : CURRENT_STUDENT.yearLevel;
    CURRENT_STUDENT.email = emailInput ? emailInput.value.trim() : CURRENT_STUDENT.email;
    CURRENT_STUDENT.phone = phoneInput ? formatPhoneInput(phoneInput.value) : CURRENT_STUDENT.phone;
    renderStudentProfile();
  }

  if (editProfileButton) {
    editProfileButton.addEventListener("click", () => {
      if (isEditing) {
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

  if (profilePhotoInput && profilePhoto) {
    profilePhotoInput.addEventListener("change", async () => {
      const file = profilePhotoInput.files && profilePhotoInput.files[0];
      if (!file) return;

      const previewUrl = URL.createObjectURL(file);
      profilePhoto.src = previewUrl;

      try {
        const savedPhoto = await uploadProfilePhoto(file);
        CURRENT_STUDENT.profilePhoto = savedPhoto;
        profilePhoto.src = `${savedPhoto}?v=${Date.now()}`;
      } catch (error) {
        alert(error.message);
        renderStudentProfile();
      } finally {
        URL.revokeObjectURL(previewUrl);
        profilePhotoInput.value = "";
      }
    });
  }

});
