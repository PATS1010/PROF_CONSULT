// Student Dashboard JS
document.addEventListener("DOMContentLoaded", () => {

  const STUDENT_QUICK_ACTION_SHOWN_STORAGE_KEY =
    "profconsult_student_quick_action_shown";

  const firstNameEl = document.getElementById("studentFirstName");

  fetch("api/session.php?role=student", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((result) => {
      const fullName = result && result.user ? String(result.user.name || "").trim() : "";
      if (firstNameEl && fullName) {
        firstNameEl.textContent = fullName.split(/\s+/)[0];
      }
    })
    .catch(() => {
      window.location.replace("login.html");
    });

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

  if (quickActionButton && quickActionPanel) {
    let hasShownQuickAction = false;

    try {
      hasShownQuickAction =
        sessionStorage.getItem(
          STUDENT_QUICK_ACTION_SHOWN_STORAGE_KEY
        ) === "1";
    } catch (error) {
    }

    if (!hasShownQuickAction) {
      window.setTimeout(() => {
        openQuickAction();

        try {
          sessionStorage.setItem(
            STUDENT_QUICK_ACTION_SHOWN_STORAGE_KEY,
            "1"
          );
        } catch (error) {
        }
      }, 450);
    }
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
  let filterOptions = filterPanel
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
  const professorList = document.getElementById("professorList");
  const availabilityList = document.getElementById("availabilityList");
  const noResultsMessage = document.getElementById("noResultsMessage");

  let activeDepartment = null;
  let facultyDashboardData = [];
  let isFacultyLoading = true;

  const DEPARTMENT_OPTIONS = [
    { key: "computer-engineering", label: "Computer Engineering" },
    { key: "civil-engineering", label: "Civil Engineering" },
    { key: "electronics-engineering", label: "Electronics Engineering" },
  ];

  function departmentKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function departmentLabel(value) {
    const key = departmentKey(value);
    const option = DEPARTMENT_OPTIONS.find((department) => department.key === key);
    if (option) return option.label;
    return String(value || "Faculty").trim() || "Faculty";
  }

  function normalizeStatus(value) {
    const raw = String(value || "consultation").toLowerCase();
    if (raw === "available" || raw === "online") return "online";
    if (raw === "in class") return "meeting";
    if (raw === "on leave") return "onleave";
    if (raw === "unavailable" || raw === "offline") return "onleave";
    return ["online", "meeting", "consultation", "onleave"].includes(raw)
      ? raw
      : "consultation";
  }

  function statusLabel(status) {
    const labels = {
      online: "Online",
      meeting: "Meeting",
      consultation: "Consultation",
      onleave: "On Leave",
    };
    return labels[status] || "Consultation";
  }

  function mapFacultyRecord(record) {
    const status = normalizeStatus(record.Current_Status);
    const program = departmentLabel(record.Department || "Faculty");
    return {
      id: String(record.Faculty_ID || ""),
      fullName: String(record.Full_Name || "Faculty").trim() || "Faculty",
      program,
      departmentKey: departmentKey(program),
      status,
      statusLabel: statusLabel(status),
      photo: String(record.Profile_Photo || "images/user.png").trim() || "images/user.png",
    };
  }

  function createStatusDot(faculty) {
    const dot = document.createElement("span");
    dot.className = `status-dot status-${faculty.status}`;
    dot.setAttribute("aria-hidden", "true");
    dot.title = faculty.statusLabel;
    return dot;
  }

  function renderProfessorCards() {
    if (!professorList) return;

    professorList.innerHTML = "";

    facultyDashboardData.forEach((faculty) => {
      const card = document.createElement("article");
      card.className = "professor-card";
      card.dataset.status = faculty.status;
      card.dataset.department = faculty.departmentKey;
      card.dataset.facultyId = faculty.id;
      card.tabIndex = 0;

      const photo = document.createElement("img");
      photo.src = faculty.photo;
      photo.alt = faculty.fullName;
      photo.className = "professor-photo";

      const info = document.createElement("div");
      info.className = "professor-info";

      const name = document.createElement("p");
      name.className = "professor-name";
      name.textContent = faculty.fullName;

      const meta = document.createElement("p");
      meta.className = "professor-meta";
      meta.textContent = `${faculty.program} | ${faculty.statusLabel}`;

      info.appendChild(name);
      info.appendChild(meta);
      card.appendChild(photo);
      card.appendChild(info);
      card.appendChild(createStatusDot(faculty));

      card.addEventListener("click", () => {
        window.location.href = `faculty-directory.html?facultyId=${encodeURIComponent(faculty.id)}`;
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          card.click();
        }
      });

      professorList.appendChild(card);
    });
  }

  function renderDepartmentFilters() {
    if (!filterPanel) return;

    const departments = DEPARTMENT_OPTIONS;

    filterPanel.innerHTML = "";

    departments.forEach((department) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "filter-option";
      option.dataset.department = department.key;
      option.textContent = department.label;
      option.classList.toggle("is-active", activeDepartment === department.key);
      filterPanel.appendChild(option);
    });

    filterOptions = Array.from(filterPanel.querySelectorAll(".filter-option"));
  }

  function renderAvailabilityList() {
    if (!availabilityList) return;

    availabilityList.innerHTML = "";

    if (isFacultyLoading) {
      const item = document.createElement("li");
      item.textContent = "Loading faculty...";
      availabilityList.appendChild(item);
      return;
    }

    if (facultyDashboardData.length === 0) {
      const item = document.createElement("li");
      item.textContent = "No faculty accounts found.";
      availabilityList.appendChild(item);
      return;
    }

    facultyDashboardData.forEach((faculty) => {
      const item = document.createElement("li");
      item.appendChild(createStatusDot(faculty));
      item.appendChild(document.createTextNode(` ${faculty.fullName} | ${faculty.statusLabel}`));
      availabilityList.appendChild(item);
    });
  }

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const professorCards = professorList
      ? Array.from(professorList.querySelectorAll(".professor-card"))
      : [];
    let visibleCount = 0;

    professorCards.forEach((card) => {
      const nameEl = card.querySelector(".professor-name");
      const metaEl = card.querySelector(".professor-meta");
      const name = nameEl ? nameEl.textContent.toLowerCase() : "";
      const meta = metaEl ? metaEl.textContent.toLowerCase() : "";
      const department = card.dataset.department || "";
      const matchesSearch = query === "" || name.includes(query) || meta.includes(query);
      const matchesDepartment = !activeDepartment || department === activeDepartment;
      const matches = matchesSearch && matchesDepartment;

      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    if (noResultsMessage) {
      noResultsMessage.hidden = isFacultyLoading || visibleCount > 0;
    }
  }

  function renderFacultyDashboard() {
    renderDepartmentFilters();
    renderProfessorCards();
    renderAvailabilityList();
    applyFilters();
  }

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  if (filterPanel) {
    filterPanel.addEventListener("click", (event) => {
      const option = event.target.closest(".filter-option");
      if (!option || option.disabled) return;

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
      closeFilterPanel();
    });
  }

  renderFacultyDashboard();

  fetch("api/faculty-directory.php", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((result) => {
      facultyDashboardData = result && Array.isArray(result.faculty)
        ? result.faculty.map(mapFacultyRecord)
        : [];
      isFacultyLoading = false;
      renderFacultyDashboard();
    })
    .catch(() => {
      facultyDashboardData = [];
      isFacultyLoading = false;
      renderFacultyDashboard();
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

  renderRecentNotifications(
    buildRecentNotificationRows(storedNotificationRecords.slice(0, RECENT_NOTIFICATIONS_LIMIT))
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
    try {
      sessionStorage.removeItem(
        "profconsult_student_quick_action_shown"
      );
    } catch (error) {
    }

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
