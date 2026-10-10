// Student Settings JS
document.addEventListener("DOMContentLoaded", () => {


  const hamburgerButton = document.getElementById("hamburgerButton");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const sidebarClose = document.getElementById("sidebarClose");

  function openSidebar() {
    sidebar.classList.add("is-open");
    sidebarOverlay.hidden = false;
    requestAnimationFrame(() => sidebarOverlay.classList.add("is-open"));
  }

  function closeSidebar() {
    sidebar.classList.remove("is-open");
    sidebarOverlay.classList.remove("is-open");
    window.setTimeout(() => {
      sidebarOverlay.hidden = true;
    }, 250); 
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
    }, 200); 
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

  
  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
    if (window.ProfConsultNotifications) {
      window.ProfConsultNotifications.renderBellIndicator(notificationBellButton);
    }
  }

  const SETTINGS_STORAGE_KEY = "profconsult_student_settings";

  const emailNotificationsCheckbox = document.getElementById("emailNotificationsCheckbox");
  const pushNotificationsCheckbox = document.getElementById("pushNotificationsCheckbox");

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
    } catch (error) {

    }
  }

  function saveSettings() {
    const settings = {
      emailNotifications: emailNotificationsCheckbox.checked,
      pushNotifications: pushNotificationsCheckbox.checked,
    };

    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {

    }
  }

  loadSettings();


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
        }, 250); 
      }, 2000);
    });
  }

});
document.addEventListener("DOMContentLoaded", () => {

  const logoutLink = document.getElementById("logoutLink");
  if (!logoutLink) return;

  const overlay = document.createElement("div");
  overlay.className = "pc-logout-overlay";
  overlay.hidden = true;

  overlay.innerHTML = `
    <div class="pc-logout-modal" role="dialog" aria-modal="true" aria-label="Log out of your account?">
      <div class="pc-logout-modal-header">
        <button type="button" class="pc-logout-modal-close" aria-label="Close">&times;</button>
      </div>
      <div class="pc-logout-modal-body">
        <p class="pc-logout-modal-title">Log out of your account?</p>
        <div class="pc-logout-modal-actions">
          <button type="button" class="pc-logout-cancel-button">Cancel</button>
          <button type="button" class="pc-logout-yes-button">Yes</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector(".pc-logout-modal-close");
  const cancelButton = overlay.querySelector(".pc-logout-cancel-button");
  const yesButton = overlay.querySelector(".pc-logout-yes-button");

  function openModal() {
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("is-open"));
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    window.setTimeout(() => {
      overlay.hidden = true;
    }, 200);
  }

  closeButton.addEventListener("click", closeModal);
  cancelButton.addEventListener("click", closeModal);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeModal();
  });

  yesButton.addEventListener("click", () => {
    const redirectPage = logoutLink.getAttribute("href") || "login.html";
    if (window.ProfConsultAuth && window.ProfConsultAuth.logout) {
      window.ProfConsultAuth.logout(redirectPage);
      return;
    }
    window.location.href = redirectPage;
  });

  logoutLink.addEventListener("click", (event) => {
    event.preventDefault();
    openModal();
  });

});
document.addEventListener("DOMContentLoaded", () => {

  const deleteAccountButton = document.getElementById("deleteAccountButton");
  if (!deleteAccountButton) return;

  const origin = "student";
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
      window.location.href = "login.html";
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
