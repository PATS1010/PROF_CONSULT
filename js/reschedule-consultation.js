// Reschedule Consultation JS
document.addEventListener("DOMContentLoaded", async () => {

  const RESCHEDULE_TARGET_STORAGE_KEY = "profconsult_reschedule_target";

  function getRescheduleTargetId() {
    const queryId = new URLSearchParams(window.location.search).get("request_id");
    if (queryId) return queryId;
    try {
      return sessionStorage.getItem(RESCHEDULE_TARGET_STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  const targetId = getRescheduleTargetId();
  let request = null;
  try {
    const response = await fetch("api/consultation-requests.php?role=faculty", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.message || "Unable to load the consultation request.");
    const record = (result.requests || []).find((item) => String(item.Request_ID) === String(targetId));
    if (record) {
      request = {
        id: String(record.Request_ID),
        type: record.Purpose || "Consultation",
        message: record.Additional_Message || "",
        name: record.Student_Name || "",
        yearSet: `${record.Year_Level || ""} ${record.Section || ""}`.trim(),
        preferredDateISO: record.Request_Date || "",
        preferredTimeLabel: "",
      };
    }
  } catch (error) {
    window.alert(error.message || "Unable to load the consultation request.");
  }

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

  const TIME_RANGE_START_MINUTES = 7 * 60;
  const TIME_RANGE_END_MINUTES = 19 * 60;

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

  function normalizeSlotLabel(label) {
    return String(label || "").replace(/\s*-\s*/g, " \u2013 ").trim();
  }

  async function loadScheduleForDate(dateValue) {
    const params = new URLSearchParams({ date: dateValue, request_id: request.id });
    const response = await fetch(`api/faculty-schedule.php?${params.toString()}`, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to load available time slots.");
    }
    return result;
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

  function updateTimeSlotAvailability(slots) {
    if (!preferredTimeOptions) return;
    const availableSet = new Set(
      (slots || [])
        .filter((slot) => slot.available && !slot.taken)
        .map((slot) => normalizeSlotLabel(slot.value || slot.label))
    );
    const takenSet = new Set(
      (slots || [])
        .filter((slot) => slot.taken)
        .map((slot) => normalizeSlotLabel(slot.value || slot.label))
    );
    const options = preferredTimeOptions.querySelectorAll("li[role='option']");

    options.forEach((li) => {
      const baseLabel = normalizeSlotLabel(li.getAttribute("data-value"));
      const isTaken = takenSet.has(baseLabel);
      const isAvailable = availableSet.has(baseLabel);
      li.textContent = isTaken ? `${baseLabel} (Taken)` : baseLabel;
      li.setAttribute("data-value", baseLabel);
      li.classList.toggle("is-unavailable", !isAvailable);
      li.setAttribute("aria-disabled", isAvailable ? "false" : "true");
    });

    if (hiddenTimeInput && hiddenTimeInput.value && !availableSet.has(normalizeSlotLabel(hiddenTimeInput.value))) {
      clearSelectedTime();
    }
  }

  updateTimeSlotAvailability([]);

  function setDateErrorState(isError) {
    if (dateInput) dateInput.classList.toggle("is-date-invalid", isError);
    if (dateHint) dateHint.classList.toggle("is-error", isError);
  }

  if (dateInput) {
    let scheduleVersion = 0;
    dateInput.addEventListener("change", async () => {
      const version = ++scheduleVersion;
      const dateValue = dateInput.value;
      clearSelectedTime();
      updateTimeSlotAvailability([]);

      if (!dateValue) {
        setDateErrorState(false);
        updateTimeSlotAvailability([]);
        return;
      }

      const dayOfWeek = new Date(`${dateValue}T00:00:00`).getDay();

      if (dayOfWeek === 0) {
        dateInput.value = "";
        setDateErrorState(true);
        if (dateHint) dateHint.textContent = "Consultations are available from Monday to Saturday only.";
        updateTimeSlotAvailability([]);
        clearSelectedTime();
        window.setTimeout(() => setDateErrorState(false), 1200);
        return;
      }

      setDateErrorState(false);
      try {
        const schedule = await loadScheduleForDate(dateValue);
        if (version !== scheduleVersion) return;
        if (dateHint) {
          dateHint.textContent = schedule.message || "Choose a time based on the professor's saved availability.";
        }
        updateTimeSlotAvailability(schedule.slots || []);
        if (dateValue === request.preferredDateISO && request.preferredTimeLabel) {
          selectTimeSlot(normalizeSlotLabel(request.preferredTimeLabel));
        }
      } catch (error) {
        if (version !== scheduleVersion) return;
        updateTimeSlotAvailability([]);
        clearSelectedTime();
        window.alert(error.message || "Unable to load available time slots.");
      }
    });
  }

  if (dateInput && dateInput.value) {
    dateInput.dispatchEvent(new Event("change"));
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
  if (submitButton) submitButton.disabled = false;

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitButton && submitButton.disabled) return;

      const newDateISO = dateInput ? dateInput.value : "";
      const newTimeLabel = hiddenTimeInput ? hiddenTimeInput.value : "";

      if (!newDateISO || !newTimeLabel) {
        window.alert("Please select a new date and time before submitting.");
        return;
      }

      const messageForStudentRaw = messageForStudentInput ? messageForStudentInput.value.trim() : "";
      if (submitButton) submitButton.disabled = true;
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
        if (submitButton) submitButton.disabled = false;
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
