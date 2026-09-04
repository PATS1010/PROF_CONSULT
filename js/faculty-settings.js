// SYSTEM NOTE: Controls client-side behavior for the faculty settings page, including UI events and API calls.
// =========================================================
// FACULTY ACCOUNT SETTINGS -- PAGE-SPECIFIC INTERACTIONS
// - Email Notifications / Auto Check-In Reminder: frontend
//   state only for now, stored so a future backend can read
//   the same shape without changes here.
// - Dark Mode: state is tracked and persisted, but checking
//   it intentionally does NOT alter the page's appearance --
//   actual dark mode theming is future work.
// - Change Password: a real link to faculty-change-password.html
//   (no JS navigation needed).
// - Save: persists the current checkbox states and shows a
//   clear success message without navigating or reloading.
//
// Shared shell behavior (navbar, sidebar, quick action,
// notification bell) lives in faculty-shared.js.
// =========================================================

const FACULTY_SETTINGS_STORAGE_KEY = "profconsult_faculty_settings";

// ---------------------------------------------------------
// Default settings shape -- once a backend exists, this is
// the same shape it should read/write for the logged-in
// faculty account's preferences.
// ---------------------------------------------------------
const DEFAULT_FACULTY_SETTINGS = {
  emailNotifications: false,
  darkMode: false,
  autoCheckInReminder: false,
};

function loadFacultySettings() {
  try {
    const raw = window.localStorage.getItem(FACULTY_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FACULTY_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_FACULTY_SETTINGS, ...parsed };
  } catch (error) {
    return { ...DEFAULT_FACULTY_SETTINGS };
  }
}

function saveFacultySettings(settings) {
  try {
    window.localStorage.setItem(FACULTY_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    // Storage unavailable (e.g. private browsing) -- fail silently,
    // the in-memory state for this session still works.
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const emailNotificationsCheckbox = document.getElementById("emailNotificationsCheckbox");
  const darkModeCheckbox = document.getElementById("darkModeCheckbox");
  const autoCheckInCheckbox = document.getElementById("autoCheckInCheckbox");
  const saveButton = document.getElementById("saveSettingsButton");
  const saveSuccessMessage = document.getElementById("settingsSaveSuccess");

  // ---------------------------------------------------------
  // Apply the stored (or default) settings to the checkboxes
  // ---------------------------------------------------------
  const currentSettings = loadFacultySettings();

  if (emailNotificationsCheckbox) {
    emailNotificationsCheckbox.checked = currentSettings.emailNotifications;
  }
  if (darkModeCheckbox) {
    darkModeCheckbox.checked = currentSettings.darkMode;
  }
  if (autoCheckInCheckbox) {
    autoCheckInCheckbox.checked = currentSettings.autoCheckInReminder;
  }

  // ---------------------------------------------------------
  // Save: reads the current checkbox states, persists them,
  // and shows a clear success message. Does not navigate or
  // reload the page.
  // ---------------------------------------------------------
  function handleSaveSettings() {
    const updatedSettings = {
      emailNotifications: !!(emailNotificationsCheckbox && emailNotificationsCheckbox.checked),
      // Dark Mode state is saved, but intentionally has no visual
      // effect yet -- actual theming is future work.
      darkMode: !!(darkModeCheckbox && darkModeCheckbox.checked),
      autoCheckInReminder: !!(autoCheckInCheckbox && autoCheckInCheckbox.checked),
    };

    saveFacultySettings(updatedSettings);

    if (saveSuccessMessage) {
      saveSuccessMessage.hidden = false;
      requestAnimationFrame(() => saveSuccessMessage.classList.add("is-visible"));
      window.setTimeout(() => {
        saveSuccessMessage.classList.remove("is-visible");
        window.setTimeout(() => {
          saveSuccessMessage.hidden = true;
        }, 250);
      }, 2500);
    }
  }

  if (saveButton) {
    saveButton.addEventListener("click", handleSaveSettings);
  }

});