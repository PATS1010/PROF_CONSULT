// SYSTEM NOTE: Controls client-side behavior for the student dashboard page, including UI events and API calls.
// =========================================================
// STUDENT DASHBOARD INTERACTIONS
// - Populates the greeting from the logged-in student session
// - Live Philippine date and time, updated every second
// - Burger menu: slide-in sidebar with dim/blur overlay
// - Quick Action: fade/slide popup with Find Faculty and
//   Request Consultation actions
// - Notification bell: navigates to notifications.html
// - Search Professor: real-time, case-insensitive, partial-match
//   filtering, combined with an optional status filter, with a
//   shared empty state when nothing matches
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  const firstNameEl = document.getElementById("studentFirstName");

  function firstNameFrom(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    return parts[0] || "Student";
  }

  async function loadCurrentStudent() {
    try {
      const response = await fetch("api/session.php?role=student", {
        cache: "no-store",
        headers: { "Accept": "application/json" },
      });
      const data = await response.json();

      if (!response.ok || !data.ok || !data.user || data.user.role !== "student") {
        throw new Error("Student session unavailable");
      }

      if (firstNameEl) firstNameEl.textContent = firstNameFrom(data.user.name);
    } catch (error) {
      window.location.href = "student-login.html";
    }
  }

  loadCurrentStudent();

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

  // "Send Request" doesn't have a destination page yet --
  // left wired up but intentionally not navigating anywhere
  const requestConsultationButton = document.getElementById("requestConsultationButton");
  if (requestConsultationButton) {
    requestConsultationButton.addEventListener("click", (event) => {
      event.preventDefault();
      // Future: navigate to the consultation request page once it exists
    });
  }

  // ---------------------------------------------------------
  // Notification bell -- navigates to notifications.html.
  // TEST/DEMO ONLY: no real notification data or backend yet,
  // this just routes the whole button (not only the image) to
  // the Notifications page.
  // ---------------------------------------------------------
  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
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
    }, 200); // matches the panel's CSS transition duration
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
  // Search Professor + Status Filter: the cards are loaded from
  // the real faculty accounts returned by api/faculty-directory.php.
  // ---------------------------------------------------------
  const searchInput = document.getElementById("professorSearchInput");
  const professorList = document.getElementById("professorList");
  const availabilityList = document.getElementById("availabilityList");
  const notificationsList = document.getElementById("notificationsList");
  const noResultsMessage = document.getElementById("noResultsMessage");

  let activeStatus = null;
  let facultyDirectoryData = [];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;",
    }[character]));
  }

  function normalizeStatus(value) {
    const normalized = String(value || "offline").trim().toLowerCase();
    const map = {
      "available": "available",
      "in class": "teaching",
      "teaching": "teaching",
      "meeting": "meeting",
      "consultation": "consultation",
      "on leave": "onleave",
      "onleave": "onleave",
      "unavailable": "offline",
      "offline": "offline",
    };

    return map[normalized] || "offline";
  }

  function statusLabel(status) {
    const labels = {
      available: "Available",
      teaching: "Teaching Class",
      meeting: "Meeting",
      consultation: "Consultation",
      onleave: "On Leave",
      offline: "Offline",
    };

    return labels[status] || "Offline";
  }

  function displayName(userName) {
    const name = String(userName || "Unnamed Faculty").trim();
    return /^engr\./i.test(name) ? name : `Engr. ${name}`;
  }

  function facultyFromApi(row) {
    const status = normalizeStatus(row.Current_Status);
    const profilePhoto = String(row.Profile_Photo || row.profile_photo || "").trim();

    return {
      id: String(row.Faculty_ID),
      fullName: displayName(row.Full_Name),
      department: row.Department || "Department not set",
      office: row.Office || "Office not set",
      status,
      statusLabel: statusLabel(status),
      photo: profilePhoto || "images/user1.png",
    };
  }

  function renderEmpty(message) {
    if (professorList) professorList.innerHTML = "";
    if (availabilityList) availabilityList.innerHTML = `<li>${message}</li>`;
    if (noResultsMessage) {
      noResultsMessage.textContent = message;
      noResultsMessage.hidden = false;
    }
  }

  function renderFacultyCards() {
    if (!professorList) return;

    professorList.innerHTML = facultyDirectoryData.map((faculty) => `
      <article class="professor-card" data-status="${escapeHtml(faculty.status)}" data-faculty-id="${escapeHtml(faculty.id)}">
        <img src="${escapeHtml(faculty.photo)}" alt="${escapeHtml(faculty.fullName)}" class="professor-photo">
        <div class="professor-info">
          <p class="professor-name">${escapeHtml(faculty.fullName)}</p>
          <p class="professor-meta">${escapeHtml(faculty.department)} | ${escapeHtml(faculty.statusLabel)}</p>
        </div>
        <span class="status-dot status-${escapeHtml(faculty.status)}" aria-hidden="true"></span>
      </article>
    `).join("");
  }

  function renderAvailability() {
    if (!availabilityList) return;

    availabilityList.innerHTML = facultyDirectoryData.map((faculty) => `
      <li>
        <span class="status-dot status-${escapeHtml(faculty.status)}" aria-hidden="true"></span>
        ${escapeHtml(faculty.fullName)} | ${escapeHtml(faculty.statusLabel)}
      </li>
    `).join("");
  }

  function renderNotifications(notifications) {
    if (!notificationsList) return;

    notificationsList.innerHTML = "";

    if (notifications.length === 0) {
      notificationsList.innerHTML = "<li>No notifications yet.</li>";
      return;
    }

    notifications.slice(0, 3).forEach((notification) => {
      notificationsList.innerHTML += `
        <li>
          <span class="notification-check" aria-hidden="true">&check;</span>
          ${escapeHtml(notification.Message || "")}
        </li>
      `;
    });
  }

  async function loadNotifications() {
    if (!notificationsList) return;

    notificationsList.innerHTML = "<li>Loading notifications...</li>";

    try {
      const response = await fetch("api/notifications.php", {
        cache: "no-store",
        headers: { "Accept": "application/json" },
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to load notifications.");
      }

      renderNotifications(result.notifications || []);
    } catch (error) {
      notificationsList.innerHTML = `<li>${escapeHtml(error.message || "Unable to load notifications.")}</li>`;
    }
  }

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const professorCards = professorList
      ? Array.from(professorList.querySelectorAll(".professor-card"))
      : [];
    let visibleCount = 0;

    professorCards.forEach((card) => {
      const name = card.querySelector(".professor-name").textContent.toLowerCase();
      const meta = card.querySelector(".professor-meta").textContent.toLowerCase();
      const status = card.dataset.status || "";
      const matchesSearch = query === "" || name.includes(query) || meta.includes(query);
      const matchesStatus = !activeStatus || status === activeStatus;
      const matches = matchesSearch && matchesStatus;

      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    if (noResultsMessage) {
      noResultsMessage.textContent = "No faculty members match your search or selected status.";
      noResultsMessage.hidden = visibleCount > 0;
    }
  }

  async function loadFacultyDirectory(showLoading = false) {
    if (showLoading) {
      renderEmpty("Loading faculty...");
    }

    try {
      const response = await fetch("api/faculty-directory.php", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Unable to load faculty directory.");
      }

      facultyDirectoryData = (result.faculty || []).map(facultyFromApi);

      if (facultyDirectoryData.length === 0) {
        renderEmpty("No faculty accounts have been created yet.");
        return;
      }

      renderFacultyCards();
      renderAvailability();
      applyFilters();
    } catch (error) {
      if (showLoading || facultyDirectoryData.length === 0) {
        renderEmpty(error.message || "Unable to load faculty directory.");
      }
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

  loadFacultyDirectory(true);
  loadNotifications();

  window.setInterval(() => {
    loadFacultyDirectory(false);
  }, 5000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadFacultyDirectory(false);
      loadNotifications();
    }
  });
});
