// Student Notification Toast JS
(function () {

  "use strict";

  const STUDENT_INCOMING_NOTIFICATION_STORAGE_KEY =
    "studentTestIncomingNotification";

  window.showStudentNotificationToast = function (message, title) {
    window.ProfConsultNotificationPopup.show({ role: "student", text: message || "", heading: title || "New Notification" });
  };

  const STUDENT_NOTIF_DATE_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function formatRecordDateLabel(dateISO) {

    if (!dateISO) {

      return "";
    }

    const parsed = new Date(dateISO);

    if (Number.isNaN(parsed.getTime())) {

      return "";
    }

    return STUDENT_NOTIF_DATE_LABEL_FORMATTER.format(parsed);
  }

  function formatStudentNotificationMessage(record) {

    if (!record || typeof record !== "object") {

      return "";
    }

    const facultyName = record.facultyName || "";

    if (record.type === "accepted") {

      return `${facultyName} accepted your consultation request.`;
    }

    if (record.type === "declined") {

      return `${facultyName} declined your consultation request.`;
    }

    if (record.type === "rescheduled") {

      const dateLabel = formatRecordDateLabel(record.dateISO);

      const timeLabel = record.timeLabel || "";

      const scheduleText = [timeLabel, dateLabel]
        .filter(Boolean)
        .join(", ");

      if (record.accepted) {

        return `${facultyName} accepted and moved your consultation at ${scheduleText}.`;
      }

      return `${facultyName} moved your consultation request at ${scheduleText}.`;
    }

    return record.message || "";
  }

  window.formatStudentNotificationMessage =
    formatStudentNotificationMessage;

  function raiseBellIndicator() {

    const state =
      window.ProfConsultNotifications;

    if (!state) {

      return;
    }

    state.markUnread();

    const bellButton =
      document.getElementById(
        "notificationBellButton"
      ) ||
      document.querySelector(
        ".notification-bell-button"
      );

    if (bellButton) {

      state.renderBellIndicator(
        bellButton
      );
    }
  }

  window.addEventListener(
    "storage",
    (event) => {

      if (
        event.key !==
          STUDENT_INCOMING_NOTIFICATION_STORAGE_KEY ||
        !event.newValue
      ) {

        return;
      }

      try {

        const incoming =
          JSON.parse(event.newValue);

        if (
          incoming &&
          typeof incoming.message === "string" &&
          incoming.message
        ) {

          window.showStudentNotificationToast(
            incoming.message
          );

          raiseBellIndicator();
        }

      } catch (error) {

      }
    }
  );

  function isOnStudentNotificationsPage() {

    return /(^|\/)notifications\.html(\?|$)/i.test(
      window.location.pathname + window.location.search
    );
  }

})();
