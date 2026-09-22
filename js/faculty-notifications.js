// =========================================================
// FACULTY NOTIFICATIONS
//
// SYNCED WITH CONSULTATION REQUESTS STATE.
//
// Notifications are no longer a separate hardcoded test list --
// they are derived live from the same consultations data that
// faculty-consultation-requests.js reads/writes in localStorage
// (CONSULTATIONS_STORAGE_KEY below). Only two kinds are shown:
//
//   1. A "pending" consultation  ->
//        "<Name> sent a request for consultation."
//
//   2. An "upcoming" consultation whose preferredDateISO is
//      today (Asia/Manila) ->
//        "Your consultation with <Name> is today at <time>."
//
// Each has a "View" link that:
//   1. Remembers which request/section to open (sessionStorage),
//   2. Navigates to faculty-consultation-requests.html, which
//      reads that on load and expands/scrolls to that exact card.
//
// The student's name is now ALSO a separate link, to the (not yet
// built) page where the faculty views that student's profile --
// see STUDENT NAME LINKS below.
//
// Gated by window.TEST_FACULTY_ACCOUNT (set in faculty-shared.js) --
// for any other account this renders empty, same as before.
//
// Opening this page still marks notifications as viewed (clears
// the shared navbar red dot) via window.setFacultyNotificationCount(0).
// =========================================================


// =========================================================
// SHARED STORAGE KEYS
// =========================================================

// Must match CONSULTATIONS_STORAGE_KEY in
// faculty-consultation-requests.js -- this is the single
// source of truth both pages read from.
const CONSULTATIONS_STORAGE_KEY = "profconsult_faculty_consultations";

// Written by this page right before navigating via a
// notification's "View" link; read by
// faculty-consultation-requests.js on load to expand/scroll to
// the matching card.
const NOTIFICATION_VIEW_TARGET_STORAGE_KEY = "profconsult_notification_view_target";

// ---------------------------------------------------------
// STUDENT NAME LINKS
// A student's name links to the (not yet built) page where the
// faculty views that student's profile. Change
// STUDENT_PROFILE_PAGE_URL once the real page exists -- nothing
// else needs to change. The student is identified by the same
// studentId already stored on every consultation.
// ---------------------------------------------------------
const STUDENT_PROFILE_PAGE_URL = "faculty-student-profile.html";

// This file only ever links from Faculty Notifications, so the origin
// is fixed here -- it's what lets faculty-student-profile.html's Back
// button know to return to faculty-notifications.html.
const STUDENT_PROFILE_ORIGIN = "notifications";

function getStudentProfileUrl(studentId) {
  const params = new URLSearchParams({
    studentId: studentId,
    from: STUDENT_PROFILE_ORIGIN,
  });
  return `${STUDENT_PROFILE_PAGE_URL}?${params.toString()}`;
}


// =========================================================
// MOCK/TEST CONSULTATIONS (READ-ONLY FALLBACK)
//
// Only used if this page is opened before
// faculty-consultation-requests.html has ever seeded
// localStorage. Must stay identical to DEFAULT_CONSULTATIONS
// in faculty-consultation-requests.js so both pages agree on
// the same test data. This page NEVER writes this back to
// localStorage -- it only reads, so it can never conflict with
// the requests page's own seeding/reset logic.
// =========================================================

const DEFAULT_CONSULTATIONS = [
  {
    id: "req-1",
    name: "Juan Dela Cruz",
    studentId: "22-00145",
    type: "Research Proposal",
    date: "July 20, 10:00 AM",
    preferredDateISO: "2026-07-20",
    preferredTimeLabel: "10:00 AM \u2013 10:30 AM",
    program: "BS Computer Engineering",
    yearSet: "3B",
    message: "Good day po! I'd like to consult about my capstone research proposal title and methodology before I submit it for approval.",
    status: "pending",
  },
  {
    id: "req-2",
    name: "Joselita Rizal",
    studentId: "22-00098",
    type: "Research Proposal",
    date: "July 20, 10:00 AM",
    preferredDateISO: "2026-07-20",
    preferredTimeLabel: "10:00 AM \u2013 10:30 AM",
    program: "BS Computer Engineering",
    yearSet: "3B",
    message: "Hi sir/ma'am, may I request a consultation regarding the scope and limitations section of our group's proposal?",
    status: "pending",
  },
  {
    id: "req-3",
    name: "Mark Santos",
    studentId: "21-00567",
    type: "Thesis Defense Prep",
    date: "July 21, 1:00 PM",
    preferredDateISO: "2026-07-21",
    preferredTimeLabel: "1:00 PM \u2013 1:30 PM",
    program: "BS Computer Engineering",
    yearSet: "4A",
    message: "Requesting a short consultation to go over my defense slides and anticipated panel questions.",
    status: "pending",
  },
  {
    id: "req-4",
    name: "Angela Cruz",
    studentId: "23-00212",
    type: "Grade Concern",
    date: "July 22, 9:30 AM",
    preferredDateISO: "2026-07-22",
    preferredTimeLabel: "9:30 AM \u2013 10:00 AM",
    program: "BS Computer Engineering",
    yearSet: "2A",
    message: "I'd like to clarify some items on my midterm exam whenever you have a free slot this week.",
    status: "pending",
  },
];


// =========================================================
// READ CONSULTATIONS (READ-ONLY)
//
// Never writes back to localStorage -- this page only reads
// the requests page's state so the two can never fight over
// who owns the data.
// =========================================================

function loadConsultationsReadOnly() {

  try {

    const stored =
      localStorage.getItem(
        CONSULTATIONS_STORAGE_KEY
      );


    if (stored) {

      const parsed =
        JSON.parse(stored);


      if (Array.isArray(parsed)) {

        return parsed;
      }
    }

  } catch (error) {

    // fall through to defaults below
  }


  return DEFAULT_CONSULTATIONS.slice();
}


// =========================================================
// "IS THIS TODAY?" (Philippine time)
// =========================================================

const PH_TODAY_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getTodayISO() {

  return PH_TODAY_KEY_FORMATTER.format(new Date());
}


// =========================================================
// BUILD NOTIFICATIONS FROM CONSULTATION STATE
//
// Only two kinds, in this order: pending requests first, then
// today's upcoming consultations. Each notification also
// carries the student's studentId, so the row can be built
// with a clickable student name (see buildNotificationRow).
// =========================================================

function buildFacultyNotifications() {

  const consultations =
    loadConsultationsReadOnly();


  const todayISO =
    getTodayISO();


  const notifications = [];


  consultations
    .filter((request) => request.status === "pending")
    .forEach((request) => {

      notifications.push({
        id: `pending-${request.id}`,
        studentName: request.name,
        studentId: request.studentId,
        messageBefore: "",
        messageAfter: " sent a request for consultation.",
        linkText: "View",
        targetId: request.id,
        targetSection: "pending",
      });
    });


  consultations
    .filter(
      (request) =>
        request.status === "upcoming" &&
        request.preferredDateISO === todayISO
    )
    .forEach((request) => {

      const timeLabel =
        request.preferredTimeLabel || "";

      notifications.push({
        id: `today-${request.id}`,
        studentName: request.name,
        studentId: request.studentId,
        messageBefore: "Your consultation with ",
        messageAfter: ` is today at ${timeLabel}.`,
        linkText: "View",
        targetId: request.id,
        targetSection: "upcoming",
      });
    });


  return notifications;
}


// =========================================================
// BUILD NOTIFICATION ROW
//
// The row's text is built in three pieces so the student's name
// can be its own clickable link:
//   "<messageBefore>" + "<Name link>" + "<messageAfter>" + "<View link>"
// e.g. "Your consultation with " + "Juan Dela Cruz" + " is today at
// 10:00 AM – 10:30 AM." + " " + "View"
// =========================================================

function buildNotificationRow(notification) {

  const li =
    document.createElement("li");

  li.className =
    "notification-row";

  li.dataset.id =
    notification.id;


  const icon =
    document.createElement("span");

  icon.className =
    "notification-icon";

  icon.setAttribute(
    "aria-hidden",
    "true"
  );

  icon.textContent =
    "\u2714";


  const message =
    document.createElement("p");

  message.className =
    "notification-message";


  // Leading plain-text piece, if any (e.g. "Your consultation with ")
  if (notification.messageBefore) {

    message.appendChild(
      document.createTextNode(
        notification.messageBefore
      )
    );
  }


  // Student's name -- its own link to the (not yet built) student
  // profile page. Falls back to plain text if this notification
  // somehow has no studentId.
  if (notification.studentId) {

    const nameLink =
      document.createElement("a");

    nameLink.className =
      "notification-student-link";

    nameLink.href =
      getStudentProfileUrl(
        notification.studentId
      );

    nameLink.textContent =
      notification.studentName;

    message.appendChild(nameLink);

  } else {

    message.appendChild(
      document.createTextNode(
        notification.studentName
      )
    );
  }


  // Trailing plain-text piece, then a trailing space so
  // "message. View" doesn't run together.
  message.appendChild(
    document.createTextNode(
      `${notification.messageAfter} `
    )
  );


  const link =
    document.createElement("a");

  link.className =
    "notification-view-link";

  link.href =
    "faculty-consultation-requests.html";

  link.textContent =
    notification.linkText;


  // Remember exactly which request/section to open on the
  // Consultation Requests page, right before navigating there.
  link.addEventListener(
    "click",
    () => {

      try {

        sessionStorage.setItem(
          NOTIFICATION_VIEW_TARGET_STORAGE_KEY,
          JSON.stringify({
            id: notification.targetId,
            section: notification.targetSection,
          })
        );

      } catch (error) {

        // sessionStorage unavailable -- link still navigates
        // normally, it just won't auto-open the matching card.
      }
    }
  );


  message.appendChild(link);

  li.appendChild(icon);

  li.appendChild(message);


  return li;
}


// =========================================================
// RENDER NOTIFICATIONS
//
// Displays the live notifications for the test account (empty
// for any other account), then marks them viewed by clearing
// the shared navbar notification count -- same as before.
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


  listEl.innerHTML =
    "";


  const isTestAccount =
    window.TEST_FACULTY_ACCOUNT === true;

  const notifications =
    isTestAccount
      ? buildFacultyNotifications()
      : [];


  notifications.forEach(
    (notification) => {

      listEl.appendChild(
        buildNotificationRow(
          notification
        )
      );
    }
  );


  if (emptyMessageEl) {

    emptyMessageEl.hidden =
      notifications.length > 0;
  }


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
// PAGE LOAD
// =========================================================

document.addEventListener(
  "DOMContentLoaded",
  renderFacultyNotifications
);