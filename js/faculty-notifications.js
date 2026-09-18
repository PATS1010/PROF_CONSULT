// SYSTEM NOTE: Controls client-side behavior for the faculty notifications page, using database-backed notifications.

function buildNotificationRow(notification) {
  const li = document.createElement("li");
  li.className = "notification-item";
  li.dataset.id = String(notification.id || "");
  li.dataset.href = notificationHref(notification.message);
  li.tabIndex = 0;
  li.setAttribute("role", "link");

  const icon = document.createElement("span");
  icon.className = "notification-check";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "\u2714";

  const content = document.createElement("div");
  content.className = "notification-content";

  const message = document.createElement("p");
  message.className = "notification-message";
  message.textContent = notification.message;
  content.appendChild(message);

  if (notification.timestamp) {
    const timestamp = document.createElement("p");
    timestamp.className = "notification-timestamp";
    timestamp.textContent = notification.timestamp;
    content.appendChild(timestamp);
  }

  li.appendChild(icon);
  li.appendChild(content);
  return li;
}

function notificationHref(message) {
  if (/consultation request/i.test(message)) {
    return "faculty-consultation-requests.html";
  }

  if (/completed|finished/i.test(message)) {
    return "faculty-dashboard.html";
  }

  return "faculty-dashboard.html";
}

function formatTimestamp(value) {
  if (!value) return "";
  const normalized = String(value).replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function renderFacultyNotifications(notifications) {
  const listEl = document.getElementById("notificationsList");
  const emptyMessageEl = document.getElementById("noNotificationsMessage");
  if (!listEl) return;

  listEl.innerHTML = "";

  notifications.forEach((notification) => {
    listEl.appendChild(buildNotificationRow(notification));
  });

  if (emptyMessageEl) {
    emptyMessageEl.hidden = notifications.length > 0;
  }
}

async function markNotificationsSeen() {
  await fetch("api/notifications.php", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "faculty", mark_all: true }),
  });

  if (typeof window.setNotificationBellUnread === "function") {
    window.setNotificationBellUnread(false);
  }
}

async function loadFacultyNotifications() {
  try {
    const response = await fetch("api/notifications.php?role=faculty", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "Unable to load notifications.");
    }

    const notifications = (result.notifications || []).map((notification) => ({
      id: Number(notification.Notification_ID || 0),
      message: notification.Message || "",
      timestamp: formatTimestamp(notification.Date_Time),
      readStatus: notification.Read_Status || "read",
    }));

    renderFacultyNotifications(notifications);

    if (notifications.some((notification) => notification.readStatus === "unread")) {
      await markNotificationsSeen();
    }
  } catch (error) {
    renderFacultyNotifications([{
      id: 0,
      message: error.message || "Unable to load notifications.",
      readStatus: "read",
    }]);
  }
}

document.addEventListener("DOMContentLoaded", loadFacultyNotifications);

document.addEventListener("click", (event) => {
  const row = event.target.closest(".notification-item[data-href]");
  if (!row) return;

  window.location.href = row.dataset.href;
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;

  const row = event.target.closest(".notification-item[data-href]");
  if (!row) return;

  event.preventDefault();
  window.location.href = row.dataset.href;
});
