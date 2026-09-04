// SYSTEM NOTE: Controls client-side behavior for the faculty notifications page, including UI events and API calls.
// =========================================================
// FACULTY NOTIFICATIONS -- PAGE-SPECIFIC INTERACTIONS
// Renders the notification list from a data array rather than
// hardcoded markup, so future notification types (consultation
// approved/rejected/rescheduled, system announcements, etc.)
// can be added just by pushing to NOTIFICATIONS and calling
// window.addFacultyNotification() -- no HTML changes needed.
//
// Shared shell behavior (navbar, sidebar, quick action,
// notification bell) lives in faculty-shared.js.
// =========================================================

// ---------------------------------------------------------
// Sample notifications -- replace with real data from the
// backend once notifications are persisted server-side.
// Each entry: { id, message, linkText, linkHref }
// linkText/linkHref are optional -- omit for notifications
// with no action link.
// ---------------------------------------------------------
const NOTIFICATIONS = [
  {
    id: "notif-1",
    type: "consultation-request",
    message: "New consultation request.",
    linkText: "View",
    linkHref: "faculty-consultation-requests.html",
  },
  {
    id: "notif-2",
    type: "consultation-cancelled",
    message: "Student canceled appointment.",
  },
  {
    id: "notif-3",
    type: "schedule-reminder",
    message: "Schedule reminder.",
  },
];

function buildNotificationRow(notification) {
  const li = document.createElement("li");
  li.className = "notification-row";
  li.dataset.type = notification.type;
  li.dataset.id = notification.id;

  const icon = document.createElement("span");
  icon.className = "notification-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "\u2714"; // heavy checkmark, matches the reference design

  const message = document.createElement("p");
  message.className = "notification-message";
  message.textContent = notification.message;

  if (notification.linkText && notification.linkHref) {
    const link = document.createElement("a");
    link.className = "notification-view-link";
    link.href = notification.linkHref;
    link.textContent = notification.linkText;
    // A plain link navigation -- no modal, per spec.
    message.appendChild(link);
  }

  li.appendChild(icon);
  li.appendChild(message);
  return li;
}

function renderFacultyNotifications() {
  const listEl = document.getElementById("notificationsList");
  const emptyMessageEl = document.getElementById("noNotificationsMessage");
  if (!listEl) return;

  listEl.innerHTML = "";

  NOTIFICATIONS.forEach((notification) => {
    listEl.appendChild(buildNotificationRow(notification));
  });

  if (emptyMessageEl) {
    emptyMessageEl.hidden = NOTIFICATIONS.length > 0;
  }
}

// ---------------------------------------------------------
// Public hook for future dynamic notifications -- explicitly
// attached to window so other faculty pages/scripts can call
// it once real-time notifications exist (e.g. a new
// consultation request coming in while this page is open).
// ---------------------------------------------------------
window.addFacultyNotification = function addFacultyNotification(notification) {
  NOTIFICATIONS.unshift(notification);
  renderFacultyNotifications();
};

document.addEventListener("DOMContentLoaded", renderFacultyNotifications);