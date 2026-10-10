// Faculty Notifications JS
const CONSULTATIONS_STORAGE_KEY = "profconsult_faculty_consultations";

const NOTIFICATION_VIEW_TARGET_STORAGE_KEY = "profconsult_notification_view_target";

const STUDENT_PROFILE_PAGE_URL = "faculty-student-profile.html";

const STUDENT_PROFILE_ORIGIN = "notifications";

function getStudentProfileUrl(studentId) {
  const params = new URLSearchParams({
    studentId: studentId,
    from: STUDENT_PROFILE_ORIGIN,
  });
  return `${STUDENT_PROFILE_PAGE_URL}?${params.toString()}`;
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

  }

  return DEFAULT_CONSULTATIONS.slice();
}

const PH_TODAY_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getTodayISO() {

  return PH_TODAY_KEY_FORMATTER.format(new Date());
}

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

  if (notification.messageBefore) {

    message.appendChild(
      document.createTextNode(
        notification.messageBefore
      )
    );
  }

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

      }
    }
  );

  message.appendChild(link);

  li.appendChild(icon);

  li.appendChild(message);

  return li;
}

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

document.addEventListener(
  "DOMContentLoaded",
  renderFacultyNotifications
);