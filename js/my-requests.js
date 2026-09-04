// SYSTEM NOTE: Controls client-side behavior for the my requests page, including UI events and API calls.
// =========================================================
// MY CONSULTATION REQUESTS PAGE INTERACTIONS
// - Burger menu + Quick Action: copied verbatim from the
//   proven-working Student Dashboard implementation
// - Notification bell: navigates to notifications.html
// - Renders the current student's database-backed requests
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Burger sidebar: slides in from the left, dims/blurs the
  // dashboard behind it. Closes via the X button or clicking
  // the overlay outside the sidebar.
  // ---------------------------------------------------------
  const hamburgerButton = document.getElementById("hamburgerButton");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarClose = document.getElementById("sidebarClose");

  function openSidebar() {
    sidebar.classList.add("is-open");
    sidebarOverlay.hidden = false;
    // Let the browser paint `hidden` removal first so the
    // opacity transition on the overlay actually animates in
    requestAnimationFrame(() => sidebarOverlay.classList.add("is-open"));
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarOverlay.classList.remove("is-open");
    window.setTimeout(() => {
      sidebarOverlay.hidden = true;
    }, 250); // matches the overlay's CSS transition duration
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

  // ---------------------------------------------------------
  // Quick Action popup: fades/slides in below its trigger icon.
  // Closes when clicking its trigger again or anywhere outside.
  // ---------------------------------------------------------
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
    }, 200); // matches the panel's CSS transition duration
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

  // "Send Request" doesn't have a destination page yet --
  // left wired up but intentionally not navigating anywhere
  const requestConsultationButton = document.getElementById("requestConsultationButton");
  if (requestConsultationButton) {
    requestConsultationButton.addEventListener("click", (event) => {
      event.preventDefault();
      // Future: navigate to the consultation request page once it exists
    });
  }

  // ---------------------------------------------------------
  // Notification bell
  // ---------------------------------------------------------
  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
  }

  // ---------------------------------------------------------
  // Consultation requests from the backend
  // ---------------------------------------------------------
  function statusClass(status) {
    const normalized = String(status || "pending").toLowerCase();
    return normalized === "pending" ? "waiting" : normalized;
  }

  function statusLabel(status) {
    const labels = {
      pending: "Waiting",
      approved: "Approved",
      declined: "Declined",
      rescheduled: "Rescheduled",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    return labels[String(status || "pending").toLowerCase()] || "Waiting";
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }

  function formatTime(value) {
    if (!value) return "";
    const [hours = "0", minutes = "00"] = String(value).split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  function requestFromApi(row) {
    return {
      title: row.Purpose || "Consultation",
      date: formatDate(row.Request_Date),
      time: formatTime(row.Preferred_Time),
      status: statusClass(row.Status),
      statusLabel: statusLabel(row.Status),
    };
  }

  function renderRequests(requests) {
    const listEl = document.getElementById("requestsList");
    const noResultsEl = document.getElementById("noRequestsMessage");
    if (!listEl) return;

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

      // "Completed" shows as plain bold text with no dot,
      // matching the reference design
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

  async function loadRequests(showLoading = false) {
    const listEl = document.getElementById("requestsList");
    const noResultsEl = document.getElementById("noRequestsMessage");
    if (showLoading && listEl) listEl.innerHTML = "";
    if (showLoading && noResultsEl) {
      noResultsEl.textContent = "Loading consultation requests...";
      noResultsEl.hidden = false;
    }

    try {
      const response = await fetch("api/consultation-requests.php?role=student", {
        cache: "no-store",
        headers: { "Accept": "application/json" },
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to load consultation requests.");
      }

      if (noResultsEl) {
        noResultsEl.textContent = "You haven't submitted any consultation requests yet.";
      }
      renderRequests((result.requests || []).map(requestFromApi));
    } catch (error) {
      if (showLoading && noResultsEl) {
        noResultsEl.textContent = error.message || "Unable to load consultation requests.";
        noResultsEl.hidden = false;
      }
    }
  }

  loadRequests(true);

  window.setInterval(() => {
    loadRequests(false);
  }, 5000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadRequests(false);
    }
  });

});
