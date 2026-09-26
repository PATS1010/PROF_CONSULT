// SYSTEM NOTE: Shows a red dot on notification bells when the signed-in user has unread notifications.

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

  function getDot(button) {
    let dot = button.querySelector(".notification-unread-dot");
    if (dot) return dot;

    dot = document.createElement("span");
    dot.className = "notification-unread-dot";
    dot.setAttribute("aria-hidden", "true");
    Object.assign(dot.style, {
      position: "absolute",
      top: "8px",
      right: "8px",
      width: "10px",
      height: "10px",
      borderRadius: "999px",
      background: "#e71d2b",
      border: "2px solid #ffffff",
      boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.08)",
      display: "none",
      pointerEvents: "none",
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

      if (!response.ok || !result.ok) {
        setBellUnread(false);
        return;
      }

      setBellUnread(Number(result.unread_count || 0) > 0);
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
})();
