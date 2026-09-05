// SYSTEM NOTE: Controls client-side behavior for the faculty shared page, including UI events and API calls.
// =========================================================
// FACULTY SHARED LAYOUT INTERACTIONS
// Reused across every Faculty page. Handles only the shared
// shell: burger sidebar, Quick Action popup (including Check
// In/Check Out online status), notification bell navigation,
// and active-link highlighting.
//
// Each Faculty page sets `document.body.dataset.activePage`
// to one of: "dashboard", "consultation-requests",
// "availability", "notifications", "profile", "settings"
// so the correct sidebar link gets the .is-active class
// automatically, without hardcoding it per page.
//
// Page-specific behavior (e.g. the Dashboard's Change Status
// dropdown) belongs in that page's own JS file, loaded after
// this one.
// =========================================================

// ---------------------------------------------------------
// Faculty online/offline status (Quick Action Check In/Out)
// -- Quick Action keeps its own temporary UI state. The saved
// dashboard availability is loaded and updated by each page's
// database-backed status code.
//
// CHECK_IN_TIMEOUT is the single place that controls how long
// a Check In lasts before automatically reverting to Offline
// if the faculty forgets to Check Out -- change this one value
// to adjust the duration everywhere it's used.
// ---------------------------------------------------------
const CHECK_IN_TIMEOUT = 5 * 60 * 1000; // 5 minutes

let facultyOnlineStatus = "offline"; // "offline" | "available"
let checkInTimeoutId = null;

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Burger sidebar: slides in from the left, dims/blurs the
  // page behind it. Closes via the X button or clicking the
  // overlay outside the sidebar.
  // ---------------------------------------------------------
  const hamburgerButton = document.getElementById("facultyHamburgerButton");
  const sidebar = document.getElementById("facultySidebar");
  const sidebarOverlay = document.getElementById("facultySidebarOverlay");
  const sidebarClose = document.getElementById("facultySidebarClose");

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
  // Active sidebar link -- set automatically from
  // document.body.dataset.activePage, so nothing needs to be
  // hardcoded by hand on each page's copy of the sidebar.
  // ---------------------------------------------------------
  const activePage = document.body.dataset.activePage;
  if (activePage) {
    const activeLink = sidebar
      ? sidebar.querySelector(`.faculty-sidebar-link[data-page="${activePage}"]`)
      : null;
    if (activeLink) {
      activeLink.classList.add("is-active");
    }
  }

  // ---------------------------------------------------------
  // Quick Action popup: fades/slides in below its trigger icon.
  // ---------------------------------------------------------
  const quickActionButton = document.getElementById("facultyQuickActionButton");
  const quickActionPanel = document.getElementById("facultyQuickActionPanel");

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
      event.target !== quickActionButton &&
      !quickActionButton.contains(event.target)
    ) {
      closeQuickAction();
    }
  });

  // ---------------------------------------------------------
  // Check In / Check Out -- toggles facultyOnlineStatus between
  // "offline" and "available". The popup's status line is not
  // part of the existing static markup, so it's created here at
  // runtime (inline-styled, so it renders consistently even on
  // pages whose own CSS doesn't define status-dot colors) and
  // inserted right after the popup header, before the buttons.
  // Only one of Check In / Check Out is visible at a time.
  // ---------------------------------------------------------
  const checkInButton = document.getElementById("facultyCheckInButton");
  const checkOutButton = document.getElementById("facultyCheckOutButton");
  const quickActionHeader = quickActionPanel
    ? quickActionPanel.querySelector(".faculty-quick-action-header")
    : null;

  let quickActionStatusDot = null;
  let quickActionStatusLabel = null;

  if (quickActionPanel && quickActionHeader && !quickActionPanel.querySelector(".faculty-quick-action-status")) {
    const statusRow = document.createElement("p");
    statusRow.className = "faculty-quick-action-status";
    statusRow.style.cssText = "display:flex;align-items:center;gap:8px;font-size:0.82rem;font-weight:600;color:#2b2b2b;margin:0 0 14px;";

    quickActionStatusDot = document.createElement("span");
    quickActionStatusDot.setAttribute("aria-hidden", "true");
    quickActionStatusDot.style.cssText = "display:inline-block;width:10px;height:10px;border-radius:50%;flex-shrink:0;";

    quickActionStatusLabel = document.createElement("span");

    statusRow.appendChild(document.createTextNode("Status: "));
    statusRow.appendChild(quickActionStatusDot);
    statusRow.appendChild(quickActionStatusLabel);

    quickActionHeader.insertAdjacentElement("afterend", statusRow);
  } else if (quickActionPanel) {
    // Popup already has a status row (shouldn't normally happen,
    // but guards against double-injection if this ever runs twice).
    const existingRow = quickActionPanel.querySelector(".faculty-quick-action-status");
    if (existingRow) {
      quickActionStatusDot = existingRow.children[0] || null;
      quickActionStatusLabel = existingRow.children[1] || null;
    }
  }

  function updateQuickActionUI() {
    const isAvailable = facultyOnlineStatus === "available";

    if (quickActionStatusDot) {
      quickActionStatusDot.style.backgroundColor = isAvailable ? "#2fae4e" : "#b9b9b9";
    }
    if (quickActionStatusLabel) {
      quickActionStatusLabel.textContent = isAvailable ? "Available" : "Offline";
    }
    if (checkInButton) {
      checkInButton.hidden = isAvailable;
    }
    if (checkOutButton) {
      checkOutButton.hidden = !isAvailable;
    }
  }

  function setFacultyOnlineStatus(newStatus) {
    facultyOnlineStatus = newStatus;
    updateQuickActionUI();
  }

  function handleCheckIn(event) {
    event.preventDefault();
    setFacultyOnlineStatus("available");

    if (checkInTimeoutId) {
      window.clearTimeout(checkInTimeoutId);
    }
    // Forgot-to-Check-Out safeguard: automatically revert to
    // Offline after CHECK_IN_TIMEOUT if Check Out was never
    // clicked. Frontend-only simulation of what a real session
    // timeout will eventually do once there's a backend.
    checkInTimeoutId = window.setTimeout(() => {
      setFacultyOnlineStatus("offline");
      checkInTimeoutId = null;
    }, CHECK_IN_TIMEOUT);
  }

  function handleCheckOut(event) {
    event.preventDefault();
    setFacultyOnlineStatus("offline");

    if (checkInTimeoutId) {
      window.clearTimeout(checkInTimeoutId);
      checkInTimeoutId = null;
    }
  }

  if (checkInButton) {
    checkInButton.addEventListener("click", handleCheckIn);
  }
  if (checkOutButton) {
    checkOutButton.addEventListener("click", handleCheckOut);
  }

  // Establish the initial Quick Action state without changing
  // the database-backed Dashboard status card.
  updateQuickActionUI();

  // ---------------------------------------------------------
  // Notification bell -- navigates to the Faculty Notifications
  // page. The bell icon/design itself is untouched.
  // ---------------------------------------------------------
  const notificationBellButton = document.getElementById("facultyNotificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "faculty-notifications.html";
    });
  }

});
