// Student Notification Toast JS
(function () {

  "use strict";

  const STUDENT_INCOMING_NOTIFICATION_STORAGE_KEY =
    "studentTestIncomingNotification";

  const STUDENT_NOTIFICATIONS_PAGE =
    "notifications.html";

  const STUDENT_TOAST_DURATION = 10 * 1000;

  const STUDENT_TOAST_EXIT_MS = 400;

  const STUDENT_TOAST_MAX_VISIBLE = 3;

  let stackEl = null;

  const toasts = [];

  function getStack() {

    if (
      stackEl &&
      document.body.contains(stackEl)
    ) {

      return stackEl;
    }

    stackEl =
      document.createElement("div");

    stackEl.className =
      "student-toast-stack";

    stackEl.setAttribute(
      "role",
      "status"
    );

    stackEl.setAttribute(
      "aria-live",
      "polite"
    );

    document.body.appendChild(stackEl);

    return stackEl;
  }

  function layoutToasts() {

    toasts.forEach(
      (toast, depth) => {

        const el = toast.el;

        const isVisible =
          depth < STUDENT_TOAST_MAX_VISIBLE;

        el.style.setProperty(
          "--stack-y",
          `${-depth * 12}px`
        );

        el.style.setProperty(
          "--stack-scale",
          String(1 - depth * 0.05)
        );

        el.style.setProperty(
          "--stack-opacity",
          isVisible
            ? String(1 - depth * 0.2)
            : "0"
        );

        el.style.setProperty(
          "--stack-z",
          String(1000 - depth)
        );

        el.style.pointerEvents =
          depth === 0
            ? "auto"
            : "none";
      }
    );
  }

  function removeToast(
    toast,
    animate
  ) {

    const index =
      toasts.indexOf(toast);

    if (index === -1) {

      return;
    }

    toasts.splice(index, 1);

    window.clearTimeout(
      toast.timerId
    );

    layoutToasts();

    if (!animate) {

      toast.el.remove();

      return;
    }

    toast.el.style.pointerEvents =
      "none";

    toast.el.classList.add(
      "is-leaving"
    );

    window.setTimeout(
      () => {

        toast.el.remove();

      },
      STUDENT_TOAST_EXIT_MS + 50
    );
  }

  function showStudentNotificationToast(
    message,
    title
  ) {

    if (!document.body) {

      return;
    }

    const stack =
      getStack();

    const el =
      document.createElement("div");

    el.className =
      "student-toast";

    const header =
      document.createElement("div");

    header.className =
      "student-toast-header";

    const titleEl =
      document.createElement("p");

    titleEl.className =
      "student-toast-title";

    titleEl.textContent =
      title || "New Notification";

    const closeButton =
      document.createElement("button");

    closeButton.type =
      "button";

    closeButton.className =
      "student-toast-close";

    closeButton.setAttribute(
      "aria-label",
      "Dismiss notification"
    );

    closeButton.textContent =
      "\u00d7";

    header.appendChild(titleEl);

    header.appendChild(closeButton);

    const body =
      document.createElement("div");

    body.className =
      "student-toast-body";

    const messageEl =
      document.createElement("p");

    messageEl.className =
      "student-toast-message";

    messageEl.textContent =
      message || "";

    const viewMoreLink =
      document.createElement("a");

    viewMoreLink.className =
      "student-toast-view-more";

    viewMoreLink.href =
      STUDENT_NOTIFICATIONS_PAGE;

    viewMoreLink.textContent =
      "View More";

    body.appendChild(messageEl);

    body.appendChild(viewMoreLink);

    el.appendChild(header);

    el.appendChild(body);

    const toast = {
      el: el,
      timerId: null,
    };

    closeButton.addEventListener(
      "click",
      () => {

        removeToast(
          toast,
          false
        );
      }
    );

    toasts.unshift(toast);

    stack.appendChild(el);

    layoutToasts();

    void el.offsetWidth;

    el.classList.add("is-in");

    toast.timerId =
      window.setTimeout(
        () => {

          removeToast(
            toast,
            true
          );

        },
        STUDENT_TOAST_DURATION
      );
  }

  window.showStudentNotificationToast =
    showStudentNotificationToast;

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

          showStudentNotificationToast(
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
