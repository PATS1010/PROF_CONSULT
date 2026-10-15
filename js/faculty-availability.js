// Faculty Availability JS
const AVAILABLE_HOURS_STORAGE_KEY = "profconsult_faculty_available_hours";

const NOT_SET_LABEL = "No hours set";
const UNAVAILABLE_LABEL = "Unavailable";

const SLOT_START_MINUTES = 7 * 60;
const SLOT_END_MINUTES = 19 * 60;
const SLOT_LENGTH_MINUTES = 30;

function formatClock(totalMinutes) {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function buildTimeOptions() {
  const options = [];
  for (let start = SLOT_START_MINUTES; start < SLOT_END_MINUTES; start += SLOT_LENGTH_MINUTES) {
    options.push(`${formatClock(start)} - ${formatClock(start + SLOT_LENGTH_MINUTES)}`);
  }
  return options;
}

// 7:00 AM - 7:30 AM, 7:30 AM - 8:00 AM, ... 6:30 PM - 7:00 PM
const TIME_OPTIONS = buildTimeOptions();

// Joins back-to-back slots into ranges (kept in "time" so other pages still get a readable string)
function summarizeTimes(times) {
  if (!times.length) return NOT_SET_LABEL;

  const ranges = [];
  let rangeStart = times[0];
  let previous = times[0];

  for (let i = 1; i < times.length; i++) {
    const isNextSlot = TIME_OPTIONS.indexOf(times[i]) === TIME_OPTIONS.indexOf(previous) + 1;
    if (isNextSlot) {
      previous = times[i];
    } else {
      ranges.push(`${rangeStart.split(" - ")[0]} - ${previous.split(" - ")[1]}`);
      rangeStart = times[i];
      previous = times[i];
    }
  }
  ranges.push(`${rangeStart.split(" - ")[0]} - ${previous.split(" - ")[1]}`);

  return ranges.join(", ");
}

// Older saved hours were one range such as "10:00 AM - 12:00 PM"; turn them into 30-minute slots
function rangeToSlots(rangeText) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(rangeText).trim());
  if (!match) return [];

  const toMinutes = (hour, minute, period) => {
    return (parseInt(hour, 10) % 12 + (period.toUpperCase() === "PM" ? 12 : 0)) * 60 + parseInt(minute, 10);
  };

  const start = toMinutes(match[1], match[2], match[3]);
  const end = toMinutes(match[4], match[5], match[6]);

  return TIME_OPTIONS.filter((option, index) => {
    const slotStart = SLOT_START_MINUTES + index * SLOT_LENGTH_MINUTES;
    return slotStart >= start && slotStart + SLOT_LENGTH_MINUTES <= end;
  });
}

const DEFAULT_AVAILABLE_HOURS = [
  { day: "Monday", short: "Mon", times: [], time: NOT_SET_LABEL },
  { day: "Tuesday", short: "Tue", times: [], time: NOT_SET_LABEL },
  { day: "Wednesday", short: "Wed", times: [], time: NOT_SET_LABEL },
  { day: "Thursday", short: "Thurs", times: [], time: NOT_SET_LABEL },
  { day: "Friday", short: "Fri", times: [], time: NOT_SET_LABEL },
  { day: "Saturday", short: "Sat", times: [], time: NOT_SET_LABEL },
];

function cloneHours(hours) {
  return hours.map((entry) => ({ ...entry, times: entry.times.slice() }));
}

function loadAvailableHours() {
  const defaults = cloneHours(DEFAULT_AVAILABLE_HOURS);

  try {
    const raw = localStorage.getItem(AVAILABLE_HOURS_STORAGE_KEY);
    if (!raw) return defaults;

    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return defaults;

    return defaults.map((entry) => {
      const match = saved.find((item) => item && item.day === entry.day);
      if (!match) return entry;

      if (Array.isArray(match.times)) {
        const times = TIME_OPTIONS.filter((option) => match.times.includes(option));
        if (times.length) return { ...entry, times, time: summarizeTimes(times) };
        if (match.time === UNAVAILABLE_LABEL) return { ...entry, times: [], time: UNAVAILABLE_LABEL };
        return entry;
      }

      if (typeof match.time === "string" && match.time) {
        if (match.time === UNAVAILABLE_LABEL) return { ...entry, times: [], time: UNAVAILABLE_LABEL };
        const times = rangeToSlots(match.time);
        if (times.length) return { ...entry, times, time: summarizeTimes(times) };
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
let draftHours = cloneHours(AVAILABLE_HOURS);

function applySavedHours(rawHours) {
  try {
    const saved = JSON.parse(rawHours || "[]");
    if (!Array.isArray(saved)) return;
    localStorage.setItem(AVAILABLE_HOURS_STORAGE_KEY, JSON.stringify(saved));
    AVAILABLE_HOURS = loadAvailableHours();
    draftHours = cloneHours(AVAILABLE_HOURS);
  } catch (error) {
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const changeStatusButton = document.getElementById("changeStatusButton");
  const statusPanel = document.getElementById("statusPanel");
  const statusOptions = statusPanel
    ? Array.from(statusPanel.querySelectorAll(".faculty-status-option"))
    : [];
  const saveStatusButton = document.getElementById("saveStatusButton");
  const currentStatusDot = document.getElementById("availabilityStatusDot");
  const currentStatusLabel = document.getElementById("availabilityStatusLabel");

  fetch("api/manage-consultation-hours.php", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((result) => {
      if (result && result.consultation_hours) {
        applySavedHours(result.consultation_hours);
        renderAvailableHours();
      }
    })
    .catch(() => {
    });

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
    saveStatusButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (saveStatusButton.disabled) return;
      const selectedOption = statusOptions.find((opt) => opt.classList.contains("is-selected"));
      if (selectedOption && typeof window.setFacultyOnlineStatus === "function") {
        saveStatusButton.disabled = true;
        try {
          await window.setFacultyOnlineStatus(selectedOption.dataset.status, { throwOnError: true });
        } catch (error) {
          const previous = window.getFacultyOnlineStatus();
          setCurrentStatus(previous, window.FACULTY_STATUS_LABELS[previous]);
          window.alert(error.message || "Unable to save faculty availability.");
          return;
        } finally {
          saveStatusButton.disabled = false;
        }
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

  function setCurrentStatus(status, label) {
    if (currentStatusDot) currentStatusDot.className = `status-dot status-${status}`;
    if (currentStatusLabel) currentStatusLabel.textContent = label;
    statusOptions.forEach((opt) => {
      opt.classList.toggle("is-selected", opt.dataset.status === status);
    });
  }

  const hoursListEl = document.getElementById("availabilityHoursList");
  const editButton = document.getElementById("editHoursButton");
  const saveHoursButton = document.getElementById("saveHoursButton");

  let isEditingHours = false;
  let savedFeedbackTimer = null;

  function setSaveButtonSaved() {
    if (!saveHoursButton) return;
    window.clearTimeout(savedFeedbackTimer);
    saveHoursButton.classList.add("is-saved");
    saveHoursButton.textContent = "Saved";
    savedFeedbackTimer = window.setTimeout(() => {
      saveHoursButton.classList.remove("is-saved");
      saveHoursButton.textContent = "Save";
    }, 2200);
  }

  function resetSaveButton() {
    if (!saveHoursButton) return;
    window.clearTimeout(savedFeedbackTimer);
    saveHoursButton.classList.remove("is-saved");
    saveHoursButton.textContent = "Save";
  }

  // Not editing: the earliest slot only. Editing: the earliest slot plus how many more are picked.
  function getDisplayText(entry, editing) {
    if (entry.times.length === 0) {
      return entry.time === UNAVAILABLE_LABEL ? UNAVAILABLE_LABEL : NOT_SET_LABEL;
    }
    if (editing && entry.times.length > 1) {
      return `${entry.times[0]} (+${entry.times.length - 1} more)`;
    }
    return entry.times[0];
  }

  function buildTimeDropdown(dayIndex) {
    const dropdown = document.createElement("div");
    dropdown.className = "availability-time-dropdown";
    dropdown.dataset.dayIndex = String(dayIndex);
    dropdown.hidden = true;

    const entry = draftHours[dayIndex];

    TIME_OPTIONS.forEach((option) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "availability-time-option";
      if (entry.times.includes(option)) optionButton.classList.add("is-selected");
      optionButton.dataset.value = option;
      optionButton.textContent = option;
      dropdown.appendChild(optionButton);
    });

    const unavailableButton = document.createElement("button");
    unavailableButton.type = "button";
    unavailableButton.className = "availability-time-option is-unavailable-option";
    if (entry.times.length === 0 && entry.time === UNAVAILABLE_LABEL) {
      unavailableButton.classList.add("is-selected");
    }
    unavailableButton.dataset.value = UNAVAILABLE_LABEL;
    unavailableButton.textContent = UNAVAILABLE_LABEL;
    dropdown.appendChild(unavailableButton);

    return dropdown;
  }

  // Saved view: every set slot in order, in the same size of dropdown as the time picker
  function buildViewDropdown(dayIndex, entry) {
    const dropdown = document.createElement("div");
    dropdown.className = "availability-time-dropdown";
    dropdown.dataset.dayIndex = String(dayIndex);
    dropdown.hidden = true;

    entry.times.forEach((slot) => {
      const item = document.createElement("div");
      item.className = "availability-time-item";
      item.textContent = slot;
      dropdown.appendChild(item);
    });

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
    Array.from(hoursListEl.querySelectorAll(".availability-view-button")).forEach((viewButton) => {
      viewButton.textContent = "View All";
      viewButton.setAttribute("aria-expanded", "false");
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
      if (entry.times.length === 0) {
        timeText.classList.add("is-unavailable");
      }
      timeText.textContent = getDisplayText(entry, isEditingHours);

      if (!isEditingHours && entry.times.length > 1) {
        const moreText = document.createElement("span");
        moreText.className = "availability-time-more";
        moreText.textContent = `+${entry.times.length - 1} more`;
        timeText.appendChild(moreText);
      }

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

      if (!isEditingHours && entry.times.length > 1) {
        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "availability-view-button";
        viewButton.dataset.dayIndex = String(index);
        viewButton.setAttribute("aria-expanded", "false");
        viewButton.textContent = "View All";
        timeWrap.appendChild(viewButton);

        timeWrap.appendChild(buildViewDropdown(index, entry));
      }

      if (isEditingHours) {
        timeWrap.appendChild(buildTimeDropdown(index));
      }

      row.appendChild(timeWrap);
      hoursListEl.appendChild(row);
    });
  }

  // While picking several slots the dropdown stays open, so update the row in place
  function refreshEditingRow(dayIndex) {
    if (!hoursListEl) return;
    const row = hoursListEl.querySelector(`.availability-hours-row[data-day-index="${dayIndex}"]`);
    if (!row) return;

    const entry = draftHours[dayIndex];

    const timeText = row.querySelector(".availability-time-text");
    if (timeText) {
      timeText.textContent = getDisplayText(entry, true);
      timeText.classList.toggle("is-unavailable", entry.times.length === 0);
    }

    Array.from(row.querySelectorAll(".availability-time-option")).forEach((optionButton) => {
      const value = optionButton.dataset.value;
      const isSelected = value === UNAVAILABLE_LABEL
        ? entry.times.length === 0 && entry.time === UNAVAILABLE_LABEL
        : entry.times.includes(value);
      optionButton.classList.toggle("is-selected", isSelected);
    });
  }

  renderAvailableHours();

  if (hoursListEl) {
    hoursListEl.addEventListener("click", (event) => {
      const viewButton = event.target.closest(".availability-view-button");
      const arrowButton = event.target.closest(".availability-time-arrow");
      const optionButton = event.target.closest(".availability-time-option");

      if (viewButton) {
        event.stopPropagation();

        const dayIndex = viewButton.dataset.dayIndex;
        const dropdown = viewButton.parentElement.querySelector(
          `.availability-time-dropdown[data-day-index="${dayIndex}"]`
        );
        if (!dropdown) return;

        const isOpen = dropdown.classList.contains("is-open");
        closeAllTimeDropdowns();

        if (!isOpen) {
          dropdown.hidden = false;
          requestAnimationFrame(() => dropdown.classList.add("is-open"));
          viewButton.textContent = "Less";
          viewButton.setAttribute("aria-expanded", "true");
        }
        return;
      }

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

        const value = optionButton.dataset.value;
        const entry = draftHours[dayIndex];

        if (value === UNAVAILABLE_LABEL) {
          draftHours[dayIndex] = { ...entry, times: [], time: UNAVAILABLE_LABEL };
        } else {
          const picked = new Set(entry.times);
          if (picked.has(value)) {
            picked.delete(value);
          } else {
            picked.add(value);
          }
          const times = TIME_OPTIONS.filter((option) => picked.has(option));
          draftHours[dayIndex] = { ...entry, times, time: summarizeTimes(times) };
        }

        refreshEditingRow(dayIndex);
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
    saveHoursButton.addEventListener("click", async () => {
      let didSaveHours = false;

      if (isEditingHours) {
        AVAILABLE_HOURS = cloneHours(draftHours);

        saveAvailableHours(AVAILABLE_HOURS);

        try {
          const response = await fetch("api/manage-consultation-hours.php", {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({
              consultation_hours: JSON.stringify(AVAILABLE_HOURS),
            }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok || !result.ok) {
            throw new Error(result.message || "Unable to save availability hours.");
          }
        } catch (error) {
          window.alert(error.message || "Unable to save availability hours.");
          return;
        }

        if (typeof window.setFacultyOnlineStatus === "function") {
          window.setFacultyOnlineStatus("online");
        } else {
          setCurrentStatus("online", "Online");
        }
        didSaveHours = true;
      }

      isEditingHours = false;
      if (editButton) editButton.textContent = "Edit";
      closeAllTimeDropdowns();
      renderAvailableHours();
      if (didSaveHours) setSaveButtonSaved();
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
        draftHours = cloneHours(AVAILABLE_HOURS);
        editButton.textContent = "Cancel";
        resetSaveButton();
        renderAvailableHours();
      }
    });
  }

});
