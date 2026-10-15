// Notification State JS
(function () {
  const STORAGE_KEY = "profconsult_notifications_unread";

  function readUnread() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) return false;
      return stored === "true";
    } catch (error) {
      return false;
    }
  }

  function writeUnread(isUnread) {
    try {
      localStorage.setItem(STORAGE_KEY, isUnread ? "true" : "false");
    } catch (error) {
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
