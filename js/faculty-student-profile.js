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

  if (!studentId) {
    showNotFound();
    return;
  }

  fetch(`api/student-public-profile.php?student_number=${encodeURIComponent(studentId)}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
  })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((result) => {
      const profile = result.profile || {};
      const fullName = profile.Full_Name || "";

      if (photoEl) {
        photoEl.src = profile.Profile_Photo || "images/student-profile-photo.jpg";
        photoEl.alt = fullName;
      }

      if (nameEl) nameEl.textContent = fullName;
      if (numberEl) numberEl.textContent = profile.Student_Number || "";
      if (courseEl) courseEl.textContent = profile.Program || "";
      if (yearLevelEl) yearLevelEl.textContent = profile.Year_Level || "";
      if (sectionEl) sectionEl.textContent = profile.Section || "";
      if (emailEl) emailEl.textContent = profile.Email || "";
      if (phoneEl) phoneEl.textContent = profile.Mobile_Number ? `+63 ${profile.Mobile_Number}` : "";

      document.title = `Prof Consult | ${fullName}`;
    })
    .catch(showNotFound);

});
