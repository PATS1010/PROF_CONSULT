// Reschedule Consultation JS
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
    }
    return [];
  }

  function saveConsultations(list) {
    try {
      localStorage.setItem(CONSULTATIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
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

  if (!request) {
    window.location.href = "faculty-consultation-requests.html";
    return;
  }

  const purposeEl = document.getElementById("reschedulePurpose");
  const messageEl = document.getElementById("rescheduleMessage");
  const studentNameEl = document.getElementById("rescheduleStudentName");
  const yearSetEl = document.getElementById("rescheduleYearSet");
  const dateInput = document.getElementById("reschedulePreferredDate");
  const dateHint = document.getElementById("reschedulePreferredDateHint");
  const messageForStudentInput = document.getElementById("rescheduleMessageForStudent");

  if (purposeEl) purposeEl.textContent = request.type;
  if (messageEl) messageEl.textContent = request.message;
  if (studentNameEl) studentNameEl.textContent = request.name;
  if (yearSetEl) yearSetEl.textContent = request.yearSet;
  if (dateInput) dateInput.value = request.preferredDateISO || "";

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

  const initialDayOfWeek = request.preferredDateISO
    ? new Date(`${request.preferredDateISO}T00:00:00`).getDay()
    : DEFAULT_PREVIEW_DAY_OF_WEEK;

  updateTimeSlotAvailability(getAvailableSlotsForDayOfWeek(initialDayOfWeek));
  if (request.preferredTimeLabel) selectTimeSlot(request.preferredTimeLabel);

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
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const newDateISO = dateInput ? dateInput.value : "";
      const newTimeLabel = hiddenTimeInput ? hiddenTimeInput.value : "";

      if (!newDateISO || !newTimeLabel) return;

      const messageForStudentRaw = messageForStudentInput ? messageForStudentInput.value.trim() : "";
      try {
        const response = await fetch("api/consultation-requests.php", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            role: "faculty",
            request_id: Number(request.id),
            status: "rescheduled",
            preferred_date: newDateISO,
            preferred_time: newTimeLabel,
            response: messageForStudentRaw,
          }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Unable to reschedule consultation.");
        }
      } catch (error) {
        window.alert(error.message || "Unable to reschedule consultation.");
        return;
      }

      try {
        sessionStorage.removeItem(RESCHEDULE_TARGET_STORAGE_KEY);
      } catch (error) {
      }

      if (submitButton) {
        submitButton.textContent = "New Schedule Submitted";
        submitButton.disabled = true;
        submitButton.classList.add("is-submitted");
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

  const cancelLink = document.querySelector('.reschedule-buttons [data-nav="cancel"]');
  if (cancelLink) {
    cancelLink.addEventListener("click", () => {
      try {
        sessionStorage.removeItem(RESCHEDULE_TARGET_STORAGE_KEY);
      } catch (error) {
      }
    });
  }

});
