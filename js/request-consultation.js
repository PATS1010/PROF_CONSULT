// =========================================================
// REQUEST CONSULTATION PAGE INTERACTIONS
// - Burger menu + Quick Action + Notification bell: same
//   behavior as the Dashboard / Faculty Directory. Bell also
//   renders the shared unread-indicator badge (see
//   notification-state.js / window.ProfConsultNotifications)
// - Faculty Member auto-fills from the professor the student
//   selected in the Faculty Directory (handed off via
//   sessionStorage from faculty-directory.js) -- never
//   hardcoded to a specific professor
// - Student Name/ID/Program & Year auto-fill from sample
//   student data (structured so it's easy to swap for the
//   real logged-in student once the backend exists)
// - Preferred Time: custom dropdown populated with every
//   30-minute slot from 8:00 AM to 8:00 PM
// - Faculty availability (FRONTEND TEST DATA ONLY): dates and
//   times outside the test faculty's availability stay visible
//   but grayed out and unselectable; see FACULTY_AVAILABILITY_TEST
// - Submit Request -> request-submitted.html
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Selected faculty -- set by faculty-directory.js
  // (sessionStorage) when the student clicks "Request
  // Consultation" on a professor's profile. There is no
  // backend yet, so sessionStorage is the frontend-only
  // hand-off mechanism; this page never hardcodes a specific
  // professor. Falls back to a neutral placeholder only if
  // the student somehow lands here without selecting anyone
  // (e.g. navigating here directly).
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Sample student data -- replace with the logged-in
  // student's real record once the backend exists.
  //
  // course / yearLevel / section deliberately use the same
  // field names and values as Student Profile's own sample
  // data (see student-profile.js: SAMPLE_STUDENT.course,
  // .yearLevel, .section) so that once Student Profile shares
  // its data somewhere accessible (e.g. the same sessionStorage
  // hand-off pattern used for Selected Faculty above, or a real
  // backend), this object can be replaced with that shared data
  // without changing how Program & Year is built below.
  // Student Profile itself has not been modified to expose this
  // data yet -- that wasn't requested.
  // ---------------------------------------------------------
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

  // Builds "<Program Label> - <Year><Section>", e.g.
  // "BSCPE (Computer Engineering) - 3A". Never hardcode the
  // combined string -- always derive it from the year/section values.
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
  // Preferred Time: build every 30-minute slot from 8:00 AM to
  // 8:00 PM (8:00 AM - 8:30 AM, 8:30 AM - 9:00 AM, ... through
  // 7:30 PM - 8:00 PM), then populate the dropdown.
  // ---------------------------------------------------------
  const TIME_RANGE_START_MINUTES = 8 * 60;   // 8:00 AM
  const TIME_RANGE_END_MINUTES = 20 * 60;    // 8:00 PM

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

  // ---------------------------------------------------------
  // FRONTEND TEST/DEMO faculty availability data ONLY.
  // There is no backend yet -- this stands in for the real
  // per-faculty availability schedule and is deliberately kept
  // in one small, swappable object so it can later be replaced
  // with real data (e.g. fetched per selected faculty) without
  // touching the dropdown-building or date-validation logic
  // below, which just read from this object.
  //
  // Test faculty is available:
  //   Days: Monday, Wednesday, Friday
  //   Time: 1:00 PM - 2:30 PM (three 30-minute slots)
  // ---------------------------------------------------------
  const TEST_AVAILABLE_TIME_LABELS = [
    buildTimeLabel(13 * 60, 13 * 60 + 30),       // 1:00 PM - 1:30 PM
    buildTimeLabel(13 * 60 + 30, 14 * 60),       // 1:30 PM - 2:00 PM
    buildTimeLabel(14 * 60, 14 * 60 + 30),       // 2:00 PM - 2:30 PM
  ];

  // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday,
  // 4 = Thursday, 5 = Friday, 6 = Saturday
  const FACULTY_AVAILABILITY_TEST = {
    availableDaysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
    availableTimeSlotsByDay: {
      1: TEST_AVAILABLE_TIME_LABELS,
      3: TEST_AVAILABLE_TIME_LABELS,
      5: TEST_AVAILABLE_TIME_LABELS,
    },
  };

  // Used to preview time-slot availability before a date is
  // chosen. All currently-available days share the same test
  // time slots, so Monday's set doubles as the default preview.
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

  // Clears the current time selection back to the placeholder --
  // used whenever the previously-picked slot is no longer valid
  // for the newly selected date.
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

  // Marks every rendered time option as available/unavailable
  // based on the given list of available labels. Unavailable
  // options stay in the list (per spec) but get the
  // .is-unavailable class, which grays them out and blocks
  // clicks via CSS pointer-events:none.
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

  // Initial preview (before any date is picked)
  updateTimeSlotAvailability(getAvailableSlotsForDayOfWeek(DEFAULT_PREVIEW_DAY_OF_WEEK));

  // ---------------------------------------------------------
  // Custom dropdown behavior (Preferred Time) -- same pattern
  // used elsewhere in the project so it can never be sized or
  // positioned by the browser/OS in a way that overflows on mobile.
  // ---------------------------------------------------------
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
      if (option.classList.contains("is-unavailable")) return; // grayed-out slots are not selectable

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

  // ---------------------------------------------------------
  // Preferred Date availability (FRONTEND TEST DATA ONLY).
  // Native <input type="date"> can't gray out individual
  // weekdays inside its own calendar UI (that's browser/OS
  // rendered), so this validates on change instead: picking an
  // unavailable day immediately clears the field and flags it,
  // so an unavailable date can never remain selected. Picking a
  // valid day also refreshes which time slots are available,
  // since date and time availability work together.
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Submit Request -> request-submitted.html
  // No backend yet, so this just collects and forwards the
  // entered data structure; wire up the real API call here later.
  // ---------------------------------------------------------
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

      // Future: POST requestData to the backend here instead of
      // storing it locally -- sessionStorage is a frontend-only
      // stand-in so request-submitted.html can display it
      sessionStorage.setItem("profconsult_last_request", JSON.stringify(requestData));

      // Also add this request to the persistent My Requests list
      // so it automatically shows up on my-requests.html, growing
      // that list every time a request is submitted.
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
        // Storage unavailable -- the request still submits, it just
        // won't show up on My Requests until storage works again
      }

      window.location.href = "request-submitted.html";
    });
  }

});