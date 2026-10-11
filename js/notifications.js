// Notifications JS
document.addEventListener("DOMContentLoaded", () => {

  if (window.ProfConsultNotifications) {
    window.ProfConsultNotifications.markRead();
  }

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
    });
    if (window.ProfConsultNotifications) {
      window.ProfConsultNotifications.renderBellIndicator(notificationBellButton);
    }
  }

  const PH_DAY_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const PH_DATE_LABEL_FORMATTER = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const PH_TIME_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const PH_LONG_DATE_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function formatTimeAgo(createdAt) {
    const created = Number(createdAt);
    if (!Number.isFinite(created)) return "";

    const now = Date.now();
    const diffMinutes = Math.floor((now - created) / 60000);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) {
      return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
    }

    const createdDay = PH_DAY_KEY_FORMATTER.format(new Date(created));
    if (createdDay === PH_DAY_KEY_FORMATTER.format(new Date(now))) {
      return "Today";
    }
    if (createdDay === PH_DAY_KEY_FORMATTER.format(new Date(now - 24 * 60 * 60 * 1000))) {
      return "Yesterday";
    }
    return PH_LONG_DATE_LABEL_FORMATTER.format(new Date(created));
  }

  function statusFromMessage(message) {
    const text = String(message || "").toLowerCase();
    if (text.includes("completed")) return ["completed", "Completed"];
    if (text.includes("declined") || text.includes("rejected") || text.includes("cancelled")) {
      return ["declined", text.includes("cancelled") ? "Cancelled" : "Declined"];
    }
    if (text.includes("rescheduled")) return ["rescheduled", "Rescheduled"];
    if (text.includes("approved") || text.includes("accepted")) return ["approved", "Approved"];
    return ["pending", "Pending"];
  }

  function titleFromMessage(message) {
    const text = String(message || "").trim();
    const quoted = text.match(/["']([^"']{2,60})["']/);
    if (quoted) return quoted[1];

    const purpose = text.match(/(?:for|about)\s+(.{2,50}?)(?:\s+was|\s+has|\.|$)/i);
    if (purpose) return purpose[1].trim();

    return "Notification";
  }

  function buildNotificationRows(records) {
    return records.map((record) => {
      const created = new Date(record.Date_Time || Date.now());
      const status = statusFromMessage(record.Message || "");

      return {
        title: titleFromMessage(record.Message || ""),
        message: record.Message || "",
        date: PH_DATE_LABEL_FORMATTER.format(created),
        time: PH_TIME_LABEL_FORMATTER.format(created),
        status: status[0],
        statusLabel: status[1],
        timestamp: formatTimeAgo(created.getTime()),
      };
    });
  }

  function renderNotifications(notifications) {
    const listEl = document.getElementById("notificationsList");
    const emptyEl = document.getElementById("noNotificationsMessage");
    if (!listEl) return;

    listEl.innerHTML = "";

    if (notifications.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    notifications.forEach((notification) => {
      const li = document.createElement("li");
      li.className = "notification-item";

      const title = document.createElement("h2");
      title.className = "notification-title";
      title.textContent = notification.title;
      li.appendChild(title);

      const content = document.createElement("div");
      content.className = "notification-content";

      const date = document.createElement("p");
      date.className = "notification-date";
      date.textContent = notification.date;
      content.appendChild(date);

      const time = document.createElement("p");
      time.className = "notification-time";
      time.textContent = notification.time;
      content.appendChild(time);

      const statusLabel = document.createElement("p");
      statusLabel.className = "notification-status-label";
      statusLabel.textContent = "Status:";
      content.appendChild(statusLabel);

      const status = document.createElement("p");
      status.className = "notification-status";

      const dot = document.createElement("span");
      dot.className = `status-dot status-${notification.status}`;
      dot.setAttribute("aria-hidden", "true");
      status.appendChild(dot);

      const statusText = document.createElement("span");
      statusText.textContent = notification.statusLabel;
      status.appendChild(statusText);
      content.appendChild(status);

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

      li.appendChild(content);
      listEl.appendChild(li);
    });
  }

  fetch("api/notifications.php?role=student", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((result) => {
      renderNotifications(buildNotificationRows(Array.isArray(result.notifications) ? result.notifications : []));
    })
    .catch(() => {
      renderNotifications([]);
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
