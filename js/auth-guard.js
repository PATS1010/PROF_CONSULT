// Shared session guard for pages that require a logged-in user.
(function () {
  const script = document.currentScript;
  const role = script ? String(script.dataset.authRole || "").trim() : "";
  const loginPage = script ? String(script.dataset.loginPage || "login.html").trim() : "login.html";
  const sessionUrl = role ? `api/session.php?role=${encodeURIComponent(role)}` : "api/session.php";
  let sessionCheckPromise = null;

  function redirectToLogin() {
    window.location.replace(loginPage || "login.html");
  }

  async function checkSession() {
    if (sessionCheckPromise) return sessionCheckPromise;

    sessionCheckPromise = runSessionCheck().finally(() => {
      sessionCheckPromise = null;
    });

    return sessionCheckPromise;
  }

  async function runSessionCheck() {
    try {
      const response = await fetch(sessionUrl, {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        redirectToLogin();
        return null;
      }

      const result = await response.json();
      window.ProfConsultAuth.currentSession = result;
      document.dispatchEvent(
        new CustomEvent("profconsult:session", { detail: result })
      );
      return result;
    } catch (error) {
      redirectToLogin();
      return null;
    }
  }

  async function logout(redirectPage) {
    try {
      await fetch("api/logout.php", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
    } catch (error) {
    } finally {
      window.location.replace(redirectPage || loginPage || "login.html");
    }
  }

  window.ProfConsultAuth = Object.assign(window.ProfConsultAuth || {}, {
    checkSession,
    currentSession: null,
    logout,
    redirectToLogin,
  });

  checkSession();

  window.addEventListener("pageshow", (event) => {
    const navigationEntries = performance.getEntriesByType
      ? performance.getEntriesByType("navigation")
      : [];
    const restoredFromHistory =
      event.persisted ||
      (
        navigationEntries.length > 0 &&
        navigationEntries[0].type === "back_forward"
      );

    if (restoredFromHistory) {
      checkSession();
    }
  });
})();
