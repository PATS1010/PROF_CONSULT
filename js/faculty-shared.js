// Faculty Shared JS
const FACULTY_ONLINE_STATUS_STORAGE_KEY =
  "facultyTestOnlineStatus";

const FACULTY_NOTIFICATION_STORAGE_KEY =
  "facultyTestNotifications";

const FACULTY_INCOMING_NOTIFICATION_STORAGE_KEY =
  "facultyTestIncomingNotification";

window.TEST_FACULTY_ACCOUNT = false;

const FACULTY_STATUS_LABELS = {
  online: "Online",
  meeting: "Meeting",
  consultation: "Consultation",
  onleave: "On Leave",
};

const FACULTY_STATUS_COLOR_VARS = {
  online: "--color-status-available",
  meeting: "--color-status-meeting",
  consultation: "--color-status-consultation",
  onleave: "--color-status-onleave",
};

const FACULTY_STATUS_DEFAULT = "consultation";

const FACULTY_STATUS_API_VALUES = {
  online: "available",
  meeting: "meeting",
  consultation: "consultation",
  onleave: "on leave",
};

const FACULTY_STATUS_FROM_API = {
  available: "online",
  online: "online",
  unavailable: "onleave",
  "in class": "meeting",
  meeting: "meeting",
  consultation: "consultation",
  "on leave": "onleave",
  offline: "onleave",
};

function isValidFacultyStatus(value) {

  return Object.prototype.hasOwnProperty.call(
    FACULTY_STATUS_LABELS,
    value
  );
}

let facultyOnlineStatus = FACULTY_STATUS_DEFAULT;

let checkInTimeoutId = null;

const CHECK_IN_TIMEOUT =
  5 * 60 * 1000;

function loadFacultyOnlineStatus() {

  try {

    const savedStatus =
      localStorage.getItem(
        FACULTY_ONLINE_STATUS_STORAGE_KEY
      );

    facultyOnlineStatus =
      isValidFacultyStatus(savedStatus)
        ? savedStatus
        : FACULTY_STATUS_DEFAULT;

  } catch (error) {

    facultyOnlineStatus =
      FACULTY_STATUS_DEFAULT;
  }
}

function saveFacultyOnlineStatus(
  status
) {

  try {

    localStorage.setItem(
      FACULTY_ONLINE_STATUS_STORAGE_KEY,
      status
    );

  } catch (error) {

  }
}

function facultyStatusForApi(status) {
  return FACULTY_STATUS_API_VALUES[status] ||
    FACULTY_STATUS_API_VALUES[FACULTY_STATUS_DEFAULT];
}

function facultyStatusFromApi(status) {
  const key =
    String(status || "")
      .trim()
      .toLowerCase();

  return FACULTY_STATUS_FROM_API[key] ||
    FACULTY_STATUS_DEFAULT;
}

function getPhilippineStatusTimestamp() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(new Date());
  const getPart = (type) => {
    const part = parts.find((item) => item.type === type);
    return part ? part.value : "";
  };
  return {
    date: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
    time: `${getPart("hour")}:${getPart("minute")}:${getPart("second")}`,
  };
}

async function persistFacultyOnlineStatus(status) {
  const timestamp = getPhilippineStatusTimestamp();
  const response =
    await fetch(
      "api/availability.php",
      {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          status: facultyStatusForApi(status),
          date: timestamp.date,
          time: timestamp.time,
        }),
      }
    );

  const result =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok || !result.ok) {
    throw new Error(
      result.message ||
      "Unable to save faculty availability."
    );
  }

  return result;
}

function getFacultyNotificationCount() {

  try {

    const savedCount =
      localStorage.getItem(
        FACULTY_NOTIFICATION_STORAGE_KEY
      );

    if (savedCount === null) {

      return 0;
    }

    const count =
      Number(savedCount);

    if (
      !Number.isFinite(count) ||
      count < 0
    ) {

      return 0;
    }

    return Math.floor(count);

  } catch (error) {

    return 0;
  }
}

function setFacultyNotificationCount(
  count
) {

  const normalizedCount =
    Math.max(
      0,
      Math.floor(
        Number(count) || 0
      )
    );

  try {

    localStorage.setItem(
      FACULTY_NOTIFICATION_STORAGE_KEY,
      String(normalizedCount)
    );

  } catch (error) {

  }

  updateFacultyNotificationBadge();
}

function updateFacultyNotificationBadge() {

  const notificationBellButton =
    document.getElementById(
      "facultyNotificationBellButton"
    );

  if (!notificationBellButton) {

    return;
  }

  const notificationCount =
    getFacultyNotificationCount();

  if (notificationCount > 0) {

    notificationBellButton.classList.add(
      "has-notifications"
    );

    notificationBellButton.setAttribute(
      "aria-label",
      `Notifications (${notificationCount} unread)`
    );

  } else {

    notificationBellButton.classList.remove(
      "has-notifications"
    );

    notificationBellButton.setAttribute(
      "aria-label",
      "Notifications"
    );
  }
}

window.setFacultyNotificationCount =
  setFacultyNotificationCount;

window.getFacultyNotificationCount =
  getFacultyNotificationCount;

const FACULTY_TOAST_DURATION = 10 * 1000;

const FACULTY_TOAST_EXIT_MS = 400;

const FACULTY_TOAST_MAX_VISIBLE = 3;

let facultyToastStackEl = null;

const facultyToasts = [];

function getFacultyToastStack() {

  if (
    facultyToastStackEl &&
    document.body.contains(facultyToastStackEl)
  ) {

    return facultyToastStackEl;
  }

  facultyToastStackEl =
    document.createElement("div");

  facultyToastStackEl.className =
    "faculty-toast-stack";

  facultyToastStackEl.setAttribute(
    "role",
    "status"
  );

  facultyToastStackEl.setAttribute(
    "aria-live",
    "polite"
  );

  document.body.appendChild(
    facultyToastStackEl
  );

  return facultyToastStackEl;
}

function layoutFacultyToasts() {

  facultyToasts.forEach(
    (toast, depth) => {

      const el = toast.el;

      const isVisible =
        depth < FACULTY_TOAST_MAX_VISIBLE;

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

function removeFacultyToast(
  toast,
  animate
) {

  const index =
    facultyToasts.indexOf(toast);

  if (index === -1) {

    return;
  }

  facultyToasts.splice(index, 1);

  window.clearTimeout(
    toast.timerId
  );

  layoutFacultyToasts();

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
    FACULTY_TOAST_EXIT_MS + 50
  );
}

function showFacultyNotificationToast(
  message,
  title
) {

  const stack =
    getFacultyToastStack();

  const el =
    document.createElement("div");

  el.className =
    "faculty-toast";

  const header =
    document.createElement("div");

  header.className =
    "faculty-toast-header";

  const titleEl =
    document.createElement("p");

  titleEl.className =
    "faculty-toast-title";

  titleEl.textContent =
    title || "New Notification";

  const closeButton =
    document.createElement("button");

  closeButton.type =
    "button";

  closeButton.className =
    "faculty-toast-close";

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
    "faculty-toast-body";

  const messageEl =
    document.createElement("p");

  messageEl.className =
    "faculty-toast-message";

  messageEl.textContent =
    message || "";

  const viewMoreLink =
    document.createElement("a");

  viewMoreLink.className =
    "faculty-toast-view-more";

  viewMoreLink.href =
    "faculty-notifications.html";

  viewMoreLink.textContent =
    "View More";

  viewMoreLink.addEventListener(
    "click",
    () => {

      setFacultyNotificationCount(0);
    }
  );

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

      removeFacultyToast(
        toast,
        false
      );
    }
  );

  facultyToasts.unshift(toast);

  stack.appendChild(el);

  layoutFacultyToasts();

  void el.offsetWidth;

  el.classList.add("is-in");

  toast.timerId =
    window.setTimeout(
      () => {

        removeFacultyToast(
          toast,
          true
        );

      },
      FACULTY_TOAST_DURATION
    );
}

window.showFacultyNotificationToast =
  showFacultyNotificationToast;

// ---------------------------------------------------------
// LOGOUT CONFIRMATION MODAL
// Built once per page (lazily, only if a sidebar Logout link
// exists) and appended to <body>, the same way the toast stack
// above is built. Shared across every Faculty page since it
// lives in this shared file -- no HTML/CSS needs to be added to
// individual pages for this.
//
// Clicking the sidebar's Logout link no longer navigates
// immediately: it opens this modal instead. "Cancel" (or the
// close button, or clicking the dark backdrop) just closes the
// modal -- nothing else happens, same as before the click.
// "Yes" does exactly what the old immediate-navigation Logout
// link used to do (clear the auto-check-in "shown" flag, then
// go to the link's own href) before actually navigating, so
// per-page href differences are respected rather than hardcoded.
// ---------------------------------------------------------
function buildFacultyLogoutModal(logoutLink) {

  const overlay =
    document.createElement("div");

  overlay.className =
    "faculty-logout-overlay";

  overlay.hidden = true;

  const modal =
    document.createElement("div");

  modal.className =
    "faculty-logout-modal";

  modal.setAttribute("role", "dialog");

  modal.setAttribute("aria-modal", "true");

  modal.setAttribute(
    "aria-label",
    "Log out of your account?"
  );

  const header =
    document.createElement("div");

  header.className =
    "faculty-logout-modal-header";

  const closeButton =
    document.createElement("button");

  closeButton.type = "button";

  closeButton.className =
    "faculty-logout-modal-close";

  closeButton.setAttribute(
    "aria-label",
    "Close"
  );

  closeButton.textContent = "\u00d7";

  header.appendChild(closeButton);

  const body =
    document.createElement("div");

  body.className =
    "faculty-logout-modal-body";

  const title =
    document.createElement("p");

  title.className =
    "faculty-logout-modal-title";

  title.textContent =
    "Log out of your account?";

  const actions =
    document.createElement("div");

  actions.className =
    "faculty-logout-modal-actions";

  const cancelButton =
    document.createElement("button");

  cancelButton.type = "button";

  cancelButton.className =
    "faculty-logout-cancel-button";

  cancelButton.textContent = "Cancel";

  const yesButton =
    document.createElement("button");

  yesButton.type = "button";

  yesButton.className =
    "faculty-logout-yes-button";

  yesButton.textContent = "Yes";

  actions.appendChild(cancelButton);

  actions.appendChild(yesButton);

  body.appendChild(title);

  body.appendChild(actions);

  modal.appendChild(header);

  modal.appendChild(body);

  overlay.appendChild(modal);

  document.body.appendChild(overlay);

  function openModal() {

    overlay.hidden = false;

    requestAnimationFrame(() => {

      overlay.classList.add("is-open");
    });
  }

  function closeModal() {

    overlay.classList.remove("is-open");

    window.setTimeout(() => {

      overlay.hidden = true;

    }, 200);
  }

  closeButton.addEventListener(
    "click",
    closeModal
  );

  cancelButton.addEventListener(
    "click",
    closeModal
  );

  overlay.addEventListener(
    "click",
    (event) => {

      if (event.target === overlay) {

        closeModal();
      }
    }
  );

  yesButton.addEventListener(
    "click",
    () => {

      try {

        sessionStorage.removeItem(
          "profconsult_faculty_auto_checkin_shown"
        );

      } catch (error) {

      }

      const redirectPage =
        logoutLink.getAttribute("href") ||
        "login.html";

      if (
        window.ProfConsultAuth &&
        window.ProfConsultAuth.logout
      ) {

        window.ProfConsultAuth.logout(
          redirectPage
        );
        return;
      }

      window.location.href =
        redirectPage;
    }
  );

  return {
    open: openModal,
  };
}

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadFacultyOnlineStatus();

    const hamburgerButton =
      document.getElementById(
        "facultyHamburgerButton"
      );

    const sidebar =
      document.getElementById(
        "facultySidebar"
      );

    const sidebarOverlay =
      document.getElementById(
        "facultySidebarOverlay"
      );

    const sidebarClose =
      document.getElementById(
        "facultySidebarClose"
      );

    function openSidebar() {

      if (
        !sidebar ||
        !sidebarOverlay
      ) {

        return;
      }

      sidebar.classList.add(
        "is-open"
      );

      sidebarOverlay.hidden =
        false;

      requestAnimationFrame(
        () => {

          sidebarOverlay.classList.add(
            "is-open"
          );

        }
      );
    }

    function closeSidebar() {

      if (
        !sidebar ||
        !sidebarOverlay
      ) {

        return;
      }

      sidebar.classList.remove(
        "is-open"
      );

      sidebarOverlay.classList.remove(
        "is-open"
      );

      window.setTimeout(
        () => {

          sidebarOverlay.hidden =
            true;

        },
        250
      );
    }

    if (hamburgerButton) {

      hamburgerButton.addEventListener(
        "click",
        openSidebar
      );
    }

    if (sidebarClose) {

      sidebarClose.addEventListener(
        "click",
        closeSidebar
      );
    }

    if (sidebarOverlay) {

      sidebarOverlay.addEventListener(
        "click",
        closeSidebar
      );
    }

    const activePage =
      document.body.dataset.activePage;

    if (
      activePage &&
      sidebar
    ) {

      const activeLink =
        sidebar.querySelector(
          `.faculty-sidebar-link[data-page="${activePage}"]`
        );

      if (activeLink) {

        activeLink.classList.add(
          "is-active"
        );
      }
    }

    const facultyLogoLinks =
      document.querySelectorAll(
        ".faculty-navbar-logo, .faculty-sidebar-logo"
      );

    facultyLogoLinks.forEach(
      (logo) => {

        logo.addEventListener(
          "click",
          () => {

            window.location.href =
              "faculty-dashboard.html";
          }
        );
      }
    );

    // ---------------------------------------------------------
    // Logout: clicking the sidebar link now opens the confirm
    // modal (built above) instead of navigating right away.
    // Cancel/close/backdrop click just closes it; Yes performs
    // the same cleanup + navigation the link used to do directly.
    // ---------------------------------------------------------
    const logoutLink =
      sidebar
        ? sidebar.querySelector(
            '.faculty-sidebar-link[data-page="logout"]'
          )
        : null;

    if (logoutLink) {

      const logoutModal =
        buildFacultyLogoutModal(
          logoutLink
        );

      logoutLink.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

          logoutModal.open();
        }
      );
    }

    const quickActionButton =
      document.getElementById(
        "facultyQuickActionButton"
      );

    const quickActionPanel =
      document.getElementById(
        "facultyQuickActionPanel"
      );

    function openQuickAction() {

      if (
        !quickActionButton ||
        !quickActionPanel
      ) {

        return;
      }

      quickActionPanel.hidden =
        false;

      requestAnimationFrame(
        () => {

          quickActionPanel.classList.add(
            "is-open"
          );

        }
      );

      quickActionButton.setAttribute(
        "aria-expanded",
        "true"
      );
    }

    function closeQuickAction() {

      if (
        !quickActionButton ||
        !quickActionPanel
      ) {

        return;
      }

      quickActionPanel.classList.remove(
        "is-open"
      );

      quickActionButton.setAttribute(
        "aria-expanded",
        "false"
      );

      window.setTimeout(
        () => {

          quickActionPanel.hidden =
            true;

        },
        200
      );
    }

    if (quickActionButton) {

      quickActionButton.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();

          const isOpen =
            quickActionPanel &&
            quickActionPanel.classList.contains(
              "is-open"
            );

          if (isOpen) {

            closeQuickAction();

          } else {

            openQuickAction();
          }
        }
      );
    }

    document.addEventListener(
      "click",
      (event) => {

        if (
          quickActionPanel &&
          !quickActionPanel.hidden &&
          !quickActionPanel.contains(
            event.target
          ) &&
          event.target !==
            quickActionButton &&
          !quickActionButton.contains(
            event.target
          )
        ) {

          closeQuickAction();
        }
      }
    );

    const checkInButton =
      document.getElementById(
        "facultyCheckInButton"
      );

    const checkOutButton =
      document.getElementById(
        "facultyCheckOutButton"
      );

    const quickActionHeader =
      quickActionPanel
        ? quickActionPanel.querySelector(
            ".faculty-quick-action-header"
          )
        : null;

    let quickActionStatusDot =
      null;

    let quickActionStatusLabel =
      null;

    if (
      quickActionPanel &&
      quickActionHeader &&
      !quickActionPanel.querySelector(
        ".faculty-quick-action-status"
      )
    ) {

      const statusRow =
        document.createElement(
          "p"
        );

      statusRow.className =
        "faculty-quick-action-status";

      statusRow.style.cssText =
        "display:flex;" +
        "align-items:center;" +
        "gap:8px;" +
        "font-size:0.82rem;" +
        "font-weight:600;" +
        "color:#2b2b2b;" +
        "margin:0 0 14px;";

      quickActionStatusDot =
        document.createElement(
          "span"
        );

      quickActionStatusDot.setAttribute(
        "aria-hidden",
        "true"
      );

      quickActionStatusDot.style.cssText =
        "display:inline-block;" +
        "width:10px;" +
        "height:10px;" +
        "border-radius:50%;" +
        "flex-shrink:0;";

      quickActionStatusLabel =
        document.createElement(
          "span"
        );

      statusRow.appendChild(
        document.createTextNode(
          "Status: "
        )
      );

      statusRow.appendChild(
        quickActionStatusDot
      );

      statusRow.appendChild(
        quickActionStatusLabel
      );

      quickActionHeader.insertAdjacentElement(
        "afterend",
        statusRow
      );

    } else if (
      quickActionPanel
    ) {

      const existingRow =
        quickActionPanel.querySelector(
          ".faculty-quick-action-status"
        );

      if (existingRow) {

        quickActionStatusDot =
          existingRow.querySelector(
            "span"
          );

        quickActionStatusLabel =
          existingRow.lastElementChild;
      }
    }

    function updateQuickActionUI() {

      const isOnLeave =
        facultyOnlineStatus ===
        "onleave";

      const colorVar =
        FACULTY_STATUS_COLOR_VARS[
          facultyOnlineStatus
        ] ||
        FACULTY_STATUS_COLOR_VARS[
          FACULTY_STATUS_DEFAULT
        ];

      if (quickActionStatusDot) {

        quickActionStatusDot.style.backgroundColor =
          `var(${colorVar})`;
      }

      if (quickActionStatusLabel) {

        quickActionStatusLabel.textContent =
          FACULTY_STATUS_LABELS[
            facultyOnlineStatus
          ] ||
          FACULTY_STATUS_LABELS[
            FACULTY_STATUS_DEFAULT
          ];
      }

      if (checkInButton) {

        checkInButton.hidden =
          !isOnLeave;
      }

      if (checkOutButton) {

        checkOutButton.hidden =
          isOnLeave;
      }
    }

    function updateDashboardStatusUI() {

      const dashboardStatusDot =
        document.getElementById(
          "currentStatusDot"
        );

      const dashboardStatusLabel =
        document.getElementById(
          "currentStatusLabel"
        );

      if (
        !dashboardStatusDot ||
        !dashboardStatusLabel
      ) {

        return;
      }

      dashboardStatusDot.className =
        `status-dot status-${facultyOnlineStatus}`;

      dashboardStatusLabel.textContent =
        FACULTY_STATUS_LABELS[
          facultyOnlineStatus
        ] ||
        FACULTY_STATUS_LABELS[
          FACULTY_STATUS_DEFAULT
        ];
    }

    function updateAvailabilityStatusUI() {

      const availabilityStatusDot =
        document.getElementById(
          "availabilityStatusDot"
        );

      const availabilityStatusLabel =
        document.getElementById(
          "availabilityStatusLabel"
        );

      if (
        !availabilityStatusDot ||
        !availabilityStatusLabel
      ) {

        return;
      }

      availabilityStatusDot.className =
        `status-dot status-${facultyOnlineStatus}`;

      availabilityStatusLabel.textContent =
        FACULTY_STATUS_LABELS[
          facultyOnlineStatus
        ] ||
        FACULTY_STATUS_LABELS[
          FACULTY_STATUS_DEFAULT
        ];
    }

    function syncStatusPanelSelection() {

      const statusPanel =
        document.getElementById(
          "statusPanel"
        );

      if (!statusPanel) {

        return;
      }

      const options =
        Array.from(
          statusPanel.querySelectorAll(
            ".faculty-status-option"
          )
        );

      options.forEach((option) => {

        option.classList.toggle(
          "is-selected",
          option.dataset.status ===
            facultyOnlineStatus
        );
      });
    }

    function setFacultyOnlineStatus(
      newStatus,
      options
    ) {

      facultyOnlineStatus =
        isValidFacultyStatus(newStatus)
          ? newStatus
          : FACULTY_STATUS_DEFAULT;

      saveFacultyOnlineStatus(
        facultyOnlineStatus
      );

      updateQuickActionUI();

      updateDashboardStatusUI();

      updateAvailabilityStatusUI();

      syncStatusPanelSelection();

      document.dispatchEvent(
        new CustomEvent(
          "faculty-status-changed",
          {
            detail: {
              status: facultyOnlineStatus,
            },
          }
        )
      );

      const shouldPersist =
        !options ||
        options.persist !== false;

      if (shouldPersist) {

        return persistFacultyOnlineStatus(
          facultyOnlineStatus
        ).catch((error) => {

          console.error(
            error.message ||
            "Unable to save faculty availability."
          );
          if (options && options.throwOnError) {
            throw error;
          }
        });
      }

      return Promise.resolve();
    }

    window.setFacultyOnlineStatus =
      setFacultyOnlineStatus;

    window.getFacultyOnlineStatus =
      () => facultyOnlineStatus;

    window.FACULTY_STATUS_LABELS =
      FACULTY_STATUS_LABELS;

    function loadFacultyOnlineStatusFromApi() {

      fetch(
        "api/availability.php?role=faculty&latest=1",
        {
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            "Accept": "application/json",
          },
        }
      )
        .then((response) =>
          response.ok
            ? response.json()
            : Promise.reject()
        )
        .then((result) => {

          const rows =
            result &&
            Array.isArray(result.availability)
              ? result.availability
              : [];

          if (rows.length === 0) {
            return;
          }

          const latest =
            rows[rows.length - 1];

          setFacultyOnlineStatus(
            facultyStatusFromApi(
              latest.Status
            ),
            {
              persist: false,
            }
          );
        })
        .catch(() => {
        });
    }

    function handleCheckIn(
      event
    ) {

      event.preventDefault();

      setFacultyOnlineStatus(
        "online"
      );

      if (checkInTimeoutId) {

        window.clearTimeout(
          checkInTimeoutId
        );
      }

      checkInTimeoutId =
        window.setTimeout(
          () => {

            setFacultyOnlineStatus(
              "onleave"
            );

            checkInTimeoutId =
              null;

          },
          CHECK_IN_TIMEOUT
        );
    }

    function handleCheckOut(
      event
    ) {

      event.preventDefault();

      setFacultyOnlineStatus(
        "onleave"
      );

      if (checkInTimeoutId) {

        window.clearTimeout(
          checkInTimeoutId
        );

        checkInTimeoutId =
          null;
      }
    }

    if (checkInButton) {

      checkInButton.addEventListener(
        "click",
        handleCheckIn
      );
    }

    if (checkOutButton) {

      checkOutButton.addEventListener(
        "click",
        handleCheckOut
      );
    }

    updateQuickActionUI();

    updateDashboardStatusUI();

    updateAvailabilityStatusUI();

    syncStatusPanelSelection();

    loadFacultyOnlineStatusFromApi();

    if (activePage === "notifications") {

      setFacultyNotificationCount(0);
    }

    updateFacultyNotificationBadge();

    const notificationBellButton =
      document.getElementById(
        "facultyNotificationBellButton"
      );

    if (notificationBellButton) {

      notificationBellButton.addEventListener(
        "click",
        () => {

          setFacultyNotificationCount(
            0
          );

          window.location.href =
            "faculty-notifications.html";
        }
      );
    }

    window.addEventListener(
      "storage",
      (event) => {

        if (
          event.key ===
          FACULTY_ONLINE_STATUS_STORAGE_KEY
        ) {

          loadFacultyOnlineStatus();

          updateQuickActionUI();

          updateDashboardStatusUI();

          updateAvailabilityStatusUI();

          syncStatusPanelSelection();

          document.dispatchEvent(
            new CustomEvent(
              "faculty-status-changed",
              {
                detail: {
                  status: facultyOnlineStatus,
                },
              }
            )
          );
        }

        if (
          event.key ===
          FACULTY_NOTIFICATION_STORAGE_KEY
        ) {

          updateFacultyNotificationBadge();
        }

        if (
          event.key ===
            FACULTY_INCOMING_NOTIFICATION_STORAGE_KEY &&
          event.newValue
        ) {

          try {

            const incoming =
              JSON.parse(event.newValue);

            if (
              incoming &&
              typeof incoming.message === "string" &&
              incoming.message
            ) {

              showFacultyNotificationToast(
                incoming.message
              );
            }

          } catch (error) {

          }
        }
      }
    );

  }
);
