// =========================================================
// STUDENT NEW NOTIFICATION TOAST CARDS
//
// Standalone file for every logged-in Student page. Does not
// depend on (or change) any existing student script.
//
// - A new card slides in from the right edge into the
//   bottom-right corner.
// - Cards stack: the newest is in front, older ones sit
//   behind it (only the front card is clickable).
// - Each card removes itself after 10 seconds by sliding
//   back out through the right edge (reverse of entrance).
//   Every card has its own 10-second timer.
// - The X button removes a card instantly (no animation).
// - View More opens notifications.html (that page is what
//   marks notifications as read / clears the bell dot).
//
// WHEN A CARD APPEARS
//
// At the exact moment the faculty answers a request the
// student sent (accepted / rejected / rescheduled), the
// faculty side writes these two things (frontend-only
// stand-in for a real push from the backend). The first
// marks notifications unread in the shared state
// (notification-state.js), so the red dot is there even if
// no Student page is open at that moment:
//
// localStorage.setItem("profconsult_notifications_unread", "true");
//
// localStorage.setItem(
//   "studentTestIncomingNotification",
//   JSON.stringify({
//     id: Date.now() + "-" + Math.random(),
//     message: "Engr. Sales accepted your consultation request."
//   })
// );
//
// Whichever Student page is open at that moment hears the
// browser's "storage" event and shows ONE card. Pages opened
// later do not replay it.
//
// Other Student scripts can also show one directly with:
//
// window.showStudentNotificationToast("Your message here.");
//
// Styling lives in student-notification-toast.css.
// =========================================================

(function () {

  "use strict";


  const STUDENT_INCOMING_NOTIFICATION_STORAGE_KEY =
    "studentTestIncomingNotification";

  const STUDENT_NOTIFICATIONS_PAGE =
    "notifications.html";

  const STUDENT_TOAST_DURATION = 10 * 1000;

  const STUDENT_TOAST_EXIT_MS = 400;

  // How many stacked cards can be seen at once. Extra cards
  // stay in the stack (and keep their timers) but are hidden
  // until the cards in front of them are gone.
  const STUDENT_TOAST_MAX_VISIBLE = 3;


  let stackEl = null;

  // Index 0 = newest (front of the stack)
  const toasts = [];


  function getStack() {

    if (
      stackEl &&
      document.body.contains(stackEl)
    ) {

      return stackEl;
    }


    stackEl =
      document.createElement("div");

    stackEl.className =
      "student-toast-stack";

    stackEl.setAttribute(
      "role",
      "status"
    );

    stackEl.setAttribute(
      "aria-live",
      "polite"
    );

    document.body.appendChild(stackEl);


    return stackEl;
  }


  // Positions every card that is still in the stack.
  // (A card that is sliding out is no longer in the array,
  // so it keeps whatever position it had.)
  function layoutToasts() {

    toasts.forEach(
      (toast, depth) => {

        const el = toast.el;

        const isVisible =
          depth < STUDENT_TOAST_MAX_VISIBLE;


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


  function removeToast(
    toast,
    animate
  ) {

    const index =
      toasts.indexOf(toast);


    if (index === -1) {

      return;
    }


    toasts.splice(index, 1);

    window.clearTimeout(
      toast.timerId
    );

    layoutToasts();


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
      STUDENT_TOAST_EXIT_MS + 50
    );
  }


  function showStudentNotificationToast(
    message,
    title
  ) {

    if (!document.body) {

      return;
    }


    const stack =
      getStack();


    const el =
      document.createElement("div");

    el.className =
      "student-toast";


    // Header: title + X
    const header =
      document.createElement("div");

    header.className =
      "student-toast-header";


    const titleEl =
      document.createElement("p");

    titleEl.className =
      "student-toast-title";

    titleEl.textContent =
      title || "New Notification";


    const closeButton =
      document.createElement("button");

    closeButton.type =
      "button";

    closeButton.className =
      "student-toast-close";

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
      "student-toast-body";


    const messageEl =
      document.createElement("p");

    messageEl.className =
      "student-toast-message";

    messageEl.textContent =
      message || "";


    const viewMoreLink =
      document.createElement("a");

    viewMoreLink.className =
      "student-toast-view-more";

    viewMoreLink.href =
      STUDENT_NOTIFICATIONS_PAGE;

    viewMoreLink.textContent =
      "View More";


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

        removeToast(
          toast,
          false
        );
      }
    );


    // Newest goes to the front of the stack.
    toasts.unshift(toast);

    stack.appendChild(el);

    layoutToasts();


    // Force a reflow so the card starts off-screen on the
    // right, then slides in.
    void el.offsetWidth;

    el.classList.add("is-in");


    // Each card removes itself after 10 seconds.
    toast.timerId =
      window.setTimeout(
        () => {

          removeToast(
            toast,
            true
          );

        },
        STUDENT_TOAST_DURATION
      );
  }


  window.showStudentNotificationToast =
    showStudentNotificationToast;


  // -------------------------------------------------------
  // NOTIFICATION MESSAGE FORMATTING (used by notifications.js
  // to render the Notifications page list). ONLY these three
  // record types are supported: accepted, declined, rescheduled.
  //
  //   accepted    -> "Engr. Sales accepted your consultation request."
  //   declined    -> "Engr. Sales declined your consultation request."
  //   rescheduled, accepted: true  ->
  //       "Engr. Sales accepted and moved your consultation at
  //        3:00 PM - 3:30 PM, September 19, 2026."
  //   rescheduled, accepted: false ->
  //       "Engr. Sales moved your consultation request at
  //        3:00 PM - 3:30 PM, September 19, 2026."
  //
  // Record shape: { type, facultyName, accepted, dateISO, timeLabel }
  // -------------------------------------------------------

  const STUDENT_NOTIF_DATE_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function formatRecordDateLabel(dateISO) {

    if (!dateISO) {

      return "";
    }


    const parsed = new Date(dateISO);

    if (Number.isNaN(parsed.getTime())) {

      return "";
    }


    return STUDENT_NOTIF_DATE_LABEL_FORMATTER.format(parsed);
  }


  function formatStudentNotificationMessage(record) {

    if (!record || typeof record !== "object") {

      return "";
    }


    const facultyName = record.facultyName || "";


    if (record.type === "accepted") {

      return `${facultyName} accepted your consultation request.`;
    }


    if (record.type === "declined") {

      return `${facultyName} declined your consultation request.`;
    }


    if (record.type === "rescheduled") {

      const dateLabel = formatRecordDateLabel(record.dateISO);

      const timeLabel = record.timeLabel || "";

      const scheduleText = [timeLabel, dateLabel]
        .filter(Boolean)
        .join(", ");

      if (record.accepted) {

        return `${facultyName} accepted and moved your consultation at ${scheduleText}.`;
      }

      return `${facultyName} moved your consultation request at ${scheduleText}.`;
    }


    return record.message || "";
  }


  window.formatStudentNotificationMessage =
    formatStudentNotificationMessage;


  // -------------------------------------------------------
  // Red dot on the bell of the page that is open right now.
  // Uses the EXISTING shared state (notification-state.js /
  // window.ProfConsultNotifications) -- nothing is
  // duplicated here. markUnread() is only a safety net (the
  // sender already sets it); notifications.js remains the
  // only thing that clears it (markRead), which is what
  // happens after View More opens notifications.html.
  // -------------------------------------------------------

  function raiseBellIndicator() {

    const state =
      window.ProfConsultNotifications;


    if (!state) {

      return;
    }


    state.markUnread();


    const bellButton =
      document.getElementById(
        "notificationBellButton"
      ) ||
      document.querySelector(
        ".notification-bell-button"
      );


    if (bellButton) {

      state.renderBellIndicator(
        bellButton
      );
    }
  }


  // -------------------------------------------------------
  // A notification was just sent to the student: show ONE
  // card on whichever Student page is open right now.
  // (The browser only fires "storage" in OTHER open tabs, and
  // only when the value changes -- hence the unique id.)
  // -------------------------------------------------------

  window.addEventListener(
    "storage",
    (event) => {

      if (
        event.key !==
          STUDENT_INCOMING_NOTIFICATION_STORAGE_KEY ||
        !event.newValue
      ) {

        return;
      }


      try {

        const incoming =
          JSON.parse(event.newValue);


        if (
          incoming &&
          typeof incoming.message === "string" &&
          incoming.message
        ) {

          showStudentNotificationToast(
            incoming.message
          );

          raiseBellIndicator();
        }

      } catch (error) {

        // Ignore malformed data.
      }
    }
  );


  // -------------------------------------------------------
  // TEST ONLY
  //
  // Shows two demo cards the FIRST time a Student page is
  // opened in a browser tab (not on every page switch), so
  // the slide-in, stacking, 10-second slide-out, X, and
  // View More can be seen without a second tab.
  //
  // Delete this whole block (or set the flag to false) once
  // real notifications arrive through the storage key above.
  // To see it again: open a new tab, or use the console
  // snippet at the top of this file.
  // -------------------------------------------------------

  const STUDENT_TOAST_TEST_DEMO = true;

  if (STUDENT_TOAST_TEST_DEMO) {

    let alreadyShownThisSession = true;

    try {

      alreadyShownThisSession =
        sessionStorage.getItem(
          "studentTestToastDemoShown"
        ) === "true";

      sessionStorage.setItem(
        "studentTestToastDemoShown",
        "true"
      );

    } catch (error) {

      // Can't remember it -> skip, rather than repeat.
      alreadyShownThisSession = true;
    }


    if (!alreadyShownThisSession) {

      showStudentNotificationToast(
        "Engr. Sales accepted your consultation request."
      );

      window.setTimeout(
        () => {

          showStudentNotificationToast(
            "Engr. Sales rescheduled your consultation request."
          );

        },
        1500
      );
    }
  }


  // -------------------------------------------------------
  // TEST ONLY (ADDED)
  //
  // Re-arms the shared unread flag (notification-state.js /
  // window.ProfConsultNotifications) on EVERY Student page
  // load, EXCEPT the Notifications page itself -- so the red
  // badge on the bell keeps reappearing while testing, instead
  // of staying cleared forever after the first time
  // Notifications is viewed (which is what was happening
  // before: markRead() only ever runs once and nothing ever
  // re-armed it afterward).
  //
  // This is entirely TEST-ACCOUNT behavior. Once a real
  // backend exists, delete this whole block (or gate it behind
  // a designated test-account flag the same way the Faculty
  // side does with TEST_FACULTY_ACCOUNT). With it removed, the
  // badge goes back to being driven ONLY by real notifications:
  // viewed stays viewed across every page and every navigation,
  // and red only reappears when an actual new notification is
  // sent via the storage-event path above
  // (STUDENT_INCOMING_NOTIFICATION_STORAGE_KEY).
  // -------------------------------------------------------

  const STUDENT_BADGE_TEST_DEMO = true;

  function isOnStudentNotificationsPage() {

    return /(^|\/)notifications\.html(\?|$)/i.test(
      window.location.pathname + window.location.search
    );
  }

  if (STUDENT_BADGE_TEST_DEMO) {

    document.addEventListener(
      "DOMContentLoaded",
      () => {

        if (isOnStudentNotificationsPage()) {

          // notifications.js already marks this as read/viewed
          // on this page -- don't fight it here.
          return;
        }


        raiseBellIndicator();
      }
    );
  }

})();