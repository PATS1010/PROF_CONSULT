// SYSTEM NOTE: Controls client-side behavior for the faculty notifications page, using database-backed notifications.

function buildNotificationRow(notification) {
  const li = document.createElement("li");
  li.className = "notification-row";
  li.dataset.id = String(notification.id || "");

  const icon = document.createElement("span");
  icon.className = "notification-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "\u2714";

  const message = document.createElement("p");
  message.className = "notification-message";
  message.textContent = notification.message;

  if (/consultation request/i.test(notification.message)) {
    const link = document.createElement("a");
    link.className = "notification-view-link";
    link.href = "faculty-consultation-requests.html";
    link.textContent = "View";
    message.appendChild(link);
  }

  li.appendChild(icon);
  li.appendChild(message);
  return li;
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
    body: JSON.stringify({ mark_all: true }),
  });

  if (typeof window.setNotificationBellUnread === "function") {
    window.setNotificationBellUnread(false);
  }
}

async function loadFacultyNotifications() {
  try {
    const response = await fetch("api/notifications.php", {
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
