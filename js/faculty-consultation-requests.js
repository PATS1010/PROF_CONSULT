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
// - Decline (Pending) sets status "declined"; Cancel (Upcoming)
//   sets status "cancelled" -- two distinct outcomes (previously
//   both wrote "declined", since neither was ever rendered
//   anywhere; History now needs to tell them apart, so this is
//   the one status-model change this feature required).
// - Reschedule navigates to reschedule-consultation.html for that
//   exact consultation.
// - History: an in-page view (no navigation/reload) listing every
//   request whose status is "declined", "cancelled", or
//   "completed" -- i.e. it reads the exact same REQUESTS array as
//   everything else above, just filtered differently. Clear All
//   removes those entries from REQUESTS entirely (after an inline
//   confirm), which is also why it empties the Completed
//   Consultations panel for any consultation cleared this way --
//   same record, two views of it.
// - Faculty Notifications reads this same localStorage data to
//   build its "sent a request for consultation" / "is today at"
//   notifications (see faculty-notifications.js). A notification's
//   "View" link stores which request/section to open under
//   NOTIFICATION_VIEW_TARGET_STORAGE_KEY (ADDED below); on load
//   here we check for that and auto-expand/scroll to that card.
//
// STATE / STORAGE:
// Consultations persist in localStorage under CONSULTATIONS_STORAGE_KEY
// so Reschedule can update a consultation's date/time on a separate
// page and have it reflected back here. Still no backend -- once one
// exists, loadConsultations()/saveConsultations() are the two
// functions to swap for real API calls; everything else (rendering,
// actions, History) stays the same.
//
// MOCK/TEST RESET ON REFRESH:
// This is currently a mock/test account, so an actual browser refresh
// (not the normal navigate-away-and-back-from-reschedule flow) wipes
// any Accept/Complete/Decline/Cancel/Reschedule test changes (History
// included, since it's the same data) and restores
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
// (ADDED) Read by this page on load to auto-expand/scroll to
// the exact request a Faculty Notifications "View" link pointed
// at. Written by faculty-notifications.js right before it
// navigates here -- see applyNotificationViewTarget() below.
// ---------------------------------------------------------
const NOTIFICATION_VIEW_TARGET_STORAGE_KEY = "profconsult_notification_view_target";

// ---------------------------------------------------------
// History status labels -- maps a consultation's stored
// `status` to the plain label History shows for it. Only
// these three statuses ever appear in History.
// ---------------------------------------------------------
const HISTORY_STATUS_LABELS = {
  declined: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
};

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

// ---------------------------------------------------------
// (ADDED) Auto-expand/scroll to the request a Faculty
// Notifications "View" link pointed at. Searches across
// whichever section the card actually rendered in (its status
// may have changed since the notification was shown), not just
// the section that was stored, so this stays correct even if
// stale. One-time use: the stored target is removed immediately
// so a later real page refresh/navigation never re-triggers it.
// ---------------------------------------------------------
function applyNotificationViewTarget() {
  let target = null;

  try {
    const stored = sessionStorage.getItem(NOTIFICATION_VIEW_TARGET_STORAGE_KEY);
    if (stored) target = JSON.parse(stored);
  } catch (error) {
    target = null;
  }

  if (!target || !target.id) return;

  try {
    sessionStorage.removeItem(NOTIFICATION_VIEW_TARGET_STORAGE_KEY);
  } catch (error) {
    // ignore
  }

  const card = document.querySelector(`.request-card[data-id="${target.id}"]`);
  if (!card) return;

  // Same "only one expanded at a time" rule as a normal View More click.
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
  if (card.dataset.section === "completed") {
    const btn = card.querySelector('[data-action="view-more"]');
    if (btn) btn.textContent = "View Less";
  }

  card.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
}

document.addEventListener("DOMContentLoaded", () => {

  const pendingContainer = document.getElementById("requestsScrollContainer");
  const noPendingMessage = document.getElementById("noRequestsMessage");
  const upcomingContainer = document.getElementById("upcomingScrollContainer");
  const noUpcomingMessage = document.getElementById("noUpcomingMessage");
  const completedContainer = document.getElementById("completedScrollContainer");
  const noCompletedMessage = document.getElementById("noCompletedMessage");

  // ---------------------------------------------------------
  // History view elements
  // ---------------------------------------------------------
  const historyToggleButton = document.getElementById("historyToggleButton");
  const requestsSubtitle = document.getElementById("requestsSubtitle");
  const pendingSectionCard = document.getElementById("pendingSectionCard");
  const consultationSectionsGrid = document.getElementById("consultationSectionsGrid");
  const historyCard = document.getElementById("historyCard");
  const historyEntriesList = document.getElementById("historyEntriesList");
  const historyEmptyMessage = document.getElementById("historyEmptyMessage");
  const historyClearButton = document.getElementById("historyClearButton");
  const historyConfirmRow = document.getElementById("historyConfirmRow");
  const historyConfirmYesButton = document.getElementById("historyConfirmYesButton");
  const historyConfirmCancelButton = document.getElementById("historyConfirmCancelButton");

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

  // ---------------------------------------------------------
  // History
  // Plain, non-interactive entries -- no Accept/Decline/
  // Reschedule/Complete/View More, per spec. Just the student
  // name, purpose, and the outcome label.
  // ---------------------------------------------------------
  function buildHistoryEntry(request) {
    const entry = document.createElement("article");
    entry.className = "history-entry";
    entry.dataset.id = request.id;

    const statusLabel = HISTORY_STATUS_LABELS[request.status] || "";
    const statusModifierClass = `history-entry-status--${request.status}`;

    entry.innerHTML = `
      <p class="history-entry-name">${request.name}</p>
      <p class="history-entry-type">${request.type}</p>
      <p class="history-entry-date">Preferred Date: ${request.date}</p>
      <p class="history-entry-status ${statusModifierClass}">${statusLabel}</p>
    `;

    return entry;
  }

  function renderHistory() {
    if (!historyEntriesList) return;
    historyEntriesList.innerHTML = "";

    const historyItems = REQUESTS.filter(
      (request) => Object.prototype.hasOwnProperty.call(HISTORY_STATUS_LABELS, request.status)
    );

    historyItems.forEach((request) => {
      historyEntriesList.appendChild(buildHistoryEntry(request));
    });

    if (historyEmptyMessage) {
      historyEmptyMessage.hidden = historyItems.length > 0;
    }

    // Nothing to clear -- hide Clear All (and make sure any open
    // confirm prompt from a previous state doesn't linger).
    if (historyClearButton) {
      historyClearButton.hidden = historyItems.length === 0;
    }
    if (historyConfirmRow) {
      historyConfirmRow.hidden = true;
    }
  }

  function renderAll() {
    renderSection(pendingContainer, noPendingMessage, "pending", "pending");
    renderSection(upcomingContainer, noUpcomingMessage, "upcoming", "upcoming");
    renderSection(completedContainer, noCompletedMessage, "completed", "completed");
  }

  renderAll();

  // (ADDED) After the very first render, check whether we arrived
  // here from a Faculty Notifications "View" link and, if so,
  // auto-expand/scroll to that exact card.
  applyNotificationViewTarget();

  // ---------------------------------------------------------
  // History / Back toggle
  // Shows/hides in place -- no navigation, no reload.
  // ---------------------------------------------------------
  let isHistoryOpen = false;

  function showHistoryView() {
    isHistoryOpen = true;

    if (requestsSubtitle) requestsSubtitle.hidden = true;
    if (pendingSectionCard) pendingSectionCard.hidden = true;
    if (consultationSectionsGrid) consultationSectionsGrid.hidden = true;

    if (historyCard) historyCard.hidden = false;
    if (historyToggleButton) historyToggleButton.textContent = "Back";

    renderHistory();
  }

  function showPendingView() {
    isHistoryOpen = false;

    if (historyCard) historyCard.hidden = true;
    if (historyToggleButton) historyToggleButton.textContent = "History";

    if (requestsSubtitle) requestsSubtitle.hidden = false;
    if (pendingSectionCard) pendingSectionCard.hidden = false;
    if (consultationSectionsGrid) consultationSectionsGrid.hidden = false;
  }

  if (historyToggleButton) {
    historyToggleButton.addEventListener("click", () => {
      if (isHistoryOpen) {
        showPendingView();
      } else {
        showHistoryView();
      }
    });
  }

  // ---------------------------------------------------------
  // Clear All -- inline confirm/cancel, nothing removed until
  // the confirm button is actually clicked.
  // ---------------------------------------------------------
  if (historyClearButton) {
    historyClearButton.addEventListener("click", () => {
      historyClearButton.hidden = true;
      if (historyConfirmRow) historyConfirmRow.hidden = false;
    });
  }

  if (historyConfirmCancelButton) {
    historyConfirmCancelButton.addEventListener("click", () => {
      if (historyConfirmRow) historyConfirmRow.hidden = true;
      if (historyClearButton) historyClearButton.hidden = false;
    });
  }

  if (historyConfirmYesButton) {
    historyConfirmYesButton.addEventListener("click", () => {
      // Remove every declined/cancelled/completed record entirely.
      // This is the same underlying data the Completed Consultations
      // panel reads, so clearing History also empties that panel for
      // any consultation removed this way.
      REQUESTS = REQUESTS.filter(
        (request) => !Object.prototype.hasOwnProperty.call(HISTORY_STATUS_LABELS, request.status)
      );

      saveConsultations(REQUESTS);

      renderHistory();
      renderAll();
    });
  }

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
      const isCancel = section === "upcoming";

      actionButton.textContent = isCancel ? "Cancelled" : "Declined";
      actionButton.disabled = true;
      actionButton.classList.add("is-declined");

      const acceptButton = card.querySelector(".request-accept-button");
      if (acceptButton) acceptButton.disabled = true;
      const viewMoreButton = card.querySelector(".request-view-more-button");
      if (viewMoreButton) viewMoreButton.disabled = true;
      const rescheduleButton = card.querySelector(".request-reschedule-button");
      if (rescheduleButton) rescheduleButton.disabled = true;

      // Pending's Decline and Upcoming's Cancel are different real
      // outcomes -- distinct statuses so History can label them
      // correctly ("Rejected" vs "Cancelled").
      request.status = isCancel ? "cancelled" : "declined";
      saveConsultations(REQUESTS);
      notifyRequestAnswered(request, isCancel ? "cancelled" : "declined");

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