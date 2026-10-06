// Faculty Directory JS
document.addEventListener("DOMContentLoaded", () => {

  const DEFAULT_OFFICE = "Faculty Room";

  const FACULTY_DIRECTORY_DATA = [
    {
      id: "maria-nina-sales",
      lastName: "Sales",
      fullName: "Engr. Maria Nina Sales",
      program: "Computer Engineering",
      office: DEFAULT_OFFICE,
      status: "available",
      statusLabel: "Available",
      photo: "images/professor-maria-nina-sales.jpg",
      hours: [
        { day: "Monday", time: "9:00 AM - 11:00 AM" },
        { day: "Tuesday", time: "1:00 PM - 3:00 PM" },
        { day: "Wednesday", time: "9:00 AM - 11:00 AM" },
        { day: "Thursday", time: "1:00 PM - 3:00 PM" },
        { day: "Friday", time: "10:00 AM - 12:00 PM" },
      ],
    },
    {
      id: "bernard-bisuecos",
      lastName: "Bisuecos",
      fullName: "Engr. Bernard Bisuecos",
      program: "Computer Engineering",
      office: DEFAULT_OFFICE,
      status: "onleave",
      statusLabel: "On Leave",
      photo: "images/professor-bernard-bisuecos.jpg",
      hours: [
        { day: "Monday", time: "Unavailable" },
        { day: "Tuesday", time: "Unavailable" },
        { day: "Wednesday", time: "10:00 AM - 12:00 PM" },
        { day: "Thursday", time: "Unavailable" },
        { day: "Friday", time: "Unavailable" },
      ],
    },
    {
      id: "mervin-molina",
      lastName: "Molina",
      fullName: "Engr. Mervin Molina",
      program: "Computer Engineering",
      office: DEFAULT_OFFICE,
      status: "teaching",
      statusLabel: "Teaching Class",
      photo: "images/professor-mervin-molina.jpg",
      hours: [
        { day: "Monday", time: "2:00 PM - 4:00 PM" },
        { day: "Tuesday", time: "9:00 AM - 10:00 AM" },
        { day: "Wednesday", time: "2:00 PM - 4:00 PM" },
        { day: "Thursday", time: "9:00 AM - 10:00 AM" },
        { day: "Friday", time: "1:00 PM - 2:00 PM" },
      ],
    },
    {
      id: "rose-onate",
      lastName: "Onate",
      fullName: "Engr. Rose Onate",
      program: "Computer Engineering",
      office: DEFAULT_OFFICE,
      status: "meeting",
      statusLabel: "Meeting",
      photo: "images/professor-rose-onate.jpg",
      hours: [
        { day: "Monday", time: "10:00 AM - 12:00 PM" },
        { day: "Tuesday", time: "10:00 AM - 12:00 PM" },
        { day: "Wednesday", time: "1:00 PM - 3:00 PM" },
        { day: "Thursday", time: "10:00 AM - 12:00 PM" },
        { day: "Friday", time: "9:00 AM - 11:00 AM" },
      ],
    },
    {
      id: "melody-paned",
      lastName: "Paned",
      fullName: "Engr. Melody Paned",
      program: "Computer Engineering",
      office: DEFAULT_OFFICE,
      status: "offline",
      statusLabel: "Offline",
      photo: "images/professor-melody-paned.jpg",
      hours: [
        { day: "Monday", time: "9:00 AM - 11:00 AM" },
        { day: "Tuesday", time: "Unavailable" },
        { day: "Wednesday", time: "9:00 AM - 11:00 AM" },
        { day: "Thursday", time: "Unavailable" },
        { day: "Friday", time: "9:00 AM - 11:00 AM" },
      ],
    },
  ];

  const SELECTED_FACULTY_STORAGE_KEY = "profconsult_selected_faculty";

  const facultyListEl = document.getElementById("facultyList");
  const noResultsMessage = document.getElementById("noResultsMessage");
  const searchInput = document.getElementById("facultySearchInput");
  const directoryContainer = document.getElementById("directoryContainer");
  const profilePanel = document.getElementById("directoryProfilePanel");
  const backRow = document.getElementById("directoryBackRow");
  const backButton = document.getElementById("directoryBackButton");

  let selectedFacultyId = null;

  function renderFacultyList() {
    facultyListEl.innerHTML = "";

    FACULTY_DIRECTORY_DATA.forEach((faculty) => {
      const card = document.createElement("article");
      card.className = "faculty-card";
      card.dataset.status = faculty.status;
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

  function applyFilters() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const activeStatus = (window.StudentShared && window.StudentShared.activeStatus) || null;
    const cards = Array.from(facultyListEl.querySelectorAll(".faculty-card"));
    let visibleCount = 0;

    cards.forEach((card) => {
      const faculty = FACULTY_DIRECTORY_DATA.find((f) => f.id === card.dataset.facultyId);
      const status = card.dataset.status || (faculty ? faculty.status : "");
      const nameMatch = faculty ? faculty.fullName.toLowerCase().includes(query) : false;
      const programMatch = faculty ? faculty.program.toLowerCase().includes(query) : false;
      const matchesSearch = query === "" || nameMatch || programMatch;
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

  document.addEventListener("statusfilterchange", applyFilters);

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

  renderFacultyList();
  applyFilters();

  const initialParams = new URLSearchParams(window.location.search);
  const initialFacultyId = initialParams.get("facultyId");
  if (initialFacultyId && FACULTY_DIRECTORY_DATA.some((f) => f.id === initialFacultyId)) {
    openProfile(initialFacultyId);
  }

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