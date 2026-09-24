// SYSTEM NOTE: Controls client-side behavior for the faculty consultation requests page, including UI events and API calls.
// =========================================================
// FACULTY CONSULTATION REQUESTS -- PAGE-SPECIFIC INTERACTIONS
// - Renders pending requests from api/consultation-requests.php.
// - View More expands a card in place to show Program, Year
//   and Set, and Additional Message; clicking outside any
//   expanded card collapses it back.
// - Accept / Decline mark the request answered, then remove it
//   from the pending queue so the next one moves up.
// - Reschedule is a frontend-only placeholder for now.
//
// Shared shell behavior (navbar, sidebar, quick action,
// notification bell) lives in faculty-shared.js and is untouched
// by this file.
// =========================================================

let REQUESTS = [];

document.addEventListener("DOMContentLoaded", () => {

  const scrollContainer = document.getElementById("requestsScrollContainer");
  const noRequestsMessage = document.getElementById("noRequestsMessage");

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;",
    }[character]));
  }

  function formatDateTime(dateValue, timeValue) {
    if (!dateValue) return "Date not set";

    const [hours = "00", minutes = "00"] = String(timeValue || "00:00").split(":");
    const date = new Date(`${dateValue}T${hours}:${minutes}:00`);
    if (Number.isNaN(date.getTime())) return `${dateValue} ${timeValue || ""}`.trim();

    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

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
    // Convert the database year value into the label shown on request cards.
    const year = displayYear(row.Year_Level);
    // Keep the section separate so blank sections do not create extra punctuation.
    const section = row.Section || "";

    return {
      // Store the database request id so button clicks update the correct row.
      id: String(row.Request_ID),
      // Show the real student name from the joined users table.
      name: row.Student_Name || "Unnamed Student",
      // Prefer the user's student number, then fall back to the profile id.
      studentId: row.Student_Number || row.Student_ID || "",
      // Purpose becomes the request subject displayed on the card.
      type: row.Purpose || "Consultation",
      // Combine the saved request date and preferred time for display.
      date: formatDateTime(row.Request_Date, row.Preferred_Time),
      // Program, year, section, and message come from the current student's profile/request.
      program: row.Program || "Program not set",
      yearSet: [year, section].filter(Boolean).join(" - ") || "Year and section not set",
      message: row.Additional_Message || "No additional message.",
      // Status controls whether the request remains visible in the pending list.
      status: row.Status || "pending",
    };
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

  async function loadRequests() {
    if (scrollContainer) {
      scrollContainer.innerHTML = "";
    }
    if (noRequestsMessage) {
      noRequestsMessage.textContent = "Loading consultation requests...";
      noRequestsMessage.hidden = false;
    }

    try {
      // Ask the API for faculty requests so the backend uses the professor session.
      const response = await fetch("api/consultation-requests.php?role=faculty", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Accept": "application/json" },
      });
      // Parse the JSON reply from the API.
      const result = await response.json();

      // Stop rendering if the API reports an authentication or database problem.
      if (!response.ok || !result.ok) {
        if (handleAuthFailure(response, result)) return;
        throw new Error(result.message || "Unable to load consultation requests.");
      }

      // Convert raw database rows into the card shape used by this page.
      REQUESTS = (result.requests || []).map(requestFromApi);
      // Rebuild the visible cards after loading fresh data.
      renderRequests();
    } catch (error) {
      if (noRequestsMessage) {
        noRequestsMessage.textContent = error.message || "Unable to load consultation requests.";
        noRequestsMessage.hidden = false;
      }
    }
  }

  async function updateRequestStatus(requestId, status) {
    // Include role=faculty so Accept/Reschedule/Decline uses the professor session.
    const response = await fetch("api/consultation-requests.php?role=faculty", {
      method: "POST",
      credentials: "same-origin",
      // Tell PHP that the request body is JSON.
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      // Send the selected request id and the new status to the backend.
      body: JSON.stringify({ request_id: requestId, status }),
    });
    // Read the backend response so errors can be shown to the professor.
    const result = await response.json();

    // Turn API failures into an error message the click handler can alert.
    if (!response.ok || !result.ok) {
      if (handleAuthFailure(response, result)) {
        throw new Error("AUTH_REQUIRED");
      }
      throw new Error(result.message || "Unable to update consultation request.");
    }
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  function buildRequestCard(request) {
    const card = document.createElement("article");
    card.className = "request-card";
    card.dataset.id = request.id;

    card.innerHTML = `
      <div class="request-card-header">
        <p class="request-name">${escapeHtml(request.name)}</p>
        <span class="request-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8v1H4v-1z"></path>
          </svg>
        </span>
        <button type="button" class="request-accept-button" data-action="accept">Accept</button>
      </div>

      <p class="request-type">${escapeHtml(request.type)}</p>
      <p class="request-date">Preferred Date: ${escapeHtml(request.date)}</p>

      <div class="request-expanded-info">
        <div class="request-info-col">
          <p class="request-info-label">Student ID:</p>
          <p class="request-info-value">${escapeHtml(request.studentId)}</p>
          <p class="request-info-label">Program:</p>
          <p class="request-info-value">${escapeHtml(request.program)}</p>
          <p class="request-info-label">Year and Set:</p>
          <p class="request-info-value">${escapeHtml(request.yearSet)}</p>
        </div>
        <div class="request-info-col">
          <p class="request-info-label">Additional Message:</p>
          <p class="request-message">${escapeHtml(request.message)}</p>
        </div>
      </div>

      <div class="request-actions">
        <button type="button" class="request-view-more-button" data-action="view-more">View More</button>
        <button type="button" class="request-reschedule-button" data-action="reschedule">Reschedule</button>
        <button type="button" class="request-decline-button" data-action="decline">Decline</button>
      </div>

      <p class="request-toast" aria-live="polite"></p>
    `;

    return card;
  }

  function renderRequests() {
    if (!scrollContainer) return;
    scrollContainer.innerHTML = "";

    const pending = REQUESTS.filter((request) => request.status === "pending");

    pending.forEach((request) => {
      scrollContainer.appendChild(buildRequestCard(request));
    });

    if (noRequestsMessage) {
      noRequestsMessage.textContent = "No pending consultation requests right now.";
      noRequestsMessage.hidden = pending.length > 0;
    }
  }

  loadRequests();

  // ---------------------------------------------------------
  // Card interactions -- delegated to the scroll container so
  // re-rendering never loses event bindings.
  // ---------------------------------------------------------
  if (scrollContainer) {
    scrollContainer.addEventListener("click", async (event) => {
      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) return;

      const card = actionButton.closest(".request-card");
      if (!card) return;

      const requestId = card.dataset.id;
      const request = REQUESTS.find((r) => r.id === requestId);
      if (!request) return;

      const action = actionButton.dataset.action;

      if (action === "view-more") {
        // Only one card expanded at a time.
        Array.from(scrollContainer.querySelectorAll(".request-card")).forEach((c) => {
          if (c !== card) c.classList.remove("is-expanded");
        });
        card.classList.add("is-expanded");
      }

      if (action === "reschedule") {
        const toast = card.querySelector(".request-toast");
        actionButton.textContent = "Rescheduled";
        actionButton.disabled = true;

        try {
          await updateRequestStatus(request.id, "rescheduled");
          request.status = "rescheduled";
        } catch (error) {
          if (error.message === "AUTH_REQUIRED") return;
          alert(error.message);
          actionButton.textContent = "Reschedule";
          actionButton.disabled = false;
          return;
        }

        if (toast) {
          toast.textContent = "Request marked for reschedule.";
          toast.classList.add("is-visible");
        }
        window.setTimeout(renderRequests, 900);
      }

      if (action === "accept") {
        actionButton.textContent = "Accepted";
        actionButton.disabled = true;
        actionButton.classList.add("is-accepted");
        const declineButton = card.querySelector(".request-decline-button");
        if (declineButton) declineButton.disabled = true;
        const viewMoreButton = card.querySelector(".request-view-more-button");
        if (viewMoreButton) viewMoreButton.disabled = true;

        try {
          await updateRequestStatus(request.id, "approved");
          request.status = "approved";
        } catch (error) {
          if (error.message === "AUTH_REQUIRED") return;
          alert(error.message);
          actionButton.textContent = "Accept";
          actionButton.disabled = false;
          actionButton.classList.remove("is-accepted");
          if (declineButton) declineButton.disabled = false;
          if (viewMoreButton) viewMoreButton.disabled = false;
          return;
        }

        // Give the person a moment to see "Accepted" before the
        // card leaves the pending queue and the next one shifts up.
        window.setTimeout(renderRequests, 900);
      }

      if (action === "decline") {
        actionButton.textContent = "Declined";
        actionButton.disabled = true;
        actionButton.classList.add("is-declined");
        const acceptButton = card.querySelector(".request-accept-button");
        if (acceptButton) acceptButton.disabled = true;
        const viewMoreButton = card.querySelector(".request-view-more-button");
        if (viewMoreButton) viewMoreButton.disabled = true;

        try {
          await updateRequestStatus(request.id, "declined");
          request.status = "declined";
        } catch (error) {
          if (error.message === "AUTH_REQUIRED") return;
          alert(error.message);
          actionButton.textContent = "Decline";
          actionButton.disabled = false;
          actionButton.classList.remove("is-declined");
          if (acceptButton) acceptButton.disabled = false;
          if (viewMoreButton) viewMoreButton.disabled = false;
          return;
        }

        window.setTimeout(renderRequests, 900);
      }
    });
  }

  // ---------------------------------------------------------
  // Click outside any expanded card collapses it back.
  // ---------------------------------------------------------
  document.addEventListener("click", (event) => {
    if (!scrollContainer) return;
    const expandedCards = Array.from(scrollContainer.querySelectorAll(".request-card.is-expanded"));
    if (expandedCards.length === 0) return;

    const clickedInsideAnExpandedCard = expandedCards.some((card) => card.contains(event.target));
    if (!clickedInsideAnExpandedCard) {
      expandedCards.forEach((card) => card.classList.remove("is-expanded"));
    }
  });

});
