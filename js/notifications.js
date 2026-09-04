// SYSTEM NOTE: Controls client-side behavior for the notifications page, including UI events and API calls.
// =========================================================
// NOTIFICATIONS PAGE INTERACTIONS
// - Burger menu + Quick Action: copied verbatim from the
//   proven-working Student Dashboard implementation
// - Notification bell: keeps the user on notifications.html
// - Renders database-backed notifications, newest first.
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
  // Notifications list
  // ---------------------------------------------------------
  function formatTimestamp(value) {
    if (!value) return "";
    const normalized = String(value).replace(" ", "T");
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function renderNotifications(notifications) {
    const listEl = document.getElementById("notificationsList");
    if (!listEl) return;

    listEl.innerHTML = "";

    if (notifications.length === 0) {
      const li = document.createElement("li");
      li.className = "notification-item";
      li.textContent = "No notifications yet.";
      listEl.appendChild(li);
      return;
    }

    notifications.forEach((notification) => {
      const li = document.createElement("li");
      li.className = "notification-item";

      const check = document.createElement("span");
      check.className = "notification-check";
      check.setAttribute("aria-hidden", "true");
      check.innerHTML = "&check;";

      const content = document.createElement("div");
      content.className = "notification-content";

      const message = document.createElement("p");
      message.className = "notification-message";
      message.textContent = notification.message;
      content.appendChild(message);

      if (notification.timestamp) {
        const timestamp = document.createElement("p");
        timestamp.className = "notification-timestamp";
        timestamp.textContent = notification.timestamp;
        content.appendChild(timestamp);
      }

      li.appendChild(check);
      li.appendChild(content);
      listEl.appendChild(li);
    });
  }

  async function loadNotifications() {
    try {
      const response = await fetch("api/notifications.php", {
        cache: "no-store",
        headers: { "Accept": "application/json" },
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to load notifications.");
      }

      renderNotifications((result.notifications || []).map((notification) => ({
        message: notification.Message || "",
        timestamp: formatTimestamp(notification.Date_Time),
      })));
    } catch (error) {
      renderNotifications([{ message: error.message || "Unable to load notifications.", timestamp: "" }]);
    }
  }

  loadNotifications();

});
