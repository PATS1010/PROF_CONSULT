// Faculty Settings JS
const FACULTY_SETTINGS_STORAGE_KEY = "profconsult_faculty_settings";

const DEFAULT_FACULTY_SETTINGS = {
  emailNotifications: true,
  pushNotifications: true,
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
  }
}

function applyNotificationSettings(settings, emailCheckbox, pushCheckbox) {
  if (!settings) return;
  if (emailCheckbox && typeof settings.email_notifications === "boolean") {
    emailCheckbox.checked = settings.email_notifications;
  }
  if (pushCheckbox && typeof settings.push_notifications === "boolean") {
    pushCheckbox.checked = settings.push_notifications;
  }
}

async function loadBackendNotificationSettings(emailCheckbox, pushCheckbox) {
  const response = await fetch("api/notification-settings.php?role=faculty", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Unable to load notification settings.");
  }
  applyNotificationSettings(result.settings, emailCheckbox, pushCheckbox);
}

async function saveBackendNotificationSettings(settings, emailCheckbox, pushCheckbox) {
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
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Unable to save notification settings.");
  }
  applyNotificationSettings(result.settings, emailCheckbox, pushCheckbox);
}

document.addEventListener("DOMContentLoaded", () => {

  const emailNotificationsCheckbox = document.getElementById("emailNotificationsCheckbox");
  const pushNotificationsCheckbox = document.getElementById("pushNotificationsCheckbox");
  const autoCheckInCheckbox = document.getElementById("autoCheckInCheckbox");
  const saveButton = document.getElementById("saveSettingsButton");
  const saveSuccessMessage = document.getElementById("settingsSaveSuccess");

  const currentSettings = loadFacultySettings();

  if (emailNotificationsCheckbox) {
    emailNotificationsCheckbox.checked = currentSettings.emailNotifications;
  }
  if (pushNotificationsCheckbox) {
    pushNotificationsCheckbox.checked = currentSettings.pushNotifications;
  }
  if (autoCheckInCheckbox) {
    autoCheckInCheckbox.checked = currentSettings.autoCheckInReminder;
  }

  loadBackendNotificationSettings(emailNotificationsCheckbox, pushNotificationsCheckbox).catch(() => {
  });

  async function handleSaveSettings() {
    const updatedSettings = {
      emailNotifications: !!(emailNotificationsCheckbox && emailNotificationsCheckbox.checked),
      pushNotifications: !!(pushNotificationsCheckbox && pushNotificationsCheckbox.checked),
      autoCheckInReminder: !!(autoCheckInCheckbox && autoCheckInCheckbox.checked),
    };

    saveFacultySettings(updatedSettings);
    if (saveButton) saveButton.disabled = true;

    try {
      await saveBackendNotificationSettings(
        updatedSettings,
        emailNotificationsCheckbox,
        pushNotificationsCheckbox
      );
    } catch (error) {
      if (saveButton) saveButton.disabled = false;
      window.alert(error.message || "Unable to save notification settings.");
      return;
    }
    if (saveButton) saveButton.disabled = false;

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
document.addEventListener("DOMContentLoaded", () => {

  const deleteAccountButton = document.getElementById("deleteAccountButton");
  if (!deleteAccountButton) return;

  const origin = "faculty";
  const REOPEN_FLAG_KEY = "profconsult_reopen_delete_account_modal";

  const EYE_OPEN_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>';
  const EYE_OFF_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3l18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10.6 10.6a3 3 0 004.24 4.24" stroke="currentColor" stroke-width="2"/><path d="M9.17 5.17A10.94 10.94 0 0112 5c7 0 11 7 11 7a13.3 13.3 0 01-3.17 3.83M6.1 6.1A13.26 13.26 0 001 12s4 7 11 7a10.9 10.9 0 005.9-1.73" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  const overlay = document.createElement("div");
  overlay.className = "pc-delete-overlay";
  overlay.hidden = true;

  overlay.innerHTML = `
    <div class="pc-delete-modal" role="dialog" aria-modal="true" aria-label="Are you sure you want to delete your account?">
      <div class="pc-delete-modal-body">
        <h2 class="pc-delete-modal-title">Are you sure you want to delete your account?</h2>

        <div class="pc-delete-warning">
          <span class="pc-delete-warning-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L1.5 21h21L12 3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <rect x="11" y="9" width="2" height="6" fill="currentColor"/>
              <rect x="11" y="16.5" width="2" height="2" fill="currentColor"/>
            </svg>
          </span>
          <p class="pc-delete-warning-text">This action is irreversible. All your data will be permanently deleted.</p>
        </div>

        <label class="pc-delete-password-label" for="deleteAccountPasswordInput">Enter Password</label>
        <div class="pc-delete-password-wrapper">
          <input type="password" id="deleteAccountPasswordInput" class="pc-delete-password-input" placeholder="Password" autocomplete="current-password">
          <button type="button" class="pc-delete-password-toggle" id="deleteAccountPasswordToggle" aria-label="Show password">
            ${EYE_OPEN_ICON}
          </button>
        </div>

        <p class="pc-delete-password-error" id="deleteAccountPasswordError" hidden></p>

        <a href="forgot-password.html?from=${origin}&context=delete-account" class="pc-delete-forgot-password-link" id="deleteAccountForgotPasswordLink">Forgot password?</a>

        <div class="pc-delete-modal-actions">
          <button type="button" class="pc-delete-cancel-button" id="deleteAccountCancelButton">Cancel</button>
          <button type="button" class="pc-delete-yes-button" id="deleteAccountYesButton">Yes</button>
        </div>
      </div>

      <div class="pc-delete-loading" id="deleteAccountLoading" hidden>
        <span class="pc-delete-spinner" aria-hidden="true"></span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const modalBody = overlay.querySelector(".pc-delete-modal-body");
  const loadingEl = overlay.querySelector("#deleteAccountLoading");
  const passwordInput = overlay.querySelector("#deleteAccountPasswordInput");
  const passwordToggle = overlay.querySelector("#deleteAccountPasswordToggle");
  const passwordError = overlay.querySelector("#deleteAccountPasswordError");
  const forgotPasswordLink = overlay.querySelector("#deleteAccountForgotPasswordLink");
  const cancelButton = overlay.querySelector("#deleteAccountCancelButton");
  const yesButton = overlay.querySelector("#deleteAccountYesButton");

  function showPasswordError(text) {
    passwordError.textContent = text;
    passwordError.hidden = false;
    passwordInput.classList.add("has-error");
  }

  function clearPasswordError() {
    passwordError.textContent = "";
    passwordError.hidden = true;
    passwordInput.classList.remove("has-error");
  }

  function setPasswordVisible(visible) {
    passwordInput.type = visible ? "text" : "password";
    passwordToggle.innerHTML = visible ? EYE_OFF_ICON : EYE_OPEN_ICON;
    passwordToggle.setAttribute("aria-label", visible ? "Hide password" : "Show password");
  }

  async function verifyCurrentPassword(password) {
    const sessionResponse = await fetch(`api/session.php?role=${origin}`, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
    });
    const sessionResult = await sessionResponse.json().catch(() => ({}));
    if (!sessionResponse.ok || !sessionResult.ok || !sessionResult.user) {
      throw new Error("Please log in again before deleting your account.");
    }

    const identifier = sessionResult.user.email || sessionResult.user.username;
    if (!identifier) {
      throw new Error("Unable to verify this account.");
    }

    const loginResponse = await fetch("api/login.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ role: origin, identifier, password }),
    });
    const loginResult = await loginResponse.json().catch(() => ({}));
    if (!loginResponse.ok || !loginResult.ok) {
      throw new Error(loginResult.message || "Incorrect password.");
    }
  }

  async function deleteCurrentAccount(password) {
    const deleteResponse = await fetch("api/delete-account.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ role: origin, password }),
    });
    const deleteResult = await deleteResponse.json().catch(() => ({}));
    if (!deleteResponse.ok || !deleteResult.ok) {
      throw new Error(deleteResult.message || "Unable to delete account.");
    }
  }

  function openModal() {
    passwordInput.value = "";
    clearPasswordError();
    setPasswordVisible(false);
    modalBody.hidden = false;
    loadingEl.hidden = true;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("is-open"));
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    window.setTimeout(() => {
      overlay.hidden = true;
    }, 200);
  }

  deleteAccountButton.addEventListener("click", openModal);
  cancelButton.addEventListener("click", closeModal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  passwordToggle.addEventListener("click", () => {
    setPasswordVisible(passwordInput.type === "password");
  });

  passwordInput.addEventListener("input", clearPasswordError);

  forgotPasswordLink.addEventListener("click", () => {
    try {
      sessionStorage.setItem(REOPEN_FLAG_KEY, "1");
    } catch (error) {
    }
  });

  yesButton.addEventListener("click", async () => {
    const enteredPassword = passwordInput.value.trim();

    if (!enteredPassword) {
      showPasswordError("Please enter your password.");
      passwordInput.focus();
      return;
    }

    yesButton.disabled = true;
    try {
      await verifyCurrentPassword(enteredPassword);
    } catch (error) {
      yesButton.disabled = false;
      showPasswordError(error.message || "Incorrect password.");
      passwordInput.focus();
      return;
    }

    clearPasswordError();
    modalBody.hidden = true;
    loadingEl.hidden = false;
    try {
      await deleteCurrentAccount(enteredPassword);
      window.location.replace("faculty-login.html");
    } catch (error) {
      yesButton.disabled = false;
      modalBody.hidden = false;
      loadingEl.hidden = true;
      showPasswordError(error.message || "Unable to delete account.");
      passwordInput.focus();
    }
  });

  try {
    if (sessionStorage.getItem(REOPEN_FLAG_KEY) === "1") {
      sessionStorage.removeItem(REOPEN_FLAG_KEY);
      openModal();
    }
  } catch (error) {
  }

});
