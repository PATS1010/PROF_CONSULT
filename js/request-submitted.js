// SYSTEM NOTE: Controls client-side behavior for the request submitted page, including UI events and API calls.
// =========================================================
// REQUEST SUBMITTED PAGE INTERACTIONS
// - Burger menu + Quick Action + Notification bell: same
//   behavior as the Dashboard / Faculty Directory
// - Reads the request data saved by request-consultation.js
//   (sessionStorage is a frontend-only stand-in; once a backend
//   exists, this should instead fetch the just-created request
//   by its ID, e.g. from the URL, rather than sessionStorage).
//   That request data already carries whichever professor the
//   student selected in the Faculty Directory, so this page
//   never hardcodes a specific faculty name.
// - Back to Dashboard -> student-dashboard.html
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Populate the summary from the last submitted request
  // ---------------------------------------------------------
  const storedRequest = sessionStorage.getItem("profconsult_last_request");
  const requestData = storedRequest ? JSON.parse(storedRequest) : null;

  function formatDate(isoDateString) {
    if (!isoDateString) return "";
    const date = new Date(`${isoDateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return isoDateString;
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function extractStartTime(timeRangeLabel) {
    if (!timeRangeLabel) return "";
    // "2:00 PM \u2013 2:30 PM" -> "2:00 PM"
    return timeRangeLabel.split("\u2013")[0].trim();
  }

  const requestIdEl = document.getElementById("summaryRequestId");
  const facultyEl = document.getElementById("summaryFaculty");
  const facultyInlineEl = document.getElementById("summaryFacultyInline");
  const purposeEl = document.getElementById("summaryPurpose");
  const scheduleEl = document.getElementById("summarySchedule");
  const statusEl = document.getElementById("summaryStatus");

  if (requestData) {
    if (requestIdEl) requestIdEl.textContent = `#${requestData.requestId}`;
    if (facultyEl) facultyEl.textContent = requestData.facultyMember;
    if (facultyInlineEl) facultyInlineEl.textContent = requestData.facultyMember;
    if (purposeEl) purposeEl.textContent = requestData.purpose || "\u2014";

    if (scheduleEl) {
      const datePart = formatDate(requestData.preferredDate);
      const timePart = extractStartTime(requestData.preferredTime);
      scheduleEl.textContent = [datePart, timePart].filter(Boolean).join(" \u2022 ") || "\u2014";
    }

    if (statusEl) statusEl.textContent = requestData.status || "Pending Approval";
  }

  // ---------------------------------------------------------
  // Burger sidebar (same behavior as the Student Dashboard)
  // ---------------------------------------------------------
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

  if (hamburgerButton) hamburgerButton.addEventListener("click", openSidebar);
  if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener("click", closeSidebar);

  // ---------------------------------------------------------
  // Quick Action popup (same behavior as the Student Dashboard)
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
  // Notification bell -- navigates to notifications.html
  // ---------------------------------------------------------
  const notificationBellButton = document.getElementById("notificationBellButton");
  if (notificationBellButton) {
    notificationBellButton.addEventListener("click", () => {
      window.location.href = "notifications.html";
    });
  }

  // ---------------------------------------------------------
  // Back to Dashboard -> student-dashboard.html
  // (plain <a href>, so this just lets the default navigation
  // happen -- no JS interception needed)
  // ---------------------------------------------------------

});