// Run in <head>, before page scripts or private content can be displayed.
(function () {
  const script = document.currentScript;
  const requiredRole = script?.dataset.authRole || "";
  const loginPage = script?.dataset.loginPage || "login.html";
  let role = requiredRole;
  let token = "";
  try {
    role = role || sessionStorage.getItem("profconsult_tab_role") || "";
    token = sessionStorage.getItem(`profconsult_tab_token_${role}`) || "";
  } catch (_) {
    // Storage must be available to keep the login confined to this tab.
  }

  function lockPage() {
    if (document.getElementById("profconsult-auth-lock")) return;
    const style = document.createElement("style");
    style.id = "profconsult-auth-lock";
    style.textContent = "html{visibility:hidden!important}";
    document.head.appendChild(style);
  }
  lockPage();

  let sessionCheckPromise = null;
  let isLoggingOut = false;
  let redirecting = false;
  const nativeFetch = window.fetch.bind(window);

  function clearTabLogin() {
    token = "";
    try {
      sessionStorage.removeItem("profconsult_tab_token_student");
      sessionStorage.removeItem("profconsult_tab_token_faculty");
      sessionStorage.removeItem("profconsult_tab_role");
    } catch (_) {}
  }

  function redirectToLogin() {
    lockPage();
    clearTabLogin();
    if (!redirecting) {
      redirecting = true;
      window.location.replace(loginPage);
    }
  }

  // Attach the proof to same-origin API requests, never to third-party URLs.
  window.fetch = async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : input, document.baseURI);
    const isApi = url.origin === window.location.origin && /\/api\//.test(url.pathname);
    if (isApi) {
      const headers = new Headers(input instanceof Request ? input.headers : undefined);
      new Headers(init.headers).forEach((value, name) => headers.set(name, value));
      headers.set("X-ProfConsult-Tab-Token", token);
      init = { ...init, headers, cache: "no-store" };
    }
    const response = await nativeFetch(input, init);
    if (isApi && response.status === 401 && !isLoggingOut) redirectToLogin();
    return response;
  };

  async function checkSession() {
    if (sessionCheckPromise) return sessionCheckPromise;
    lockPage();
    if (!token || !["student", "faculty"].includes(role)) {
      redirectToLogin();
      return null;
    }
    sessionCheckPromise = (async () => {
      try {
        const response = await fetch(`api/get-current-session.php?role=${encodeURIComponent(role)}`, {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        const result = await response.json();
        if (!response.ok || !result.ok || result.user?.role !== role) {
          redirectToLogin();
          return null;
        }
        if (redirecting || isLoggingOut) return null;
        window.ProfConsultAuth.currentSession = result;
        document.getElementById("profconsult-auth-lock")?.remove();
        document.dispatchEvent(new CustomEvent("profconsult:session", { detail: result }));
        return result;
      } catch (_) {
        redirectToLogin();
        return null;
      } finally {
        sessionCheckPromise = null;
      }
    })();
    return sessionCheckPromise;
  }

  async function logout(redirectPage) {
    if (isLoggingOut) return;
    isLoggingOut = true;
    lockPage();
    try {
      await fetch("api/logout-user.php", { method: "POST", credentials: "same-origin" });
    } finally {
      clearTabLogin();
      window.ProfConsultTheme?.clearUser?.();
      document.dispatchEvent(new CustomEvent("profconsult:logout"));
      window.location.replace(redirectPage || loginPage);
    }
  }

  window.ProfConsultAuth = { checkSession, currentSession: null, logout, redirectToLogin };

  // <img> requests cannot set headers. Fetch private photos with the same proof
  // and display a blob URL; the login token never appears in image URLs.
  const photos = new WeakMap();
  const defaultPhoto = new URL("images/default-profile.jpg", document.baseURI).href;
  const profilePhotoSelector = ".profile-photo, .faculty-profile-photo, .student-profile-photo, .faculty-photo";
  function useDefaultPhoto(img) {
    if (img instanceof HTMLImageElement && img.matches(profilePhotoSelector) && img.src !== defaultPhoto) {
      img.src = defaultPhoto;
    }
  }
  document.addEventListener("error", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    // The authenticated fetch below handles private-photo failures. The direct
    // browser request cannot provide the login proof and may fail first.
    const url = new URL(img.src, document.baseURI);
    if (url.origin === location.origin && url.pathname.endsWith("/api/profile-photo.php")) return;
    useDefaultPhoto(img);
  }, true);
  function loadPrivatePhoto(img) {
    if (!(img instanceof HTMLImageElement) || !token) return;
    const source = img.getAttribute("src") || "";
    const url = new URL(source, document.baseURI);
    if (url.origin !== location.origin || !url.pathname.endsWith("/api/profile-photo.php")) return;
    const previous = photos.get(img);
    if (previous?.source === source) return;
    if (previous?.blob) URL.revokeObjectURL(previous.blob);
    const entry = { source };
    photos.set(img, entry);
    fetch(url.href, { credentials: "same-origin" })
      .then((response) => response.ok ? response.blob() : Promise.reject())
      .then((blob) => {
        if (photos.get(img) !== entry || img.getAttribute("src") !== source) return;
        entry.blob = URL.createObjectURL(blob);
        img.src = entry.blob;
      })
      .catch(() => {
        if (photos.get(img) === entry && img.getAttribute("src") === source) useDefaultPhoto(img);
      });
  }
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") loadPrivatePhoto(record.target);
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        loadPrivatePhoto(node);
        node.querySelectorAll("img").forEach(loadPrivatePhoto);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("img").forEach(loadPrivatePhoto));

  checkSession();
  window.addEventListener("pagehide", lockPage);
  window.addEventListener("pageshow", checkSession);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) lockPage();
    else checkSession();
  });
  try {
    window.history.pushState({ profConsultProtectedPage: true }, "", window.location.href);
  } catch (_) {}
  window.addEventListener("popstate", () => { logout(loginPage).catch(redirectToLogin); });
})();
