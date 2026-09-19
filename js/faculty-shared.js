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
// INCOMING NOTIFICATION (ADDED)
//
// Written at the exact moment something is sent to the
// faculty (e.g. a student submits a consultation request).
// The sender raises the unread count first (so the red dot
// shows on the bell of every open Faculty page), then
// writes the incoming notification:
//
// const count =
//   Number(localStorage.getItem("facultyTestNotifications")) || 0;
//
// localStorage.setItem("facultyTestNotifications", String(count + 1));
//
// localStorage.setItem(
//   "facultyTestIncomingNotification",
//   JSON.stringify({
//     id: Date.now() + "-" + Math.random(),
//     message: "Juan Dela Cruz sent a request for consultation."
//   })
// );
//
// Whichever Faculty page is open at that moment hears the
// browser's "storage" event and shows ONE toast card. Pages
// opened later do not replay it. Frontend-only stand-in for
// a real push from the backend.
// =========================================================

const FACULTY_INCOMING_NOTIFICATION_STORAGE_KEY =
  "facultyTestIncomingNotification";


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
// NEW NOTIFICATION TOAST CARDS  (ADDED)
//
// Bottom-right cards shown on every Faculty page.
//
// - A new card slides in from the right edge.
// - Cards stack: the newest is in front, older ones sit
//   behind it (only the front card is clickable).
// - Each card removes itself after 10 seconds by sliding
//   back out through the right edge (reverse of entrance).
//   Every card has its own 10-second timer.
// - The X button removes a card instantly (no animation).
// - View More opens faculty-notifications.html.
//
// Other Faculty scripts can show one with:
//
// window.showFacultyNotificationToast(
//   "Juan Dela Cruz sent a request for consultation."
// );
//
// Styling lives in faculty-shared.css (.faculty-toast*).
// =========================================================

const FACULTY_TOAST_DURATION = 10 * 1000;

const FACULTY_TOAST_EXIT_MS = 400;

// How many stacked cards can be seen at once. Extra cards
// stay in the stack (and keep their timers) but are hidden
// until the cards in front of them are gone.
const FACULTY_TOAST_MAX_VISIBLE = 3;

let facultyToastStackEl = null;

// Index 0 = newest (front of the stack)
const facultyToasts = [];


function getFacultyToastStack() {

  if (
    facultyToastStackEl &&
    document.body.contains(facultyToastStackEl)
  ) {

    return facultyToastStackEl;
  }


  facultyToastStackEl =
    document.createElement("div");

  facultyToastStackEl.className =
    "faculty-toast-stack";

  facultyToastStackEl.setAttribute(
    "role",
    "status"
  );

  facultyToastStackEl.setAttribute(
    "aria-live",
    "polite"
  );

  document.body.appendChild(
    facultyToastStackEl
  );


  return facultyToastStackEl;
}


// Positions every card that is still in the stack.
// (A card that is sliding out is no longer in the array,
// so it keeps whatever position it had.)
function layoutFacultyToasts() {

  facultyToasts.forEach(
    (toast, depth) => {

      const el = toast.el;

      const isVisible =
        depth < FACULTY_TOAST_MAX_VISIBLE;


      el.style.setProperty(
        "--stack-y",
        `${-depth * 12}px`
      );

      el.style.setProperty(
        "--stack-scale",
        String(1 - depth * 0.05)
      );

      el.style.setProperty(
        "--stack-opacity",
        isVisible
          ? String(1 - depth * 0.2)
          : "0"
      );

      el.style.setProperty(
        "--stack-z",
        String(1000 - depth)
      );

      el.style.pointerEvents =
        depth === 0
          ? "auto"
          : "none";
    }
  );
}


function removeFacultyToast(
  toast,
  animate
) {

  const index =
    facultyToasts.indexOf(toast);


  if (index === -1) {

    return;
  }


  facultyToasts.splice(index, 1);

  window.clearTimeout(
    toast.timerId
  );

  layoutFacultyToasts();


  if (!animate) {

    toast.el.remove();

    return;
  }


  toast.el.style.pointerEvents =
    "none";

  toast.el.classList.add(
    "is-leaving"
  );

  window.setTimeout(
    () => {

      toast.el.remove();

    },
    FACULTY_TOAST_EXIT_MS + 50
  );
}


function showFacultyNotificationToast(
  message,
  title
) {

  const stack =
    getFacultyToastStack();


  const el =
    document.createElement("div");

  el.className =
    "faculty-toast";


  // Header: title + X
  const header =
    document.createElement("div");

  header.className =
    "faculty-toast-header";


  const titleEl =
    document.createElement("p");

  titleEl.className =
    "faculty-toast-title";

  titleEl.textContent =
    title || "New Notification";


  const closeButton =
    document.createElement("button");

  closeButton.type =
    "button";

  closeButton.className =
    "faculty-toast-close";

  closeButton.setAttribute(
    "aria-label",
    "Dismiss notification"
  );

  closeButton.textContent =
    "\u00d7";


  header.appendChild(titleEl);

  header.appendChild(closeButton);


  // Body: message + View More
  const body =
    document.createElement("div");

  body.className =
    "faculty-toast-body";


  const messageEl =
    document.createElement("p");

  messageEl.className =
    "faculty-toast-message";

  messageEl.textContent =
    message || "";


  const viewMoreLink =
    document.createElement("a");

  viewMoreLink.className =
    "faculty-toast-view-more";

  viewMoreLink.href =
    "faculty-notifications.html";

  viewMoreLink.textContent =
    "View More";


  // Same as the bell: viewing notifications clears the
  // red dot. The link itself then opens the page.
  viewMoreLink.addEventListener(
    "click",
    () => {

      setFacultyNotificationCount(0);
    }
  );


  body.appendChild(messageEl);

  body.appendChild(viewMoreLink);


  el.appendChild(header);

  el.appendChild(body);


  const toast = {
    el: el,
    timerId: null,
  };


  // X = remove instantly
  closeButton.addEventListener(
    "click",
    () => {

      removeFacultyToast(
        toast,
        false
      );
    }
  );


  // Newest goes to the front of the stack.
  facultyToasts.unshift(toast);

  stack.appendChild(el);

  layoutFacultyToasts();


  // Force a reflow so the card starts off-screen on the
  // right, then slides in.
  void el.offsetWidth;

  el.classList.add("is-in");


  // Each card removes itself after 10 seconds.
  toast.timerId =
    window.setTimeout(
      () => {

        removeFacultyToast(
          toast,
          true
        );

      },
      FACULTY_TOAST_DURATION
    );
}


window.showFacultyNotificationToast =
  showFacultyNotificationToast;


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
    // LOGOUT RESETS THE DASHBOARD "AUTO CHECK IN REMINDER"  (ADDED)
    //
    // The Dashboard opens Quick Action once per login (see
    // faculty-dashboard.js) when Auto Check In Reminder is on.
    // Logging out clears that "already shown" flag, so the NEXT
    // login shows it again.
    //
    // Traveling between pages does NOT clear it, so coming back
    // to the Dashboard from another page never re-opens the
    // popup.
    // =======================================================

    const logoutLink =
      sidebar
        ? sidebar.querySelector(
            '.faculty-sidebar-link[data-page="logout"]'
          )
        : null;


    if (logoutLink) {

      logoutLink.addEventListener(
        "click",
        () => {

          try {

            sessionStorage.removeItem(
              "profconsult_faculty_auto_checkin_shown"
            );

          } catch (error) {

            // Ignore storage errors.
          }
        }
      );
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
    // VIEWING THE NOTIFICATIONS PAGE = NOTIFICATIONS SEEN
    //
    // Covers every way of getting there (bell, View More,
    // sidebar link): the red dot on the bell is cleared.
    //
    // Moved above the TEST ONLY block below so that when the
    // test block re-arms the badge, it can correctly check
    // "did this same load already mark it read" via activePage.
    // =======================================================

    if (activePage === "notifications") {

      setFacultyNotificationCount(0);
    }


    // =======================================================
    // TEST ONLY (ADDED)
    //
    // Shows a demo toast card EVERY time a Faculty page loads
    // (not gated by sessionStorage), for the designated test
    // account only, so the pop-up keeps appearing while you're
    // testing it instead of showing just once. Also re-arms
    // the red bell badge each load (unless you're currently on
    // the Notifications page, which already marked it read
    // just above) since otherwise the badge only ever gets set
    // once (on the very first load ever) and stays cleared
    // forever after the first visit to Notifications.
    //
    // This entire block, including the badge re-arm, is gated
    // by FACULTY_TOAST_TEST_DEMO and TEST_FACULTY_ACCOUNT, so
    // it has NO effect on real accounts/backend behavior: once
    // a backend exists (TEST_FACULTY_ACCOUNT = false, or this
    // block deleted), the badge goes back to only being driven
    // by real notification counts -- viewed stays viewed, and
    // red only reappears when an actual new notification is
    // written via FACULTY_INCOMING_NOTIFICATION_STORAGE_KEY.
    //
    // Delete this whole block (or set the flag to false) once
    // real notifications arrive through that storage-event path.
    // =======================================================

    const FACULTY_TOAST_TEST_DEMO = true;

    if (
      FACULTY_TOAST_TEST_DEMO &&
      window.TEST_FACULTY_ACCOUNT === true
    ) {

      showFacultyNotificationToast(
        "Juan Dela Cruz sent a request for consultation."
      );

      if (activePage !== "notifications") {

        setFacultyNotificationCount(1);
      }
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


        // A notification was just sent to the faculty:
        // show ONE toast on whichever page is open now.
        if (
          event.key ===
            FACULTY_INCOMING_NOTIFICATION_STORAGE_KEY &&
          event.newValue
        ) {

          try {

            const incoming =
              JSON.parse(event.newValue);


            if (
              incoming &&
              typeof incoming.message === "string" &&
              incoming.message
            ) {

              showFacultyNotificationToast(
                incoming.message
              );
            }

          } catch (error) {

            // Ignore malformed data.
          }
        }
      }
    );

  }
);