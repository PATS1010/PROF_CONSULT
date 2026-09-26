// SYSTEM NOTE: Shows a red dot on notification bells while the signed-in user has unread notifications.

(function () {
  const refreshIntervalMs = 30000;
  let refreshTimer = null;

  function getBellButton() {
    return document.getElementById("notificationBellButton")
      || document.getElementById("facultyNotificationBellButton");
  }

  function notificationRole() {
    return document.getElementById("facultyNotificationBellButton") ? "faculty" : "student";
  }

  function notifiedStorageKey() {
    return `profConsultBrowserNotified:${notificationRole()}`;
  }

  function popupStorageKey() {
    return `profConsultPopupShown:${notificationRole()}`;
  }

  function browserNotificationsSupported() {
    return "Notification" in window;
  }

  async function requestBrowserNotificationPermission() {
    if (!browserNotificationsSupported()) {
      return "unsupported";
    }
    if (Notification.permission !== "default") {
      return Notification.permission;
    }

    return Notification.requestPermission();
  }

  function storedNotifiedIds() {
    try {
      const value = JSON.parse(localStorage.getItem(notifiedStorageKey()) || "[]");
      return Array.isArray(value) ? value.map(String) : [];
    } catch (error) {
      return [];
    }
  }

  function saveNotifiedIds(ids) {
    localStorage.setItem(notifiedStorageKey(), JSON.stringify(ids.slice(-80)));
  }

  function storedPopupIds() {
    try {
      const value = JSON.parse(localStorage.getItem(popupStorageKey()) || "[]");
      return Array.isArray(value) ? value.map(String) : [];
    } catch (error) {
      return [];
    }
  }

  function savePopupIds(ids) {
    localStorage.setItem(popupStorageKey(), JSON.stringify(ids.slice(-80)));
  }

  function notificationId(notification) {
    return String(notification.Notification_ID || notification.id || "");
  }

  function unreadNotifications(notifications) {
    return (notifications || []).filter((notification) => {
      return notificationId(notification) && notification.Read_Status === "unread";
    });
  }

  function showBrowserNotification(notification) {
    const browserNotification = new Notification("Prof Consult", {
      body: notification.Message || "You have a new notification.",
      icon: "images/bell.png",
      tag: `prof-consult-${notificationRole()}-${notificationId(notification)}`,
    });

    browserNotification.onclick = () => {
      window.focus();
      window.location.href = notificationRole() === "faculty"
        ? "faculty-notifications.html"
        : "notifications.html";
      browserNotification.close();
    };
  }

  function notifyUnreadNotifications(notifications) {
    if (!browserNotificationsSupported() || Notification.permission !== "granted") {
      return;
    }

    const knownIds = new Set(storedNotifiedIds());
    const nextIds = [...knownIds];

    unreadNotifications(notifications).forEach((notification) => {
      const id = notificationId(notification);
      if (knownIds.has(id)) return;

      showBrowserNotification(notification);
      knownIds.add(id);
      nextIds.push(id);
    });

    saveNotifiedIds(nextIds);
  }

  function ensurePopupStyles() {
    if (document.getElementById("profConsultNotificationPopupStyles")) return;

    const style = document.createElement("style");
    style.id = "profConsultNotificationPopupStyles";
    style.textContent = `
      .prof-consult-notification-popup {
        position: fixed;
        right: 28px;
        bottom: 88px;
        width: min(330px, calc(100vw - 32px));
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22);
        overflow: hidden;
        z-index: 9999;
        transform: translateY(18px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
        font-family: inherit;
      }

      .prof-consult-notification-popup.is-visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }

      .prof-consult-notification-popup__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        background: linear-gradient(90deg, #9b111e 0%, #ef5a18 100%);
        color: #ffffff;
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .prof-consult-notification-popup__close {
        border: 0;
        background: transparent;
        color: #ffffff;
        cursor: pointer;
        font: inherit;
        line-height: 1;
        padding: 0;
      }

      .prof-consult-notification-popup__body {
        padding: 14px 16px 16px;
        color: #191919;
        text-align: center;
      }

      .prof-consult-notification-popup__message {
        margin: 0 0 10px;
        font-size: 0.78rem;
        line-height: 1.35;
      }

      .prof-consult-notification-popup__button {
        display: inline-block;
        border: 0;
        border-radius: 999px;
        background: #efefef;
        color: #202020;
        padding: 5px 12px;
        font: inherit;
        font-size: 0.68rem;
        font-weight: 700;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  function notificationPageHref() {
    return notificationRole() === "faculty" ? "faculty-notifications.html" : "notifications.html";
  }

  function showInAppNotificationPopup(notification) {
    ensurePopupStyles();

    const existingPopup = document.querySelector(".prof-consult-notification-popup");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("aside");
    popup.className = "prof-consult-notification-popup";
    popup.setAttribute("role", "status");
    popup.setAttribute("aria-live", "polite");
    popup.innerHTML = `
      <div class="prof-consult-notification-popup__header">
        <span>New Notification</span>
        <button type="button" class="prof-consult-notification-popup__close" aria-label="Close notification">&times;</button>
      </div>
      <div class="prof-consult-notification-popup__body">
        <p class="prof-consult-notification-popup__message"></p>
        <button type="button" class="prof-consult-notification-popup__button">View More</button>
      </div>
    `;

    const message = popup.querySelector(".prof-consult-notification-popup__message");
    const closeButton = popup.querySelector(".prof-consult-notification-popup__close");
    const viewButton = popup.querySelector(".prof-consult-notification-popup__button");
    if (message) message.textContent = notification.Message || "You have a new notification.";
    if (closeButton) closeButton.addEventListener("click", () => popup.remove());
    if (viewButton) {
      viewButton.addEventListener("click", () => {
        window.location.href = notificationPageHref();
      });
    }

    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add("is-visible"));
    window.setTimeout(() => {
      popup.classList.remove("is-visible");
      window.setTimeout(() => popup.remove(), 220);
    }, 9000);
  }

  function showUnreadNotificationPopups(notifications) {
    const knownIds = new Set(storedPopupIds());
    const nextIds = [...knownIds];
    const freshUnread = unreadNotifications(notifications).filter((notification) => {
      return !knownIds.has(notificationId(notification));
    });

    if (freshUnread.length === 0) return;

    const newest = freshUnread[0];
    showInAppNotificationPopup(newest);

    freshUnread.forEach((notification) => {
      const id = notificationId(notification);
      knownIds.add(id);
      nextIds.push(id);
    });
    savePopupIds(nextIds);
  }

  function getDot(button) {
    let dot = button.querySelector(".notification-unread-dot");
    if (dot) return dot;

    dot = document.createElement("span");
    dot.className = "notification-unread-dot";
    dot.setAttribute("aria-hidden", "true");
    Object.assign(dot.style, {
      position: "absolute",
      top: "7px",
      right: "7px",
      width: "10px",
      height: "10px",
      borderRadius: "999px",
      background: "#e71d2b",
      border: "2px solid #ffffff",
      boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.08)",
      display: "none",
      pointerEvents: "none",
      zIndex: "5",
    });

    if (getComputedStyle(button).position === "static") {
      button.style.position = "relative";
    }
    button.appendChild(dot);
    return dot;
  }

  function setBellUnread(hasUnread) {
    const button = getBellButton();
    if (!button) return;

    const dot = getDot(button);
    dot.style.display = hasUnread ? "block" : "none";
    button.classList.toggle("has-notifications", hasUnread);
    button.setAttribute(
      "aria-label",
      hasUnread ? "Notifications, unread notifications" : "Notifications"
    );
  }

  async function refreshBellUnreadStatus() {
    const button = getBellButton();
    if (!button) return;

    try {
      const response = await fetch(`api/notifications.php?role=${encodeURIComponent(notificationRole())}`, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Accept": "application/json" },
      });
      const result = await response.json();

      const hasUnread = response.ok && result.ok && Number(result.unread_count || 0) > 0;
      setBellUnread(hasUnread);
      if (hasUnread) {
        showUnreadNotificationPopups(result.notifications || []);
        notifyUnreadNotifications(result.notifications || []);
      }
    } catch (error) {
      setBellUnread(false);
    }
  }

  function startBellRefresh() {
    refreshBellUnreadStatus();

    if (!refreshTimer) {
      refreshTimer = window.setInterval(refreshBellUnreadStatus, refreshIntervalMs);
    }
  }

  window.refreshNotificationBellStatus = refreshBellUnreadStatus;
  window.setNotificationBellUnread = setBellUnread;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startBellRefresh);
  } else {
    startBellRefresh();
  }

  window.addEventListener("pageshow", refreshBellUnreadStatus);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refreshBellUnreadStatus();
    }
  });
  window.addEventListener("focus", refreshBellUnreadStatus);
  window.addEventListener("notifications:changed", refreshBellUnreadStatus);
  document.addEventListener("click", (event) => {
    if (event.target.closest("#notificationBellButton, #facultyNotificationBellButton")) {
      requestBrowserNotificationPermission();
    }
  }, true);
})();
