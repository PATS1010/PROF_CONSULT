// =========================================================
// FACULTY NOTIFICATIONS
//
// TEST ACCOUNT ONLY.
//
// These notifications are frontend test data.
// They are NOT backend notifications.
//
// Whether they are actually shown is gated by
// window.TEST_FACULTY_ACCOUNT (set in faculty-shared.js).
// For any other account, this page renders empty --
// "You have no notifications yet."
//
// IMPORTANT:
//
// The notifications remain visible on this page.
//
// Opening this page marks the notifications as VIEWED,
// so the shared navbar red dot is removed.
//
// The notification data itself is NOT deleted.
// =========================================================


// =========================================================
// TEST NOTIFICATIONS
//
// Only ever rendered when window.TEST_FACULTY_ACCOUNT is
// true. This array is not persisted anywhere, so a full
// page reload always resets it back to exactly these three
// items -- refreshing repeatedly can never duplicate or
// accumulate entries.
// =========================================================

const NOTIFICATIONS = [

  {
    id: "notif-1",
    type: "consultation-request",
    message: "New consultation request.",
    linkText: "View",
    linkHref:
      "faculty-consultation-requests.html",
  },


  {
    id: "notif-2",
    type: "consultation-cancelled",
    message:
      "Student canceled appointment.",
  },


  {
    id: "notif-3",
    type: "schedule-reminder",
    message:
      "Schedule reminder.",
  },

];


// =========================================================
// GET VISIBLE NOTIFICATIONS
//
// For the designated test account, show the test data above.
// For every other (normal/fresh) account, there is no test
// data and no backend yet, so the page has nothing to show.
// =========================================================

function getVisibleNotifications() {

  const isTestAccount =
    window.TEST_FACULTY_ACCOUNT === true;


  return isTestAccount
    ? NOTIFICATIONS
    : [];
}


// =========================================================
// IS THIS A RELOAD?
//
// Distinguishes:
//
// - Arriving here by clicking the top bell / sidebar link
//   (navigation type "navigate") -- a genuine "view", so the
//   indicator should stay cleared.
//
// - Hitting the browser's refresh button while already on
//   this page (navigation type "reload") -- for the test
//   account, treated as "test the indicator again", so it
//   re-arms right after being cleared below.
//
// Uses the standard Navigation Timing API; if unavailable,
// safely assumes "not a reload" (the existing, safe default).
// =========================================================

function isReloadNavigation() {

  try {

    if (
      typeof performance.getEntriesByType ===
      "function"
    ) {

      const entries =
        performance.getEntriesByType(
          "navigation"
        );


      if (
        entries &&
        entries[0]
      ) {

        return (
          entries[0].type ===
          "reload"
        );
      }
    }


    // Fallback for older browsers.
    if (performance.navigation) {

      return (
        performance.navigation
          .type === 1
      );
    }

  } catch (error) {

    // Detection unavailable -- treat as not a reload.
  }


  return false;
}


// =========================================================
// BUILD NOTIFICATION ROW
// =========================================================

function buildNotificationRow(
  notification
) {

  const li =
    document.createElement(
      "li"
    );


  li.className =
    "notification-row";


  li.dataset.type =
    notification.type;


  li.dataset.id =
    notification.id;


  const icon =
    document.createElement(
      "span"
    );


  icon.className =
    "notification-icon";


  icon.setAttribute(
    "aria-hidden",
    "true"
  );


  icon.textContent =
    "\u2714";


  const message =
    document.createElement(
      "p"
    );


  message.className =
    "notification-message";


  message.textContent =
    notification.message;


  // =======================================================
  // OPTIONAL VIEW LINK
  // =======================================================

  if (
    notification.linkText &&
    notification.linkHref
  ) {

    const link =
      document.createElement(
        "a"
      );


    link.className =
      "notification-view-link";


    link.href =
      notification.linkHref;


    link.textContent =
      notification.linkText;


    message.appendChild(
      link
    );
  }


  li.appendChild(
    icon
  );


  li.appendChild(
    message
  );


  return li;
}


// =========================================================
// RENDER NOTIFICATIONS
//
// IMPORTANT:
//
// This function displays the visible notifications for this
// account (test data for the test account, empty otherwise).
//
// It does NOT set the notification count based on how many
// notifications are shown.
//
// Instead, opening this page marks them as viewed and sets
// the shared navbar notification count to 0 -- for the test
// account, faculty-shared.js re-arms this count back to 1 on
// the NEXT page load, not this one.
// =========================================================

function renderFacultyNotifications() {

  const listEl =
    document.getElementById(
      "notificationsList"
    );


  const emptyMessageEl =
    document.getElementById(
      "noNotificationsMessage"
    );


  if (!listEl) {

    return;
  }


  // =======================================================
  // CLEAR CURRENT LIST
  // =======================================================

  listEl.innerHTML =
    "";


  // =======================================================
  // RENDER VISIBLE NOTIFICATIONS ONLY
  // =======================================================

  const visibleNotifications =
    getVisibleNotifications();


  visibleNotifications.forEach(
    (notification) => {

      listEl.appendChild(
        buildNotificationRow(
          notification
        )
      );

    }
  );


  // =======================================================
  // EMPTY MESSAGE
  // =======================================================

  if (emptyMessageEl) {

    emptyMessageEl.hidden =
      visibleNotifications.length > 0;
  }


  // =======================================================
  // MARK NOTIFICATIONS AS VIEWED
  //
  // IMPORTANT:
  //
  // We DO NOT delete the notifications.
  //
  // We ONLY clear the unread count.
  //
  // Therefore:
  //
  // Notifications stay visible.
  // Red dot disappears.
  // =======================================================

  if (
    typeof window.setFacultyNotificationCount ===
    "function"
  ) {

    window.setFacultyNotificationCount(
      0
    );
  }
}


// =========================================================
// ADD NEW TEST NOTIFICATION
//
// Other frontend pages can call:
//
// window.addFacultyNotification({...});
//
// Example:
//
// window.addFacultyNotification({
//   id: "notif-4",
//   type: "new-request",
//   message: "New consultation request.",
//   linkText: "View",
//   linkHref: "faculty-consultation-requests.html"
// });
//
// Note: like the rest of this file, this is test-account
// behavior -- getVisibleNotifications() only shows anything
// when window.TEST_FACULTY_ACCOUNT is true.
// =========================================================

window.addFacultyNotification =
  function addFacultyNotification(
    notification
  ) {

    if (
      !notification ||
      typeof notification !==
        "object"
    ) {

      return;
    }


    // =====================================================
    // ADD NEW NOTIFICATION
    // =====================================================

    NOTIFICATIONS.unshift(
      notification
    );


    // =====================================================
    // SHOW THE NEW NOTIFICATION AS UNREAD
    //
    // If another page calls this function while this page
    // is active, the new notification becomes unread.
    // =====================================================

    if (
      typeof window.setFacultyNotificationCount ===
      "function"
    ) {

      window.setFacultyNotificationCount(
        1
      );
    }


    // =====================================================
    // REFRESH THE NOTIFICATION LIST
    //
    // If the user is currently on this page, the newly
    // added notification is immediately displayed.
    //
    // renderFacultyNotifications() will then mark the
    // page as viewed again and clear the dot.
    // =====================================================

    renderFacultyNotifications();
  };


// =========================================================
// PAGE LOAD
//
// When the Notifications page opens:
//
// 1. Display notifications.
// 2. Mark them as viewed.
// 3. Remove the red dot.
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  renderFacultyNotifications
);