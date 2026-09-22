// =========================================================
// FACULTY-DIRECTORY.JS
// Page-specific behavior for the Faculty Directory:
// - Renders faculty cards from FACULTY_DIRECTORY_DATA
// - Each card shows a status dot (same colors as the Student
//   Dashboard) driven by that faculty's `status` value
// - Search-as-you-type by name or specialization/program
// - Combines with the shared status filter (student-shared.js)
// - "View Profile" switches the page (in-page, no navigation) to
//   a profile view: the search bar and faculty list are hidden,
//   and the selected faculty's profile card is shown directly
//   below the heading/description with a Back button above it.
//   The profile is populated from the same data object.
// - "Back" hides the profile and restores the search bar and
//   faculty list exactly as they were
// - "Request Consultation" persists the selected professor's
//   full record to sessionStorage so request-consultation.html
//   (and, after submitting, request-submitted.html) can display
//   that SAME professor instead of a hardcoded one
// - If the page loads with a "?facultyId=" URL param (e.g. from
//   a Student Dashboard faculty card click), that same faculty
//   is auto-selected using the EXISTING openProfile() function --
//   see the AUTO-SELECT FROM URL section near the bottom. Manual
//   selection via "View Profile" is completely unaffected.
//
// NOTE -- TEST DATA ONLY:
// We are testing from a student account and there is no
// backend yet, so FACULTY_DIRECTORY_DATA below is prototype
// data. Faculty status/availability is currently controlled
// here. Once real faculty accounts exist, this array (and the
// render/lookup functions that use it) should be replaced by
// data fetched from those accounts -- the rest of the page
// logic (search, filter, profile panel, status display,
// selected-faculty hand-off) should not need to change.
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // TEST DATA -- replace with real faculty account data later
  // ---------------------------------------------------------
  // All faculty currently share one placeholder office label. Change
  // this single constant when real office assignments exist per faculty.
  const DEFAULT_OFFICE = "Faculty Room";

  // STATUS: each faculty's `status` (one of the existing values:
  // available, teaching, meeting, consultation, onleave, offline)
  // picks the dot color, and `statusLabel` is the text shown after
  // "Status:" in the profile. Both the list and the profile read
  // these SAME two fields -- update them here (or from the backend
  // later) and every view updates on the next render.
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

  // Key used to hand the selected professor off to
  // request-consultation.html and, from there, request-submitted.html.
  // Frontend-only stand-in until real faculty accounts/backend exist.
  const SELECTED_FACULTY_STORAGE_KEY = "profconsult_selected_faculty";

  // ---------------------------------------------------------
  // Element references
  // ---------------------------------------------------------
  const facultyListEl = document.getElementById("facultyList");
  const noResultsMessage = document.getElementById("noResultsMessage");
  const searchInput = document.getElementById("facultySearchInput");
  const directoryContainer = document.getElementById("directoryContainer");
  const profilePanel = document.getElementById("directoryProfilePanel");
  const backRow = document.getElementById("directoryBackRow");
  const backButton = document.getElementById("directoryBackButton");

  let selectedFacultyId = null;

  // ---------------------------------------------------------
  // Render the faculty list from FACULTY_DIRECTORY_DATA
  // ---------------------------------------------------------
  function renderFacultyList() {
    facultyListEl.innerHTML = "";

    FACULTY_DIRECTORY_DATA.forEach((faculty) => {
      const card = document.createElement("article");
      card.className = "faculty-card";
      card.dataset.status = faculty.status;
      card.dataset.facultyId = faculty.id;

      // The status dot uses the shared .status-dot + .status-<status>
      // classes (same colors as the Student Dashboard), so its color
      // always comes from faculty.status -- nothing is hardcoded here.
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

    // Wire up "View Profile" buttons after render
    Array.from(facultyListEl.querySelectorAll(".view-profile-button")).forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openProfile(button.dataset.facultyId);
      });
    });
  }

  // ---------------------------------------------------------
  // Search + status filter (status comes from student-shared.js)
  //
  // FIX: status is now read directly from the card's own
  // `data-status` attribute (set in renderFacultyList above),
  // the same reliable pattern student-dashboard.js already uses
  // for its own filter. Previously this re-derived status by
  // looking the card back up in FACULTY_DIRECTORY_DATA via
  // card.dataset.facultyId -- if that lookup ever came back
  // undefined for any card, `faculty.status` threw and silently
  // aborted the whole filter loop, so nothing ever got hidden.
  // The lookup is now only used (safely, with a fallback) for
  // the name/program text search, which was working already.
  // ---------------------------------------------------------
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

  // student-shared.js dispatches this when a status filter option is toggled
  document.addEventListener("statusfilterchange", applyFilters);

  // ---------------------------------------------------------
  // Profile panel: builds the markup for the selected faculty,
  // then switches the page into the profile view (search + list
  // hidden, profile shown under the heading).
  // ---------------------------------------------------------
  function buildProfileMarkup(faculty) {
    const hoursRows = faculty.hours.map((entry) => `
      <li class="profile-hours-row">
        <span class="profile-hours-day">${entry.day}</span>
        <span class="profile-hours-time">${entry.time}</span>
      </li>
    `).join("");

    // Status sits directly below the office/room line. It reads the same
    // faculty.status / faculty.statusLabel fields as the list dot, so the
    // list and profile can never disagree.
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

    // Highlight the selected card (it is hidden in the profile view, but
    // this keeps the existing selection state consistent)
    Array.from(facultyListEl.querySelectorAll(".faculty-card")).forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.facultyId === facultyId);
    });

    profilePanel.innerHTML = buildProfileMarkup(faculty);
    profilePanel.hidden = false;

    // Profile view: CSS hides the search bar + faculty list and stacks
    // the profile card under the heading. The Back button appears above it.
    directoryContainer.classList.add("is-profile-view");
    if (backRow) backRow.hidden = false;

    // Persist the selected faculty so request-consultation.html (and,
    // after submission, request-submitted.html) can display the same
    // professor instead of a hardcoded one. sessionStorage is a
    // frontend-only stand-in until real faculty accounts/backend exist.
    // The facultyId query param on the link above is kept as a fallback.
    const requestConsultationLink = profilePanel.querySelector(".request-consultation-button");
    if (requestConsultationLink) {
      requestConsultationLink.addEventListener("click", () => {
        try {
          sessionStorage.setItem(SELECTED_FACULTY_STORAGE_KEY, JSON.stringify(faculty));
        } catch (error) {
          // sessionStorage unavailable -- request-consultation.html will
          // fall back to its own neutral placeholder if it can't read this
        }
      });
    }

    // Start at the top so the heading, Back button and profile are in
    // view (the list above it is no longer in the way)
    window.scrollTo(0, 0);

    // Let the browser paint `hidden` removal first so the
    // opacity/transform transition actually animates in
    requestAnimationFrame(() => profilePanel.classList.add("is-visible"));
  }

  // ---------------------------------------------------------
  // Back: leave the profile view and restore the normal directory
  // (search bar + faculty list). Purely in-page -- no navigation
  // or reload. The search text / status filter the student had
  // before opening the profile are left as they were.
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Initial render
  // ---------------------------------------------------------
  renderFacultyList();
  applyFilters();

  // ---------------------------------------------------------
  // AUTO-SELECT FROM URL: if the page was opened with
  // "?facultyId=<id>" (e.g. clicking a faculty card on the
  // Student Dashboard -- see student-dashboard.js), automatically
  // open that same faculty's profile using the EXISTING
  // openProfile() function above -- no separate/duplicate
  // selection logic, and no per-faculty special-casing. Falls
  // through silently (normal, unselected directory view) if the
  // param is missing or doesn't match a real faculty id, so
  // opening the page normally is completely unaffected.
  // ---------------------------------------------------------
  const initialParams = new URLSearchParams(window.location.search);
  const initialFacultyId = initialParams.get("facultyId");
  if (initialFacultyId && FACULTY_DIRECTORY_DATA.some((f) => f.id === initialFacultyId)) {
    openProfile(initialFacultyId);
  }

});