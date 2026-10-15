// Faculty Directory JS
document.addEventListener("DOMContentLoaded", () => {

  const DEFAULT_OFFICE = "Faculty Room";

  let FACULTY_DIRECTORY_DATA = [];

  const SELECTED_FACULTY_STORAGE_KEY = "profconsult_selected_faculty";

  const facultyListEl = document.getElementById("facultyList");
  const noResultsMessage = document.getElementById("noResultsMessage");
  const searchInput = document.getElementById("facultySearchInput");
  const directoryContainer = document.getElementById("directoryContainer");
  const profilePanel = document.getElementById("directoryProfilePanel");
  const backRow = document.getElementById("directoryBackRow");
  const backButton = document.getElementById("directoryBackButton");
  const filterPanel = document.getElementById("filterPanel");

  let selectedFacultyId = null;
  let activeDepartment = null;
  let activeStatus = null;
  let filterOptions = [];

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
    if (raw === "unavailable") return "onleave";
    if (raw === "offline") return "offline";
    return ["online", "meeting", "consultation", "onleave", "offline"].includes(raw)
      ? raw
      : "consultation";
  }

  function statusLabel(status) {
    const labels = {
      online: "Online",
      meeting: "Meeting",
      consultation: "Consultation",
      onleave: "On Leave",
      offline: "Offline",
    };
    return labels[status] || "Consultation";
  }

  function mapFacultyRecord(record) {
    const status = normalizeStatus(record.Current_Status);
    const fullName = record.Full_Name || "";
    const nameParts = fullName.trim().split(/\s+/);
    const program = departmentLabel(record.Department || "Faculty");
    return {
      id: String(record.Faculty_ID),
      lastName: nameParts[nameParts.length - 1] || fullName,
      fullName,
      program,
      departmentKey: departmentKey(program),
      office: record.Office || DEFAULT_OFFICE,
      status,
      statusLabel: statusLabel(status),
      photo: record.Profile_Photo || "images/default-profile.jpg",
      hours: parseConsultationHours(record.Consultation_Hours),
    };
  }

  function parseConsultationHours(value) {
    try {
      const saved = JSON.parse(String(value || "[]"));
      if (Array.isArray(saved)) {
        const rows = saved
          .filter((entry) => entry && entry.day)
          .map((entry) => ({
            day: entry.day,
            time: entry.time || (Array.isArray(entry.times) && entry.times.length ? entry.times.join(", ") : "Unavailable"),
          }));
        return rows.length ? rows : [{ day: "Schedule", time: "Consultation hours not set" }];
      }
    } catch (error) {
    }

    const rows = String(value || "").split(/\r?\n|;/).map((item) => item.trim()).filter(Boolean);
    if (rows.length === 0) {
      return [{ day: "Schedule", time: "Consultation hours not set" }];
    }
    return rows.map((row) => {
      const parts = row.split(/:\s*/);
      return {
        day: parts.length > 1 ? parts.shift() : "Schedule",
        time: parts.join(": ") || row,
      };
    });
  }

  function renderFacultyList() {
    facultyListEl.innerHTML = "";

    FACULTY_DIRECTORY_DATA.forEach((faculty) => {
      const card = document.createElement("article");
      card.className = "faculty-card";
      card.dataset.status = faculty.status;
      card.dataset.department = faculty.departmentKey || departmentKey(faculty.program);
      card.dataset.facultyId = faculty.id;

      card.innerHTML = `
        <img src="${faculty.photo}" alt="${faculty.fullName}" class="faculty-photo">
        <div class="faculty-info">
          <p class="faculty-name">Engr. ${faculty.lastName}</p>
          <p class="faculty-meta faculty-meta-row">
            <span>${faculty.program}</span>
            <span class="faculty-meta-dot" aria-hidden="true">&middot;</span>
            <span>${faculty.office}</span>
          </p>
        </div>
        <button type="button" class="view-profile-button" data-faculty-id="${faculty.id}">View Profile</button>
        <span
          class="status-dot faculty-status-dot status-${faculty.status}"
          role="img"
          aria-label="Status: ${faculty.statusLabel}"
          title="${faculty.statusLabel}"
        ></span>
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

  function renderDepartmentFilters() {
    if (!filterPanel) return;

    const departments = DEPARTMENT_OPTIONS;

    filterPanel.innerHTML = "";

    const onlineOption = document.createElement("button");
    onlineOption.type = "button";
    onlineOption.className = "filter-option";
    onlineOption.dataset.status = "online";
    onlineOption.textContent = "Online";
    onlineOption.classList.toggle("is-active", activeStatus === "online");
    filterPanel.appendChild(onlineOption);

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

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const cards = Array.from(facultyListEl.querySelectorAll(".faculty-card"));
    let visibleCount = 0;

    cards.forEach((card) => {
      const faculty = FACULTY_DIRECTORY_DATA.find((f) => f.id === card.dataset.facultyId);
      const department = card.dataset.department || (faculty ? faculty.departmentKey : "");
      const nameMatch = faculty ? faculty.fullName.toLowerCase().includes(query) : false;
      const programMatch = faculty ? faculty.program.toLowerCase().includes(query) : false;
      const matchesSearch = query === "" || nameMatch || programMatch;
      const matchesDepartment = !activeDepartment || department === activeDepartment;
      const status = card.dataset.status || "";
      const matchesStatus = !activeStatus || status === activeStatus;
      const matches = matchesSearch && matchesDepartment && matchesStatus;

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

  if (filterPanel) {
    filterPanel.addEventListener("click", (event) => {
      const option = event.target.closest(".filter-option");
      if (!option || option.disabled) return;

      event.stopPropagation();
      const department = option.dataset.department || "";
      const status = option.dataset.status || "";

      if (status) {
        activeStatus = activeStatus === status ? null : status;
        activeDepartment = null;
      } else if (activeDepartment === department) {
        activeDepartment = null;
      } else {
        activeDepartment = department;
        activeStatus = null;
      }

      filterOptions.forEach((opt) => {
        opt.classList.toggle(
          "is-active",
          (activeStatus && opt.dataset.status === activeStatus) ||
            (activeDepartment && opt.dataset.department === activeDepartment)
        );
      });

      applyFilters();
    });
  }

  function buildProfileMarkup(faculty) {
    const hoursRows = faculty.hours.map((entry) => `
      <li class="profile-hours-row">
        <span class="profile-hours-day">${entry.day}</span>
        <span class="profile-hours-time">${entry.time}</span>
      </li>
    `).join("");

    return `
      <img src="${faculty.photo}" alt="${faculty.fullName}" class="profile-photo">
      <p class="profile-name">${faculty.fullName}</p>
      <p class="profile-program">${faculty.program}</p>
      <p class="profile-office">${faculty.office}</p>
      <p class="profile-status-row">
        <span class="status-dot status-${faculty.status}" aria-hidden="true"></span>
        <span class="profile-status-label">Status: ${faculty.statusLabel}</span>
      </p>

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
    const faculty = FACULTY_DIRECTORY_DATA.find((f) => f.id === facultyId);
    if (!faculty) return;

    selectedFacultyId = facultyId;

    Array.from(facultyListEl.querySelectorAll(".faculty-card")).forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.facultyId === facultyId);
    });

    profilePanel.innerHTML = buildProfileMarkup(faculty);
    profilePanel.hidden = false;

    directoryContainer.classList.add("is-profile-view");
    if (backRow) backRow.hidden = false;

    const requestConsultationLink = profilePanel.querySelector(".request-consultation-button");
    if (requestConsultationLink) {
      requestConsultationLink.addEventListener("click", () => {
        try {
          sessionStorage.setItem(SELECTED_FACULTY_STORAGE_KEY, JSON.stringify(faculty));
        } catch (error) {
        }
      });
    }

    window.scrollTo(0, 0);

    requestAnimationFrame(() => profilePanel.classList.add("is-visible"));
  }

  function closeProfile() {
    selectedFacultyId = null;

    profilePanel.classList.remove("is-visible");
    profilePanel.hidden = true;
    profilePanel.innerHTML = "";

    Array.from(facultyListEl.querySelectorAll(".faculty-card")).forEach((card) => {
      card.classList.remove("is-selected");
    });

    directoryContainer.classList.remove("is-profile-view");
    if (backRow) backRow.hidden = true;

    window.scrollTo(0, 0);
  }

  if (backButton) {
    backButton.addEventListener("click", closeProfile);
  }

  function renderInitialView() {
    renderDepartmentFilters();
    renderFacultyList();
    applyFilters();

    const initialParams = new URLSearchParams(window.location.search);
    const initialFacultyId = initialParams.get("facultyId");
    if (initialFacultyId && FACULTY_DIRECTORY_DATA.some((f) => f.id === initialFacultyId)) {
      openProfile(initialFacultyId);
    }
  }

  let directoryLoaded = false;
  function refreshFacultyDirectory() {
    if (document.hidden) return;
    fetch("api/get-faculty-directory.php", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((result) => {
      if (result && Array.isArray(result.faculty)) {
        FACULTY_DIRECTORY_DATA = result.faculty.map(mapFacultyRecord);
      }
      if (directoryLoaded) {
        renderFacultyList();
        applyFilters();
        if (selectedFacultyId) openProfile(selectedFacultyId);
      } else {
        renderInitialView();
        directoryLoaded = true;
      }
    })
    .catch(() => { if (!directoryLoaded) renderInitialView(); });
  }
  refreshFacultyDirectory();
  window.setInterval(refreshFacultyDirectory, 20000);
  document.addEventListener("visibilitychange", refreshFacultyDirectory);

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
