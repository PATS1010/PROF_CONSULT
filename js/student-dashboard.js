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

});