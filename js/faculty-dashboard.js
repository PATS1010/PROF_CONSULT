// SYSTEM NOTE: Controls client-side behavior for the faculty dashboard page, including UI events and API calls.
// =========================================================
// FACULTY DASHBOARD -- PAGE-SPECIFIC INTERACTIONS
// - Populates the greeting from the logged-in faculty session.
// - Today's Status: Change Status opens a gradient popup of
//   status options; selecting + Save updates the visible
//   status pill. Frontend-only for now (no persistence).
// - Accept / Decline / View More: backed by consultation request API.
//
// Shared shell behavior (navbar, sidebar, quick action,
// notification bell) lives in faculty-shared.js.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  const nameEl = document.getElementById("facultyLastName");

  function lastNameFrom(fullName) {
    const cleaned = String(fullName || "").replace(/^engr\.\s*/i, "").trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : "Professor";
  }

  async function loadCurrentFaculty() {
    try {
      const response = await fetch("api/session.php?role=faculty", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Accept": "application/json" },
      });
      const data = await response.json();

      if (!response.ok || !data.ok || !data.user || data.user.role !== "faculty") {
        throw new Error("Faculty session unavailable");
      }

      if (nameEl) nameEl.textContent = lastNameFrom(data.user.name);
    } catch (error) {
      window.location.href = "faculty-login.html";
    }
  }

  loadCurrentFaculty();

  // ---------------------------------------------------------
  // Today's Status: Change Status popup. Selecting an option
  // marks it visually selected; Save applies it to the status
  // pill and closes the popup. Closing without Save discards
  // the pending selection.
  // ---------------------------------------------------------
  const changeStatusButton = document.getElementById("changeStatusButton");
  const statusPanel = document.getElementById("statusPanel");
  const statusOptions = statusPanel
    ? Array.from(statusPanel.querySelectorAll(".faculty-status-option"))
    : [];
  const saveStatusButton = document.getElementById("saveStatusButton");
  const currentStatusDot = document.getElementById("currentStatusDot");
  const currentStatusLabel = document.getElementById("currentStatusLabel");

  let pendingStatus = null;
  let pendingLabel = null;

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
      if (currentStatusDot) currentStatusDot.className = `status-dot status-${status}`;
      if (currentStatusLabel) currentStatusLabel.textContent = statusLabel(status);
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
      pendingStatus = option.dataset.status;
      pendingLabel = option.dataset.label;
      statusOptions.forEach((opt) => opt.classList.remove("is-selected"));
      option.classList.add("is-selected");
    });
  });

  if (saveStatusButton) {
    saveStatusButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      if (pendingStatus && currentStatusDot && currentStatusLabel) {
        try {
          await saveCurrentStatus(pendingStatus);
          currentStatusDot.className = `status-dot status-${pendingStatus}`;
          currentStatusLabel.textContent = pendingLabel;
        } catch (error) {
          if (error.message === "AUTH_REQUIRED") return;
          alert(error.message);
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

  let requests = [];

  const requestNameEl = document.querySelector(".faculty-request-name");
  const requestMetaEl = document.querySelector(".faculty-request-meta");
  const requestSubjectLabelEl = document.querySelector(".faculty-request-subject-label");
  const requestSubjectEl = document.querySelector(".faculty-request-subject");
  const requestActionsEl = document.querySelector(".faculty-request-actions");
  const acceptButton = document.getElementById("acceptRequestButton");
  const declineButton = document.getElementById("declineRequestButton");
  const viewMoreButton = document.getElementById("viewMoreRequestsButton");
  const scheduleListEl = document.getElementById("facultyScheduleList");
  // Tracks whether the first request load has finished, so later refreshes do not show a loading flicker.
  let hasLoadedDashboardRequests = false;
  // Prevents multiple overlapping request loads from running at the same time.
  let isLoadingDashboardRequests = false;

  function displayYear(value) {
    const normalized = String(value || "").trim();
    const labels = {
      "1": "1st Year",
      "2": "2nd Year",
      "3": "3rd Year",
      "4": "4th Year",
      "5": "5th Year",
    };

    return labels[normalized] || normalized;
  }

  function requestFromApi(row) {
    // Convert the database year level into the readable dashboard label.
    const year = displayYear(row.Year_Level);
    // Keep section optional so missing sections do not leave extra separators.
    const section = row.Section || "";

    return {
      // Keep the database id so dashboard buttons update the correct request.
      id: String(row.Request_ID),
      // Show the real student name instead of the old sample "Juan Dela Cruz" value.
      name: row.Student_Name || "Unnamed Student",
      // Prefer the login username/student number, then fall back to Student_ID.
      studentId: row.Student_Number || row.Student_ID || "",
      // The request purpose is shown as the pending request subject.
      type: row.Purpose || "Consultation",
      // Program and year/section appear in the professor's pending request card.
      program: row.Program || "Program not set",
      yearSet: [year, section].filter(Boolean).join(" - ") || "Year and section not set",
      // Status controls whether the card is pending and whether it appears in today's schedule.
      status: row.Status || "pending",
    };
  }

  function formatDisplayTime(value) {
    // Normalize database time values like 09:30:00 before showing them on the dashboard.
    const normalized = String(value || "").trim();
    // Read only the hour and minute because seconds are not useful in the schedule UI.
    const match = normalized.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return normalized || "Time not set";

    // Convert 24-hour database time into 12-hour AM/PM text.
    const hour24 = Number(match[1]);
    const minute = match[2];
    const suffix = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minute} ${suffix}`;
  }

  function renderTodaySchedule(apiRequests) {
    if (!scheduleListEl) return;

    // Match requests against the local current date shown by the dashboard.
    const today = currentDateValue();
    // Only approved/completed requests for today are real scheduled consultations.
    const scheduledRequests = (apiRequests || [])
      .filter((row) => {
        const requestDate = String(row.Request_Date || "").slice(0, 10);
        const status = String(row.Status || "").toLowerCase();
        return requestDate === today && ["approved", "completed"].includes(status);
      })
      // Sort by the saved preferred time so the schedule reads from morning to afternoon.
      .sort((a, b) => String(a.Preferred_Time || "").localeCompare(String(b.Preferred_Time || "")));

    // Replace the old hardcoded schedule with a clear empty state when there is no consultation today.
    if (!scheduledRequests.length) {
      scheduleListEl.innerHTML = '<li class="faculty-schedule-empty">No consultations scheduled today.</li>';
      return;
    }

    // Build DOM nodes directly so student-entered text is displayed as text, not HTML.
    scheduleListEl.replaceChildren(...scheduledRequests.map((row) => {
      const status = String(row.Status || "").toLowerCase();
      const statusText = status === "completed" ? "Completed" : "Approved";
      const title = row.Purpose || "Consultation";
      const studentName = row.Student_Name || "Student";
      const item = document.createElement("li");
      const icon = document.createElement("span");
      const text = document.createElement("span");

      // Green check icon marks each schedule item as accepted/completed.
      icon.className = "faculty-check";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "\u2713";
      // Show the consultation time, purpose, student, and status in one schedule row.
      text.textContent = `${formatDisplayTime(row.Preferred_Time)} ${title} with ${studentName} (${statusText})`;

      // Add the icon and schedule text to the list item.
      item.append(icon, text);
      return item;
    }));
  }

  async function loadDashboardRequests({ showLoading = false } = {}) {
    // If a request load is already in progress, skip this call to avoid duplicate API requests.
    if (isLoadingDashboardRequests) return;
    // Mark the request loader as busy until the try/catch/finally block finishes.
    isLoadingDashboardRequests = true;

    // Show the loading text only for the first visible page load.
    if (showLoading && !hasLoadedDashboardRequests) {
      // Tell the professor that requests are being loaded.
      if (requestNameEl) requestNameEl.textContent = "Loading requests...";
      // Hide request metadata until real request data is available.
      if (requestMetaEl) requestMetaEl.style.display = "none";
      // Hide the "Subject:" label while loading.
      if (requestSubjectLabelEl) requestSubjectLabelEl.style.display = "none";
      // Hide the request subject while loading.
      if (requestSubjectEl) requestSubjectEl.style.display = "none";
      // Hide Accept/Decline buttons while loading.
      if (requestActionsEl) requestActionsEl.style.display = "none";
    }

    try {
      // Load requests as faculty so the API reads the professor session, not a student session.
      const response = await fetch("api/consultation-requests.php?role=faculty", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Accept": "application/json" },
      });
      // Parse the API result before updating the dashboard UI.
      const result = await response.json();

      // Show an error if the backend rejects the session or query.
      if (!response.ok || !result.ok) {
        if (handleAuthFailure(response, result)) return;
        throw new Error(result.message || "Unable to load consultation requests.");
      }

      // Keep the raw rows for today's schedule and mapped rows for the pending card.
      const apiRequests = result.requests || [];
      requests = apiRequests.map(requestFromApi);
      // Refresh today's schedule from approved/completed requests.
      renderTodaySchedule(apiRequests);
      // Refresh the pending request card from pending requests.
      renderDashboardRequest();
      // Remember that the dashboard has real request data or a real empty state now.
      hasLoadedDashboardRequests = true;
    } catch (error) {
      // Only replace the card with an error before the first successful load.
      if (!hasLoadedDashboardRequests && requestNameEl) {
        // Show a readable failure message in the pending request area.
        requestNameEl.textContent = error.message || "Unable to load requests.";
      }
      if (scheduleListEl) {
        // Show a schedule-specific error when the same request load fails.
        scheduleListEl.innerHTML = '<li class="faculty-schedule-empty">Unable to load today&apos;s schedule.</li>';
      }
    } finally {
      // Clear the busy flag so a future manual/visibility refresh can run.
      isLoadingDashboardRequests = false;
    }
  }

  async function updateRequestStatus(requestId, status) {
    // Include role=faculty so dashboard Accept/Decline is handled as the logged-in professor.
    const response = await fetch("api/consultation-requests.php?role=faculty", {
      method: "POST",
      credentials: "same-origin",
      // Send JSON because the PHP API reads the request body with input().
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      // request_id selects the consultation row; status is the new faculty decision.
      body: JSON.stringify({ request_id: requestId, status }),
    });
    // Decode the API response so error messages can be shown.
    const result = await response.json();

    // Bubble API errors back to the button handler.
    if (!response.ok || !result.ok) {
      if (handleAuthFailure(response, result)) {
        throw new Error("AUTH_REQUIRED");
      }
      throw new Error(result.message || "Unable to update consultation request.");
    }
  }

  function getNextPendingRequest() {
    return requests.find((r) => r.status === "pending") || null;
  }

  function renderDashboardRequest() {
    const request = getNextPendingRequest();

    if (!request) {
      // No pending requests left -- reuse the existing markup,
      // just swap its text instead of adding new elements.
      if (requestNameEl) requestNameEl.textContent = "No pending requests right now.";
      if (requestMetaEl) requestMetaEl.style.display = "none";
      if (requestSubjectLabelEl) requestSubjectLabelEl.style.display = "none";
      if (requestSubjectEl) requestSubjectEl.style.display = "none";
      if (requestActionsEl) requestActionsEl.style.display = "none";
      return;
    }

    if (requestMetaEl) requestMetaEl.style.display = "";
    if (requestSubjectLabelEl) requestSubjectLabelEl.style.display = "";
    if (requestSubjectEl) requestSubjectEl.style.display = "";
    if (requestActionsEl) requestActionsEl.style.display = "";

    if (requestNameEl) requestNameEl.textContent = request.name;
    if (requestMetaEl) requestMetaEl.textContent = `${request.program} | ${request.studentId} | ${request.yearSet}`;
    if (requestSubjectEl) requestSubjectEl.textContent = request.type;

    if (acceptButton) {
      acceptButton.textContent = "Accept";
      acceptButton.disabled = false;
      acceptButton.classList.remove("is-accepted");
    }
    if (declineButton) {
      declineButton.textContent = "Decline";
      declineButton.disabled = false;
      declineButton.classList.remove("is-declined");
    }
  }

  loadDashboardRequests({ showLoading: true });

  if (acceptButton) {
    acceptButton.addEventListener("click", async () => {
      const request = getNextPendingRequest();
      if (!request) return;

      acceptButton.textContent = "Accepted";
      acceptButton.disabled = true;
      acceptButton.classList.add("is-accepted");
      if (declineButton) declineButton.disabled = true;

      try {
        await updateRequestStatus(request.id, "approved");
        request.status = "approved";
      } catch (error) {
        if (error.message === "AUTH_REQUIRED") return;
        alert(error.message);
        acceptButton.textContent = "Accept";
        acceptButton.disabled = false;
        acceptButton.classList.remove("is-accepted");
        if (declineButton) declineButton.disabled = false;
        return;
      }

      // Give the person a moment to see "Accepted" before the
      // next pending request takes its place.
      window.setTimeout(loadDashboardRequests, 900);
    });
  }

  if (declineButton) {
    declineButton.addEventListener("click", async () => {
      const request = getNextPendingRequest();
      if (!request) return;

      declineButton.textContent = "Declined";
      declineButton.disabled = true;
      declineButton.classList.add("is-declined");
      if (acceptButton) acceptButton.disabled = true;

      try {
        await updateRequestStatus(request.id, "declined");
        request.status = "declined";
      } catch (error) {
        if (error.message === "AUTH_REQUIRED") return;
        alert(error.message);
        declineButton.textContent = "Decline";
        declineButton.disabled = false;
        declineButton.classList.remove("is-declined");
        if (acceptButton) acceptButton.disabled = false;
        return;
      }

      window.setTimeout(loadDashboardRequests, 900);
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadSavedStatus();
      loadDashboardRequests();
    }
  });

  if (viewMoreButton) {
    viewMoreButton.addEventListener("click", () => {
      window.location.href = "faculty-consultation-requests.html";
    });
  }

});
