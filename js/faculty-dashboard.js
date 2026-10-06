// Faculty Dashboard JS
const CONSULTATIONS_STORAGE_KEY = "profconsult_faculty_consultations";

const SCHEDULE_VIEW_TARGET_STORAGE_KEY = "profconsult_notification_view_target";

const STUDENT_PROFILE_PAGE_URL = "faculty-student-profile.html";

function getStudentProfileUrl(studentId, from) {
  const params = new URLSearchParams({ studentId: studentId });
  if (from) params.set("from", from);
  return `${STUDENT_PROFILE_PAGE_URL}?${params.toString()}`;
}

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

function isPageReload() {
  try {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0) return navEntries[0].type === "reload";
    if (performance.navigation) {
      return performance.navigation.type === performance.navigation.TYPE_RELOAD;
    }
  } catch (error) {
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
  }
  saveConsultations(DEFAULT_CONSULTATIONS);
  return DEFAULT_CONSULTATIONS.slice();
}

function saveConsultations(list) {
  try {
    localStorage.setItem(CONSULTATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
  }
}

const CONSULTATION_SLOT_MINUTES = 30;

function formatPreferredDateTime(request) {
  const raw = String((request && request.date) || "");

  if (/\d\s*(AM|PM)\s*[\u2013\u2014-]\s*\d/i.test(raw)) return raw;

  const match = raw.match(/^(.*?)(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i);
  if (!match) return raw;

  const datePrefix = match[1];
  const startHour = parseInt(match[2], 10);
  const startMinute = parseInt(match[3], 10);
  const startPeriod = match[4].toUpperCase();
  const startLabel = `${startHour}:${match[3]} ${startPeriod}`;

  const normalize = (text) => String(text).replace(/\s+/g, "").toUpperCase();

  const label = String((request && request.preferredTimeLabel) || "");
  const labelParts = label.split(/\s*[\u2013\u2014-]\s*/);
  if (
    labelParts.length === 2 &&
    labelParts[1].trim() &&
    normalize(labelParts[0]) === normalize(startLabel)
  ) {
    return `${datePrefix}${startLabel} \u2013 ${labelParts[1].trim()}`;
  }

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

  const SAMPLE_FACULTY = {
    fullName: "Engr. Maria Nina Sales",
    lastName: "Professor",
  };

  const nameEl = document.getElementById("facultyLastName");

  if (nameEl) {
    nameEl.textContent = SAMPLE_FACULTY.lastName;
  }

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

    renderPhilippineDateTime();

    setInterval(renderPhilippineDateTime, 1000);
  }

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

  let requests = loadConsultations();

  function notifyRequestAnswered(
    request,
    decision
  ) {
  }

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

  function getNextPendingRequest() {

    return requests.find(
      (request) =>
        request.status === "pending"
    ) || null;

  }

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

  renderDashboardRequest();

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

        }

      }
    );
  }

  renderTodaysSchedule();

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
          "upcoming";

        saveConsultations(requests);

        notifyRequestAnswered(
          request,
          "accepted"
        );

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

  if (viewMoreButton) {

    viewMoreButton.addEventListener(
      "click",
      () => {

        window.location.href =
          "faculty-consultation-requests.html";

      }
    );

  }

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

      return false;
    }
  }

  if (shouldAutoOpenQuickAction()) {

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