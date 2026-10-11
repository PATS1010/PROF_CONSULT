// Faculty Notifications JS
const STUDENT_PROFILE_PAGE_URL = "faculty-student-profile.html";

const STUDENT_PROFILE_ORIGIN = "notifications";

function getStudentProfileUrl(studentId) {
  const params = new URLSearchParams({
    studentId: studentId,
    from: STUDENT_PROFILE_ORIGIN,
  });
  return `${STUDENT_PROFILE_PAGE_URL}?${params.toString()}`;
}

function buildNotificationRow(notification) {

  const li =
    document.createElement("li");

  li.className =
    "notification-row";

  li.dataset.id =
    notification.Notification_ID || notification.id || "";

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

  message.appendChild(
    document.createTextNode(
      `${notification.Message || notification.message || ""} `
    )
  );

  const link =
    document.createElement("a");

  link.className =
    "notification-view-link";

  link.href =
    "faculty-consultation-requests.html";

  link.textContent = "View";

  message.appendChild(link);

  li.appendChild(icon);

  li.appendChild(message);

  return li;
}

function renderFacultyNotifications(notifications) {

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
  () => {
    fetch("api/notifications.php", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
    })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => {
        renderFacultyNotifications(
          result && Array.isArray(result.notifications)
            ? result.notifications
            : []
        );
      })
      .catch(() => renderFacultyNotifications([]));
  }
);
