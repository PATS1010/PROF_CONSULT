// SYSTEM NOTE: Controls client-side behavior for the request consultation page, including UI events and API calls.
// =========================================================
// REQUEST CONSULTATION PAGE INTERACTIONS
// - Burger menu + Quick Action + Notification bell: same
//   behavior as the Dashboard / Faculty Directory
// - Faculty Member auto-fills from the professor the student
//   selected in the Faculty Directory (handed off via
//   sessionStorage from faculty-directory.js) -- never
//   hardcoded to a specific professor
// - Student Name/ID/Program & Year auto-fill from the current
//   logged-in student session
// - Preferred Time: custom dropdown populated with every
//   30-minute slot across a full 24-hour day
// - Submit Request -> request-submitted.html
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------
  // Selected faculty -- set by faculty-directory.js
  // (sessionStorage) when the student clicks "Request
  // Consultation" on a professor's profile. There is no
  // backend yet, so sessionStorage is the frontend-only
  // hand-off mechanism; this page never hardcodes a specific
  // professor. Falls back to a neutral placeholder only if
  // the student somehow lands here without selecting anyone
  // (e.g. navigating here directly).
  // ---------------------------------------------------------
  const SELECTED_FACULTY_STORAGE_KEY = "profconsult_selected_faculty";

  const params = new URLSearchParams(window.location.search);
  const facultyIdFromParams = params.get("facultyId");

  function getSelectedFaculty() {
    try {
      const stored = sessionStorage.getItem(SELECTED_FACULTY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  const selectedFaculty = getSelectedFaculty();
  const facultyId = (selectedFaculty && selectedFaculty.id) || facultyIdFromParams || "";
  const SELECTED_FACULTY_MEMBER = (selectedFaculty && selectedFaculty.fullName)
    ? selectedFaculty.fullName
    : (params.get("faculty") || "Selected Faculty Member");

  const COURSE_LABELS = {
    "computer-engineering": "BSCPE (Computer Engineering)",
  };

  const YEAR_LABELS = {
    "1": "1st Year",
    "2": "2nd Year",
    "3": "3rd Year",
    "4": "4th Year",
    "5": "5th Year",
  };

  const facultyMemberInput = document.getElementById("facultyMember");
  const studentNameInput = document.getElementById("studentName");
  const studentIdInput = document.getElementById("studentId");
  const programYearInput = document.getElementById("programYear");

  if (facultyMemberInput) facultyMemberInput.textContent = SELECTED_FACULTY_MEMBER;

  function displayCourse(value) {
    return COURSE_LABELS[value] || value || "";
  }

  function displayYear(value) {
    const normalized = String(value || "");
    return YEAR_LABELS[normalized] || normalized;
  }

  async function loadCurrentStudent() {
    try {
      const response = await fetch("api/session.php?role=student", {
        cache: "no-store",
        headers: { "Accept": "application/json" },
      });
      const data = await response.json();

      if (!response.ok || !data.ok || !data.user || data.user.role !== "student") {
        throw new Error("Student session unavailable");
      }

      const user = data.user || {};
      const profile = data.profile || {};
      const program = displayCourse(profile.Program || profile.program || "");
      const year = displayYear(profile.Year_Level || profile.year_level || "");

      if (studentNameInput) studentNameInput.textContent = user.name || "";
      if (studentIdInput) studentIdInput.textContent = user.username || "";
      if (programYearInput) {
        programYearInput.textContent = [program, year].filter(Boolean).join(" - ");
      }
    } catch (error) {
      window.location.href = "student-login.html";
    }
  }

  loadCurrentStudent();

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
  // Preferred Time: build every 30-minute slot covering a full
  // 24-hour day (12:00 AM - 12:30 AM, 12:30 AM - 1:00 AM, ...
  // through 11:30 PM - 12:00 AM), then populate the dropdown.
  // ---------------------------------------------------------
  function formatHourMinute(totalMinutes) {
    const hour24 = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;
    const period = hour24 < 12 ? "AM" : "PM";
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    const minuteStr = minute.toString().padStart(2, "0");
    return `${hour12}:${minuteStr} ${period}`;
  }

  function buildTimeSlots() {
    const slots = [];
    for (let start = 0; start < 24 * 60; start += 30) {
      const end = start + 30;
      const label = `${formatHourMinute(start)} \u2013 ${formatHourMinute(end)}`;
      slots.push(label);
    }
    return slots;
  }

  const preferredTimeOptions = document.getElementById("preferredTimeOptions");
  if (preferredTimeOptions) {
    buildTimeSlots().forEach((label) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.setAttribute("data-value", label);
      li.textContent = label;
      preferredTimeOptions.appendChild(li);
    });
  }

  // ---------------------------------------------------------
  // Custom dropdown behavior (Preferred Time) -- same pattern
  // used elsewhere in the project so it can never be sized or
  // positioned by the browser/OS in a way that overflows on mobile.
  // ---------------------------------------------------------
  const timeSelect = document.getElementById("preferredTimeSelect");

  if (timeSelect) {
    const trigger = timeSelect.querySelector(".custom-select-trigger");
    const valueLabel = timeSelect.querySelector(".custom-select-value");
    const optionsList = timeSelect.querySelector(".custom-select-options");
    const hiddenInput = timeSelect.querySelector('input[type="hidden"]');

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = timeSelect.classList.contains("is-open");

      if (isOpen) {
        timeSelect.classList.remove("is-open");
        optionsList.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      } else {
        timeSelect.classList.add("is-open");
        optionsList.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    optionsList.addEventListener("click", (event) => {
      const option = event.target.closest("li[role='option']");
      if (!option) return;

      optionsList.querySelectorAll("li").forEach((li) => li.classList.remove("is-active"));
      option.classList.add("is-active");

      valueLabel.textContent = option.textContent;
      valueLabel.removeAttribute("data-is-placeholder");
      hiddenInput.value = option.getAttribute("data-value");

      timeSelect.classList.remove("is-open");
      optionsList.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", () => {
      timeSelect.classList.remove("is-open");
      optionsList.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    });
  }

  // ---------------------------------------------------------
  // Submit Request -> request-submitted.html
  // No backend yet, so this just collects and forwards the
  // entered data structure; wire up the real API call here later.
  // ---------------------------------------------------------
  const form = document.getElementById("requestConsultationForm");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!facultyId) {
        alert("Please select a faculty member from the directory.");
        return;
      }

      const purpose = document.getElementById("consultationPurpose").value.trim();
      const message = document.getElementById("additionalMessage").value.trim();
      const preferredDate = document.getElementById("preferredDate").value;
      const preferredTime = document.getElementById("preferredTime").value;

      if (!purpose || !preferredDate || !preferredTime) {
        alert("Please complete the purpose, preferred date, and preferred time.");
        return;
      }

      const requestData = {
        facultyMember: facultyMemberInput.textContent,
        studentName: studentNameInput.textContent,
        studentId: studentIdInput.textContent,
        programYear: programYearInput.textContent,
        purpose,
        message,
        preferredDate,
        preferredTime,
        status: "Pending Approval",
      };

      if (/^\d+$/.test(String(facultyId))) {
        try {
          const response = await fetch("api/submit-consultation.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              faculty_id: facultyId,
              purpose: requestData.purpose,
              message: requestData.message,
              preferred_date: requestData.preferredDate,
              preferred_time: requestData.preferredTime,
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || "Unable to submit request.");
          requestData.requestId = `REQ-${result.id}`;
        } catch (error) {
          alert(error.message);
          return;
        }
      } else {
        requestData.requestId = `REQ-${Date.now()}`;
      }

      sessionStorage.setItem("profconsult_last_request", JSON.stringify(requestData));

      // Also keep the display list in sync for the static My Requests page.
      // so it automatically shows up on my-requests.html, growing
      // that list every time a request is submitted.
      try {
        const MY_REQUESTS_KEY = "profconsult_my_requests";
        const existing = JSON.parse(localStorage.getItem(MY_REQUESTS_KEY) || "[]");

        const dateLabel = requestData.preferredDate
          ? new Date(`${requestData.preferredDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })
          : "";
        const timeLabel = requestData.preferredTime ? requestData.preferredTime.split("\u2013")[0].trim() : "";

        existing.unshift({
          title: requestData.purpose || "Consultation",
          date: dateLabel,
          time: timeLabel,
          status: "waiting",
          statusLabel: "Waiting",
        });

        localStorage.setItem(MY_REQUESTS_KEY, JSON.stringify(existing));
      } catch (error) {
        // Storage unavailable -- the request still submits, it just
        // won't show up on My Requests until storage works again
      }

      window.location.href = "request-submitted.html";
    });
  }

});
