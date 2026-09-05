// SYSTEM NOTE: Controls client-side behavior for the faculty availability page, including UI events and API calls.
// =========================================================
// FACULTY AVAILABILITY -- PAGE-SPECIFIC INTERACTIONS
// - Current Status pill + Change Status dropdown, anchored
//   directly below the Change Status button. Selecting an
//   option updates the main status display immediately as a
//   PENDING choice; it only becomes the saved status once
//   Save Changes is clicked.
// - Available Hours: six independent day rows. Hours are shown
//   as plain text and are NEVER directly editable. Clicking
//   Edit reveals a black downward-arrow button on every row
//   (hidden the rest of the time) and turns Edit into Cancel.
//   Clicking a day's arrow opens THAT day's own time dropdown
//   (preset options + "Unavailable") -- every day is fully
//   independent of the others. Save commits only the days that
//   were actually changed; Cancel discards all pending changes,
//   restores the previously saved hours, hides the arrows again,
//   and turns Cancel back into Edit.
//
// FACULTY TEST ACCOUNT -- no backend yet. Current status and
// the weekly available hours are frontend/mock state only: a
// plain JS variable, no localStorage/sessionStorage/persistence
// of any kind, so a page reload resets everything back to the
// default mock schedule below. Structured so this can later be
// connected to the real logged-in faculty account's data once
// the backend exists.
//
// Shared shell behavior (navbar, sidebar, quick action,
// notification bell) lives in faculty-shared.js.
// =========================================================

// ---------------------------------------------------------
// Mock weekly schedule -- replace with the logged-in faculty's
// real saved hours once the backend exists. `time` is the
// currently SAVED value for that day; "Unavailable" is a valid
// saved value, same as any time range.
// ---------------------------------------------------------
let AVAILABLE_HOURS = [
  { day: "Monday", short: "Mon", time: "11:00 AM - 1:00 PM" },
  { day: "Tuesday", short: "Tue", time: "11:00 AM - 1:00 PM" },
  { day: "Wednesday", short: "Wed", time: "11:00 AM - 1:00 PM" },
  { day: "Thursday", short: "Thurs", time: "11:00 AM - 1:00 PM" },
  { day: "Friday", short: "Fri", time: "11:00 AM - 1:00 PM" },
  { day: "Saturday", short: "Sat", time: "11:00 AM - 1:00 PM" },
];

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

  // ---------------------------------------------------------
  // Current Status pill + Change Status dropdown -- anchored to
  // the button itself (see .faculty-change-status-wrap in the
  // CSS/HTML), so the popup always opens directly below the
  // Change Status button rather than the status pill.
  // ---------------------------------------------------------
  const changeStatusButton = document.getElementById("changeStatusButton");
  const statusPanel = document.getElementById("statusPanel");
  const statusOptions = statusPanel
    ? Array.from(statusPanel.querySelectorAll(".faculty-status-option"))
    : [];
  const saveStatusButton = document.getElementById("saveStatusButton");
  const currentStatusDot = document.getElementById("availabilityStatusDot");
  const currentStatusLabel = document.getElementById("availabilityStatusLabel");

  // Tracks the currently SAVED status vs. a pending in-progress
  // selection -- selecting an option updates the main display
  // right away (per spec), but Cancel-by-closing-without-saving
  // isn't requested for status, only for hours; Save Changes is
  // what makes a selection the new source of truth.
  let savedStatus = { status: "consultation", label: "Consultation" };

  function statusForApi(status) {
    const map = {
      teaching: "in class",
      onleave: "on leave",
    };

    return map[status] || status;
  }

  function statusForUi(status) {
    const map = {
      "in class": "teaching",
      "on leave": "onleave",
      unavailable: "offline",
    };

    return map[String(status || "").toLowerCase()] || String(status || "offline").toLowerCase();
  }

  function statusLabel(status) {
    const labels = {
      available: "Available",
      teaching: "In Class",
      meeting: "Meeting",
      consultation: "Consultation",
      onleave: "On Leave",
      offline: "Offline",
    };

    return labels[status] || "Offline";
  }

  function currentTimeValue() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  function currentDateValue() {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function renderStatus(status, label) {
    if (currentStatusDot) currentStatusDot.className = `status-dot status-${status}`;
    if (currentStatusLabel) currentStatusLabel.textContent = label;
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

  async function saveCurrentStatus(status) {
    const response = await fetch("api/availability.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        status: statusForApi(status),
        date: currentDateValue(),
        time: currentTimeValue(),
      }),
    });
    const result = await response.json();

    if (handleAuthFailure(response, result)) {
      throw new Error("AUTH_REQUIRED");
    }

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to save availability status.");
    }
  }

  async function loadSavedStatus() {
    try {
      const response = await fetch("api/availability.php?role=faculty", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Accept": "application/json" },
      });
      const result = await response.json();
      if (!response.ok || !result.ok) return;

      const latest = (result.availability || []).slice(-1)[0];
      if (!latest) return;

      const status = statusForUi(latest.Status);
      savedStatus = { status, label: statusLabel(status) };
      renderStatus(savedStatus.status, savedStatus.label);
    } catch (error) {
      // Keep the default display if availability cannot be loaded.
    }
  }

  loadSavedStatus();

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
    }, 200); // matches the panel's CSS transition duration
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

      // Update the main display immediately on selection.
      const status = option.dataset.status;
      const label = option.dataset.label;
      renderStatus(status, label);
    });
  });

  if (saveStatusButton) {
    saveStatusButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      const selectedOption = statusOptions.find((opt) => opt.classList.contains("is-selected"));
      if (selectedOption) {
        try {
          await saveCurrentStatus(selectedOption.dataset.status);
          savedStatus = { status: selectedOption.dataset.status, label: selectedOption.dataset.label };
          renderStatus(savedStatus.status, savedStatus.label);
        } catch (error) {
          if (error.message === "AUTH_REQUIRED") return;
          alert(error.message);
          renderStatus(savedStatus.status, savedStatus.label);
          return;
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

  // ---------------------------------------------------------
  // Available Hours
  // ---------------------------------------------------------
  const hoursListEl = document.getElementById("availabilityHoursList");
  const editButton = document.getElementById("editHoursButton");
  const saveHoursButton = document.getElementById("saveHoursButton");

  let isEditingHours = false;
  // Draft copy edited during an edit session; only written back
  // into AVAILABLE_HOURS when Save is clicked. Cancel just
  // discards this and re-renders from AVAILABLE_HOURS untouched.
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
      if (entry.time === UNAVAILABLE_LABEL) timeText.classList.add("is-unavailable");
      timeText.textContent = entry.time;
      timeWrap.appendChild(timeText);

      // Arrow is ALWAYS in the markup but hidden outside edit
      // mode -- never becomes a text input, and clicking it is
      // the only way to change a day's hours.
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
        if (!isEditingHours) return; // arrows are inert unless in edit mode

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

        // Only THIS day's draft entry changes -- every other day
        // stays exactly as it was.
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
        // Commit the draft -- only days that actually changed
        // differ from AVAILABLE_HOURS; unchanged days are
        // written back identically, so nothing is lost.
        AVAILABLE_HOURS = draftHours.map((entry) => ({ ...entry }));
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
        // Currently showing "Cancel" -- discard any pending
        // changes and restore the previously saved hours.
        isEditingHours = false;
        editButton.textContent = "Edit";
        closeAllTimeDropdowns();
        renderAvailableHours();
      } else {
        // Currently showing "Edit" -- enter edit mode with a
        // fresh draft copied from the saved hours.
        isEditingHours = true;
        draftHours = AVAILABLE_HOURS.map((entry) => ({ ...entry }));
        editButton.textContent = "Cancel";
        renderAvailableHours();
      }
    });
  }

});
