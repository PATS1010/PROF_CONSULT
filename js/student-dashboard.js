// Student Dashboard JS
document.addEventListener("DOMContentLoaded", () => {

  const SAMPLE_STUDENT = {
    studentId: "24-00001",
    program: "BSCPE (Computer Engineering)",
    yearLevel: "3rd Year",
  };

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
    }
    return { ...DEFAULT_STUDENT_NAME };
  }

  const studentName = loadStudentName();

  const firstNameEl = document.getElementById("studentFirstName");
  if (firstNameEl) {
    firstNameEl.textContent = studentName.firstName;
  }

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

  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
    if (window.ProfConsultNotifications) {
      window.ProfConsultNotifications.renderBellIndicator(notificationBellButton);
    }
  }

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

  const searchInput = document.getElementById("professorSearchInput");
  const professorCards = Array.from(document.querySelectorAll(".professor-card"));
  const noResultsMessage = document.getElementById("noResultsMessage");

  let activeDepartment = null;

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    let visibleCount = 0;

    professorCards.forEach((card) => {
      const name = card.querySelector(".professor-name").textContent.toLowerCase();
      const department = card.dataset.department || "";
      const matchesSearch = query === "" || name.includes(query);
      const matchesDepartment = !activeDepartment || department === activeDepartment;
      const matches = matchesSearch && matchesDepartment;

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
      const department = option.dataset.department;

      if (activeDepartment === department) {
        activeDepartment = null;
        option.classList.remove("is-active");
      } else {
        activeDepartment = department;
        filterOptions.forEach((opt) => opt.classList.remove("is-active"));
        option.classList.add("is-active");
      }

      applyFilters();
    });
  });

  professorCards.forEach((card) => {
    const facultyId = card.dataset.facultyId;
    if (!facultyId) return;

    card.addEventListener("click", () => {
      window.location.href = `faculty-directory.html?facultyId=${encodeURIComponent(facultyId)}`;
    });
  });

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
    }
    return [];
  }

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
    window.location.href = logoutLink.getAttribute("href") || "login.html";
  });

  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    openModal();
  });

});