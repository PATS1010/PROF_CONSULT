// Faculty Availability JS
const AVAILABLE_HOURS_STORAGE_KEY = "profconsult_faculty_available_hours";

const NOT_SET_LABEL = "No hours set";

const DEFAULT_AVAILABLE_HOURS = [
  { day: "Monday", short: "Mon", time: NOT_SET_LABEL },
  { day: "Tuesday", short: "Tue", time: NOT_SET_LABEL },
  { day: "Wednesday", short: "Wed", time: NOT_SET_LABEL },
  { day: "Thursday", short: "Thurs", time: NOT_SET_LABEL },
  { day: "Friday", short: "Fri", time: NOT_SET_LABEL },
  { day: "Saturday", short: "Sat", time: NOT_SET_LABEL },
];

function loadAvailableHours() {
  const defaults = DEFAULT_AVAILABLE_HOURS.map((entry) => ({ ...entry }));

  try {
    const raw = localStorage.getItem(AVAILABLE_HOURS_STORAGE_KEY);
    if (!raw) return defaults;

    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return defaults;

    return defaults.map((entry) => {
      const match = saved.find((item) => item && item.day === entry.day);
      if (match && typeof match.time === "string" && match.time) {
        return { ...entry, time: match.time };
      }
      return entry;
    });
  } catch (error) {
    return defaults;
  }
}

function saveAvailableHours(hours) {
  try {
    localStorage.setItem(AVAILABLE_HOURS_STORAGE_KEY, JSON.stringify(hours));
  } catch (error) {
  }
}

let AVAILABLE_HOURS = loadAvailableHours();

const TIME_OPTIONS = [
  "8:00 AM - 10:00 AM",
  "9:00 AM - 11:00 AM",
  "10:00 AM - 12:00 PM",
  "11:00 AM - 1:00 PM",
  "1:00 PM - 2:30 PM",
  "2:30 PM - 4:30 PM",
  "4:00 PM - 6:00 PM",
  "6:00 PM - 8:00 PM",
];

const UNAVAILABLE_LABEL = "Unavailable";

document.addEventListener("DOMContentLoaded", () => {

  const changeStatusButton = document.getElementById("changeStatusButton");
  const statusPanel = document.getElementById("statusPanel");
  const statusOptions = statusPanel
    ? Array.from(statusPanel.querySelectorAll(".faculty-status-option"))
    : [];
  const saveStatusButton = document.getElementById("saveStatusButton");
  const currentStatusDot = document.getElementById("availabilityStatusDot");
  const currentStatusLabel = document.getElementById("availabilityStatusLabel");

  function openStatusPanel() {
    statusPanel.hidden = false;
    requestAnimationFrame(() => statusPanel.classList.add("is-open"));
    changeStatusButton.setAttribute("aria-expanded", "true");
  }

  function closeStatusPanel() {
    statusPanel.classList.remove("is-open");
    changeStatusButton.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      statusPanel.hidden = true;
    }, 200);
  }

  if (changeStatusButton) {
    changeStatusButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = statusPanel.classList.contains("is-open");
      if (isOpen) {
        closeStatusPanel();
      } else {
        openStatusPanel();
      }
    });
  }

  statusOptions.forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();

      statusOptions.forEach((opt) => opt.classList.remove("is-selected"));
      option.classList.add("is-selected");

      const status = option.dataset.status;
      const label = option.dataset.label;
      if (currentStatusDot) currentStatusDot.className = `status-dot status-${status}`;
      if (currentStatusLabel) currentStatusLabel.textContent = label;
    });
  });

  if (saveStatusButton) {
    saveStatusButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const selectedOption = statusOptions.find((opt) => opt.classList.contains("is-selected"));
      if (selectedOption && typeof window.setFacultyOnlineStatus === "function") {
        window.setFacultyOnlineStatus(selectedOption.dataset.status);
      }
      closeStatusPanel();
    });
  }

  document.addEventListener("click", (event) => {
    if (
      statusPanel &&
      !statusPanel.hidden &&
      !statusPanel.contains(event.target) &&
      event.target !== changeStatusButton &&
      !changeStatusButton.contains(event.target)
    ) {
      closeStatusPanel();
    }
  });

  document.addEventListener("faculty-status-changed", (event) => {
    const newStatus = event.detail && event.detail.status;
    if (!newStatus) return;

    statusOptions.forEach((opt) => {
      opt.classList.toggle("is-selected", opt.dataset.status === newStatus);
    });
  });

  const hoursListEl = document.getElementById("availabilityHoursList");
  const editButton = document.getElementById("editHoursButton");
  const saveHoursButton = document.getElementById("saveHoursButton");

  let isEditingHours = false;
  let draftHours = AVAILABLE_HOURS.map((entry) => ({ ...entry }));

  function buildTimeDropdown(dayIndex) {
    const dropdown = document.createElement("div");
    dropdown.className = "availability-time-dropdown";
    dropdown.dataset.dayIndex = String(dayIndex);
    dropdown.hidden = true;

    const currentValue = draftHours[dayIndex].time;

    TIME_OPTIONS.forEach((option) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "availability-time-option";
      if (option === currentValue) optionButton.classList.add("is-selected");
      optionButton.dataset.value = option;
      optionButton.textContent = option;
      dropdown.appendChild(optionButton);
    });

    const unavailableButton = document.createElement("button");
    unavailableButton.type = "button";
    unavailableButton.className = "availability-time-option is-unavailable-option";
    if (currentValue === UNAVAILABLE_LABEL) unavailableButton.classList.add("is-selected");
    unavailableButton.dataset.value = UNAVAILABLE_LABEL;
    unavailableButton.textContent = UNAVAILABLE_LABEL;
    dropdown.appendChild(unavailableButton);

    return dropdown;
  }

  function closeAllTimeDropdowns() {
    if (!hoursListEl) return;
    Array.from(hoursListEl.querySelectorAll(".availability-time-dropdown")).forEach((dropdown) => {
      dropdown.classList.remove("is-open");
      dropdown.hidden = true;
    });
    Array.from(hoursListEl.querySelectorAll(".availability-time-arrow")).forEach((arrow) => {
      arrow.setAttribute("aria-expanded", "false");
    });
  }

  function renderAvailableHours() {
    if (!hoursListEl) return;
    hoursListEl.innerHTML = "";

    const source = isEditingHours ? draftHours : AVAILABLE_HOURS;

    source.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "availability-hours-row";
      row.dataset.dayIndex = String(index);

      const dayBadge = document.createElement("span");
      dayBadge.className = "availability-day-badge";
      dayBadge.textContent = entry.short;
      row.appendChild(dayBadge);

      const timeWrap = document.createElement("div");
      timeWrap.className = "availability-time-wrap";

      const timeText = document.createElement("span");
      timeText.className = "availability-time-text";
      if (entry.time === UNAVAILABLE_LABEL || entry.time === NOT_SET_LABEL) {
        timeText.classList.add("is-unavailable");
      }
      timeText.textContent = entry.time;
      timeWrap.appendChild(timeText);

      const arrowButton = document.createElement("button");
      arrowButton.type = "button";
      arrowButton.className = "availability-time-arrow";
      arrowButton.dataset.dayIndex = String(index);
      arrowButton.setAttribute("aria-label", `Change ${entry.day} hours`);
      arrowButton.setAttribute("aria-expanded", "false");
      arrowButton.hidden = !isEditingHours;
      arrowButton.textContent = "\u25BC";
      timeWrap.appendChild(arrowButton);

      if (isEditingHours) {
        timeWrap.appendChild(buildTimeDropdown(index));
      }

      row.appendChild(timeWrap);
      hoursListEl.appendChild(row);
    });
  }

  renderAvailableHours();

  if (hoursListEl) {
    hoursListEl.addEventListener("click", (event) => {
      const arrowButton = event.target.closest(".availability-time-arrow");
      const optionButton = event.target.closest(".availability-time-option");

      if (arrowButton) {
        event.stopPropagation();
        if (!isEditingHours) return;

        const dayIndex = arrowButton.dataset.dayIndex;
        const dropdown = arrowButton.parentElement.querySelector(
          `.availability-time-dropdown[data-day-index="${dayIndex}"]`
        );
        if (!dropdown) return;

        const isOpen = dropdown.classList.contains("is-open");
        closeAllTimeDropdowns();

        if (!isOpen) {
          dropdown.hidden = false;
          requestAnimationFrame(() => dropdown.classList.add("is-open"));
          arrowButton.setAttribute("aria-expanded", "true");
        }
        return;
      }

      if (optionButton) {
        event.stopPropagation();
        const dropdown = optionButton.closest(".availability-time-dropdown");
        const dayIndex = Number(dropdown ? dropdown.dataset.dayIndex : NaN);
        if (Number.isNaN(dayIndex) || !draftHours[dayIndex]) return;

        draftHours[dayIndex] = { ...draftHours[dayIndex], time: optionButton.dataset.value };
        renderAvailableHours();
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (!hoursListEl) return;
    const clickedInsideHoursList = hoursListEl.contains(event.target);
    if (!clickedInsideHoursList) {
      closeAllTimeDropdowns();
    }
  });

  if (saveHoursButton) {
    saveHoursButton.addEventListener("click", () => {
      if (isEditingHours) {
        AVAILABLE_HOURS = draftHours.map((entry) => ({ ...entry }));

        saveAvailableHours(AVAILABLE_HOURS);
      }

      isEditingHours = false;
      if (editButton) editButton.textContent = "Edit";
      closeAllTimeDropdowns();
      renderAvailableHours();
    });
  }

  if (editButton) {
    editButton.addEventListener("click", () => {
      if (isEditingHours) {
        isEditingHours = false;
        editButton.textContent = "Edit";
        closeAllTimeDropdowns();
        renderAvailableHours();
      } else {
        isEditingHours = true;
        draftHours = AVAILABLE_HOURS.map((entry) => ({ ...entry }));
        editButton.textContent = "Cancel";
        renderAvailableHours();
      }
    });
  }

});