// =========================================================
// FACULTY DASHBOARD -- PAGE-SPECIFIC INTERACTIONS
// - Populates the greeting from sample faculty data
//   (will come from the logged-in faculty's real record
//   once the backend exists)
// - Philippine date/time: displayed below the greeting
//   and updates every second.
// - Today's Status: Change Status opens a gradient popup of
//   status options; selecting + Save now updates the SHARED
//   faculty status (see faculty-shared.js) instead of only
//   this page's own status pill, so Quick Action and
//   faculty-availability stay in sync.
// - Today's Schedule: lists every UPCOMING (accepted)
//   consultation scheduled for today (Philippine date) from the
//   same shared consultation data, showing the student's name,
//   purpose, and time range. Each entry has an underlined "View"
//   link that opens Faculty Consultation Requests with that
//   student's card in Upcoming Consultations already expanded
//   (see the TODAY'S SCHEDULE section below).
// - Pending Consultation Requests: Accept / Decline now read
//   and write the SAME consultation data as
//   faculty-consultation-requests.js (same localStorage key,
//   same status values), so accepting/declining here is
//   reflected on the Consultation Requests page and vice
//   versa. View More still just navigates there.
// - Student names (Pending Consultation Requests and Today's
//   Schedule) are links to the student profile page -- see
//   STUDENT NAME LINKS near the top of this file.
// - Auto Check In Reminder: if that setting is checked AND
//   saved on Faculty Settings, the Quick Action popup opens
//   by itself when the faculty lands here after logging in
//   (see the AUTO CHECK IN REMINDER section at the bottom).
//   Dashboard only.
//
// Shared shell behavior (navbar, sidebar, quick action,
// notification bell) lives in faculty-shared.js.
// =========================================================

// ---------------------------------------------------------
// SHARED CONSULTATION DATA
//
// Same storage key, same default dataset, and the same
// mock/test reset-on-refresh behavior as
// faculty-consultation-requests.js -- this is intentionally
// kept in sync with that file so both pages agree on what a
// "fresh" test account's pending requests look like and on
// what counts as a real browser refresh.
//
// This page only ever reads "pending" requests and moves one
// to "upcoming" (Accept) or "declined" (Decline) -- it does
// not render Upcoming/Completed/History, so it doesn't need
// anything else from that file. (Today's Schedule also reads
// "upcoming" requests, read-only.)
// ---------------------------------------------------------

const CONSULTATIONS_STORAGE_KEY = "profconsult_faculty_consultations";

// ---------------------------------------------------------
// Same sessionStorage key faculty-consultation-requests.js
// already reads on load (NOTIFICATION_VIEW_TARGET_STORAGE_KEY)
// to auto-expand and scroll to one specific request card. The
// Today's Schedule "View" link writes to it right before
// navigating there, so that page needs no changes.
// ---------------------------------------------------------
const SCHEDULE_VIEW_TARGET_STORAGE_KEY = "profconsult_notification_view_target";

// ---------------------------------------------------------
// STUDENT NAME LINKS
// A student's name links to the (not yet built) page where the
// faculty views that student's profile. Change
// STUDENT_PROFILE_PAGE_URL once the real page exists -- nothing
// else needs to change. The student is identified by the same
// studentId already stored on every consultation.
// ---------------------------------------------------------
const STUDENT_PROFILE_PAGE_URL = "faculty-student-profile.html";

function getStudentProfileUrl(studentId, from) {
  const params = new URLSearchParams({ studentId: studentId });
  if (from) params.set("from", from);
  return `${STUDENT_PROFILE_PAGE_URL}?${params.toString()}`;
}

// This file only ever links from the Dashboard, so the origin is
// fixed here -- it's what lets faculty-student-profile.html's Back
// button know to return to faculty-dashboard.html.
const STUDENT_PROFILE_ORIGIN = "dashboard";

function studentNameLinkHtml(request) {
  if (!request) return "";
  if (!request.studentId) return request.name;
  return `<a href="${getStudentProfileUrl(request.studentId, STUDENT_PROFILE_ORIGIN)}" class="student-name-link">${request.name}</a>`;
}

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

// ---------------------------------------------------------
// Detects a real browser refresh (F5 / reload button / Ctrl+R)
// as opposed to arriving here via ordinary navigation. Only a
// true reload resets the mock/test data -- matches
// faculty-consultation-requests.js exactly, so refreshing
// either page behaves the same way for this shared data.
// ---------------------------------------------------------
function isPageReload() {
  try {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0) return navEntries[0].type === "reload";
    if (performance.navigation) {
      return performance.navigation.type === performance.navigation.TYPE_RELOAD;
    }
  } catch (error) {
    // fall through -- if we can't tell, don't force a reset
  }
  return false;
}

function loadConsultations() {
  try {
    if (isPageReload()) {
      saveConsultations(DEFAULT_CONSULTATIONS);
      return DEFAULT_CONSULTATIONS.slice();
    }
    const stored = localStorage.getItem(CONSULTATIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    // fall through to seeding defaults below
  }
  saveConsultations(DEFAULT_CONSULTATIONS);
  return DEFAULT_CONSULTATIONS.slice();
}

function saveConsultations(list) {
  try {
    localStorage.setItem(CONSULTATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    // Storage unavailable -- state just won't persist across reload/navigation
  }
}

// ---------------------------------------------------------
// Preferred Date display: shows the start AND end time.
//   "July 20, 10:00 AM"  ->  "July 20, 10:00 AM – 10:30 AM"
//
// Same helper as faculty-consultation-requests.js, so Today's
// Schedule shows the time exactly the way the Consultation
// Requests cards do. Display only -- request.date is never
// modified.
//   1. If request.date already contains a range, it is shown as is.
//   2. Else, if request.preferredTimeLabel is a range that starts at
//      the same time as request.date, its end time is used.
//   3. Else the end time is the start time plus one consultation
//      slot (30 minutes).
// ---------------------------------------------------------
const CONSULTATION_SLOT_MINUTES = 30;

function formatPreferredDateTime(request) {
  const raw = String((request && request.date) || "");

  // Already a range -- nothing to add
  if (/\d\s*(AM|PM)\s*[\u2013\u2014-]\s*\d/i.test(raw)) return raw;

  // Split "July 20, 10:00 AM" into the date part and the start time
  const match = raw.match(/^(.*?)(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i);
  if (!match) return raw;

  const datePrefix = match[1];
  const startHour = parseInt(match[2], 10);
  const startMinute = parseInt(match[3], 10);
  const startPeriod = match[4].toUpperCase();
  const startLabel = `${startHour}:${match[3]} ${startPeriod}`;

  const normalize = (text) => String(text).replace(/\s+/g, "").toUpperCase();

  // Prefer the stored range's end time when it belongs to this start time
  const label = String((request && request.preferredTimeLabel) || "");
  const labelParts = label.split(/\s*[\u2013\u2014-]\s*/);
  if (
    labelParts.length === 2 &&
    labelParts[1].trim() &&
    normalize(labelParts[0]) === normalize(startLabel)
  ) {
    return `${datePrefix}${startLabel} \u2013 ${labelParts[1].trim()}`;
  }

  // Otherwise: start time + one 30-minute slot
  const startTotalMinutes =
    ((startHour % 12) + (startPeriod === "PM" ? 12 : 0)) * 60 + startMinute;
  const endTotalMinutes = (startTotalMinutes + CONSULTATION_SLOT_MINUTES) % (24 * 60);
  const endHour24 = Math.floor(endTotalMinutes / 60);
  const endMinute = endTotalMinutes % 60;
  const endPeriod = endHour24 >= 12 ? "PM" : "AM";
  const endHour12 = endHour24 % 12 || 12;
  const endLabel = `${endHour12}:${String(endMinute).padStart(2, "0")} ${endPeriod}`;

  return `${datePrefix}${startLabel} \u2013 ${endLabel}`;
}

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Sample faculty account -- replace with real session/user
  // data once backend authentication exists
  // ---------------------------------------------------------

  const SAMPLE_FACULTY = {
    fullName: "Engr. Maria Nina Sales",
    lastName: "Professor",
  };

  const nameEl = document.getElementById("facultyLastName");

  if (nameEl) {
    nameEl.textContent = SAMPLE_FACULTY.lastName;
  }


  // ---------------------------------------------------------
  // Philippine Date and Time
  //
  // This is frontend-only.
  // No backend/API is used.
  //
  // The time is always displayed using the Philippines
  // timezone: Asia/Manila.
  //
  // Example:
  // Saturday, September 12, 2026 10:30:00 AM
  //
  // It renders immediately and then updates every second.
  // ---------------------------------------------------------

  const facultyPageDateTimeEl =
    document.getElementById("facultyPageDateTime");

  if (facultyPageDateTimeEl) {

    const philippineDateTimeFormatter =
      new Intl.DateTimeFormat("en-US", {
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

      const parts =
        philippineDateTimeFormatter.formatToParts(new Date());


      function getPart(type) {
        const part = parts.find(
          (item) => item.type === type
        );

        return part ? part.value : "";
      }


      const weekday = getPart("weekday");
      const month = getPart("month");
      const day = getPart("day");
      const year = getPart("year");
      const hour = getPart("hour");
      const minute = getPart("minute");
      const second = getPart("second");
      const dayPeriod = getPart("dayPeriod");


      facultyPageDateTimeEl.textContent =
        `${weekday}, ${month} ${day}, ${year} ${hour}:${minute}:${second} ${dayPeriod}`;
    }


    // Display immediately.
    renderPhilippineDateTime();

    // Update every second.
    setInterval(renderPhilippineDateTime, 1000);
  }


  // ---------------------------------------------------------
  // Today's Status: Change Status popup.
  //
  // Selecting an option marks it visually selected (pending).
  // Save applies it to the SHARED faculty status (source of
  // truth in faculty-shared.js), which in turn updates this
  // page's status pill, Quick Action, and (if navigated to)
  // faculty-availability. Closing without Save discards the
  // pending selection.
  // ---------------------------------------------------------

  const changeStatusButton =
    document.getElementById("changeStatusButton");

  const statusPanel =
    document.getElementById("statusPanel");

  const statusOptions = statusPanel
    ? Array.from(
        statusPanel.querySelectorAll(
          ".faculty-status-option"
        )
      )
    : [];

  const saveStatusButton =
    document.getElementById("saveStatusButton");


  let pendingStatus = null;
  let pendingLabel = null;


  // ---------------------------------------------------------
  // Sync the panel's pending selection to whatever the real,
  // shared faculty status currently is. Called whenever the
  // panel is opened, so it always starts from the true
  // current status rather than a stale prior selection.
  // ---------------------------------------------------------

  function syncPendingFromCurrentStatus() {

    const current =
      typeof window.getFacultyOnlineStatus ===
        "function"
        ? window.getFacultyOnlineStatus()
        : "available";


    statusOptions.forEach((opt) => {
      opt.classList.remove("is-selected");
    });


    const matchingOption =
      statusOptions.find(
        (opt) =>
          opt.dataset.status === current
      );


    if (matchingOption) {

      matchingOption.classList.add(
        "is-selected"
      );

      pendingStatus =
        matchingOption.dataset.status;

      pendingLabel =
        matchingOption.dataset.label;

    } else {

      pendingStatus = null;
      pendingLabel = null;
    }
  }


  function openStatusPanel() {

    syncPendingFromCurrentStatus();

    statusPanel.hidden = false;

    requestAnimationFrame(() => {
      statusPanel.classList.add("is-open");
    });

    changeStatusButton.setAttribute(
      "aria-expanded",
      "true"
    );
  }


  function closeStatusPanel() {

    statusPanel.classList.remove("is-open");

    changeStatusButton.setAttribute(
      "aria-expanded",
      "false"
    );

    window.setTimeout(() => {
      statusPanel.hidden = true;
    }, 200);
  }


  if (changeStatusButton) {

    changeStatusButton.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        const isOpen =
          statusPanel.classList.contains("is-open");

        if (isOpen) {
          closeStatusPanel();
        } else {
          openStatusPanel();
        }

      }
    );
  }


  statusOptions.forEach((option) => {

    option.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        pendingStatus =
          option.dataset.status;

        pendingLabel =
          option.dataset.label;


        statusOptions.forEach((opt) => {
          opt.classList.remove("is-selected");
        });


        option.classList.add("is-selected");

      }
    );

  });


  if (saveStatusButton) {

    saveStatusButton.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        if (
          pendingStatus &&
          typeof window.setFacultyOnlineStatus ===
            "function"
        ) {

          // Updates the SHARED status (localStorage +
          // Quick Action + this page's pill + Availability's
          // pill, if that page is open elsewhere).
          window.setFacultyOnlineStatus(
            pendingStatus
          );
        }

        closeStatusPanel();

      }
    );
  }


  document.addEventListener(
    "click",
    (event) => {

      if (
        statusPanel &&
        !statusPanel.hidden &&
        !statusPanel.contains(event.target) &&
        event.target !== changeStatusButton &&
        !changeStatusButton.contains(event.target)
      ) {

        closeStatusPanel();

      }

    }
  );


  // ---------------------------------------------------------
  // If the shared status changes while this panel happens to
  // be open (e.g. Check In/Out clicked from Quick Action),
  // re-sync the panel's highlighted option so a later Save
  // doesn't re-apply a stale pending selection.
  // ---------------------------------------------------------

  document.addEventListener(
    "faculty-status-changed",
    () => {

      if (
        statusPanel &&
        !statusPanel.hidden
      ) {

        syncPendingFromCurrentStatus();
      }
    }
  );


  // ---------------------------------------------------------
  // Pending Consultation Requests
  //
  // Reads/writes the SAME consultation data as
  // faculty-consultation-requests.js (see the top of this
  // file). Accept moves a request to "upcoming" -- the same
  // status that page's Accept uses -- and Decline sets
  // "declined", so the change shows up correctly on that page
  // (Upcoming Consultations, or gone from Pending) without
  // needing to touch that file at all.
  // ---------------------------------------------------------

  let requests = loadConsultations();


  // ---------------------------------------------------------
  // Placeholder notification function.
  // Intentionally does nothing.
  // ---------------------------------------------------------

  function notifyRequestAnswered(
    request,
    decision
  ) {
    // Intentionally does nothing.
  }


  // ---------------------------------------------------------
  // Request elements
  // ---------------------------------------------------------

  const requestNameEl =
    document.querySelector(
      ".faculty-request-name"
    );

  const requestMetaEl =
    document.querySelector(
      ".faculty-request-meta"
    );

  const requestSubjectLabelEl =
    document.querySelector(
      ".faculty-request-subject-label"
    );

  const requestSubjectEl =
    document.querySelector(
      ".faculty-request-subject"
    );

  const requestActionsEl =
    document.querySelector(
      ".faculty-request-actions"
    );

  const acceptButton =
    document.getElementById(
      "acceptRequestButton"
    );

  const declineButton =
    document.getElementById(
      "declineRequestButton"
    );

  const viewMoreButton =
    document.getElementById(
      "viewMoreRequestsButton"
    );


  // ---------------------------------------------------------
  // Get the next pending request
  // ---------------------------------------------------------

  function getNextPendingRequest() {

    return requests.find(
      (request) =>
        request.status === "pending"
    ) || null;

  }


  // ---------------------------------------------------------
  // Render request
  // ---------------------------------------------------------

  function renderDashboardRequest() {

    const request =
      getNextPendingRequest();


    if (!request) {

      if (requestNameEl) {
        requestNameEl.textContent =
          "No pending requests right now.";
      }

      if (requestMetaEl) {
        requestMetaEl.style.display =
          "none";
      }

      if (requestSubjectLabelEl) {
        requestSubjectLabelEl.style.display =
          "none";
      }

      if (requestSubjectEl) {
        requestSubjectEl.style.display =
          "none";
      }

      if (requestActionsEl) {
        requestActionsEl.style.display =
          "none";
      }

      return;
    }


    if (requestMetaEl) {
      requestMetaEl.style.display = "";
    }

    if (requestSubjectLabelEl) {
      requestSubjectLabelEl.style.display = "";
    }

    if (requestSubjectEl) {
      requestSubjectEl.style.display = "";
    }

    if (requestActionsEl) {
      requestActionsEl.style.display = "";
    }


    if (requestNameEl) {
      requestNameEl.innerHTML =
        studentNameLinkHtml(request);
    }


    if (requestMetaEl) {

      requestMetaEl.textContent =
        `${request.program} | ${request.studentId} | ${request.yearSet}`;

    }


    if (requestSubjectEl) {
      requestSubjectEl.textContent =
        request.type;
    }


    if (acceptButton) {

      acceptButton.textContent =
        "Accept";

      acceptButton.disabled =
        false;

      acceptButton.classList.remove(
        "is-accepted"
      );
    }


    if (declineButton) {

      declineButton.textContent =
        "Decline";

      declineButton.disabled =
        false;

      declineButton.classList.remove(
        "is-declined"
      );
    }

  }


  // Render the first request immediately.
  renderDashboardRequest();


  // =========================================================
  // TODAY'S SCHEDULE  (ADDED)
  //
  // Replaces the old hardcoded "10:00 AM Consultation" line with
  // real entries built from the SAME consultation data as
  // everything else on this page. An entry appears here when a
  // request is:
  //   - "upcoming" (accepted, not yet completed/cancelled), AND
  //   - scheduled for TODAY's date in Philippine time
  //     (Asia/Manila, same timezone as the date/time above).
  //
  // Each entry shows the student's name, the purpose, and the time
  // range, in the same format as the Consultation Requests cards.
  // Because it reads request.date, a consultation that was
  // Rescheduled to today shows up here with its new time.
  //
  // The underlined "View" link stores which request to open, then
  // navigates to Faculty Consultation Requests, where that
  // student's card in Upcoming Consultations is expanded
  // automatically (that page already supports this -- see
  // SCHEDULE_VIEW_TARGET_STORAGE_KEY at the top of this file).
  // =========================================================

  const scheduleListEl =
    document.querySelector(
      ".faculty-schedule-list"
    );

  const philippineTodayFormatter =
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      month: "long",
      day: "numeric",
    });


  // Today's month + day in Philippine time
  function getPhilippineToday() {

    const parts =
      philippineTodayFormatter.formatToParts(
        new Date()
      );

    const monthPart =
      parts.find((p) => p.type === "month");

    const dayPart =
      parts.find((p) => p.type === "day");

    return {
      month: monthPart
        ? monthPart.value.slice(0, 3).toLowerCase()
        : "",
      day: dayPart
        ? parseInt(dayPart.value, 10)
        : 0,
    };
  }


  // True when request.date (e.g. "September 21, 10:00 AM") falls
  // on today's Philippine date
  function isScheduledToday(request, today) {

    const match =
      String(request.date || "").match(
        /([A-Za-z]{3,9})\.?\s+(\d{1,2})\b/
      );

    if (!match) return false;

    return (
      match[1].slice(0, 3).toLowerCase() ===
        today.month &&
      parseInt(match[2], 10) === today.day
    );
  }


  // Start time in minutes, used only to list today's
  // consultations in time order
  function getStartMinutes(request) {

    const match =
      String(request.date || "").match(
        /(\d{1,2}):(\d{2})\s*(AM|PM)/i
      );

    if (!match) return 24 * 60;

    const hour24 =
      (parseInt(match[1], 10) % 12) +
      (match[3].toUpperCase() === "PM" ? 12 : 0);

    return hour24 * 60 + parseInt(match[2], 10);
  }


  function renderTodaysSchedule() {

    if (!scheduleListEl) return;

    const today = getPhilippineToday();

    const todaysConsultations =
      requests
        .filter(
          (request) =>
            request.status === "upcoming" &&
            isScheduledToday(request, today)
        )
        .sort(
          (a, b) =>
            getStartMinutes(a) -
            getStartMinutes(b)
        );


    scheduleListEl.innerHTML = "";


    if (todaysConsultations.length === 0) {

      const emptyItem =
        document.createElement("li");

      emptyItem.className =
        "faculty-schedule-empty";

      emptyItem.textContent =
        "No consultations scheduled for today.";

      scheduleListEl.appendChild(emptyItem);

      return;
    }


    todaysConsultations.forEach((request) => {

      const item =
        document.createElement("li");

      item.className =
        "faculty-schedule-item";

      item.innerHTML = `
        <span class="faculty-check" aria-hidden="true">&check;</span>
        <div class="faculty-schedule-details">
          <div class="faculty-schedule-name-row">
            <p class="faculty-schedule-name">${studentNameLinkHtml(request)}</p>
            <a
              href="faculty-consultation-requests.html"
              class="faculty-schedule-view-link"
              data-request-id="${request.id}"
            >View</a>
          </div>
          <p class="faculty-schedule-purpose">${request.type}</p>
          <p class="faculty-schedule-time">Preferred Date: ${formatPreferredDateTime(request)}</p>
        </div>
      `;

      scheduleListEl.appendChild(item);
    });
  }


  // "View": remember which consultation to open, then let the
  // link navigate normally to Faculty Consultation Requests
  if (scheduleListEl) {

    scheduleListEl.addEventListener(
      "click",
      (event) => {

        const viewLink =
          event.target.closest(
            ".faculty-schedule-view-link"
          );

        if (!viewLink) return;

        try {

          sessionStorage.setItem(
            SCHEDULE_VIEW_TARGET_STORAGE_KEY,
            JSON.stringify({
              id: viewLink.dataset.requestId,
              section: "upcoming",
            })
          );

        } catch (error) {

          // sessionStorage unavailable -- the link still
          // navigates, just without auto-opening the card
        }

      }
    );
  }


  // Render today's schedule immediately.
  renderTodaysSchedule();


  // ---------------------------------------------------------
  // Accept request
  // ---------------------------------------------------------

  if (acceptButton) {

    acceptButton.addEventListener(
      "click",
      () => {

        const request =
          getNextPendingRequest();

        if (!request) return;


        acceptButton.textContent =
          "Accepted";

        acceptButton.disabled =
          true;

        acceptButton.classList.add(
          "is-accepted"
        );


        if (declineButton) {
          declineButton.disabled =
            true;
        }


        // "upcoming" -- same status
        // faculty-consultation-requests.js's Accept uses, so
        // this request correctly shows up there under
        // Upcoming Consultations.
        request.status =
          "upcoming";

        saveConsultations(requests);

        notifyRequestAnswered(
          request,
          "accepted"
        );


        // Give the person a moment to see
        // "Accepted" before the next request.
        // (Today's Schedule refreshes too, in case the request
        // just accepted is scheduled for today.)
        window.setTimeout(
          () => {
            renderDashboardRequest();
            renderTodaysSchedule();
          },
          900
        );

      }
    );

  }


  // ---------------------------------------------------------
  // Decline request
  // ---------------------------------------------------------

  if (declineButton) {

    declineButton.addEventListener(
      "click",
      () => {

        const request =
          getNextPendingRequest();

        if (!request) return;


        declineButton.textContent =
          "Declined";

        declineButton.disabled =
          true;

        declineButton.classList.add(
          "is-declined"
        );


        if (acceptButton) {
          acceptButton.disabled =
            true;
        }


        request.status =
          "declined";

        saveConsultations(requests);

        notifyRequestAnswered(
          request,
          "declined"
        );


        window.setTimeout(
          renderDashboardRequest,
          900
        );

      }
    );

  }


  // ---------------------------------------------------------
  // View More
  // ---------------------------------------------------------

  if (viewMoreButton) {

    viewMoreButton.addEventListener(
      "click",
      () => {

        window.location.href =
          "faculty-consultation-requests.html";

      }
    );

  }


  // =========================================================
  // AUTO CHECK IN REMINDER  (ADDED)
  //
  // If "Auto Check In Reminder" is checked AND saved on the
  // Faculty Settings page, the Quick Action popup (Check In /
  // Check Out) opens by itself when the faculty lands on this
  // Dashboard after logging in -- for easy access. Unchecked
  // (or never saved) = nothing happens.
  //
  // - Dashboard ONLY: no other Faculty page auto-opens it.
  // - Once per login: it does not pop open again every time
  //   the faculty comes back to the Dashboard from another
  //   page. The "already shown" flag lives in sessionStorage
  //   and is cleared by the login page (see the one-line
  //   snippet for faculty-login.html), so the next login
  //   shows it again.
  // - Reads the SAME saved setting Faculty Settings writes
  //   (profconsult_faculty_settings -> autoCheckInReminder);
  //   no new setting/storage is created for the on/off state.
  // - Reuses the existing Quick Action toggle from
  //   faculty-shared.js by clicking its button, so none of the
  //   popup open/close logic is duplicated here.
  // =========================================================

  const AUTO_CHECKIN_SETTINGS_STORAGE_KEY =
    "profconsult_faculty_settings";

  const AUTO_CHECKIN_SHOWN_SESSION_KEY =
    "profconsult_faculty_auto_checkin_shown";


  function isAutoCheckInReminderOn() {

    try {

      const raw =
        localStorage.getItem(
          AUTO_CHECKIN_SETTINGS_STORAGE_KEY
        );

      if (!raw) return false;

      const parsed = JSON.parse(raw);

      return !!(
        parsed &&
        parsed.autoCheckInReminder === true
      );

    } catch (error) {

      return false;
    }
  }


  // True only the first time in this login session that the
  // reminder should open. Marks it as shown when it says yes.
  function shouldAutoOpenQuickAction() {

    if (!isAutoCheckInReminderOn()) return false;

    try {

      if (
        sessionStorage.getItem(
          AUTO_CHECKIN_SHOWN_SESSION_KEY
        ) === "true"
      ) {

        return false;
      }

      sessionStorage.setItem(
        AUTO_CHECKIN_SHOWN_SESSION_KEY,
        "true"
      );

      return true;

    } catch (error) {

      // Can't remember it -> skip, rather than pop open on
      // every single Dashboard visit.
      return false;
    }
  }


  if (shouldAutoOpenQuickAction()) {

    // Short delay so the page paints first and the popup's
    // fade/slide-in is actually visible.
    window.setTimeout(
      () => {

        const autoQuickActionButton =
          document.getElementById(
            "facultyQuickActionButton"
          );

        const autoQuickActionPanel =
          document.getElementById(
            "facultyQuickActionPanel"
          );

        if (
          !autoQuickActionButton ||
          !autoQuickActionPanel
        ) {

          return;
        }


        // Already open (e.g. the faculty clicked it first)?
        // Leave it -- clicking would toggle it CLOSED.
        if (
          autoQuickActionPanel.classList.contains(
            "is-open"
          )
        ) {

          return;
        }


        autoQuickActionButton.click();

      },
      350
    );
  }

});