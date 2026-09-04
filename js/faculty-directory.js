// SYSTEM NOTE: Controls client-side behavior for the faculty directory page, including UI events and API calls.
// =========================================================
// STUDENT-SHARED.JS
// Shared behavior for every Student-side page:
// - Burger menu: slide-in sidebar with dim/blur overlay
// - Quick Action: fade/slide popup (Find Faculty / Send Request)
// - Notification bell: navigates to notifications.html
// - Status filter popup: fade/slide open + outside-click close
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
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

  if (hamburgerButton) hamburgerButton.addEventListener("click", openSidebar);
  if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

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
      isOpen ? closeQuickAction() : openQuickAction();
    });
  }

  const requestConsultationButton = document.getElementById("requestConsultationButton");
  if (requestConsultationButton) {
    requestConsultationButton.addEventListener("click", (event) => {
      event.preventDefault();
    });
  }

  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
  }

  const filterButton = document.getElementById("filterButton");
  const filterPanel = document.getElementById("filterPanel");
  const filterOptions = filterPanel
    ? Array.from(filterPanel.querySelectorAll(".filter-option"))
    : [];

  window.StudentShared = window.StudentShared || {};
  window.StudentShared.activeStatus = null;

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
      isOpen ? closeFilterPanel() : openFilterPanel();
    });
  }

  filterOptions.forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();
      const status = option.dataset.status;

      if (window.StudentShared.activeStatus === status) {
        window.StudentShared.activeStatus = null;
        option.classList.remove("is-active");
      } else {
        window.StudentShared.activeStatus = status;
        filterOptions.forEach((opt) => opt.classList.remove("is-active"));
        option.classList.add("is-active");
      }

      document.dispatchEvent(new CustomEvent("statusfilterchange", {
        detail: { status: window.StudentShared.activeStatus },
      }));
    });
  });

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
});


// =========================================================
// FACULTY-DIRECTORY.JS
// Loads real faculty accounts from api/faculty-directory.php,
// then renders searchable cards and request links for students.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const SELECTED_FACULTY_STORAGE_KEY = "profconsult_selected_faculty";
  const DEFAULT_PHOTO = "images/user1.png";
  const DEFAULT_OFFICE = "Office not set";
  const DEFAULT_HOURS = "Consultation hours not set";

  const facultyListEl = document.getElementById("facultyList");
  const noResultsMessage = document.getElementById("noResultsMessage");
  const searchInput = document.getElementById("facultySearchInput");
  const directoryContainer = document.getElementById("directoryContainer");
  const profilePanel = document.getElementById("directoryProfilePanel");

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

  function lastNameFrom(fullName) {
    const cleaned = String(fullName || "").replace(/^engr\.\s*/i, "").trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : cleaned || "Faculty";
  }

  function consultationHoursRows(hours) {
    const value = String(hours || DEFAULT_HOURS).trim();
    return value.split(/\r?\n|;/).map((entry) => {
      const text = entry.trim();
      if (!text) return "";

      const parts = text.split(/\s*:\s*/);
      if (parts.length > 1) {
        return {
          day: parts.shift(),
          time: parts.join(":"),
        };
      }

      return {
        day: "Schedule",
        time: text,
      };
    }).filter(Boolean);
  }

  function facultyFromApi(row) {
    const status = normalizeStatus(row.Current_Status);
    const fullName = displayName(row.Full_Name);
    const profilePhoto = String(row.Profile_Photo || row.profile_photo || "").trim();

    return {
      id: String(row.Faculty_ID),
      lastName: lastNameFrom(fullName),
      fullName,
      program: row.Department || "Department not set",
      office: row.Office || DEFAULT_OFFICE,
      status,
      statusLabel: statusLabel(status),
      photo: profilePhoto || DEFAULT_PHOTO,
      hours: consultationHoursRows(row.Consultation_Hours),
    };
  }

  function renderEmpty(message) {
    facultyListEl.innerHTML = "";
    if (noResultsMessage) {
      noResultsMessage.textContent = message;
      noResultsMessage.hidden = false;
    }
  }

  function renderFacultyList() {
    facultyListEl.innerHTML = "";

    facultyDirectoryData.forEach((faculty) => {
      const card = document.createElement("article");
      card.className = "faculty-card";
      card.dataset.status = faculty.status;
      card.dataset.facultyId = faculty.id;

      card.innerHTML = `
        <img src="${escapeHtml(faculty.photo)}" alt="${escapeHtml(faculty.fullName)}" class="faculty-photo">
        <div class="faculty-info">
          <p class="faculty-name">Engr. ${escapeHtml(faculty.lastName)}</p>
          <p class="faculty-meta faculty-meta-row">
            <span>${escapeHtml(faculty.program)}</span>
            <span class="faculty-meta-dot" aria-hidden="true">&middot;</span>
            <span>${escapeHtml(faculty.office)}</span>
          </p>
        </div>
        <button type="button" class="view-profile-button" data-faculty-id="${escapeHtml(faculty.id)}">View Profile</button>
      `;

      facultyListEl.appendChild(card);
    });

    Array.from(facultyListEl.querySelectorAll(".view-profile-button")).forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openProfile(button.dataset.facultyId);
      });
    });
  }

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const activeStatus = (window.StudentShared && window.StudentShared.activeStatus) || null;
    const cards = Array.from(facultyListEl.querySelectorAll(".faculty-card"));
    let visibleCount = 0;

    cards.forEach((card) => {
      const faculty = facultyDirectoryData.find((item) => item.id === card.dataset.facultyId);
      if (!faculty) {
        card.hidden = true;
        return;
      }

      const searchableText = `${faculty.fullName} ${faculty.program} ${faculty.office}`.toLowerCase();
      const matchesSearch = query === "" || searchableText.includes(query);
      const matchesStatus = !activeStatus || faculty.status === activeStatus;
      const matches = matchesSearch && matchesStatus;

      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    if (noResultsMessage) {
      noResultsMessage.textContent = "No faculty members match your search or selected status.";
      noResultsMessage.hidden = visibleCount > 0;
    }
  }

  function buildProfileMarkup(faculty) {
    const hoursRows = faculty.hours.map((entry) => `
      <li class="profile-hours-row">
        <span class="profile-hours-day">${escapeHtml(entry.day)}</span>
        <span class="profile-hours-time">${escapeHtml(entry.time)}</span>
      </li>
    `).join("");

    return `
      <img src="${escapeHtml(faculty.photo)}" alt="${escapeHtml(faculty.fullName)}" class="profile-photo">
      <p class="profile-name">${escapeHtml(faculty.fullName)}</p>
      <p class="profile-program">${escapeHtml(faculty.program)}</p>
      <p class="profile-office">${escapeHtml(faculty.office)}</p>

      <h2 class="profile-section-title">Available Hours</h2>
      <ul class="profile-hours-list">
        ${hoursRows}
      </ul>

      <a
        href="request-consultation.html?facultyId=${encodeURIComponent(faculty.id)}"
        class="request-consultation-button"
      >
        Request Consultation
      </a>
    `;
  }

  function openProfile(facultyId) {
    const faculty = facultyDirectoryData.find((item) => item.id === facultyId);
    if (!faculty) return;

    Array.from(facultyListEl.querySelectorAll(".faculty-card")).forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.facultyId === facultyId);
    });

    profilePanel.innerHTML = buildProfileMarkup(faculty);
    profilePanel.hidden = false;
    directoryContainer.classList.add("is-split");

    const requestConsultationLink = profilePanel.querySelector(".request-consultation-button");
    if (requestConsultationLink) {
      requestConsultationLink.addEventListener("click", () => {
        try {
          sessionStorage.setItem(SELECTED_FACULTY_STORAGE_KEY, JSON.stringify(faculty));
        } catch (error) {
          // The query string still carries the numeric Faculty_ID as fallback.
        }
      });
    }

    requestAnimationFrame(() => profilePanel.classList.add("is-visible"));
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

      renderFacultyList();
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

  document.addEventListener("statusfilterchange", applyFilters);

  loadFacultyDirectory(true);

  window.setInterval(() => {
    loadFacultyDirectory(false);
  }, 5000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadFacultyDirectory(false);
    }
  });
});
