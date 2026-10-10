// Shared session guard for pages that require a logged-in user.
(function () {
  const script = document.currentScript;
  const role = script ? String(script.dataset.authRole || "").trim() : "";
  const loginPage = script ? String(script.dataset.loginPage || "login.html").trim() : "login.html";
  const sessionUrl = role ? `api/session.php?role=${encodeURIComponent(role)}` : "api/session.php";

  function redirectToLogin() {
    window.location.replace(loginPage || "login.html");
  }

  async function checkSession() {
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
      window.location.href = redirectPage || loginPage || "login.html";
    }
  }

  window.ProfConsultAuth = Object.assign(window.ProfConsultAuth || {}, {
    checkSession,
    currentSession: null,
    logout,
    redirectToLogin,
  });

  checkSession();
})();
