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
    "computer-engineering": "Computer Engineering",
    "civil-engineering": "Civil Engineering",
    "electronics-engineering": "Electronics Engineering",
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

    const response = await fetch("api/get-faculty-directory.php", {
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
    if (raw.includes("civil")) return "civil-engineering";
    if (raw.includes("electronics")) return "electronics-engineering";
    return value || "";
  }

  fetch("api/get-current-session.php?role=student", {
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
      window.location.replace("login.html");
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
      const isAvailable = slot.available === true && !slot.taken;
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("data-value", slot.value || slot.label);
      li.setAttribute("aria-disabled", isAvailable ? "false" : "true");
      li.textContent = slot.taken
        ? `${slot.label} (Taken)`
        : slot.available === true
          ? slot.label
          : `${slot.label} (Unavailable)`;
      li.classList.toggle("is-unavailable", !isAvailable);
      li.classList.toggle("is-available", isAvailable);
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

  let scheduleVersion = 0;
  let scheduleRefreshing = false;
  async function loadFacultySchedule(dateValue, preserveSelection = false) {
    const version = ++scheduleVersion;
    if (!selectedFaculty || !selectedFaculty.id) {
      renderTimeOptions([]);
      setHint("Please choose a professor first.", true);
      return null;
    }

    const params = new URLSearchParams({ faculty_id: String(selectedFaculty.id) });
    if (dateValue) params.set("date", dateValue);

    const response = await fetch(`api/get-faculty-schedule.php?${params.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to load this professor's schedule.");
    }
    if (version !== scheduleVersion) return null;

    availableDayNumbers = Array.isArray(result.days) && result.days.length
      ? result.days.map(Number)
      : [];
    setHint(formatDayHint(result.day_names || []), false);

    if (dateValue) {
      const selectedTime = document.getElementById("preferredTime")?.value || "";
      const optionsScrollTop = preferredTimeOptions?.scrollTop || 0;
      const stillAvailable = preserveSelection && (result.slots || []).some((slot) =>
        (slot.value || slot.label) === selectedTime && slot.available === true && !slot.taken);
      renderTimeOptions(result.slots || []);
      if (preserveSelection && preferredTimeOptions) preferredTimeOptions.scrollTop = optionsScrollTop;
      if (stillAvailable) {
        preferredTimeOptions?.querySelectorAll("li").forEach((option) => {
          option.classList.toggle("is-active", option.dataset.value === selectedTime);
        });
      } else clearSelectedTime();
      if (result.message) setHint(result.message, true);
      if (!result.message && !(result.slots || []).some((slot) => slot.available === true && !slot.taken)) {
        setHint("This professor has no available slots on this date.", true);
      }
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

  function refreshMinimumDate() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const part = (type) => parts.find((item) => item.type === type).value;
    preferredDateInput.min = `${part("year")}-${part("month")}-${part("day")}`;
  }

  function rejectPastDate() {
    refreshMinimumDate();
    if (preferredDateInput.value && preferredDateInput.value < preferredDateInput.min) {
      preferredDateInput.value = "";
      setHint("Please select today or a future date. Past dates are not allowed.", true);
      renderTimeOptions([]);
      clearSelectedTime();
      return true;
    }
    return false;
  }

  if (preferredDateInput) {
    refreshMinimumDate();
    preferredDateInput.addEventListener("focus", refreshMinimumDate);

    preferredDateInput.addEventListener("change", async () => {
      scheduleVersion++;
      if (rejectPastDate()) return;
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
        setHint("Consultations cannot be scheduled on Sunday. Please select Monday to Saturday.", true);
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

  async function refreshCurrentSchedule() {
    if (document.hidden || scheduleRefreshing || !selectedFaculty?.id) return;
    scheduleRefreshing = true;
    try {
      await loadFacultySchedule(preferredDateInput?.value || "", true);
    } catch (_) {
      // Keep the last confirmed schedule until the connection returns.
    } finally {
      scheduleRefreshing = false;
    }
  }
  window.setInterval(refreshCurrentSchedule, 5000);
  window.addEventListener("focus", refreshCurrentSchedule);
  document.addEventListener("visibilitychange", refreshCurrentSchedule);
  window.addEventListener("storage", (event) => {
    if (event.key === "profconsult_faculty_available_hours") refreshCurrentSchedule();
  });

  const form = document.getElementById("requestConsultationForm");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (rejectPastDate()) {
        preferredDateInput.focus();
        return;
      }
      if (!preferredDateInput.value || !document.getElementById("preferredTime").value) {
        window.alert("Please select a date and time before submitting.");
        return;
      }

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
        const response = await fetch("api/create-consultation-request.php", {
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
    window.location.replace(redirectPage);
  });

  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    openModal();
  });

});
