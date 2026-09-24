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
// - Accept / Decline / View More: clickable placeholders,
//   functionality not implemented yet.
//
// Shared shell behavior (navbar, sidebar, quick action,
// notification bell) lives in faculty-shared.js.
// =========================================================

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
  // Frontend-only mock data.
  //
  // No localStorage.
  // No sessionStorage.
  // No API.
  // No PHP.
  // No backend.
  //
  // Everything resets when the page is refreshed.
  // ---------------------------------------------------------

  let requests = [

    {
      id: "req-1",
      name: "Juan Dela Cruz",
      studentId: "22-00145",
      type: "Research Proposal",
      date: "July 20, 10:00 AM",
      program: "BS Computer Engineering",
      yearSet: "3B",
      message:
        "Good day po! I'd like to consult about my capstone research proposal title and methodology before I submit it for approval.",
      status: "pending",
    },

    {
      id: "req-2",
      name: "Joselita Rizal",
      studentId: "22-00098",
      type: "Research Proposal",
      date: "July 20, 10:00 AM",
      program: "BS Computer Engineering",
      yearSet: "3B",
      message:
        "Hi sir/ma'am, may I request a consultation regarding the scope and limitations section of our group's proposal?",
      status: "pending",
    },

    {
      id: "req-3",
      name: "Mark Santos",
      studentId: "21-00567",
      type: "Thesis Defense Prep",
      date: "July 21, 1:00 PM",
      program: "BS Computer Engineering",
      yearSet: "4A",
      message:
        "Requesting a short consultation to go over my defense slides and anticipated panel questions.",
      status: "pending",
    },

    {
      id: "req-4",
      name: "Angela Cruz",
      studentId: "23-00212",
      type: "Grade Concern",
      date: "July 22, 9:30 AM",
      program: "BS Computer Engineering",
      yearSet: "2A",
      message:
        "I'd like to clarify some items on my midterm exam whenever you have a free slot this week.",
      status: "pending",
    },

  ];


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
      requestNameEl.textContent =
        request.name;
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


        request.status =
          "accepted";


        notifyRequestAnswered(
          request,
          "accepted"
        );


        // Give the person a moment to see
        // "Accepted" before the next request.
        window.setTimeout(
          renderDashboardRequest,
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

});