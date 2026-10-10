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

  const PH_DATE_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
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
    return PH_DATE_LABEL_FORMATTER.format(new Date(created));
  }

  function buildNotificationRows(records) {
    return records.map((record) => {
      return {
        message: record.Message || "",
        professorMessage: "",
        timestamp: formatTimeAgo(new Date(record.Date_Time || Date.now()).getTime()),
      };
    });
  }

  function renderNotifications(notifications) {
    const listEl = document.getElementById("notificationsList");
    if (!listEl) return;

    listEl.innerHTML = "";

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

      if (notification.professorMessage) {
        const professorMessage = document.createElement("p");
        professorMessage.className = "notification-professor-message";
        professorMessage.textContent = `Professor's message: ${notification.professorMessage}`;
        content.appendChild(professorMessage);
      }

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
    window.location.href = redirectPage;
  });

  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    openModal();
  });

});
