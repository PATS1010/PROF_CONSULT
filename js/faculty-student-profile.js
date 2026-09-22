// =========================================================
// FACULTY STUDENT PROFILE -- PAGE-SPECIFIC INTERACTIONS
//
// Read-only view of a single student's profile, opened when a
// faculty member clicks a student's name on the Dashboard,
// Consultation Requests, or Notifications page (see
// student-name-link / notification-student-link in those
// files). No Edit/Save controls -- faculty can only view.
//
// WHICH STUDENT + WHERE TO GO BACK
// Both come from the URL query string:
//   ?studentId=<id>&from=<dashboard|consultation-requests|notifications>
// - studentId picks the profile from FACULTY_STUDENT_PROFILES
//   below.
// - from picks the page the Back button returns to (see
//   ORIGIN_PAGES). Any missing/unrecognized "from" falls back
//   to the Dashboard, so Back never dead-ends.
//
// TEST DATA -- no backend yet.
// FACULTY_STUDENT_PROFILES holds the SAME four test students
// already used as the studentId values on
// faculty-consultation-requests.js / faculty-dashboard.js /
// faculty-notifications.js (Juan Dela Cruz, Joselita Rizal,
// Mark Santos, Angela Cruz) -- the exact IDs and names already
// in DEFAULT_CONSULTATIONS on those pages. This is intentionally
// a separate small data source (this page doesn't read/write the
// consultations localStorage) so it can later be swapped for a
// real "fetch this student's profile by ID" call without any
// other page needing to change -- every student-name link on
// every page already just passes a studentId here.
//
// All four test students currently share the same placeholder
// photo (images/student-profile-photo.jpg), because that is the
// only student profile photo asset in the project right now --
// add a `photo` path per student below once real/distinct photos
// exist; nothing else needs to change.
// =========================================================

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

// ---------------------------------------------------------
// Back button destinations -- must match the "from" values the
// student-name links on each page pass (dashboard,
// consultation-requests, notifications). Anything else, or a
// missing "from", falls back to the Dashboard.
// ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Back button -- origin-aware. Reads "from" once on load, so
  // the button always knows which page to return to regardless
  // of how it was reached.
  // ---------------------------------------------------------
  const backButton = document.getElementById("studentProfileBackButton");
  const backDestination = ORIGIN_PAGES[from] || DEFAULT_ORIGIN_PAGE;

  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.href = backDestination;
    });
  }

  // ---------------------------------------------------------
  // Render the selected student's profile
  // ---------------------------------------------------------
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
    // No/unknown studentId -- show the not-found message instead
    // of a blank or misleading profile.
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