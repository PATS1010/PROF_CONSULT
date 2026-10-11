// Request Consultation JS
document.addEventListener("DOMContentLoaded", () => {

  const SELECTED_FACULTY_STORAGE_KEY = "profconsult_selected_faculty";

  function getSelectedFaculty() {
    try {
      const stored = sessionStorage.getItem(SELECTED_FACULTY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  let selectedFaculty = getSelectedFaculty();

  function requestedFacultyId() {
    return new URLSearchParams(window.location.search).get("facultyId");
  }

  function setSelectedFaculty(faculty) {
    selectedFaculty = faculty;
    if (facultyMemberInput) {
      facultyMemberInput.textContent = faculty && faculty.fullName
        ? faculty.fullName
        : "Selected Faculty Member";
    }
    try {
      if (faculty) {
        sessionStorage.setItem(SELECTED_FACULTY_STORAGE_KEY, JSON.stringify(faculty));
      }
    } catch (error) {
    }
  }

  const COURSE_LABELS = {
    "computer-engineering": "BSCPE (Computer Engineering)",
  };

  function buildProgramYearDisplay(courseValue, yearLevel, section) {
    const programLabel = COURSE_LABELS[courseValue] || courseValue;
    return `${programLabel} - ${yearLevel}${section}`;
  }

  const facultyMemberInput = document.getElementById("facultyMember");
  const studentNameInput = document.getElementById("studentName");
  const studentIdInput = document.getElementById("studentId");
  const programYearInput = document.getElementById("programYear");

  setSelectedFaculty(selectedFaculty);

  async function loadSelectedFacultyFromUrl() {
    const facultyId = requestedFacultyId();
    if (!facultyId) {
      return selectedFaculty;
    }

    const response = await fetch("api/faculty-directory.php", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok || !Array.isArray(result.faculty)) {
      throw new Error(result.message || "Unable to load the selected professor.");
    }

    const record = result.faculty.find((faculty) => String(faculty.Faculty_ID) === String(facultyId));
    if (!record) {
      throw new Error("Selected professor was not found.");
    }

    setSelectedFaculty({
      id: String(record.Faculty_ID),
      fullName: record.Full_Name || "Selected Faculty Member",
      program: record.Department || "Faculty",
      office: record.Office || "",
      photo: record.Profile_Photo || "images/user.png",
    });
    return selectedFaculty;
  }

  function normalizeProgramValue(value) {
    const raw = String(value || "").toLowerCase();
    if (raw.includes("computer")) return "computer-engineering";
    return value || "";
  }

  fetch("api/session.php?role=student", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((result) => {
      const user = result.user || {};
      const profile = result.profile || {};
      if (studentNameInput) studentNameInput.textContent = user.name || "";
      if (studentIdInput) studentIdInput.textContent = user.username || "";
      if (programYearInput) {
        programYearInput.textContent = buildProgramYearDisplay(
          normalizeProgramValue(profile.Program || profile.program || ""),
          profile.Year_Level || profile.year_level || "",
          profile.Section || profile.section || ""
        );
      }
    })
    .catch(() => {
      window.location.href = "login.html";
    });

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

  const MONDAY_TO_SATURDAY = [1, 2, 3, 4, 5, 6];
  let availableDayNumbers = MONDAY_TO_SATURDAY.slice();

  const preferredTimeOptions = document.getElementById("preferredTimeOptions");
  function renderTimeOptions(slots) {
    if (!preferredTimeOptions) return;
    preferredTimeOptions.innerHTML = "";

    if (!slots.length) {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("aria-disabled", "true");
      li.className = "is-unavailable";
      li.textContent = "No available slots";
      preferredTimeOptions.appendChild(li);
      return;
    }

    slots.forEach((slot) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("data-value", slot.value || slot.label);
      li.setAttribute("aria-disabled", slot.taken ? "true" : "false");
      li.textContent = slot.taken ? `${slot.label} (Taken)` : slot.label;
      li.classList.toggle("is-unavailable", !!slot.taken);
      preferredTimeOptions.appendChild(li);
    });
  }

  function clearSelectedTime() {
    const timeSelectEl = document.getElementById("preferredTimeSelect");
    if (!timeSelectEl) return;
    const valueLabelEl = timeSelectEl.querySelector(".custom-select-value");
    const hiddenInputEl = timeSelectEl.querySelector('input[type="hidden"]');
    if (valueLabelEl) {
      valueLabelEl.textContent = "Select Time";
      valueLabelEl.setAttribute("data-is-placeholder", "true");
    }
    if (hiddenInputEl) hiddenInputEl.value = "";
    timeSelectEl.querySelectorAll("li.is-active").forEach((li) => li.classList.remove("is-active"));
  }

  function setHint(text, isError) {
    const preferredDateInput = document.getElementById("preferredDate");
    const preferredDateHint = document.getElementById("preferredDateHint");
    if (preferredDateHint) preferredDateHint.textContent = text;
    if (preferredDateInput) preferredDateInput.classList.toggle("is-date-invalid", !!isError);
    if (preferredDateHint) preferredDateHint.classList.toggle("is-error", !!isError);
  }

  function formatDayHint(dayNames) {
    return dayNames.length
      ? `Available days: ${dayNames.join(", ")}`
      : "No available days set by this professor yet.";
  }

  async function loadFacultySchedule(dateValue) {
    if (!selectedFaculty || !selectedFaculty.id) {
      renderTimeOptions([]);
      setHint("Please choose a professor first.", true);
      return null;
    }

    const params = new URLSearchParams({ faculty_id: String(selectedFaculty.id) });
    if (dateValue) params.set("date", dateValue);

    const response = await fetch(`api/faculty-schedule.php?${params.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to load this professor's schedule.");
    }

    availableDayNumbers = Array.isArray(result.days) && result.days.length
      ? result.days.map(Number)
      : [];
    setHint(formatDayHint(result.day_names || []), false);

    if (dateValue) {
      renderTimeOptions(result.slots || []);
      clearSelectedTime();
      if (result.message) setHint(result.message, true);
    }

    return result;
  }

  const timeSelect = document.getElementById("preferredTimeSelect");

  if (timeSelect) {
    const trigger = timeSelect.querySelector(".custom-select-trigger");
    const valueLabel = timeSelect.querySelector(".custom-select-value");
    const optionsList = timeSelect.querySelector(".custom-select-options");
    const hiddenInput = timeSelect.querySelector('input[type="hidden"]');

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = timeSelect.classList.contains("is-open");

      if (isOpen) {
        timeSelect.classList.remove("is-open");
        optionsList.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      } else {
        timeSelect.classList.add("is-open");
        optionsList.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    optionsList.addEventListener("click", (event) => {
      const option = event.target.closest("li[role='option']");
      if (!option) return;
      if (option.classList.contains("is-unavailable")) return;

      optionsList.querySelectorAll("li").forEach((li) => li.classList.remove("is-active"));
      option.classList.add("is-active");

      valueLabel.textContent = option.textContent;
      valueLabel.removeAttribute("data-is-placeholder");
      hiddenInput.value = option.getAttribute("data-value");

      timeSelect.classList.remove("is-open");
      optionsList.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", () => {
      timeSelect.classList.remove("is-open");
      optionsList.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    });
  }

  const preferredDateInput = document.getElementById("preferredDate");
  const preferredDateHint = document.getElementById("preferredDateHint");

  renderTimeOptions([]);
  loadSelectedFacultyFromUrl()
    .then(() => loadFacultySchedule(""))
    .catch((error) => {
      renderTimeOptions([]);
      setHint(error.message || "Unable to load this professor's schedule.", true);
    });

  function setDateErrorState(isError) {
    if (preferredDateInput) preferredDateInput.classList.toggle("is-date-invalid", isError);
    if (preferredDateHint) preferredDateHint.classList.toggle("is-error", isError);
  }

  if (preferredDateInput) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const localYear = today.getFullYear();
    const localMonth = String(today.getMonth() + 1).padStart(2, "0");
    const localDay = String(today.getDate()).padStart(2, "0");
    preferredDateInput.min = `${localYear}-${localMonth}-${localDay}`;

    preferredDateInput.addEventListener("change", async () => {
      const dateValue = preferredDateInput.value;

      if (!dateValue) {
        setDateErrorState(false);
        renderTimeOptions([]);
        clearSelectedTime();
        return;
      }

      const dayOfWeek = new Date(`${dateValue}T00:00:00`).getDay();
      const isoDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (!MONDAY_TO_SATURDAY.includes(isoDay)) {
        preferredDateInput.value = "";
        setHint("Please select a date from Monday to Saturday.", true);
        clearSelectedTime();
        window.setTimeout(() => setDateErrorState(false), 1200);
        return;
      }

      if (availableDayNumbers.length && !availableDayNumbers.includes(isoDay)) {
        preferredDateInput.value = "";
        setHint("This professor is not available on that day.", true);
        clearSelectedTime();
        window.setTimeout(() => setDateErrorState(false), 1200);
        return;
      }

      try {
        await loadFacultySchedule(dateValue);
      } catch (error) {
        setHint(error.message || "Unable to load available times.", true);
        renderTimeOptions([]);
      }
    });
  }

  const form = document.getElementById("requestConsultationForm");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const requestId = `REQ-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const requestData = {
        requestId,
        facultyMember: facultyMemberInput.textContent,
        studentName: studentNameInput.textContent,
        studentId: studentIdInput.textContent,
        programYear: programYearInput.textContent,
        purpose: document.getElementById("consultationPurpose").value,
        message: document.getElementById("additionalMessage").value,
        preferredDate: document.getElementById("preferredDate").value,
        preferredTime: document.getElementById("preferredTime").value,
        status: "Pending Approval",
      };

      sessionStorage.setItem("profconsult_last_request", JSON.stringify(requestData));

      try {
        const response = await fetch("api/submit-consultation.php", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            faculty_id: Number(selectedFaculty && selectedFaculty.id),
            purpose: requestData.purpose,
            message: requestData.message,
            preferred_date: requestData.preferredDate,
            preferred_time: requestData.preferredTime,
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Unable to submit consultation request.");
        }
        requestData.requestId = result.id || requestData.requestId;
        sessionStorage.setItem("profconsult_last_request", JSON.stringify(requestData));
        window.location.href = "request-submitted.html";
      } catch (error) {
        window.alert(error.message || "Unable to submit consultation request.");
      }
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
