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

const PH_TODAY_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getTodayISO() {

  return PH_TODAY_KEY_FORMATTER.format(new Date());
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

  message.appendChild(
    document.createTextNode(
      `${notification.message} `
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

  const content = document.createElement("div");
  content.className = "notification-details";
  content.appendChild(message);
  const timestamp = window.ProfConsultNotificationTime.createElement(notification.createdAt);
  if (timestamp) content.appendChild(timestamp);

  li.appendChild(icon);

  li.appendChild(content);

  return li;
}

function renderFacultyNotifications(notifications = []) {

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
    fetch("api/notifications.php?role=faculty", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
    })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => {
        const notifications = Array.isArray(result.notifications)
          ? result.notifications.map((item) => ({
              id: String(item.Notification_ID),
              message: item.Message || "",
              createdAt: item.Created_At_Epoch,
              linkText: "View",
              targetId: "",
              targetSection: "pending",
            }))
          : [];
        renderFacultyNotifications(notifications);
      })
      .catch(() => renderFacultyNotifications([]));
  }
);
