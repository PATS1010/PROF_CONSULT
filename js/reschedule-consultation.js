// SYSTEM NOTE: Loads one faculty consultation request and submits a new schedule.

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("request_id") || params.get("id") || "";

  const form = document.getElementById("rescheduleConsultationForm");
  const purposeEl = document.getElementById("reschedulePurpose");
  const messageEl = document.getElementById("rescheduleMessage");
  const studentNameEl = document.getElementById("rescheduleStudentName");
  const yearSetEl = document.getElementById("rescheduleYearSet");
  const preferredDateInput = document.getElementById("reschedulePreferredDate");
  const preferredTimeInput = document.getElementById("reschedulePreferredTime");
  const submitButton = document.getElementById("submitRescheduleButton");
  const countdownEl = document.getElementById("rescheduleCountdown");
  const timeSelect = document.getElementById("reschedulePreferredTimeSelect");
  const timeTrigger = document.getElementById("reschedulePreferredTimeTrigger");
  const timeValueEl = timeSelect ? timeSelect.querySelector(".custom-select-value") : null;
  const timeOptionsEl = document.getElementById("reschedulePreferredTimeOptions");

  const YEAR_LABELS = {
    "1": "1st Year",
    "2": "2nd Year",
    "3": "3rd Year",
    "4": "4th Year",
    "5": "5th Year",
  };

  let currentRequest = null;
  let isSubmitting = false;

  function displayYear(value) {
    const normalized = String(value || "").trim();
    return YEAR_LABELS[normalized] || normalized;
  }

  function todayValue() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatHourMinute(totalMinutes) {
    const hour24 = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;
    const period = hour24 < 12 ? "AM" : "PM";
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
  }

  function buildTimeSlots() {
    const slots = [];
    const firstSlotStart = 7 * 60;
    const lastSlotStart = (19 * 60) - 30;

    for (let start = firstSlotStart; start <= lastSlotStart; start += 30) {
      slots.push(`${formatHourMinute(start)} \u2013 ${formatHourMinute(start + 30)}`);
    }

    return slots;
  }

  function selectedTimeStartMinutes(value) {
    const startLabel = String(value || "").split("\u2013")[0].trim();
    const match = startLabel.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const period = match[3].toUpperCase();

    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return hour * 60 + minute;
  }

  function isPastSchedule(dateValue, timeValue) {
    const startMinutes = selectedTimeStartMinutes(timeValue);
    if (!dateValue || startMinutes === null) return false;

    const scheduledEnd = new Date(`${dateValue}T00:00:00`);
    scheduledEnd.setMinutes(startMinutes + 30);
    return scheduledEnd <= new Date();
  }

  function toSlotLabel(timeValue) {
    const match = String(timeValue || "").match(/^(\d{1,2}):(\d{2})/);
    if (!match) return "";

    const start = (Number(match[1]) * 60) + Number(match[2]);
    return `${formatHourMinute(start)} \u2013 ${formatHourMinute(start + 30)}`;
  }

  function setStatus(text, isError = false) {
    if (!countdownEl) return;
    countdownEl.textContent = text;
    countdownEl.style.color = isError ? "var(--color-red-primary)" : "";
  }

  function redirectToFacultyLogin() {
    window.location.href = "faculty-login.html";
  }

  function handleAuthFailure(response, result) {
    const message = String(result && result.message ? result.message : "").toLowerCase();
    if (response.status === 401 || response.status === 403 || message.includes("log in")) {
      redirectToFacultyLogin();
      return true;
    }

    return false;
  }

  function setSelectedTime(label) {
    if (!preferredTimeInput || !timeValueEl || !timeOptionsEl) return;

    preferredTimeInput.value = label;
    timeValueEl.textContent = label || "Select Time";
    if (label === "") {
      timeValueEl.setAttribute("data-is-placeholder", "true");
    } else {
      timeValueEl.removeAttribute("data-is-placeholder");
    }

    timeOptionsEl.querySelectorAll("li").forEach((option) => {
      option.classList.toggle("is-active", option.dataset.value === label);
    });
  }

  function buildTimeDropdown() {
    if (!timeOptionsEl) return;

    timeOptionsEl.replaceChildren(...buildTimeSlots().map((label) => {
      const option = document.createElement("li");
      option.setAttribute("role", "option");
      option.dataset.value = label;
      option.textContent = label;
      return option;
    }));
  }

  function setupTimeDropdown() {
    if (!timeSelect || !timeTrigger || !timeOptionsEl) return;

    timeTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = timeSelect.classList.toggle("is-open");
      timeOptionsEl.hidden = !isOpen;
      timeTrigger.setAttribute("aria-expanded", String(isOpen));
    });

    timeOptionsEl.addEventListener("click", (event) => {
      const option = event.target.closest("li[role='option']");
      if (!option) return;

      setSelectedTime(option.dataset.value || "");
      timeSelect.classList.remove("is-open");
      timeOptionsEl.hidden = true;
      timeTrigger.setAttribute("aria-expanded", "false");
      setStatus("");
    });

    document.addEventListener("click", () => {
      timeSelect.classList.remove("is-open");
      timeOptionsEl.hidden = true;
      timeTrigger.setAttribute("aria-expanded", "false");
    });
  }

  async function loadRequest() {
    if (!requestId) {
      setStatus("Missing consultation request. Please open reschedule from Consultation Requests.", true);
      if (submitButton) submitButton.disabled = true;
      return;
    }

    setStatus("Loading consultation request...");

    const response = await fetch("api/consultation-requests.php?role=faculty", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      if (handleAuthFailure(response, result)) return;
      throw new Error(result.message || "Unable to load consultation request.");
    }

    currentRequest = (result.requests || []).find((request) => String(request.Request_ID) === String(requestId));
    if (!currentRequest) {
      throw new Error("Consultation request was not found.");
    }

    const year = displayYear(currentRequest.Year_Level);
    const yearSet = [year, currentRequest.Section || ""].filter(Boolean).join(" - ");

    if (purposeEl) purposeEl.textContent = currentRequest.Purpose || "Consultation";
    if (messageEl) messageEl.textContent = currentRequest.Additional_Message || "No additional message.";
    if (studentNameEl) studentNameEl.textContent = currentRequest.Student_Name || "Unnamed Student";
    if (yearSetEl) yearSetEl.textContent = yearSet || "Year and section not set";
    if (preferredDateInput) preferredDateInput.value = String(currentRequest.Request_Date || "").slice(0, 10);

    const timeLabel = toSlotLabel(currentRequest.Preferred_Time);
    if (timeLabel) setSelectedTime(timeLabel);

    setStatus("");
  }

  async function submitReschedule() {
    if (isSubmitting) {
      return;
    }

    const preferredDate = preferredDateInput ? preferredDateInput.value : "";
    const preferredTime = preferredTimeInput ? preferredTimeInput.value : "";

    if (!preferredDate || !preferredTime) {
      setStatus("Please choose the new preferred date and time.", true);
      return;
    }

    if (preferredDate < todayValue()) {
      setStatus("Preferred date cannot be in the past.", true);
      return;
    }

    if (isPastSchedule(preferredDate, preferredTime)) {
      setStatus("Preferred date and time must be in the future.", true);
      return;
    }

    isSubmitting = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Submitting...";
    }

    try {
      const response = await fetch("api/consultation-requests.php?role=faculty", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          status: "rescheduled",
          preferred_date: preferredDate,
          preferred_time: preferredTime,
          response: "Consultation rescheduled.",
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        if (handleAuthFailure(response, result)) return;
        throw new Error(result.message || "Unable to reschedule consultation.");
      }

      if (submitButton) {
        submitButton.textContent = "Rescheduled";
        submitButton.classList.add("is-submitted");
      }

      setStatus("Consultation rescheduled. Returning to requests...");
      window.setTimeout(() => {
        window.location.href = "faculty-consultation-requests.html";
      }, 1200);
    } catch (error) {
      isSubmitting = false;
      setStatus(error.message || "Unable to reschedule consultation.", true);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit New Schedule";
      }
    }
  }

  if (preferredDateInput) {
    preferredDateInput.min = todayValue();
    preferredDateInput.addEventListener("input", () => setStatus(""));
  }

  buildTimeDropdown();
  setupTimeDropdown();

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitReschedule();
    });
  }

  loadRequest().catch((error) => {
    setStatus(error.message || "Unable to load consultation request.", true);
    if (submitButton) submitButton.disabled = true;
  });
});
