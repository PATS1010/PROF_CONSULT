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

  const selectedFaculty = getSelectedFaculty();
  const SELECTED_FACULTY_MEMBER = (selectedFaculty && selectedFaculty.fullName)
    ? selectedFaculty.fullName
    : "Selected Faculty Member";

  const COURSE_LABELS = {
    "computer-engineering": "BSCPE (Computer Engineering)",
  };

  const SAMPLE_STUDENT = {
    name: "John Dela Cruz",
    studentId: "24-00001",
    course: "computer-engineering",
    yearLevel: "3",
    section: "A",
  };

  function buildProgramYearDisplay(courseValue, yearLevel, section) {
    const programLabel = COURSE_LABELS[courseValue] || courseValue;
    return `${programLabel} - ${yearLevel}${section}`;
  }

  const facultyMemberInput = document.getElementById("facultyMember");
  const studentNameInput = document.getElementById("studentName");
  const studentIdInput = document.getElementById("studentId");
  const programYearInput = document.getElementById("programYear");

  if (facultyMemberInput) facultyMemberInput.textContent = SELECTED_FACULTY_MEMBER;
  if (studentNameInput) studentNameInput.textContent = SAMPLE_STUDENT.name;
  if (studentIdInput) studentIdInput.textContent = SAMPLE_STUDENT.studentId;
  if (programYearInput) {
    programYearInput.textContent = buildProgramYearDisplay(
      SAMPLE_STUDENT.course,
      SAMPLE_STUDENT.yearLevel,
      SAMPLE_STUDENT.section
    );
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

  const TIME_RANGE_START_MINUTES = 8 * 60;
  const TIME_RANGE_END_MINUTES = 20 * 60;

  function formatHourMinute(totalMinutes) {
    const hour24 = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;
    const period = hour24 < 12 ? "AM" : "PM";
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    const minuteStr = minute.toString().padStart(2, "0");
    return `${hour12}:${minuteStr} ${period}`;
  }

  function buildTimeLabel(startMinutes, endMinutes) {
    return `${formatHourMinute(startMinutes)} \u2013 ${formatHourMinute(endMinutes)}`;
  }

  function buildTimeSlots(rangeStartMinutes, rangeEndMinutes) {
    const slots = [];
    for (let start = rangeStartMinutes; start < rangeEndMinutes; start += 30) {
      slots.push(buildTimeLabel(start, start + 30));
    }
    return slots;
  }

  const TEST_AVAILABLE_TIME_LABELS = [
    buildTimeLabel(13 * 60, 13 * 60 + 30),
    buildTimeLabel(13 * 60 + 30, 14 * 60),
    buildTimeLabel(14 * 60, 14 * 60 + 30),
  ];

  const FACULTY_AVAILABILITY_TEST = {
    availableDaysOfWeek: [1, 3, 5],
    availableTimeSlotsByDay: {
      1: TEST_AVAILABLE_TIME_LABELS,
      3: TEST_AVAILABLE_TIME_LABELS,
      5: TEST_AVAILABLE_TIME_LABELS,
    },
  };

  const DEFAULT_PREVIEW_DAY_OF_WEEK = 1;

  function isDateAvailable(dayOfWeek) {
    return FACULTY_AVAILABILITY_TEST.availableDaysOfWeek.includes(dayOfWeek);
  }

  function getAvailableSlotsForDayOfWeek(dayOfWeek) {
    return FACULTY_AVAILABILITY_TEST.availableTimeSlotsByDay[dayOfWeek] || [];
  }

  const preferredTimeOptions = document.getElementById("preferredTimeOptions");
  if (preferredTimeOptions) {
    buildTimeSlots(TIME_RANGE_START_MINUTES, TIME_RANGE_END_MINUTES).forEach((label) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("data-value", label);
      li.setAttribute("aria-disabled", "false");
      li.textContent = label;
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

  function updateTimeSlotAvailability(availableSlots) {
    if (!preferredTimeOptions) return;
    const availableSet = new Set(availableSlots);
    const options = preferredTimeOptions.querySelectorAll("li[role='option']");

    options.forEach((li) => {
      const label = li.getAttribute("data-value");
      const isAvailable = availableSet.has(label);
      li.classList.toggle("is-unavailable", !isAvailable);
      li.setAttribute("aria-disabled", isAvailable ? "false" : "true");
    });

    const hiddenInput = document.getElementById("preferredTime");
    if (hiddenInput && hiddenInput.value && !availableSet.has(hiddenInput.value)) {
      clearSelectedTime();
    }
  }

  updateTimeSlotAvailability(getAvailableSlotsForDayOfWeek(DEFAULT_PREVIEW_DAY_OF_WEEK));

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

  function setDateErrorState(isError) {
    if (preferredDateInput) preferredDateInput.classList.toggle("is-date-invalid", isError);
    if (preferredDateHint) preferredDateHint.classList.toggle("is-error", isError);
  }

  if (preferredDateInput) {
    preferredDateInput.addEventListener("change", () => {
      const dateValue = preferredDateInput.value;

      if (!dateValue) {
        setDateErrorState(false);
        updateTimeSlotAvailability(getAvailableSlotsForDayOfWeek(DEFAULT_PREVIEW_DAY_OF_WEEK));
        return;
      }

      const dayOfWeek = new Date(`${dateValue}T00:00:00`).getDay();

      if (!isDateAvailable(dayOfWeek)) {
        preferredDateInput.value = "";
        setDateErrorState(true);
        updateTimeSlotAvailability(getAvailableSlotsForDayOfWeek(DEFAULT_PREVIEW_DAY_OF_WEEK));
        clearSelectedTime();
        window.setTimeout(() => setDateErrorState(false), 1200);
        return;
      }

      setDateErrorState(false);
      updateTimeSlotAvailability(getAvailableSlotsForDayOfWeek(dayOfWeek));
    });
  }

  const form = document.getElementById("requestConsultationForm");
  if (form) {
    form.addEventListener("submit", (event) => {
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
        const MY_REQUESTS_KEY = "profconsult_my_requests";
        const existing = JSON.parse(localStorage.getItem(MY_REQUESTS_KEY) || "[]");

        const dateLabel = requestData.preferredDate
          ? new Date(`${requestData.preferredDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })
          : "";
        const timeLabel = requestData.preferredTime ? requestData.preferredTime.split("\u2013")[0].trim() : "";

        existing.unshift({
          title: requestData.purpose || "Consultation",
          date: dateLabel,
          time: timeLabel,
          status: "waiting",
          statusLabel: "Waiting",
        });

        localStorage.setItem(MY_REQUESTS_KEY, JSON.stringify(existing));
      } catch (error) {
      }

      window.location.href = "request-submitted.html";
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
    window.location.href = logoutLink.getAttribute("href") || "login.html";
  });

  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    openModal();
  });

});