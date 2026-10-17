(function () {
  "use strict";
  let panel, message, title, timestamp, link, bell;

  function position() {
    if (!panel || panel.hidden) return;
    const header = bell?.closest("header");
    const edge = header?.querySelector(".faculty-navbar-right, .navbar-right") || bell;
    const viewport = window.visualViewport;
    const width = viewport?.width || document.documentElement.clientWidth;
    const height = viewport?.height || window.innerHeight;
    const left = viewport?.offsetLeft || 0;
    const upperEdge = viewport?.offsetTop || 0;
    const gap = 12;
    panel.style.maxWidth = `${Math.max(0, width - gap * 2)}px`;
    const preferredTop = (header || bell)?.getBoundingClientRect().bottom + 14 || 78;
    const top = Math.max(upperEdge + gap, Math.min(preferredTop, upperEdge + height - 100));
    const preferredLeft = (edge?.getBoundingClientRect().right || left + width - gap) - panel.offsetWidth;
    const x = width <= 480 ? left + (width - panel.offsetWidth) / 2
      : Math.max(left + gap, Math.min(preferredLeft, left + width - panel.offsetWidth - gap));
    panel.style.top = `${top}px`;
    panel.style.left = `${x}px`;
    panel.style.right = "auto";
    panel.style.maxHeight = `${Math.max(0, upperEdge + height - top - gap)}px`;
  }

  function close(returnFocus = false) {
    if (!panel) return;
    panel.classList.remove("is-open");
    panel.hidden = true;
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
    bell = document.getElementById(role === "faculty" ? "facultyNotificationBellButton" : "notificationBellButton");
    create();
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
    position();
    requestAnimationFrame(() => { if (!panel.hidden) panel.classList.add("is-open"); });
  }

  let session = null, timer = null, busy = false, generation = 0;

  function onNotificationsPage(role) {
    return location.pathname.endsWith(role === "faculty" ? "/faculty-notifications.html" : "/notifications.html");
  }

  function updateUnread(role, count) {
    if (role === "faculty") window.setFacultyNotificationCount?.(count);
    else if (window.ProfConsultNotifications) {
      window.ProfConsultNotifications[count > 0 ? "markUnread" : "markRead"]();
      window.ProfConsultNotifications.renderBellIndicator(document.getElementById("notificationBellButton"));
    }
  }

  async function refresh() {
    if (!session || busy || document.hidden) return;
    const version = generation;
    const { id, role } = session;
    busy = true;
    try {
      const response = await fetch(`api/manage-notifications.php?role=${role}`, {
        credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" },
      });
      const result = await response.json();
      if (version !== generation || !response.ok || !result.ok) return;
      const records = Array.isArray(result.notifications) ? result.notifications : [];
      updateUnread(role, Number(result.unread_count) || 0);
      const key = `profconsult_notification_seen_${role}_${id}`;
      let seen = 0;
      try { seen = Number(sessionStorage.getItem(key)) || 0; } catch (_) {}
      const incoming = records.filter((item) => item.Read_Status === "unread" && Number(item.Notification_ID) > seen)
        .sort((a, b) => Number(b.Notification_ID) - Number(a.Notification_ID))[0];
      const latestId = Math.max(seen, ...records.map((item) => Number(item.Notification_ID) || 0));
      try { sessionStorage.setItem(key, String(latestId)); } catch (_) {}
      if (incoming && !onNotificationsPage(role)) {
        show({ role, text: incoming.Message || "", epoch: incoming.Created_At_Epoch });
      }
    } catch (_) {
      // Keep the last confirmed unread state when the connection is unavailable.
    } finally {
      busy = false;
    }
  }

  function start(result) {
    const user = result?.user;
    if (!user || !["faculty", "student"].includes(user.role)) return;
    if (!session || session.id !== user.id || session.role !== user.role) {
      generation++;
      session = { id: user.id, role: user.role };
    }
    if (!timer) timer = window.setInterval(refresh, 10000);
    refresh();
  }

  window.ProfConsultNotificationPopup = { show, close, refresh };
  document.addEventListener("profconsult:session", (event) => start(event.detail));
  document.addEventListener("DOMContentLoaded", () => start(window.ProfConsultAuth?.currentSession));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  document.addEventListener("profconsult:notifications-read", async (event) => {
    const role = event.detail.role;
    const version = generation;
    try {
      // Mark only records that were actually rendered, so a concurrent arrival stays unread.
      for (const record of event.detail.records || []) {
        if (record.Read_Status !== "unread") continue;
        const response = await fetch("api/manage-notifications.php", {
          method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ role, notification_id: Number(record.Notification_ID) }),
        });
        const result = await response.json();
        if (version !== generation || !response.ok || !result.ok) return;
        updateUnread(role, Number(result.unread_count) || 0);
      }
      refresh();
    } catch (_) {}
  });
  document.addEventListener("click", (event) => {
    if (panel && !panel.hidden && !panel.contains(event.target) && !bell?.contains(event.target)) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel && !panel.hidden) { event.preventDefault(); close(true); }
  });
  window.addEventListener("resize", position);
  window.visualViewport?.addEventListener("resize", position);
  window.visualViewport?.addEventListener("scroll", position);
  window.addEventListener("scroll", position, { passive: true });
  window.addEventListener("pagehide", () => close());
  document.addEventListener("profconsult:logout", () => {
    generation++;
    session = null;
    clearInterval(timer);
    timer = null;
    close();
  });
})();
