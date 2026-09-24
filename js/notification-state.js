// =========================================================
// PROFCONSULT — SHARED STUDENT NOTIFICATION STATE
// One localStorage flag (profconsult_notifications_unread)
// read/written by every Student Dashboard page's own script.
// Only notifications.js should ever call markRead(). Every
// other page should only call renderBellIndicator() (read-only).
// =========================================================
(function () {
  const STORAGE_KEY = "profconsult_notifications_unread";

  function readUnread() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // No stored value yet -- default to unread, since the
      // existing sample notifications haven't been viewed.
      if (stored === null) return true;
      return stored === "true";
    } catch (error) {
      return true;
    }
  }

  function writeUnread(isUnread) {
    try {
      localStorage.setItem(STORAGE_KEY, isUnread ? "true" : "false");
    } catch (error) {
      // storage unavailable -- state just won't persist
    }
  }

  function injectBadgeStyleOnce() {
    if (document.getElementById("profconsult-notif-badge-style")) return;
    const style = document.createElement("style");
    style.id = "profconsult-notif-badge-style";
    style.textContent = `
      .notif-bell-wrapper {
        position: relative;
        display: inline-flex;
        overflow: visible;
      }

      .notif-unread-badge {
        position: absolute;
        top: -3px;
        right: -3px;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background-color: #e8112d;
        border: 2px solid #7a0f0f;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  function renderBadge(bellButton) {
    if (!bellButton) return;
    injectBadgeStyleOnce();

    // The bell button itself has overflow:hidden (to clip its icon
    // image to the circle), so a badge appended INSIDE it would be
    // clipped at the same boundary and only ever show as a sliver.
    // Instead, wrap the button once in a plain, overflow:visible
    // span and anchor the badge to that wrapper -- this only wraps
    // the existing button (no attributes/classes/listeners on the
    // button itself are touched), so nothing about the button's own
    // behavior changes.
    let wrapper = bellButton.parentElement;
    if (!wrapper || !wrapper.classList.contains("notif-bell-wrapper")) {
      wrapper = document.createElement("span");
      wrapper.className = "notif-bell-wrapper";
      bellButton.parentNode.insertBefore(wrapper, bellButton);
      wrapper.appendChild(bellButton);
    }

    let badge = wrapper.querySelector(".notif-unread-badge");

    if (readUnread()) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "notif-unread-badge";
        badge.setAttribute("aria-hidden", "true");
        wrapper.appendChild(badge);
      }
    } else if (badge) {
      badge.remove();
    }
  }

  window.ProfConsultNotifications = {
    isUnread: readUnread,
    markRead: function () {
      writeUnread(false);
    },
    markUnread: function () {
      writeUnread(true);
    },
    renderBellIndicator: renderBadge,
  };
})();