// Faculty Student Profile JS
const ORIGIN_PAGES = {
  "dashboard": "faculty-dashboard.html",
  "consultation-requests": "faculty-consultation-requests.html",
  "notifications": "faculty-notifications.html",
};

const DEFAULT_ORIGIN_PAGE = "faculty-dashboard.html";

document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("studentId");
  const from = params.get("from");

  const backButton = document.getElementById("studentProfileBackButton");
  const backDestination = ORIGIN_PAGES[from] || DEFAULT_ORIGIN_PAGE;

  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.href = backDestination;
    });
  }

  const photoEl = document.getElementById("studentProfilePhoto");
  const nameEl = document.getElementById("studentProfileName");
  const infoCardEl = document.getElementById("studentProfileInfoCard");
  const notFoundEl = document.getElementById("studentProfileNotFound");

  const numberEl = document.getElementById("studentProfileNumber");
  const courseEl = document.getElementById("studentProfileCourse");
  const yearLevelEl = document.getElementById("studentProfileYearLevel");
  const sectionEl = document.getElementById("studentProfileSection");
  const emailEl = document.getElementById("studentProfileEmail");
  const phoneEl = document.getElementById("studentProfilePhone");

  function showNotFound() {
    if (nameEl) nameEl.textContent = "Student Not Found";
    if (photoEl) photoEl.hidden = true;
    if (infoCardEl) infoCardEl.hidden = true;
    if (notFoundEl) notFoundEl.hidden = false;
  }

  function renderProfile(profile) {
    if (photoEl) {
      photoEl.src = profile.photo;
      photoEl.alt = profile.fullName;
    }

    if (nameEl) nameEl.textContent = profile.fullName;
    if (numberEl) numberEl.textContent = profile.studentNumber;
    if (courseEl) courseEl.textContent = profile.course;
    if (yearLevelEl) yearLevelEl.textContent = profile.yearLevel;
    if (sectionEl) sectionEl.textContent = profile.section;
    if (emailEl) emailEl.textContent = profile.email;
    if (phoneEl) phoneEl.textContent = profile.phone;

    document.title = `Prof Consult | ${profile.fullName}`;
  }

  if (!studentId) {
    showNotFound();
    return;
  }

  fetch("api/consultation-requests.php?role=faculty", {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((result) => {
      const requests = result && Array.isArray(result.requests) ? result.requests : [];
      const record = requests.find((request) =>
        String(request.Student_Number || request.Student_ID || "") === studentId
      );

      if (!record) {
        showNotFound();
        return;
      }

      renderProfile({
        fullName: record.Student_Name || "Student",
        photo: "images/user.png",
        studentNumber: record.Student_Number || studentId,
        course: record.Program || "",
        yearLevel: record.Year_Level || "",
        section: record.Section || "",
        email: "Available from student account profile",
        phone: "Available from student account profile",
      });
    })
    .catch(showNotFound);

});
