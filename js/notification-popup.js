(function () {
  "use strict";
  let panel, message, title, timestamp, link, bell;
  let activeRole = "";
  let requestVersion = 0;

  function position() {
    if (!panel || panel.hidden) return;
    const header = bell?.closest("header");
    const edge = header?.querySelector(".faculty-navbar-right, .navbar-right") || bell;
    const top = Math.max(12, (header || bell)?.getBoundingClientRect().bottom + 14 || 78);
    const right = Math.max(12, window.innerWidth - (edge?.getBoundingClientRect().right || window.innerWidth - 20));
    panel.style.top = `${Math.min(top, window.innerHeight - 100)}px`;
    panel.style.right = `${Math.min(right, Math.max(12, window.innerWidth - panel.offsetWidth - 12))}px`;
    panel.style.maxHeight = `${Math.max(80, window.innerHeight - parseFloat(panel.style.top) - 12)}px`;
  }

  function close(returnFocus = false) {
    requestVersion++;
    if (!panel) return;
    panel.classList.remove("is-open");
    panel.hidden = true;
    bell?.setAttribute("aria-expanded", "false");
    if (returnFocus) bell?.focus();
  }

  function create() {
    if (panel) return;
    panel = document.createElement("section");
    panel.id = "notificationPopup";
    panel.className = "notification-popup";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", "notificationPopupTitle");
    const heading = document.createElement("div");
    heading.className = "notification-popup-header";
    title = document.createElement("h2");
    title.id = "notificationPopupTitle";
    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "notification-popup-close";
    dismiss.textContent = "\u00d7";
    dismiss.setAttribute("aria-label", "Close notifications");
    dismiss.addEventListener("click", () => close(true));
    heading.append(title, dismiss);
    const body = document.createElement("div");
    body.className = "notification-popup-body";
    body.setAttribute("aria-live", "polite");
    message = document.createElement("p");
    message.className = "notification-popup-message";
    timestamp = document.createElement("time");
    timestamp.className = "notification-popup-time";
    link = document.createElement("a");
    link.className = "notification-popup-view-more";
    link.textContent = "View More";
    body.append(message, timestamp, link);
    panel.append(heading, body);
    document.body.append(panel);
  }

  function show({ role, text = "", heading = "New Notification", epoch = null }) {
    if (!document.body || !["faculty", "student"].includes(role)) return;
    activeRole = role;
    bell = document.getElementById(role === "faculty" ? "facultyNotificationBellButton" : "notificationBellButton");
    create();
    requestVersion++;
    title.textContent = heading;
    message.textContent = text;
    link.href = role === "faculty" ? "faculty-notifications.html" : "notifications.html";
    timestamp.hidden = true;
    timestamp.textContent = "";
    timestamp.removeAttribute("datetime");
    if (epoch !== null && epoch !== undefined && epoch !== "") {
      const date = new Date(Number(epoch) * 1000);
      if (Number.isFinite(date.getTime())) {
        timestamp.dateTime = date.toISOString();
        timestamp.textContent = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit", hour12: true,
        }).format(date) + " (PHT)";
        timestamp.hidden = false;
      }
    }
    const quick = document.getElementById(role === "faculty" ? "facultyQuickActionButton" : "quickActionButton");
    if (quick?.getAttribute("aria-expanded") === "true") quick.click();
    panel.hidden = false;
    bell?.setAttribute("aria-expanded", "true");
    position();
    requestAnimationFrame(() => { if (!panel.hidden) panel.classList.add("is-open"); });
  }

  async function toggle(role) {
    if (panel && !panel.hidden && activeRole === role) { close(); return; }
    show({ role, heading: "Notifications", text: "Loading notifications..." });
    const version = requestVersion;
    try {
      const response = await fetch(`api/notifications.php?role=${role}`, {
        credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" },
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("Unable to load notifications");
      if (version !== requestVersion) return;
      const latest = Array.isArray(result.notifications) ? result.notifications[0] : null;
      show({ role, text: latest?.Message || "No notifications yet.",
        heading: latest ? "New Notification" : "Notifications", epoch: latest?.Created_At_Epoch });
    } catch (_) {
      if (version === requestVersion) show({ role, heading: "Notifications", text: "Unable to load notifications. Please try again." });
    }
  }

  window.ProfConsultNotificationPopup = { show, toggle, close };
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("facultyNotificationBellButton") || document.getElementById("notificationBellButton");
    if (!button) return;
    button.setAttribute("aria-controls", "notificationPopup");
    button.setAttribute("aria-expanded", "false");
    // Override the older page-specific navigation handlers consistently.
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      toggle(button.id === "facultyNotificationBellButton" ? "faculty" : "student");
    }, true);
  });
  document.addEventListener("click", (event) => {
    if (panel && !panel.hidden && !panel.contains(event.target) && !bell?.contains(event.target)) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel && !panel.hidden) { event.preventDefault(); close(true); }
  });
  window.addEventListener("resize", position);
  window.addEventListener("scroll", position, { passive: true });
  window.addEventListener("pagehide", () => close());
  document.addEventListener("profconsult:logout", () => close());
})();
