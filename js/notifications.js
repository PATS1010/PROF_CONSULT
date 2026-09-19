// =========================================================
// NOTIFICATIONS PAGE INTERACTIONS
// - Burger menu + Quick Action: copied verbatim from the
//   proven-working Student Dashboard implementation
// - Notification bell icon: already on this page, so its click
//   does nothing; still renders the shared badge (which will
//   already be cleared below by the time it renders)
// - Viewing this page is what marks the shared notification
//   state as READ (see notification-state.js /
//   window.ProfConsultNotifications). Every other Student
//   Dashboard page only READS this state -- this is the one
//   and only place that clears it.
// - Renders the notification list, newest first. ONLY three
//   kinds of notification are shown: accepted, declined, and
//   rescheduled (see the NOTIFICATIONS LIST section below).
//   The wording comes from
//   window.formatStudentNotificationMessage (defined in
//   student-notification-toast.js), so this list and the
//   pop-up card always say the same thing.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Viewing the Notifications page is what actually marks the
  // shared notification state as read, whether the student
  // arrived here via the bell or via the sidebar link -- both
  // paths land here, so both paths produce the same result.
  // ---------------------------------------------------------
  if (window.ProfConsultNotifications) {
    window.ProfConsultNotifications.markRead();
  }

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
  // Notification bell -- already on this page, so clicking it
  // does nothing; still renders the shared badge (read-only
  // call, same as every other page -- it will render as absent
  // since markRead() above already ran).
  // ---------------------------------------------------------
  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      // Already on Notifications -- nothing to navigate to
    });
    if (window.ProfConsultNotifications) {
      window.ProfConsultNotifications.renderBellIndicator(notificationBellButton);
    }
  }

  // =========================================================
  // NOTIFICATIONS LIST
  //
  // Only THREE kinds of notification are accepted here:
  //
  //   type "accepted"    -> Engr. Sales accepted your consultation request.
  //   type "declined"    -> Engr. Sales declined your consultation request.
  //   type "rescheduled" -> accepted: true
  //                           Engr. Sales accepted and moved your consultation
  //                           at 3:00 PM - 3:30 PM, September 19, 2026.
  //                         accepted: false
  //                           Engr. Sales moved your consultation request
  //                           at 3:00 PM - 3:30 PM, September 19, 2026.
  //
  // Each one has a time line under it: "2 minutes ago", then
  // "Today", "Yesterday", and after that the date.
  //
  // Record shape (see student-notification-toast.js for how the
  // faculty side writes one):
  //   { id, type, facultyName, accepted, dateISO, timeLabel, createdAt }
  //
  // Records the faculty side saved are read from localStorage
  // ("studentTestNotificationRecords", newest first). Once a
  // backend exists, fetch the records and pass them through
  // buildNotificationRows() -- the rendering below doesn't change.
  // =========================================================

  const NOTIFICATION_RECORDS_STORAGE_KEY = "studentTestNotificationRecords";

  const SUPPORTED_NOTIFICATION_TYPES = ["accepted", "declined", "rescheduled"];

  function isSupportedRecord(record) {
    return (
      record &&
      typeof record === "object" &&
      SUPPORTED_NOTIFICATION_TYPES.includes(record.type)
    );
  }

  function loadStoredRecords() {
    try {
      const stored = localStorage.getItem(NOTIFICATION_RECORDS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      // fall through to no stored records
    }
    return [];
  }

  // ---------------------------------------------------------
  // TEST DATA ONLY: sample records for the test student
  // account, shown after any real (stored) records. createdAt
  // is relative to "now" so the time lines read like the real
  // thing. Delete this function (and its use below) once real
  // notifications exist.
  // ---------------------------------------------------------
  function getSampleRecords() {
    const now = Date.now();
    const MINUTE = 60 * 1000;
    const DAY = 24 * 60 * MINUTE;

    return [
      {
        id: "sample-1",
        type: "accepted",
        facultyName: "Engr. Sales",
        createdAt: now - 2 * MINUTE,
      },
      {
        id: "sample-2",
        type: "rescheduled",
        accepted: true,
        facultyName: "Engr. Sales",
        dateISO: "2026-09-19",
        timeLabel: "3:00 PM - 3:30 PM",
        createdAt: now - 90 * MINUTE,
      },
      {
        id: "sample-3",
        type: "rescheduled",
        accepted: false,
        facultyName: "Engr. Sales",
        dateISO: "2026-09-19",
        timeLabel: "3:00 PM - 3:30 PM",
        createdAt: now - DAY,
      },
      {
        id: "sample-4",
        type: "declined",
        facultyName: "Engr. Sales",
        createdAt: now - 3 * DAY,
      },
    ];
  }

  // ---------------------------------------------------------
  // Time line under each notification. Philippine time.
  //   under 1 minute   -> "Just now"
  //   under 1 hour     -> "2 minutes ago"
  //   same day         -> "Today"
  //   previous day     -> "Yesterday"
  //   older            -> "September 16, 2026"
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Record -> { message, timestamp } row for renderNotifications()
  // ---------------------------------------------------------
  function buildNotificationRows(records) {
    return records.filter(isSupportedRecord).map((record) => {
      const message =
        typeof window.formatStudentNotificationMessage === "function"
          ? window.formatStudentNotificationMessage(record)
          : (record.message || "");

      return {
        message,
        timestamp: formatTimeAgo(record.createdAt),
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

  // Real (stored) records first, newest first; then the test samples.
  const storedRecords = loadStoredRecords()
    .filter(isSupportedRecord)
    .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

  renderNotifications(
    buildNotificationRows(storedRecords.concat(getSampleRecords()))
  );

});