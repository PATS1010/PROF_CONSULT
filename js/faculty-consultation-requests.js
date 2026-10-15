// Faculty Consultation Requests JS
const CONSULTATIONS_STORAGE_KEY = "profconsult_faculty_consultations";
const RESCHEDULE_TARGET_STORAGE_KEY = "profconsult_reschedule_target";

const NOTIFICATION_VIEW_TARGET_STORAGE_KEY = "profconsult_notification_view_target";

const STUDENT_PROFILE_PAGE_URL = "faculty-student-profile.html";

function getStudentProfileUrl(studentId, from) {
  const params = new URLSearchParams({ studentId: studentId });
  if (from) params.set("from", from);
  return `${STUDENT_PROFILE_PAGE_URL}?${params.toString()}`;
}

const STUDENT_PROFILE_ORIGIN = "consultation-requests";

function studentNameLinkHtml(request) {
  if (!request) return "";
  if (!request.studentId) return request.name;
  return `<a href="${getStudentProfileUrl(request.studentId, STUDENT_PROFILE_ORIGIN)}" class="student-name-link">${request.name}</a>`;
}

const HISTORY_STATUS_INFO = {
  completed: { group: "completed", label: "Completed" },
  declined: { group: "cancelled-rejected", label: "Rejected" },
  cancelled: { group: "cancelled-rejected", label: "Cancelled" },
  ignored: { group: "ignored", label: "Ignored" },
};

const DEFAULT_CONSULTATIONS = [];

function isPageReload() {
  try {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0) return navEntries[0].type === "reload";
    if (performance.navigation) {
      return performance.navigation.type === performance.navigation.TYPE_RELOAD;
    }
  } catch (error) {
  }
  return false;
}

function getTodayISODate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function applyIgnoredStatusToPastPending(list) {
  const todayISO = getTodayISODate();
  let changed = false;

  list.forEach((request) => {
    if (
      request.status === "pending" &&
      request.preferredDateISO &&
      request.preferredDateISO < todayISO
    ) {
      request.status = "ignored";
      changed = true;
    }
  });

  return changed;
}

function loadConsultations() {
  return DEFAULT_CONSULTATIONS.slice();
}

function saveConsultations(list) {
  try {
    localStorage.setItem(CONSULTATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
  }
}

let REQUESTS = loadConsultations();

const CONSULTATION_SLOT_MINUTES = 30;

function formatPreferredDateTime(request) {
  const raw = String((request && request.date) || "");

  if (/\d\s*(AM|PM)\s*[\u2013\u2014-]\s*\d/i.test(raw)) return raw;

  const match = raw.match(/^(.*?)(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i);
  if (!match) return raw;

  const datePrefix = match[1];
  const startHour = parseInt(match[2], 10);
  const startMinute = parseInt(match[3], 10);
  const startPeriod = match[4].toUpperCase();
  const startLabel = `${startHour}:${match[3]} ${startPeriod}`;

  const normalize = (text) => String(text).replace(/\s+/g, "").toUpperCase();

  const label = String((request && request.preferredTimeLabel) || "");
  const labelParts = label.split(/\s*[\u2013\u2014-]\s*/);
  if (
    labelParts.length === 2 &&
    labelParts[1].trim() &&
    normalize(labelParts[0]) === normalize(startLabel)
  ) {
    return `${datePrefix}${startLabel} \u2013 ${labelParts[1].trim()}`;
  }

  const startTotalMinutes =
    ((startHour % 12) + (startPeriod === "PM" ? 12 : 0)) * 60 + startMinute;
  const endTotalMinutes = (startTotalMinutes + CONSULTATION_SLOT_MINUTES) % (24 * 60);
  const endHour24 = Math.floor(endTotalMinutes / 60);
  const endMinute = endTotalMinutes % 60;
  const endPeriod = endHour24 >= 12 ? "PM" : "AM";
  const endHour12 = endHour24 % 12 || 12;
  const endLabel = `${endHour12}:${String(endMinute).padStart(2, "0")} ${endPeriod}`;

  return `${datePrefix}${startLabel} \u2013 ${endLabel}`;
}

function notifyRequestAnswered(request, decision) {
}

function formatTimeRange(timeValue) {
  const [hourText, minuteText] = String(timeValue || "00:00").split(":");
  const start = new Date();
  start.setHours(Number(hourText) || 0, Number(minuteText) || 0, 0, 0);
  const end = new Date(start.getTime() + CONSULTATION_SLOT_MINUTES * 60000);
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${formatter.format(start)} \u2013 ${formatter.format(end)}`;
}

function formatRequestDate(dateValue, timeValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  const dateLabel = Number.isNaN(date.getTime())
    ? String(dateValue || "")
    : date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  return `${dateLabel}, ${formatTimeRange(timeValue).split("\u2013")[0].trim()}`;
}

function mapApiRequest(record) {
  const apiStatus = String(record.Status || "pending").toLowerCase();
  const status = apiStatus === "approved" || apiStatus === "rescheduled" ? "upcoming" : apiStatus;
  return {
    id: String(record.Request_ID),
    name: record.Student_Name || "",
    studentId: record.Student_Number || "",
    type: record.Purpose || "Consultation",
    date: formatRequestDate(record.Request_Date, record.Preferred_Time),
    preferredDateISO: record.Request_Date || "",
    preferredTimeLabel: formatTimeRange(record.Preferred_Time),
    program: record.Program || "",
    yearSet: `${record.Year_Level || ""}${record.Section || ""}`,
    message: record.Additional_Message || "",
    response: record.Response || "",
    status,
  };
}

async function loadRequestsFromApi() {
  const response = await fetch("api/consultation-requests.php?role=faculty", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok || !Array.isArray(result.requests)) {
    throw new Error(result.message || "Unable to load consultation requests.");
  }
  REQUESTS = result.requests.map(mapApiRequest);
}

async function updateRequestStatus(request, status) {
  const response = await fetch("api/consultation-requests.php", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      role: "faculty",
      request_id: Number(request.id),
      status,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Unable to update consultation request.");
  }
}

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
  }

  const card = document.querySelector(`.request-card[data-id="${target.id}"]`);
  if (!card) return;

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

  const historyToggleButton = document.getElementById("historyToggleButton");
  const requestsSubtitle = document.getElementById("requestsSubtitle");
  const pendingSectionCard = document.getElementById("pendingSectionCard");
  const consultationSectionsGrid = document.getElementById("consultationSectionsGrid");
  const historyCard = document.getElementById("historyCard");

  const historySectionsGrid = document.getElementById("historySectionsGrid");
  const historyCompletedList = document.getElementById("historyCompletedList");
  const historyCancelledRejectedList = document.getElementById("historyCancelledRejectedList");
  const historyIgnoredList = document.getElementById("historyIgnoredList");
  const historyCompletedEmptyMessage = document.getElementById("historyCompletedEmptyMessage");
  const historyCancelledRejectedEmptyMessage = document.getElementById("historyCancelledRejectedEmptyMessage");
  const historyIgnoredEmptyMessage = document.getElementById("historyIgnoredEmptyMessage");
  const historyEmptyMessage = document.getElementById("historyEmptyMessage");

  const historyClearButton = document.getElementById("historyClearButton");
  const historyConfirmRow = document.getElementById("historyConfirmRow");
  const historyConfirmYesButton = document.getElementById("historyConfirmYesButton");
  const historyConfirmCancelButton = document.getElementById("historyConfirmCancelButton");

  function buildConsultationCard(request, section) {
    const card = document.createElement("article");
    card.className = "request-card";
    card.dataset.id = request.id;
    card.dataset.section = section;

    const primaryButtonHtml = section === "pending"
      ? `<button type="button" class="request-accept-button" data-action="accept">Accept</button>`
      : section === "upcoming"
        ? `<button type="button" class="request-accept-button" data-action="complete">Complete</button>`
        : "";

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
          ${request.response ? `<p class="request-info-label">Faculty Response:</p><p class="request-message">${request.response}</p>` : ""}
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
        <p class="request-name">${studentNameLinkHtml(request)}</p>
        <span class="request-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4"></circle>
            <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8v1H4v-1z"></path>
          </svg>
        </span>
        ${primaryButtonHtml}
      </div>

      <p class="request-type">${request.type}</p>
      <p class="request-date">Preferred Date: ${formatPreferredDateTime(request)}</p>

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

  function buildHistoryEntry(request) {
    const entry = document.createElement("article");
    entry.className = "history-entry";
    entry.dataset.id = request.id;

    const info = HISTORY_STATUS_INFO[request.status];
    const statusLabel = info ? info.label : "";
    const statusModifierClass = `history-entry-status--${request.status}`;

    entry.innerHTML = `
      <p class="history-entry-name">${studentNameLinkHtml(request)}</p>
      <p class="history-entry-type">${request.type}</p>
      <p class="history-entry-date">Preferred Date: ${formatPreferredDateTime(request)}</p>
      <p class="history-entry-status ${statusModifierClass}">${statusLabel}</p>
    `;

    return entry;
  }

  function renderHistory() {
    if (!historyCompletedList || !historyCancelledRejectedList || !historyIgnoredList) return;

    historyCompletedList.innerHTML = "";
    historyCancelledRejectedList.innerHTML = "";
    historyIgnoredList.innerHTML = "";

    const groupCounts = { completed: 0, "cancelled-rejected": 0, ignored: 0 };

    REQUESTS.forEach((request) => {
      const info = HISTORY_STATUS_INFO[request.status];
      if (!info) return;

      const entry = buildHistoryEntry(request);

      if (info.group === "completed") {
        historyCompletedList.appendChild(entry);
      } else if (info.group === "cancelled-rejected") {
        historyCancelledRejectedList.appendChild(entry);
      } else if (info.group === "ignored") {
        historyIgnoredList.appendChild(entry);
      }

      groupCounts[info.group] += 1;
    });

    if (historyCompletedEmptyMessage) {
      historyCompletedEmptyMessage.hidden = groupCounts.completed > 0;
    }
    if (historyCancelledRejectedEmptyMessage) {
      historyCancelledRejectedEmptyMessage.hidden = groupCounts["cancelled-rejected"] > 0;
    }
    if (historyIgnoredEmptyMessage) {
      historyIgnoredEmptyMessage.hidden = groupCounts.ignored > 0;
    }

    const totalHistoryItems =
      groupCounts.completed + groupCounts["cancelled-rejected"] + groupCounts.ignored;

    if (historySectionsGrid) {
      historySectionsGrid.hidden = totalHistoryItems === 0;
    }
    if (historyEmptyMessage) {
      historyEmptyMessage.hidden = totalHistoryItems > 0;
    }

    if (historyClearButton) {
      historyClearButton.hidden = totalHistoryItems === 0;
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

  loadRequestsFromApi()
    .then(() => {
      applyIgnoredStatusToPastPending(REQUESTS);
      renderAll();
    })
    .catch(() => {
      REQUESTS = [];
      renderAll();
    });

  applyNotificationViewTarget();

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
      REQUESTS = REQUESTS.filter(
        (request) => !Object.prototype.hasOwnProperty.call(HISTORY_STATUS_INFO, request.status)
      );

      saveConsultations(REQUESTS);

      renderHistory();
      renderAll();
    });
  }

  async function handleAction(event, section) {
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
        saveConsultations(REQUESTS);
        sessionStorage.setItem(RESCHEDULE_TARGET_STORAGE_KEY, request.id);
      } catch (error) {
      }
      window.location.href = `reschedule-consultation.html?request_id=${encodeURIComponent(request.id)}`;
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

      try {
        await updateRequestStatus(request, isComplete ? "completed" : "approved");
        request.status = isComplete ? "completed" : "upcoming";
        notifyRequestAnswered(request, isComplete ? "completed" : "accepted");
      } catch (error) {
        window.alert(error.message || "Unable to update request.");
      }

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

      try {
        await updateRequestStatus(request, isCancel ? "cancelled" : "declined");
        request.status = isCancel ? "cancelled" : "declined";
        notifyRequestAnswered(request, isCancel ? "cancelled" : "declined");
      } catch (error) {
        window.alert(error.message || "Unable to update request.");
      }

      window.setTimeout(renderAll, 900);
      return;
    }
  }

  if (pendingContainer) {
    pendingContainer.addEventListener("click", (event) => {
      handleAction(event, "pending");
    });
  }
  if (upcomingContainer) {
    upcomingContainer.addEventListener("click", (event) => {
      handleAction(event, "upcoming");
    });
  }
  if (completedContainer) {
    completedContainer.addEventListener("click", (event) => {
      handleAction(event, "completed");
    });
  }

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
