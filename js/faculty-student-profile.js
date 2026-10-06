// Faculty Student Profile JS
const FACULTY_STUDENT_PROFILES = {
  "22-00145": {
    fullName: "Juan Dela Cruz",
    photo: "images/student-profile-photo.jpg",
    studentNumber: "22-00145",
    course: "BSCPE (Computer Engineering)",
    yearLevel: "3rd Year",
    section: "B",
    email: "juan.delacruz@example.com",
    phone: "+63 912-345-6789",
  },
  "22-00098": {
    fullName: "Joselita Rizal",
    photo: "images/student-profile-photo.jpg",
    studentNumber: "22-00098",
    course: "BSCPE (Computer Engineering)",
    yearLevel: "3rd Year",
    section: "B",
    email: "joselita.rizal@example.com",
    phone: "+63 923-456-7890",
  },
  "21-00567": {
    fullName: "Mark Santos",
    photo: "images/student-profile-photo.jpg",
    studentNumber: "21-00567",
    course: "BSCPE (Computer Engineering)",
    yearLevel: "4th Year",
    section: "A",
    email: "mark.santos@example.com",
    phone: "+63 934-567-8901",
  },
  "23-00212": {
    fullName: "Angela Cruz",
    photo: "images/student-profile-photo.jpg",
    studentNumber: "23-00212",
    course: "BSCPE (Computer Engineering)",
    yearLevel: "2nd Year",
    section: "A",
    email: "angela.cruz@example.com",
    phone: "+63 945-678-9012",
  },
};

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

  const profile = studentId ? FACULTY_STUDENT_PROFILES[studentId] : null;

  if (!profile) {
    if (nameEl) nameEl.textContent = "Student Not Found";
    if (photoEl) photoEl.hidden = true;
    if (infoCardEl) infoCardEl.hidden = true;
    if (notFoundEl) notFoundEl.hidden = false;
    return;
  }

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

});