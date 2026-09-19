// =========================================================
// FACULTY SHARED LAYOUT INTERACTIONS
//
// Used by every Faculty page.
//
// Handles:
// - Burger sidebar
// - Active sidebar page
// - Quick Action
// - Check In / Check Out
// - Persistent faculty status (SINGLE SOURCE OF TRUTH)
// - Notification bell
// - Notification badge
//
// IMPORTANT:
// This version uses localStorage for the TEST ACCOUNT only.
// No backend is used.
// =========================================================


// =========================================================
// TEST ACCOUNT STORAGE
// =========================================================

const FACULTY_ONLINE_STATUS_STORAGE_KEY =
  "facultyTestOnlineStatus";

const FACULTY_NOTIFICATION_STORAGE_KEY =
  "facultyTestNotifications";


// =========================================================
// TEST ACCOUNT FLAG
//
// This project has no backend/login system yet, so there is
// no real per-account identification -- every Faculty file's
// own comments already describe this whole section as a
// single test account. faculty-notifications.html already
// refers to a "TEST_FACULTY_ACCOUNT flag" that decides
// whether the test notification is shown; this is that flag,
// defined here since faculty-shared.js loads on every page.
//
// Once real accounts/login exist, replace this with the
// actual "is this the designated test account" check (e.g.
// based on the logged-in user's ID) -- nothing else that
// reads window.TEST_FACULTY_ACCOUNT needs to change.
// =========================================================

window.TEST_FACULTY_ACCOUNT = true;


// =========================================================
// FACULTY STATUS MODEL
//
// SINGLE SOURCE OF TRUTH for faculty status.
//
// These are the app's existing status values -- the same
// six values already used by the faculty-dashboard and
// faculty-availability status panels (data-status), and the
// same six colors already defined in :root above as
// --color-status-*. Quick Action, the Dashboard, and
// Availability all read/write this one model instead of
// keeping their own separate status state.
// =========================================================

const FACULTY_STATUS_LABELS = {
  available: "Available",
  teaching: "In Class",
  meeting: "Meeting",
  consultation: "Consultation",
  onleave: "On Leave",
  offline: "Offline",
};

const FACULTY_STATUS_COLOR_VARS = {
  available: "--color-status-available",
  teaching: "--color-status-teaching",
  meeting: "--color-status-meeting",
  consultation: "--color-status-consultation",
  onleave: "--color-status-onleave",
  offline: "--color-status-offline",
};

const FACULTY_STATUS_DEFAULT = "available";


function isValidFacultyStatus(value) {

  return Object.prototype.hasOwnProperty.call(
    FACULTY_STATUS_LABELS,
    value
  );
}


// =========================================================
// CURRENT STATUS
//
// Possible values (existing app status model):
// "available"
// "teaching"
// "meeting"
// "consultation"
// "onleave"
// "offline"
// =========================================================

let facultyOnlineStatus = FACULTY_STATUS_DEFAULT;

let checkInTimeoutId = null;


// =========================================================
// CHECK-IN TIMEOUT
//
// The test account automatically goes Offline after 5 minutes
// if the user forgets to Check Out.
//
// This is frontend-only.
// =========================================================

const CHECK_IN_TIMEOUT =
  5 * 60 * 1000;


// =========================================================
// LOAD SAVED FACULTY STATUS
// =========================================================

function loadFacultyOnlineStatus() {

  try {

    const savedStatus =
      localStorage.getItem(
        FACULTY_ONLINE_STATUS_STORAGE_KEY
      );


    facultyOnlineStatus =
      isValidFacultyStatus(savedStatus)
        ? savedStatus
        : FACULTY_STATUS_DEFAULT;

  } catch (error) {

    facultyOnlineStatus =
      FACULTY_STATUS_DEFAULT;
  }
}


// =========================================================
// SAVE FACULTY STATUS
// =========================================================

function saveFacultyOnlineStatus(
  status
) {

  try {

    localStorage.setItem(
      FACULTY_ONLINE_STATUS_STORAGE_KEY,
      status
    );

  } catch (error) {

    // Ignore storage errors.
  }
}


// =========================================================
// GET NOTIFICATION COUNT
// =========================================================

function getFacultyNotificationCount() {

  try {

    const savedCount =
      localStorage.getItem(
        FACULTY_NOTIFICATION_STORAGE_KEY
      );


    if (savedCount === null) {

      return 0;
    }


    const count =
      Number(savedCount);


    if (
      !Number.isFinite(count) ||
      count < 0
    ) {

      return 0;
    }


    return Math.floor(count);

  } catch (error) {

    return 0;
  }
}


// =========================================================
// SET NOTIFICATION COUNT
// =========================================================

function setFacultyNotificationCount(
  count
) {

  const normalizedCount =
    Math.max(
      0,
      Math.floor(
        Number(count) || 0
      )
    );


  try {

    localStorage.setItem(
      FACULTY_NOTIFICATION_STORAGE_KEY,
      String(normalizedCount)
    );

  } catch (error) {

    // Ignore storage errors.
  }


  updateFacultyNotificationBadge();
}


// =========================================================
// UPDATE NOTIFICATION BADGE
//
// The red dot appears whenever the notification count
// is greater than zero.
//
// The CSS class used is:
//
// .has-notifications
// =========================================================

function updateFacultyNotificationBadge() {

  const notificationBellButton =
    document.getElementById(
      "facultyNotificationBellButton"
    );


  if (!notificationBellButton) {

    return;
  }


  const notificationCount =
    getFacultyNotificationCount();


  if (notificationCount > 0) {

    notificationBellButton.classList.add(
      "has-notifications"
    );


    notificationBellButton.setAttribute(
      "aria-label",
      `Notifications (${notificationCount} unread)`
    );

  } else {

    notificationBellButton.classList.remove(
      "has-notifications"
    );


    notificationBellButton.setAttribute(
      "aria-label",
      "Notifications"
    );
  }
}


// =========================================================
// PUBLIC NOTIFICATION FUNCTIONS
//
// Other Faculty scripts can use:
//
// window.setFacultyNotificationCount(1);
//
// or:
//
// window.setFacultyNotificationCount(0);
//
// =========================================================

window.setFacultyNotificationCount =
  setFacultyNotificationCount;

window.getFacultyNotificationCount =
  getFacultyNotificationCount;


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {


    // =======================================================
    // LOAD PERSISTENT STATUS
    // =======================================================

    loadFacultyOnlineStatus();


    // =======================================================
    // BURGER SIDEBAR
    // =======================================================

    const hamburgerButton =
      document.getElementById(
        "facultyHamburgerButton"
      );


    const sidebar =
      document.getElementById(
        "facultySidebar"
      );


    const sidebarOverlay =
      document.getElementById(
        "facultySidebarOverlay"
      );


    const sidebarClose =
      document.getElementById(
        "facultySidebarClose"
      );


    function openSidebar() {

      if (
        !sidebar ||
        !sidebarOverlay
      ) {

        return;
      }


      sidebar.classList.add(
        "is-open"
      );


      sidebarOverlay.hidden =
        false;


      requestAnimationFrame(
        () => {

          sidebarOverlay.classList.add(
            "is-open"
          );

        }
      );
    }


    function closeSidebar() {

      if (
        !sidebar ||
        !sidebarOverlay
      ) {

        return;
      }


      sidebar.classList.remove(
        "is-open"
      );


      sidebarOverlay.classList.remove(
        "is-open"
      );


      window.setTimeout(
        () => {

          sidebarOverlay.hidden =
            true;

        },
        250
      );
    }


    if (hamburgerButton) {

      hamburgerButton.addEventListener(
        "click",
        openSidebar
      );
    }


    if (sidebarClose) {

      sidebarClose.addEventListener(
        "click",
        closeSidebar
      );
    }


    if (sidebarOverlay) {

      sidebarOverlay.addEventListener(
        "click",
        closeSidebar
      );
    }


    // =======================================================
    // ACTIVE SIDEBAR PAGE
    // =======================================================

    const activePage =
      document.body.dataset.activePage;


    if (
      activePage &&
      sidebar
    ) {

      const activeLink =
        sidebar.querySelector(
          `.faculty-sidebar-link[data-page="${activePage}"]`
        );


      if (activeLink) {

        activeLink.classList.add(
          "is-active"
        );
      }
    }


    // =======================================================
    // QUICK ACTION
    // =======================================================

    const quickActionButton =
      document.getElementById(
        "facultyQuickActionButton"
      );


    const quickActionPanel =
      document.getElementById(
        "facultyQuickActionPanel"
      );


    function openQuickAction() {

      if (
        !quickActionButton ||
        !quickActionPanel
      ) {

        return;
      }


      quickActionPanel.hidden =
        false;


      requestAnimationFrame(
        () => {

          quickActionPanel.classList.add(
            "is-open"
          );

        }
      );


      quickActionButton.setAttribute(
        "aria-expanded",
        "true"
      );
    }


    function closeQuickAction() {

      if (
        !quickActionButton ||
        !quickActionPanel
      ) {

        return;
      }


      quickActionPanel.classList.remove(
        "is-open"
      );


      quickActionButton.setAttribute(
        "aria-expanded",
        "false"
      );


      window.setTimeout(
        () => {

          quickActionPanel.hidden =
            true;

        },
        200
      );
    }


    if (quickActionButton) {

      quickActionButton.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();


          const isOpen =
            quickActionPanel &&
            quickActionPanel.classList.contains(
              "is-open"
            );


          if (isOpen) {

            closeQuickAction();

          } else {

            openQuickAction();
          }
        }
      );
    }


    document.addEventListener(
      "click",
      (event) => {

        if (
          quickActionPanel &&
          !quickActionPanel.hidden &&
          !quickActionPanel.contains(
            event.target
          ) &&
          event.target !==
            quickActionButton &&
          !quickActionButton.contains(
            event.target
          )
        ) {

          closeQuickAction();
        }
      }
    );


    // =======================================================
    // QUICK ACTION STATUS UI
    // =======================================================

    const checkInButton =
      document.getElementById(
        "facultyCheckInButton"
      );


    const checkOutButton =
      document.getElementById(
        "facultyCheckOutButton"
      );


    const quickActionHeader =
      quickActionPanel
        ? quickActionPanel.querySelector(
            ".faculty-quick-action-header"
          )
        : null;


    let quickActionStatusDot =
      null;


    let quickActionStatusLabel =
      null;


    // =======================================================
    // CREATE STATUS LINE
    // =======================================================

    if (
      quickActionPanel &&
      quickActionHeader &&
      !quickActionPanel.querySelector(
        ".faculty-quick-action-status"
      )
    ) {

      const statusRow =
        document.createElement(
          "p"
        );


      statusRow.className =
        "faculty-quick-action-status";


      statusRow.style.cssText =
        "display:flex;" +
        "align-items:center;" +
        "gap:8px;" +
        "font-size:0.82rem;" +
        "font-weight:600;" +
        "color:#2b2b2b;" +
        "margin:0 0 14px;";


      quickActionStatusDot =
        document.createElement(
          "span"
        );


      quickActionStatusDot.setAttribute(
        "aria-hidden",
        "true"
      );


      quickActionStatusDot.style.cssText =
        "display:inline-block;" +
        "width:10px;" +
        "height:10px;" +
        "border-radius:50%;" +
        "flex-shrink:0;";


      quickActionStatusLabel =
        document.createElement(
          "span"
        );


      statusRow.appendChild(
        document.createTextNode(
          "Status: "
        )
      );


      statusRow.appendChild(
        quickActionStatusDot
      );


      statusRow.appendChild(
        quickActionStatusLabel
      );


      quickActionHeader.insertAdjacentElement(
        "afterend",
        statusRow
      );


    } else if (
      quickActionPanel
    ) {

      const existingRow =
        quickActionPanel.querySelector(
          ".faculty-quick-action-status"
        );


      if (existingRow) {

        quickActionStatusDot =
          existingRow.querySelector(
            "span"
          );


        quickActionStatusLabel =
          existingRow.lastElementChild;
      }
    }


    // =======================================================
    // UPDATE QUICK ACTION UI
    //
    // Always reflects the actual current faculty status
    // (not just Available/Offline). Check In only shows while
    // Offline; Check Out shows for any active status, since
    // Checking Out always returns to Offline.
    // =======================================================

    function updateQuickActionUI() {

      const isOffline =
        facultyOnlineStatus ===
        "offline";


      const colorVar =
        FACULTY_STATUS_COLOR_VARS[
          facultyOnlineStatus
        ] ||
        FACULTY_STATUS_COLOR_VARS.offline;


      if (quickActionStatusDot) {

        quickActionStatusDot.style.backgroundColor =
          `var(${colorVar})`;
      }


      if (quickActionStatusLabel) {

        quickActionStatusLabel.textContent =
          FACULTY_STATUS_LABELS[
            facultyOnlineStatus
          ] ||
          FACULTY_STATUS_LABELS.offline;
      }


      if (checkInButton) {

        checkInButton.hidden =
          !isOffline;
      }


      if (checkOutButton) {

        checkOutButton.hidden =
          isOffline;
      }
    }


    // =======================================================
    // UPDATE DASHBOARD STATUS
    // =======================================================

    function updateDashboardStatusUI() {

      const dashboardStatusDot =
        document.getElementById(
          "currentStatusDot"
        );


      const dashboardStatusLabel =
        document.getElementById(
          "currentStatusLabel"
        );


      if (
        !dashboardStatusDot ||
        !dashboardStatusLabel
      ) {

        return;
      }


      dashboardStatusDot.className =
        `status-dot status-${facultyOnlineStatus}`;


      dashboardStatusLabel.textContent =
        FACULTY_STATUS_LABELS[
          facultyOnlineStatus
        ] ||
        FACULTY_STATUS_LABELS.offline;
    }


    // =======================================================
    // UPDATE AVAILABILITY STATUS
    // =======================================================

    function updateAvailabilityStatusUI() {

      const availabilityStatusDot =
        document.getElementById(
          "availabilityStatusDot"
        );


      const availabilityStatusLabel =
        document.getElementById(
          "availabilityStatusLabel"
        );


      if (
        !availabilityStatusDot ||
        !availabilityStatusLabel
      ) {

        return;
      }


      availabilityStatusDot.className =
        `status-dot status-${facultyOnlineStatus}`;


      availabilityStatusLabel.textContent =
        FACULTY_STATUS_LABELS[
          facultyOnlineStatus
        ] ||
        FACULTY_STATUS_LABELS.offline;
    }


    // =======================================================
    // SYNC STATUS PANEL SELECTION
    //
    // Dashboard and Availability both reuse the same
    // #statusPanel / .faculty-status-option markup, so this
    // one function keeps whichever one is on the current page
    // highlighting the option that matches the real status.
    // =======================================================

    function syncStatusPanelSelection() {

      const statusPanel =
        document.getElementById(
          "statusPanel"
        );


      if (!statusPanel) {

        return;
      }


      const options =
        Array.from(
          statusPanel.querySelectorAll(
            ".faculty-status-option"
          )
        );


      options.forEach((option) => {

        option.classList.toggle(
          "is-selected",
          option.dataset.status ===
            facultyOnlineStatus
        );
      });
    }


    // =======================================================
    // SET FACULTY STATUS
    //
    // SINGLE SOURCE OF TRUTH. Every page/component that
    // changes the faculty status (Quick Action Check In/Out,
    // Dashboard's Change Status, Availability's Change
    // Status) must call this instead of writing its own
    // status state.
    // =======================================================

    function setFacultyOnlineStatus(
      newStatus
    ) {

      facultyOnlineStatus =
        isValidFacultyStatus(newStatus)
          ? newStatus
          : FACULTY_STATUS_DEFAULT;


      saveFacultyOnlineStatus(
        facultyOnlineStatus
      );


      updateQuickActionUI();

      updateDashboardStatusUI();

      updateAvailabilityStatusUI();

      syncStatusPanelSelection();


      // Same-page notice, so a Change Status panel that is
      // already open (e.g. on Dashboard/Availability) can
      // re-sync itself if the status changed from elsewhere
      // (Quick Action, or another tab) while it was open.
      document.dispatchEvent(
        new CustomEvent(
          "faculty-status-changed",
          {
            detail: {
              status: facultyOnlineStatus,
            },
          }
        )
      );
    }


    // Exposed so faculty-dashboard.js / faculty-availability.js
    // can update the one shared status instead of keeping their
    // own separate state.
    window.setFacultyOnlineStatus =
      setFacultyOnlineStatus;

    window.getFacultyOnlineStatus =
      () => facultyOnlineStatus;

    window.FACULTY_STATUS_LABELS =
      FACULTY_STATUS_LABELS;


    // =======================================================
    // CHECK IN
    // =======================================================

    function handleCheckIn(
      event
    ) {

      event.preventDefault();


      setFacultyOnlineStatus(
        "available"
      );


      if (checkInTimeoutId) {

        window.clearTimeout(
          checkInTimeoutId
        );
      }


      checkInTimeoutId =
        window.setTimeout(
          () => {

            setFacultyOnlineStatus(
              "offline"
            );


            checkInTimeoutId =
              null;

          },
          CHECK_IN_TIMEOUT
        );
    }


    // =======================================================
    // CHECK OUT
    // =======================================================

    function handleCheckOut(
      event
    ) {

      event.preventDefault();


      setFacultyOnlineStatus(
        "offline"
      );


      if (checkInTimeoutId) {

        window.clearTimeout(
          checkInTimeoutId
        );


        checkInTimeoutId =
          null;
      }
    }


    if (checkInButton) {

      checkInButton.addEventListener(
        "click",
        handleCheckIn
      );
    }


    if (checkOutButton) {

      checkOutButton.addEventListener(
        "click",
        handleCheckOut
      );
    }


    // =======================================================
    // INITIAL UI
    // =======================================================

    updateQuickActionUI();

    updateDashboardStatusUI();

    updateAvailabilityStatusUI();

    syncStatusPanelSelection();


    // =======================================================
    // TEST ACCOUNT: RE-ARM THE TEST NOTIFICATION
    //
    // For the designated test account only, every page load
    // simulates a fresh unread notification so the red
    // indicator can be tested repeatedly. This resets the
    // existing unread COUNT -- it never inserts a new
    // notification record, so nothing accumulates/duplicates
    // across repeated refreshes.
    //
    // Normal/real accounts (TEST_FACULTY_ACCOUNT = false)
    // skip this entirely, so their notification count stays
    // exactly as whatever was last legitimately set (0 for a
    // fresh account).
    // =======================================================

    if (window.TEST_FACULTY_ACCOUNT === true) {

      setFacultyNotificationCount(1);
    }


    // =======================================================
    // NOTIFICATION BADGE
    // =======================================================

    updateFacultyNotificationBadge();


    // =======================================================
    // NOTIFICATION BELL
    //
    // Clicking the bell:
    //
    // 1. Clears the notification count.
    // 2. Removes the red dot immediately.
    // 3. Opens the Notifications page.
    // =======================================================

    const notificationBellButton =
      document.getElementById(
        "facultyNotificationBellButton"
      );


    if (notificationBellButton) {

      notificationBellButton.addEventListener(
        "click",
        () => {

          // Mark all notifications as viewed.
          setFacultyNotificationCount(
            0
          );


          // Open Notifications page.
          window.location.href =
            "faculty-notifications.html";
        }
      );
    }


    // =======================================================
    // STORAGE EVENT
    //
    // If another Faculty page/tab changes the status or
    // notification count, this page updates automatically.
    // =======================================================

    window.addEventListener(
      "storage",
      (event) => {

        if (
          event.key ===
          FACULTY_ONLINE_STATUS_STORAGE_KEY
        ) {

          loadFacultyOnlineStatus();


          updateQuickActionUI();


          updateDashboardStatusUI();


          updateAvailabilityStatusUI();


          syncStatusPanelSelection();


          document.dispatchEvent(
            new CustomEvent(
              "faculty-status-changed",
              {
                detail: {
                  status: facultyOnlineStatus,
                },
              }
            )
          );
        }


        if (
          event.key ===
          FACULTY_NOTIFICATION_STORAGE_KEY
        ) {

          updateFacultyNotificationBadge();
        }
      }
    );

  }
);