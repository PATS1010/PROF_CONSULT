// SYSTEM NOTE: Controls client-side behavior for the faculty settings page, including UI events and API calls.
// =========================================================
// FACULTY ACCOUNT SETTINGS -- PAGE-SPECIFIC INTERACTIONS
// - Email Notifications / Push Notifications: saved to the
//   backend for the logged-in faculty account, with localStorage
//   kept as a quick client-side cache.
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
  emailNotifications: true,
  pushNotifications: true,
};

function loadFacultySettings() {
  try {
    const raw = window.localStorage.getItem(FACULTY_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FACULTY_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_FACULTY_SETTINGS,
      ...parsed,
      pushNotifications: typeof parsed.pushNotifications === "boolean"
        ? parsed.pushNotifications
        : !!parsed.autoCheckInReminder,
    };
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

async function loadFacultySettingsFromApi() {
  const response = await fetch("api/notification-settings.php?role=faculty", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Unable to load notification settings.");
  }

  return {
    emailNotifications: !!result.settings.email_notifications,
    pushNotifications: !!result.settings.push_notifications,
  };
}

async function saveFacultySettingsToApi(settings) {
  const response = await fetch("api/notification-settings.php", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      role: "faculty",
      email_notifications: settings.emailNotifications,
      push_notifications: settings.pushNotifications,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Unable to save notification settings.");
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const emailNotificationsCheckbox = document.getElementById("emailNotificationsCheckbox");
  const pushNotificationsCheckbox = document.getElementById("pushNotificationsCheckbox")
    || document.getElementById("autoCheckInCheckbox");
  const saveButton = document.getElementById("saveSettingsButton");
  const saveSuccessMessage = document.getElementById("settingsSaveSuccess");

  // ---------------------------------------------------------
  // Apply the stored (or default) settings to the checkboxes
  // ---------------------------------------------------------
  const currentSettings = loadFacultySettings();

  if (emailNotificationsCheckbox) {
    emailNotificationsCheckbox.checked = currentSettings.emailNotifications;
  }
  if (pushNotificationsCheckbox) {
    pushNotificationsCheckbox.checked = currentSettings.pushNotifications;
  }

  loadFacultySettingsFromApi()
    .then((settings) => {
      saveFacultySettings(settings);
      if (emailNotificationsCheckbox) emailNotificationsCheckbox.checked = settings.emailNotifications;
      if (pushNotificationsCheckbox) pushNotificationsCheckbox.checked = settings.pushNotifications;
    })
    .catch(() => {
      // Keep cached settings when the API is unavailable.
    });

  // ---------------------------------------------------------
  // Save: reads the current checkbox states, persists them,
  // and shows a clear success message. Does not navigate or
  // reload the page.
  // ---------------------------------------------------------
  async function handleSaveSettings() {
    const updatedSettings = {
      emailNotifications: !!(emailNotificationsCheckbox && emailNotificationsCheckbox.checked),
      pushNotifications: !!(pushNotificationsCheckbox && pushNotificationsCheckbox.checked),
    };

    saveFacultySettings(updatedSettings);
    try {
      await saveFacultySettingsToApi(updatedSettings);
    } catch (error) {
      // Keep local cache even when the network request fails.
    }

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
