// SYSTEM NOTE: Controls client-side behavior for the settings page, including UI events and API calls.
// =========================================================
// ACCOUNT SETTINGS PAGE INTERACTIONS
// - Burger menu + Quick Action: copied verbatim from the
//   proven-working Student Dashboard implementation
// - Notification bell icon: navigates to notifications.html
//   on click (TEST/DEMO ONLY -- no real notification data or
//   backend yet)
// - Settings checkboxes: persisted via localStorage as a
//   frontend-only stand-in until a real backend exists
// - Save button: persists settings and shows a green success
//   popup that auto-dismisses
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Burger sidebar: slides in from the left, dims/blurs the
  // dashboard behind it. Closes via the X button or clicking
  // the overlay outside the sidebar.
  // ---------------------------------------------------------
  const hamburgerButton = document.getElementById("hamburgerButton");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarClose = document.getElementById("sidebarClose");

  function openSidebar() {
    sidebar.classList.add("is-open");
    sidebarOverlay.hidden = false;
    // Let the browser paint `hidden` removal first so the
    // opacity transition on the overlay actually animates in
    requestAnimationFrame(() => sidebarOverlay.classList.add("is-open"));
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarOverlay.classList.remove("is-open");
    window.setTimeout(() => {
      sidebarOverlay.hidden = true;
    }, 250); // matches the overlay's CSS transition duration
  }

  if (hamburgerButton) {
    hamburgerButton.addEventListener("click", openSidebar);
  }
  if (sidebarClose) {
    sidebarClose.addEventListener("click", closeSidebar);
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }

  // ---------------------------------------------------------
  // Quick Action popup: fades/slides in below its trigger icon.
  // Closes when clicking its trigger again or anywhere outside.
  // ---------------------------------------------------------
  const quickActionButton = document.getElementById("quickActionButton");
  const quickActionPanel = document.getElementById("quickActionPanel");

  function openQuickAction() {
    quickActionPanel.hidden = false;
    requestAnimationFrame(() => quickActionPanel.classList.add("is-open"));
    quickActionButton.setAttribute("aria-expanded", "true");
  }

  function closeQuickAction() {
    quickActionPanel.classList.remove("is-open");
    quickActionButton.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      quickActionPanel.hidden = true;
    }, 200); // matches the panel's CSS transition duration
  }

  if (quickActionButton) {
    quickActionButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = quickActionPanel.classList.contains("is-open");
      if (isOpen) {
        closeQuickAction();
      } else {
        openQuickAction();
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (
      quickActionPanel &&
      !quickActionPanel.hidden &&
      !quickActionPanel.contains(event.target) &&
      event.target !== quickActionButton
    ) {
      closeQuickAction();
    }
  });

  // "Send Request" doesn't have a destination page yet --
  // left wired up but intentionally not navigating anywhere
  const requestConsultationButton = document.getElementById("requestConsultationButton");
  if (requestConsultationButton) {
    requestConsultationButton.addEventListener("click", (event) => {
      event.preventDefault();
      // Future: navigate to the consultation request page once it exists
    });
  }

  // ---------------------------------------------------------
  // Notification bell -- navigates to notifications.html.
  // TEST/DEMO ONLY: no real notification data or backend yet,
  // this just routes the whole button (not only the image) to
  // the Notifications page.
  // ---------------------------------------------------------
  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
  }

  // ---------------------------------------------------------
  // Settings checkboxes
  // No backend yet, so selections are stored in localStorage
  // as a frontend-only stand-in. Replace the body of
  // saveSettings()/loadSettings() with real API calls once a
  // backend exists -- nothing else on the page needs to change.
  // ---------------------------------------------------------
  const SETTINGS_STORAGE_KEY = "profconsult_student_settings";

  const emailNotificationsCheckbox = document.getElementById("emailNotificationsCheckbox");
  const pushNotificationsCheckbox = document.getElementById("pushNotificationsCheckbox");
  const darkModeCheckbox = document.getElementById("darkModeCheckbox");

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (typeof saved.emailNotifications === "boolean") {
        emailNotificationsCheckbox.checked = saved.emailNotifications;
      }
      if (typeof saved.pushNotifications === "boolean") {
        pushNotificationsCheckbox.checked = saved.pushNotifications;
      }
      if (typeof saved.darkMode === "boolean") {
        darkModeCheckbox.checked = saved.darkMode;
      }
    } catch (error) {
      // Nothing saved yet, or storage unavailable -- fall back to defaults
    }
  }

  function saveSettings() {
    const settings = {
      emailNotifications: emailNotificationsCheckbox.checked,
      pushNotifications: pushNotificationsCheckbox.checked,
      // Dark Mode is intentionally saved but not applied yet --
      // the actual dark theme isn't implemented, per spec
      darkMode: darkModeCheckbox.checked,
    };

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      // Storage unavailable -- settings just won't persist across reloads
    }
  }

  loadSettings();

  // ---------------------------------------------------------
  // Save button: persists settings and shows a green success
  // popup that fades out automatically after a short delay
  // ---------------------------------------------------------
  const saveSettingsButton = document.getElementById("saveSettingsButton");
  const saveSuccessPopup = document.getElementById("saveSuccessPopup");
  let successPopupTimeout = null;

  if (saveSettingsButton) {
    saveSettingsButton.addEventListener("click", () => {
      saveSettings();

      saveSuccessPopup.hidden = false;
      requestAnimationFrame(() => saveSuccessPopup.classList.add("is-visible"));

      if (successPopupTimeout) window.clearTimeout(successPopupTimeout);
      successPopupTimeout = window.setTimeout(() => {
        saveSuccessPopup.classList.remove("is-visible");
        window.setTimeout(() => {
          saveSuccessPopup.hidden = true;
        }, 250); // matches the popup's CSS transition duration
      }, 2000);
    });
  }

});