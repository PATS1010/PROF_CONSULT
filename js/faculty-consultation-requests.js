// =========================================================
// FACULTY CONSULTATION REQUESTS -- PAGE-SPECIFIC INTERACTIONS
// - Renders Pending (horizontal scroll), Upcoming, and Completed
//   consultations from ONE shared array, so a request moves
//   between sections by changing its `status` field -- never by
//   being copied/duplicated into a different data structure.
// - View More expands a card in place to show Program, Year and
//   Set, and Additional Message. Completed cards use an explicit
//   View More/View Less toggle; Pending/Upcoming collapse when
//   you click outside the expanded card (unchanged from before).
// - Accept moves a request from Pending -> Upcoming.
// - Complete (Upcoming cards only) moves a request from
//   Upcoming -> Completed.
// - Decline (Pending) / Cancel (Upcoming) are the same underlying
//   cancellation logic -- only the button label differs by section.
// - Reschedule navigates to reschedule-consultation.html for that
//   exact consultation.
//
// STATE / STORAGE:
// Consultations persist in localStorage under CONSULTATIONS_STORAGE_KEY
// so Reschedule can update a consultation's date/time on a separate
// page and have it reflected back here. Still no backend -- once one
// exists, loadConsultations()/saveConsultations() are the two
// functions to swap for real API calls; everything else (rendering,
// actions) stays the same.
//
// MOCK/TEST RESET ON REFRESH:
// This is currently a mock/test account, so an actual browser refresh
// (not the normal navigate-away-and-back-from-reschedule flow) wipes
// any Accept/Complete/Decline/Reschedule test changes and restores
// DEFAULT_CONSULTATIONS. isPageReload() distinguishes a real refresh
// from ordinary navigation using the Navigation Timing API. Once real
// accounts/backend exist, this reset behavior is the one thing to
// remove -- loadConsultations() and saveConsultations() themselves
// don't need to change further.
//
// Frontend/prototype only. Shared shell behavior (navbar, sidebar,
// quick action, notification bell) lives in faculty-shared.js and
// is untouched by this file.
// =========================================================

const CONSULTATIONS_STORAGE_KEY = "profconsult_faculty_consultations";
const RESCHEDULE_TARGET_STORAGE_KEY = "profconsult_reschedule_target";

// ---------------------------------------------------------
// Mock consultations -- replace with real data from the backend
// once consultation requests are persisted server-side. Used to
// SEED localStorage on first run AND to restore state whenever
// the page is actually refreshed (mock/test account only -- see
// isPageReload() below).
// ---------------------------------------------------------
const DEFAULT_CONSULTATIONS = [
  {
    id: "req-1",
    name: "Juan Dela Cruz",
    studentId: "22-00145",
    type: "Research Proposal",
    date: "July 20, 10:00 AM",
    preferredDateISO: "2026-07-20",
    preferredTimeLabel: "10:00 AM \u2013 10:30 AM",
    program: "BS Computer Engineering",
    yearSet: "3B",
    message: "Good day po! I'd like to consult about my capstone research proposal title and methodology before I submit it for approval.",
    status: "pending",
  },
  {
    id: "req-2",
    name: "Joselita Rizal",
    studentId: "22-00098",
    type: "Research Proposal",
    date: "July 20, 10:00 AM",
    preferredDateISO: "2026-07-20",
    preferredTimeLabel: "10:00 AM \u2013 10:30 AM",
    program: "BS Computer Engineering",
    yearSet: "3B",
    message: "Hi sir/ma'am, may I request a consultation regarding the scope and limitations section of our group's proposal?",
    status: "pending",
  },
  {
    id: "req-3",
    name: "Mark Santos",
    studentId: "21-00567",
    type: "Thesis Defense Prep",
    date: "July 21, 1:00 PM",
    preferredDateISO: "2026-07-21",
    preferredTimeLabel: "1:00 PM \u2013 1:30 PM",
    program: "BS Computer Engineering",
    yearSet: "4A",
    message: "Requesting a short consultation to go over my defense slides and anticipated panel questions.",
    status: "pending",
  },
  {
    id: "req-4",
    name: "Angela Cruz",
    studentId: "23-00212",
    type: "Grade Concern",
    date: "July 22, 9:30 AM",
    preferredDateISO: "2026-07-22",
    preferredTimeLabel: "9:30 AM \u2013 10:00 AM",
    program: "BS Computer Engineering",
    yearSet: "2A",
    message: "I'd like to clarify some items on my midterm exam whenever you have a free slot this week.",
    status: "pending",
  },
];

// ---------------------------------------------------------
// Detects a real browser refresh (F5 / reload button / Ctrl+R)
// as opposed to arriving here via ordinary navigation (e.g.
// coming back from reschedule-consultation.html). Only a true
// reload should reset the mock/test data.
// ---------------------------------------------------------
function isPageReload() {
  try {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0) return navEntries[0].type === "reload";
    if (performance.navigation) {
      return performance.navigation.type === performance.navigation.TYPE_RELOAD;
    }
  } catch (error) {
    // fall through -- if we can't tell, don't force a reset
  }
  return false;
}

function loadConsultations() {
  try {
    if (isPageReload()) {
      saveConsultations(DEFAULT_CONSULTATIONS);
      return DEFAULT_CONSULTATIONS.slice();
    }
    const stored = localStorage.getItem(CONSULTATIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    // fall through to seeding defaults below
  }
  saveConsultations(DEFAULT_CONSULTATIONS);
  return DEFAULT_CONSULTATIONS.slice();
}

function saveConsultations(list) {
  try {
    localStorage.setItem(CONSULTATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    // Storage unavailable -- state just won't persist across reload/navigation
  }
}

let REQUESTS = loadConsultations();

// ---------------------------------------------------------
// Notification hook -- intentionally a no-op placeholder for
// now. The backend team owns building out the real notification
// system; this just marks where Accept/Complete/Decline/Cancel
// would trigger it once that exists.
// ---------------------------------------------------------
function notifyRequestAnswered(request, decision) {
  // Placeholder only -- wire this to the real notification
  // system once the backend exists. Intentionally does nothing
  // and stores nothing beyond REQUESTS itself.
}

document.addEventListener("DOMContentLoaded", () => {

  const pendingContainer = document.getElementById("requestsScrollContainer");
  const noPendingMessage = document.getElementById("noRequestsMessage");
  const upcomingContainer = document.getElementById("upcomingScrollContainer");
  const noUpcomingMessage = document.getElementById("noUpcomingMessage");
  const completedContainer = document.getElementById("completedScrollContainer");
  const noCompletedMessage = document.getElementById("noCompletedMessage");

  // ---------------------------------------------------------
  // Render
  // One card-builder shared by all three sections -- they're
  // "almost identical", per spec, so the differences (which
  // buttons show, what the secondary button is labeled, the
  // green completed text) are handled with a `section` flag
  // instead of three separate templates.
  // ---------------------------------------------------------
  function buildConsultationCard(request, section) {
    const card = document.createElement("article");
    card.className = "request-card";
    card.dataset.id = request.id;
    card.dataset.section = section;

    const primaryButtonHtml = section === "pending"
      ? `<button type="button" class="request-accept-button" data-action="accept">Accept</button>`
      : section === "upcoming"
        ? `<button type="button" class="request-accept-button" data-action="complete">Complete</button>`
        : ""; // completed: no primary action button

    const secondaryActionLabel = section === "upcoming" ? "Cancel" : "Decline";

    const expandedInfoHtml = `
      <div class="request-expanded-info">
        <div class="request-info-col">
          <p class="request-info-label">Program:</p>
          <p class="request-info-value">${request.program}</p>
          <p class="request-info-label">Year and Set:</p>
          <p class="request-info-value">${request.yearSet}</p>
        </div>
        <div class="request-info-col">
          <p class="request-info-label">Additional Message:</p>
          <p class="request-message">${request.message}</p>
          ${section === "completed" ? '<p class="request-complete-text">Consultation Complete!</p>' : ""}
        </div>
      </div>
    `;

    const actionsHtml = section === "completed"
      ? `<button type="button" class="request-view-more-button request-view-more-button--full" data-action="view-more">View More</button>`
      : `
        <div class="request-actions">
          <button type="button" class="request-view-more-button" data-action="view-more">View More</button>
          <button type="button" class="request-reschedule-button" data-action="reschedule">Reschedule</button>
          <button type="button" class="request-decline-button" data-action="decline">${secondaryActionLabel}</button>
        </div>
      `;

    card.innerHTML = `
      <div class="request-card-header">
        <p class="request-name">${request.name}</p>
        <span class="request-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8v1H4v-1z"></path>
          </svg>
        </span>
        ${primaryButtonHtml}
      </div>

      <p class="request-type">${request.type}</p>
      <p class="request-date">Preferred Date: ${request.date}</p>

      ${expandedInfoHtml}

      ${actionsHtml}
    `;

    return card;
  }

  function renderSection(containerEl, emptyMessageEl, status, section) {
    if (!containerEl) return;
    containerEl.innerHTML = "";

    const items = REQUESTS.filter((request) => request.status === status);
    items.forEach((request) => {
      containerEl.appendChild(buildConsultationCard(request, section));
    });

    if (emptyMessageEl) {
      emptyMessageEl.hidden = items.length > 0;
    }
  }

  function renderAll() {
    renderSection(pendingContainer, noPendingMessage, "pending", "pending");
    renderSection(upcomingContainer, noUpcomingMessage, "upcoming", "upcoming");
    renderSection(completedContainer, noCompletedMessage, "completed", "completed");
  }

  renderAll();

  // ---------------------------------------------------------
  // Card interactions -- delegated per section container so
  // re-rendering never loses event bindings.
  // ---------------------------------------------------------
  function handleAction(event, section) {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;

    const card = actionButton.closest(".request-card");
    if (!card) return;

    const requestId = card.dataset.id;
    const request = REQUESTS.find((r) => r.id === requestId);
    if (!request) return;

    const action = actionButton.dataset.action;

    if (action === "view-more") {
      if (section === "completed") {
        const isExpanded = card.classList.toggle("is-expanded");
        actionButton.textContent = isExpanded ? "View Less" : "View More";
      } else {
        // Only one card expanded at a time, across all sections.
        document.querySelectorAll(".request-card.is-expanded").forEach((c) => {
          if (c !== card) {
            c.classList.remove("is-expanded");
            if (c.dataset.section === "completed") {
              const btn = c.querySelector('[data-action="view-more"]');
              if (btn) btn.textContent = "View More";
            }
          }
        });
        card.classList.add("is-expanded");
      }
      return;
    }

    if (action === "reschedule") {
      try {
        sessionStorage.setItem(RESCHEDULE_TARGET_STORAGE_KEY, request.id);
      } catch (error) {
        // sessionStorage unavailable -- reschedule-consultation.js
        // handles a missing target by returning here gracefully
      }
      window.location.href = "reschedule-consultation.html";
      return;
    }

    if (action === "accept" || action === "complete") {
      const isComplete = action === "complete";

      actionButton.textContent = isComplete ? "Completed" : "Accepted";
      actionButton.disabled = true;
      actionButton.classList.add("is-accepted");

      const declineButton = card.querySelector(".request-decline-button");
      if (declineButton) declineButton.disabled = true;
      const viewMoreButton = card.querySelector(".request-view-more-button");
      if (viewMoreButton) viewMoreButton.disabled = true;
      const rescheduleButton = card.querySelector(".request-reschedule-button");
      if (rescheduleButton) rescheduleButton.disabled = true;

      request.status = isComplete ? "completed" : "upcoming";
      saveConsultations(REQUESTS);
      notifyRequestAnswered(request, isComplete ? "completed" : "accepted");

      // Give the person a moment to see the confirmation text before
      // the card leaves this section and the next one shifts up.
      window.setTimeout(renderAll, 900);
      return;
    }

    if (action === "decline") {
      actionButton.textContent = section === "upcoming" ? "Cancelled" : "Declined";
      actionButton.disabled = true;
      actionButton.classList.add("is-declined");

      const acceptButton = card.querySelector(".request-accept-button");
      if (acceptButton) acceptButton.disabled = true;
      const viewMoreButton = card.querySelector(".request-view-more-button");
      if (viewMoreButton) viewMoreButton.disabled = true;
      const rescheduleButton = card.querySelector(".request-reschedule-button");
      if (rescheduleButton) rescheduleButton.disabled = true;

      // Same cancellation logic for Pending's Decline and Upcoming's
      // Cancel -- only the button label differs by section.
      request.status = "declined";
      saveConsultations(REQUESTS);
      notifyRequestAnswered(request, section === "upcoming" ? "cancelled" : "declined");

      window.setTimeout(renderAll, 900);
      return;
    }
  }

  if (pendingContainer) {
    pendingContainer.addEventListener("click", (event) => handleAction(event, "pending"));
  }
  if (upcomingContainer) {
    upcomingContainer.addEventListener("click", (event) => handleAction(event, "upcoming"));
  }
  if (completedContainer) {
    completedContainer.addEventListener("click", (event) => handleAction(event, "completed"));
  }

  // ---------------------------------------------------------
  // Click outside any expanded card collapses it back (Pending/
  // Upcoming). Completed cards also collapse this way, resetting
  // their button text back to "View More" since they use an
  // explicit label instead of hide-on-expand.
  // ---------------------------------------------------------
  document.addEventListener("click", (event) => {
    const expandedCards = Array.from(document.querySelectorAll(".request-card.is-expanded"));
    if (expandedCards.length === 0) return;

    const clickedInsideAnExpandedCard = expandedCards.some((card) => card.contains(event.target));
    if (clickedInsideAnExpandedCard) return;

    expandedCards.forEach((card) => {
      card.classList.remove("is-expanded");
      if (card.dataset.section === "completed") {
        const btn = card.querySelector('[data-action="view-more"]');
        if (btn) btn.textContent = "View More";
      }
    });
  });

});