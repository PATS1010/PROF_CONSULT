// My Consultation Requests

document.addEventListener("DOMContentLoaded", () => {

  const hamburgerButton = document.getElementById("hamburgerButton");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarClose = document.getElementById("sidebarClose");

  function openSidebar() {
    sidebar.classList.add("is-open");
    sidebarOverlay.hidden = false;
    requestAnimationFrame(() => sidebarOverlay.classList.add("is-open"));
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarOverlay.classList.remove("is-open");
    window.setTimeout(() => {
      sidebarOverlay.hidden = true;
    }, 250);
  }

  if (hamburgerButton) {
    hamburgerButton.addEventListener("click", openSidebar);
  }
  if (sidebarClose) {
    sidebarClose.addEventListener("click", closeSidebar);
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }

  const quickActionButton = document.getElementById("quickActionButton");
  const quickActionPanel = document.getElementById("quickActionPanel");

  function openQuickAction() {
    quickActionPanel.hidden = false;
    requestAnimationFrame(() => quickActionPanel.classList.add("is-open"));
    quickActionButton.setAttribute("aria-expanded", "true");
  }

  function closeQuickAction() {
    quickActionPanel.classList.remove("is-open");
    quickActionButton.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      quickActionPanel.hidden = true;
    }, 200);
  }

  if (quickActionButton) {
    quickActionButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = quickActionPanel.classList.contains("is-open");
      if (isOpen) {
        closeQuickAction();
      } else {
        openQuickAction();
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (
      quickActionPanel &&
      !quickActionPanel.hidden &&
      !quickActionPanel.contains(event.target) &&
      event.target !== quickActionButton
    ) {
      closeQuickAction();
    }
  });

  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
    if (window.ProfConsultNotifications) {
      window.ProfConsultNotifications.renderBellIndicator(notificationBellButton);
    }
  }

  let REQUESTS = [];

  const MONTH_INDEX = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  function parseRequestDate(request) {
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(request.dateISO || request.date || "").trim());
    if (iso) {
      return Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    }

    const text = String(request.date || "");
    const pattern = /([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const month = MONTH_INDEX[match[1].slice(0, 3).toLowerCase()];
      if (month === undefined) continue;

      const year = match[3] ? Number(match[3]) : new Date().getFullYear();
      return Date.UTC(year, month, Number(match[2]));
    }

    return null;
  }

  function parseRequestTime(request) {
    const match = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(String(request.time || ""));
    if (!match) return 0;

    let hours = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hours += 12;
    return hours * 60 + Number(match[2]);
  }

  function compareByDateTime(a, b) {
    const dateA = parseRequestDate(a);
    const dateB = parseRequestDate(b);

    if (dateA === null && dateB === null) return 0;
    if (dateA === null) return 1;
    if (dateB === null) return -1;
    if (dateA !== dateB) return dateB - dateA;

    return parseRequestTime(b) - parseRequestTime(a);
  }

  function formatTimeLabel(timeValue) {
    const [hourText, minuteText] = String(timeValue || "00:00").split(":");
    const date = new Date();
    date.setHours(Number(hourText) || 0, Number(minuteText) || 0, 0, 0);
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  function mapApiRequest(record) {
    const status = String(record.Status || "pending").toLowerCase();
    const statusMap = {
      pending: ["waiting", "Waiting"],
      approved: ["approved", "Approved"],
      rescheduled: ["approved", "Rescheduled"],
      completed: ["completed", "Completed"],
      declined: ["declined", "Declined"],
      cancelled: ["declined", "Cancelled"],
    };
    const mappedStatus = statusMap[status] || ["waiting", status || "Pending"];
    return {
      title: record.Purpose || "Consultation",
      date: record.Request_Date || "",
      dateISO: record.Request_Date || "",
      time: formatTimeLabel(record.Preferred_Time),
      status: mappedStatus[0],
      statusLabel: mappedStatus[1],
    };
  }

  function renderRequests() {
    const listEl = document.getElementById("requestsList");
    const noResultsEl = document.getElementById("noRequestsMessage");
    if (!listEl) return;

    const requests = REQUESTS.slice().sort(compareByDateTime);

    listEl.innerHTML = "";

    if (requests.length === 0) {
      noResultsEl.hidden = false;
      return;
    }
    noResultsEl.hidden = true;

    requests.forEach((request) => {
      const card = document.createElement("article");
      card.className = "request-card";

      const title = document.createElement("h2");
      title.className = "request-card-title";
      title.textContent = request.title;
      card.appendChild(title);

      const body = document.createElement("div");
      body.className = "request-card-body";

      const date = document.createElement("p");
      date.className = "request-card-date";
      date.textContent = request.date;
      body.appendChild(date);

      if (request.time) {
        const time = document.createElement("p");
        time.className = "request-card-time";
        time.textContent = request.time;
        body.appendChild(time);
      }

      const statusLabel = document.createElement("p");
      statusLabel.className = "request-status-label";
      statusLabel.textContent = "Status:";
      body.appendChild(statusLabel);

      const status = document.createElement("p");
      status.className = "request-status";

      if (request.status !== "completed") {
        const dot = document.createElement("span");
        dot.className = `status-dot status-${request.status}`;
        dot.setAttribute("aria-hidden", "true");
        status.appendChild(dot);
      }

      const statusText = document.createElement("span");
      statusText.textContent = request.statusLabel;
      status.appendChild(statusText);

      body.appendChild(status);
      card.appendChild(body);

      listEl.appendChild(card);
    });
  }

  fetch("api/consultation-requests.php?role=student", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((result) => {
      REQUESTS = Array.isArray(result.requests) ? result.requests.map(mapApiRequest) : [];
      renderRequests();
    })
    .catch(() => {
      REQUESTS = [];
      renderRequests();
    });

});
// Logout confirmation modal
document.addEventListener("DOMContentLoaded", () => {

  const logoutLink = document.getElementById("logoutLink");
  if (!logoutLink) return;

  const overlay = document.createElement("div");
  overlay.className = "pc-logout-overlay";
  overlay.hidden = true;

  overlay.innerHTML = `
    <div class="pc-logout-modal" role="dialog" aria-modal="true" aria-label="Log out of your account?">
      <div class="pc-logout-modal-header">
        <button type="button" class="pc-logout-modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="pc-logout-modal-body">
        <p class="pc-logout-modal-title">Log out of your account?</p>
        <div class="pc-logout-modal-actions">
          <button type="button" class="pc-logout-cancel-button">Cancel</button>
          <button type="button" class="pc-logout-yes-button">Yes</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector(".pc-logout-modal-close");
  const cancelButton = overlay.querySelector(".pc-logout-cancel-button");
  const yesButton = overlay.querySelector(".pc-logout-yes-button");

  function openModal() {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("is-open"));
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    window.setTimeout(() => {
      overlay.hidden = true;
    }, 200);
  }

  closeButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  yesButton.addEventListener("click", () => {
    const redirectPage = logoutLink.getAttribute("href") || "login.html";
    if (window.ProfConsultAuth && window.ProfConsultAuth.logout) {
      window.ProfConsultAuth.logout(redirectPage);
      return;
    }
    window.location.replace(redirectPage);
  });

  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    openModal();
  });

});
