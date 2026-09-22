// =========================================================
// STUDENT DASHBOARD INTERACTIONS
// - Populates the greeting from the SAME stored name fields as
//   Student Profile (see STUDENT_NAME_STORAGE_KEY below) -- the
//   greeting uses ONLY the stored First Name, never derived by
//   splitting a combined full-name string, so the two pages can
//   never disagree about what the student's first name is, and
//   a multi-word first name (e.g. "Mary Jane") is preserved as-is.
// - Live Philippine date and time, updated every second
// - Burger menu: slide-in sidebar with dim/blur overlay
// - Quick Action: fade/slide popup with Find Faculty and
//   Request Consultation actions
// - Notification bell: navigates to notifications.html, and
//   shows a shared unread-indicator badge (see
//   notification-state.js / window.ProfConsultNotifications)
// - Search Professor: real-time, case-insensitive, partial-match
//   filtering, combined with an optional status filter, with a
//   shared empty state when nothing matches
// - Clicking a faculty card navigates to Faculty Directory with
//   that same faculty pre-selected (see the FACULTY CARD CLICK
//   section below) -- generic for any card with data-faculty-id,
//   no per-faculty special-casing.
// - Recent Notifications: renders from the SAME notification
//   data/store as the Notifications page (notifications.js), so
//   this never shows something different from the full page --
//   see the RECENT NOTIFICATIONS section below. Its heading is a
//   plain link to notifications.html (styled in the HTML/CSS,
//   nothing to wire up here).
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Sample student account -- replace with real session/user
  // data once backend authentication exists
  // ---------------------------------------------------------
  const SAMPLE_STUDENT = {
    studentId: "24-00001",
    program: "BSCPE (Computer Engineering)",
    yearLevel: "3rd Year",
  };

  // ---------------------------------------------------------
  // Name -- read from the same localStorage key Student Profile
  // saves to (STUDENT_NAME_STORAGE_KEY), so this page and the
  // Profile page always show a consistent first name and the
  // greeting survives a refresh once the student has edited it.
  // ---------------------------------------------------------
  const STUDENT_NAME_STORAGE_KEY = "profconsult_student_name";

  const DEFAULT_STUDENT_NAME = {
    firstName: "John",
    middleInitial: "D",
    lastName: "Cruz",
  };

  function loadStudentName() {
    try {
      const stored = localStorage.getItem(STUDENT_NAME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          return {
            firstName: parsed.firstName || "",
            middleInitial: parsed.middleInitial || "",
            lastName: parsed.lastName || "",
          };
        }
      }
    } catch (error) {
      // fall through to defaults
    }
    return { ...DEFAULT_STUDENT_NAME };
  }

  const studentName = loadStudentName();

  const firstNameEl = document.getElementById("studentFirstName");
  if (firstNameEl) {
    // First Name is the source of truth for the greeting --
    // never derived by splitting a connected full name.
    firstNameEl.textContent = studentName.firstName;
  }

  // ---------------------------------------------------------
  // Live Philippine date and time, directly below the greeting.
  // Uses Intl.DateTimeFormat with the Asia/Manila timezone so
  // it always reflects Philippine time regardless of the
  // visitor's own device timezone, and re-renders every second
  // via setInterval so it stays live without a page refresh.
  // ---------------------------------------------------------
  const dashboardDateTimeEl = document.getElementById("dashboardDateTime");

  if (dashboardDateTimeEl) {
    const philippineDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    function renderPhilippineDateTime() {
      // Intl.DateTimeFormat.formatToParts lets us control spacing/
      // punctuation exactly (e.g. "June 22, 2026 9:56:03 PM")
      // instead of depending on the locale's default separators.
      const parts = philippineDateTimeFormatter.formatToParts(new Date());
      const get = (type) => {
        const part = parts.find((p) => p.type === type);
        return part ? part.value : "";
      };

      const weekday = get("weekday");
      const month = get("month");
      const day = get("day");
      const year = get("year");
      const hour = get("hour");
      const minute = get("minute");
      const second = get("second");
      const dayPeriod = get("dayPeriod");

      dashboardDateTimeEl.textContent =
        `${weekday}, ${month} ${day}, ${year} ${hour}:${minute}:${second} ${dayPeriod}`;
    }

    renderPhilippineDateTime();
    setInterval(renderPhilippineDateTime, 1000);
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



  // ---------------------------------------------------------
  // Notification bell -- navigates to notifications.html, and
  // renders the shared unread-indicator badge (read-only here;
  // only notifications.js clears the state).
  // TEST/DEMO ONLY: no real notification data or backend yet,
  // this just routes the whole button (not only the image) to
  // the Notifications page.
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
  // Status Filter popup: fades/slides in below the filter icon
  // at the right edge of the search bar. Closes when clicking
  // its trigger again or anywhere outside.
  // ---------------------------------------------------------
  const filterButton = document.getElementById("filterButton");
  const filterPanel = document.getElementById("filterPanel");
  const filterOptions = filterPanel
    ? Array.from(filterPanel.querySelectorAll(".filter-option"))
    : [];

  function openFilterPanel() {
    filterPanel.hidden = false;
    requestAnimationFrame(() => filterPanel.classList.add("is-open"));
    filterButton.setAttribute("aria-expanded", "true");
  }

  function closeFilterPanel() {
    filterPanel.classList.remove("is-open");
    filterButton.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      filterPanel.hidden = true;
    }, 200);
  }

  if (filterButton) {
    filterButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = filterPanel.classList.contains("is-open");
      if (isOpen) {
        closeFilterPanel();
      } else {
        openFilterPanel();
      }
    });
  }

  // Close the Quick Action popup and/or the Filter popup when
  // clicking anywhere outside of them
  document.addEventListener("click", (event) => {
    if (
      quickActionPanel &&
      !quickActionPanel.hidden &&
      !quickActionPanel.contains(event.target) &&
      event.target !== quickActionButton
    ) {
      closeQuickAction();
    }

    if (
      filterPanel &&
      !filterPanel.hidden &&
      !filterPanel.contains(event.target) &&
      event.target !== filterButton &&
      !filterButton.contains(event.target)
    ) {
      closeFilterPanel();
    }
  });

  // ---------------------------------------------------------
  // Search Professor + Status Filter: real-time, case-insensitive,
  // partial-match search combined with an optional status filter.
  // Both apply together -- a professor must match the search text
  // AND the selected status (when one is active) to stay visible.
  // Shows a shared empty-state message when nothing matches;
  // empty search and/or no active filter restores the full list.
  // ---------------------------------------------------------
  const searchInput = document.getElementById("professorSearchInput");
  const professorCards = Array.from(document.querySelectorAll(".professor-card"));
  const noResultsMessage = document.getElementById("noResultsMessage");

  let activeStatus = null;

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    let visibleCount = 0;

    professorCards.forEach((card) => {
      const name = card.querySelector(".professor-name").textContent.toLowerCase();
      const status = card.dataset.status || "";
      const matchesSearch = query === "" || name.includes(query);
      const matchesStatus = !activeStatus || status === activeStatus;
      const matches = matchesSearch && matchesStatus;

      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    if (noResultsMessage) {
      noResultsMessage.hidden = visibleCount > 0;
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  filterOptions.forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();
      const status = option.dataset.status;

      if (activeStatus === status) {
        // Clicking the already-active filter clears it
        activeStatus = null;
        option.classList.remove("is-active");
      } else {
        activeStatus = status;
        filterOptions.forEach((opt) => opt.classList.remove("is-active"));
        option.classList.add("is-active");
      }

      applyFilters();
    });
  });

  // ---------------------------------------------------------
  // FACULTY CARD CLICK -> Faculty Directory, same faculty selected.
  //
  // Reuses the exact same "?facultyId=" query-param hand-off
  // mechanism already used elsewhere in the project (e.g.
  // faculty-directory.js's own Request Consultation link uses
  // "request-consultation.html?facultyId=..."), and relies on
  // Faculty Directory's EXISTING openProfile() selection logic
  // to actually show the profile once it arrives there (see
  // faculty-directory.js) -- nothing about faculty selection is
  // duplicated here.
  //
  // Generic for any card that has a data-faculty-id attribute --
  // no specific faculty name is referenced or special-cased, so
  // this works for every current and future card the same way.
  // ---------------------------------------------------------
  professorCards.forEach((card) => {
    const facultyId = card.dataset.facultyId;
    if (!facultyId) return;

    card.addEventListener("click", () => {
      window.location.href = `faculty-directory.html?facultyId=${encodeURIComponent(facultyId)}`;
    });
  });

  // =========================================================
  // RECENT NOTIFICATIONS
  //
  // Reads/formats notifications EXACTLY the way notifications.js
  // does (same storage key, same supported types, same sample
  // fallback, same time-ago wording, same optional "Professor's
  // message" line for a rescheduled record) so this panel can
  // never disagree with the full Notifications page. It's
  // mirrored here rather than imported since this is a separate
  // static page with no build step/shared JS module system in
  // this project -- if that ever changes, this block and
  // notifications.js's equivalent block are the two places to
  // consolidate.
  //
  // Only the topmost few are shown here ("recent"), taken from
  // the exact same ordered list notifications.js renders in full
  // (real/stored records first, newest first, then the test
  // samples) -- so "recent" is always the literal top of the full
  // page, never a separately-decided subset.
  // =========================================================

  const RECENT_NOTIFICATIONS_LIMIT = 3;

  const NOTIFICATION_RECORDS_STORAGE_KEY = "studentTestNotificationRecords";
  const SUPPORTED_NOTIFICATION_TYPES = ["accepted", "declined", "rescheduled"];

  function isSupportedNotificationRecord(record) {
    return (
      record &&
      typeof record === "object" &&
      SUPPORTED_NOTIFICATION_TYPES.includes(record.type)
    );
  }

  function loadStoredNotificationRecords() {
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

  // TEST DATA ONLY -- identical to notifications.js's
  // getSampleRecords(), so Recent Notifications and the full
  // Notifications page always agree on the test account's sample
  // data too. Delete this function (and its use below) at the
  // same time it's deleted from notifications.js.
  function getSampleNotificationRecords() {
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

  function formatNotificationTimeAgo(createdAt) {
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

  function buildRecentNotificationRows(records) {
    return records.filter(isSupportedNotificationRecord).map((record) => {
      const message =
        typeof window.formatStudentNotificationMessage === "function"
          ? window.formatStudentNotificationMessage(record)
          : (record.message || "");

      const hasProfessorMessage =
        record.type === "rescheduled" &&
        typeof record.message === "string" &&
        record.message.trim() !== "";

      return {
        message,
        professorMessage: hasProfessorMessage ? record.message.trim() : "",
        timestamp: formatNotificationTimeAgo(record.createdAt),
      };
    });
  }

  function renderRecentNotifications(notifications) {
    const listEl = document.getElementById("notificationsList");
    if (!listEl) return;

    listEl.innerHTML = "";

    if (notifications.length === 0) {
      const emptyItem = document.createElement("li");
      emptyItem.className = "no-notifications-message";
      emptyItem.textContent = "You have no notifications yet.";
      listEl.appendChild(emptyItem);
      return;
    }

    notifications.forEach((notification) => {
      const li = document.createElement("li");

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

  const storedNotificationRecords = loadStoredNotificationRecords()
    .filter(isSupportedNotificationRecord)
    .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

  const allNotificationsInPageOrder = storedNotificationRecords.concat(getSampleNotificationRecords());

  renderRecentNotifications(
    buildRecentNotificationRows(allNotificationsInPageOrder.slice(0, RECENT_NOTIFICATIONS_LIMIT))
  );

});