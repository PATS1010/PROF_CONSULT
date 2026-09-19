// =========================================================
// MY CONSULTATION REQUESTS PAGE INTERACTIONS
// - Burger menu + Quick Action: copied verbatim from the
//   proven-working Student Dashboard implementation
// - Notification bell icon: navigates to notifications.html
//   and shows the shared unread-indicator badge (see
//   notification-state.js / window.ProfConsultNotifications)
// - Renders sample requests plus any real requests the student
//   has submitted (read from the same localStorage list that
//   request-consultation.js appends to on every submission)
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

  

  // ---------------------------------------------------------
  // Notification bell -- navigates to notifications.html, and
  // renders the shared unread-indicator badge (read-only here;
  // only notifications.js clears the state).
  // ---------------------------------------------------------
  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
    if (window.ProfConsultNotifications) {
      window.ProfConsultNotifications.renderBellIndicator(notificationBellButton);
    }
  }

  // ---------------------------------------------------------
  // Consultation requests
  // Sample data for the current test student account (matches
  // the reference design), combined with any real requests the
  // student has actually submitted via Request Consultation --
  // those are read from the same localStorage list that
  // request-consultation.js appends to on every submission,
  // which is what makes this list grow automatically over time.
  // Replace SAMPLE_REQUESTS with a real API call once a backend
  // exists; renderRequests() itself doesn't need to change.
  // ---------------------------------------------------------
  const MY_REQUESTS_STORAGE_KEY = "profconsult_my_requests";

  const SAMPLE_REQUESTS = [
    { title: "Research Consultation", date: "July 15", time: "10:00 AM", status: "waiting", statusLabel: "Waiting" },
    { title: "Capstone Consultation", date: "July 18", time: "2:00 PM", status: "approved", statusLabel: "Approved" },
    { title: "OJT Consultation", date: "July 8", time: "", status: "completed", statusLabel: "Completed" },
  ];

  function getSubmittedRequests() {
    try {
      const raw = localStorage.getItem(MY_REQUESTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function renderRequests() {
    const listEl = document.getElementById("requestsList");
    const noResultsEl = document.getElementById("noRequestsMessage");
    if (!listEl) return;

    // Real submissions first (newest submitted = newest at the
    // front already, since request-consultation.js prepends),
    // then the sample data for the test account.
    const requests = [...getSubmittedRequests(), ...SAMPLE_REQUESTS];

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

  renderRequests();

  // Re-render if a new request is submitted from another tab/page
  window.addEventListener("storage", (event) => {
    if (event.key === MY_REQUESTS_STORAGE_KEY) renderRequests();
  });

});