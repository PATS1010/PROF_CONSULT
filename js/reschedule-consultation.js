// =========================================================
// RESCHEDULE CONSULTATION -- PAGE-SPECIFIC INTERACTIONS
// - Loads the exact consultation to reschedule via the id handed
//   off in sessionStorage (set by faculty-consultation-requests.js
//   when Reschedule is clicked) and reads it from the shared
//   consultations state in localStorage -- same storage keys used
//   there, nothing is duplicated into a separate data structure.
// - Purpose of Consultation / Additional Message / Student Name /
//   Year and Set are read-only, populated from that consultation.
// - Preferred Date/Time reuse the same 8:00 AM-8:00 PM, 30-minute
//   slot, test-availability logic as request-consultation.js
//   (Monday/Wednesday/Friday, 1:00 PM-2:30 PM). It's mirrored here
//   rather than imported since this is a separate static page with
//   no build step/shared JS module system in this project -- if
//   that ever changes, this block and request-consultation.js's
//   equivalent block are the two places to consolidate.
// - Submit New Schedule updates that consultation's date/time in
//   place (status untouched), turns the submit button green, then
//   redirects back to faculty-consultation-requests.html after a
//   3-2-1 countdown.
// - Cancel just navigates back without changing anything.
//
// Frontend/prototype only -- no backend. Shared shell behavior
// (navbar, sidebar, quick action, notification bell) lives in
// faculty-shared.js and is untouched by this file.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  const CONSULTATIONS_STORAGE_KEY = "profconsult_faculty_consultations";
  const RESCHEDULE_TARGET_STORAGE_KEY = "profconsult_reschedule_target";

  function loadConsultations() {
    try {
      const stored = localStorage.getItem(CONSULTATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      // fall through
    }
    return [];
  }

  function saveConsultations(list) {
    try {
      localStorage.setItem(CONSULTATIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      // Storage unavailable -- the change just won't persist
    }
  }

  function getRescheduleTargetId() {
    try {
      return sessionStorage.getItem(RESCHEDULE_TARGET_STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  const consultations = loadConsultations();
  const targetId = getRescheduleTargetId();
  const request = targetId ? consultations.find((item) => item.id === targetId) : null;

  // No valid target (e.g. this page was opened directly, or
  // storage was cleared) -- there's no real consultation to
  // reschedule, so return to the list rather than invent data.
  if (!request) {
    window.location.href = "faculty-consultation-requests.html";
    return;
  }

  // ---------------------------------------------------------
  // Populate read-only fields from the selected consultation
  // ---------------------------------------------------------
  const purposeEl = document.getElementById("reschedulePurpose");
  const messageEl = document.getElementById("rescheduleMessage");
  const studentNameEl = document.getElementById("rescheduleStudentName");
  const yearSetEl = document.getElementById("rescheduleYearSet");
  const dateInput = document.getElementById("reschedulePreferredDate");
  const dateHint = document.getElementById("reschedulePreferredDateHint");

  if (purposeEl) purposeEl.textContent = request.type;
  if (messageEl) messageEl.textContent = request.message;
  if (studentNameEl) studentNameEl.textContent = request.name;
  if (yearSetEl) yearSetEl.textContent = request.yearSet;
  if (dateInput) dateInput.value = request.preferredDateISO || "";

  // ---------------------------------------------------------
  // Preferred Time: same 8:00 AM-8:00 PM, 30-minute-slot,
  // test-availability logic as Request Consultation.
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

  // FRONTEND TEST/DEMO faculty availability data ONLY -- same
  // test data as request-consultation.js (Mon/Wed/Fri, 1-2:30 PM).
  const TEST_AVAILABLE_TIME_LABELS = [
    buildTimeLabel(13 * 60, 13 * 60 + 30),
    buildTimeLabel(13 * 60 + 30, 14 * 60),
    buildTimeLabel(14 * 60, 14 * 60 + 30),
  ];

  const FACULTY_AVAILABILITY_TEST = {
    availableDaysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
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

  const preferredTimeOptions = document.getElementById("reschedulePreferredTimeOptions");
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

  const timeSelect = document.getElementById("reschedulePreferredTimeSelect");
  let trigger = null;
  let valueLabel = null;
  let optionsList = null;
  let hiddenTimeInput = null;

  if (timeSelect) {
    trigger = timeSelect.querySelector(".custom-select-trigger");
    valueLabel = timeSelect.querySelector(".custom-select-value");
    optionsList = timeSelect.querySelector(".custom-select-options");
    hiddenTimeInput = timeSelect.querySelector('input[type="hidden"]');

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
      hiddenTimeInput.value = option.getAttribute("data-value");

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

  function clearSelectedTime() {
    if (!valueLabel || !hiddenTimeInput) return;
    valueLabel.textContent = "Select Time";
    valueLabel.setAttribute("data-is-placeholder", "true");
    hiddenTimeInput.value = "";
    if (optionsList) {
      optionsList.querySelectorAll("li.is-active").forEach((li) => li.classList.remove("is-active"));
    }
  }

  function selectTimeSlot(label) {
    if (!optionsList || !valueLabel || !hiddenTimeInput) return;
    const option = Array.from(optionsList.querySelectorAll("li[role='option']"))
      .find((li) => li.getAttribute("data-value") === label);
    if (!option || option.classList.contains("is-unavailable")) return;

    optionsList.querySelectorAll("li").forEach((li) => li.classList.remove("is-active"));
    option.classList.add("is-active");
    valueLabel.textContent = option.textContent;
    valueLabel.removeAttribute("data-is-placeholder");
    hiddenTimeInput.value = label;
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

    if (hiddenTimeInput && hiddenTimeInput.value && !availableSet.has(hiddenTimeInput.value)) {
      clearSelectedTime();
    }
  }

  // Pre-fill the dropdown with this consultation's current schedule
  const initialDayOfWeek = request.preferredDateISO
    ? new Date(`${request.preferredDateISO}T00:00:00`).getDay()
    : DEFAULT_PREVIEW_DAY_OF_WEEK;

  updateTimeSlotAvailability(getAvailableSlotsForDayOfWeek(initialDayOfWeek));
  if (request.preferredTimeLabel) selectTimeSlot(request.preferredTimeLabel);

  // ---------------------------------------------------------
  // Preferred Date availability -- same validate-on-change
  // approach as Request Consultation (native date inputs can't
  // gray out individual weekdays in their own calendar UI).
  // ---------------------------------------------------------
  function setDateErrorState(isError) {
    if (dateInput) dateInput.classList.toggle("is-date-invalid", isError);
    if (dateHint) dateHint.classList.toggle("is-error", isError);
  }

  if (dateInput) {
    dateInput.addEventListener("change", () => {
      const dateValue = dateInput.value;

      if (!dateValue) {
        setDateErrorState(false);
        updateTimeSlotAvailability(getAvailableSlotsForDayOfWeek(DEFAULT_PREVIEW_DAY_OF_WEEK));
        return;
      }

      const dayOfWeek = new Date(`${dateValue}T00:00:00`).getDay();

      if (!isDateAvailable(dayOfWeek)) {
        dateInput.value = "";
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
  // Submit New Schedule
  // ---------------------------------------------------------
  function formatDisplayDate(isoDate, timeLabel) {
    const startTimeText = timeLabel.split("\u2013")[0].trim();
    const dateObj = new Date(`${isoDate}T00:00:00`);
    const monthDay = dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    return `${monthDay}, ${startTimeText}`;
  }

  const form = document.getElementById("rescheduleConsultationForm");
  const submitButton = document.getElementById("submitRescheduleButton");
  const countdownEl = document.getElementById("rescheduleCountdown");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const newDateISO = dateInput ? dateInput.value : "";
      const newTimeLabel = hiddenTimeInput ? hiddenTimeInput.value : "";

      if (!newDateISO || !newTimeLabel) return; // required fields incomplete -- nothing to submit yet

      // Update this exact consultation's schedule in place --
      // status (pending/upcoming) is left untouched, per spec.
      request.preferredDateISO = newDateISO;
      request.preferredTimeLabel = newTimeLabel;
      request.date = formatDisplayDate(newDateISO, newTimeLabel);

      saveConsultations(consultations);

      try {
        sessionStorage.removeItem(RESCHEDULE_TARGET_STORAGE_KEY);
      } catch (error) {
        // Not critical -- a stale key just gets overwritten next time
      }

      if (submitButton) {
        submitButton.textContent = "New Schedule Submitted";
        submitButton.disabled = true;
        submitButton.classList.add("is-submitted"); // turns the button green (see reschedule-consultation.css)
      }

      let secondsLeft = 3;
      if (countdownEl) countdownEl.textContent = `Redirecting to Consultation Requests ${secondsLeft}`;

      const countdownInterval = window.setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft > 0) {
          if (countdownEl) countdownEl.textContent = `Redirecting to Consultation Requests ${secondsLeft}`;
        } else {
          window.clearInterval(countdownInterval);
          window.location.href = "faculty-consultation-requests.html";
        }
      }, 1000);
    });
  }

  // ---------------------------------------------------------
  // Cancel -- navigates back without changing anything (the
  // anchor's href does the navigation; this just clears the
  // hand-off key so a stale target isn't reused later).
  // ---------------------------------------------------------
  const cancelLink = document.querySelector('.reschedule-buttons [data-nav="cancel"]');
  if (cancelLink) {
    cancelLink.addEventListener("click", () => {
      try {
        sessionStorage.removeItem(RESCHEDULE_TARGET_STORAGE_KEY);
      } catch (error) {
        // Not critical
      }
    });
  }

});