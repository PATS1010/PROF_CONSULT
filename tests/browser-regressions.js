// Loaded into the real pages by the local test router, before application scripts.
const recorded = [];
const alerts = [];
let failStatusSave = false;
let fixtureFacultyStatus = 'offline';
window.alert = (message) => alerts.push(message);
localStorage.clear();
sessionStorage.clear();
const fixtureRole = TEST_CASE === 'student' || TEST_CASE === 'wrong-role' ? 'student' : 'faculty';
if (TEST_CASE !== 'fresh-tab') {
  sessionStorage.setItem('profconsult_tab_role', fixtureRole);
  sessionStorage.setItem(`profconsult_tab_token_${fixtureRole}`, 'a'.repeat(64));
}
const user = { id: 1, role: TEST_CASE === 'student' ? 'student' : 'faculty', name: 'Juan A. Santos Jr.', username: '24-00001', email: 'juan@example.test', phone: '9123456789', profile_photo: 'api/profile-photo.php?user_id=1' };
const profile = { Department: 'Computer Engineering', Office: 'Room 12', Consultation_Hours: '[{"day":"Monday","times":["9:00 AM - 9:30 AM"]}]', Program: 'Computer Engineering', Year_Level: '1', Section: 'A' };
window.fetch = async (url, options = {}) => {
  recorded.push({ url: String(url), options });
  let result = { ok: true };
  let status = 200;
  if (String(url).includes('session.php')) result = { ok: true, user: TEST_CASE === 'wrong-role' ? { ...user, role: 'student' } : user, profile };
  else if (String(url).includes('faculty-profile.php')) result = { ok: true, user: { ...user, name: JSON.parse(options.body).full_name }, profile };
  else if (String(url).includes('faculty-hours.php')) result.consultation_hours = profile.Consultation_Hours;
  else if (String(url).includes('presence.php')) result = { ok: true, status: fixtureFacultyStatus, checked_in: fixtureFacultyStatus !== 'offline' };
  else if (String(url).includes('availability.php')) {
    if (options.method === 'POST') {
      if (failStatusSave) { result = { ok: false, message: 'Status save rejected' }; status = 422; }
      else {
        fixtureFacultyStatus = JSON.parse(options.body).status;
        result.status = fixtureFacultyStatus;
        result.checked_in = fixtureFacultyStatus !== 'offline';
      }
    } else result.availability = [{ Status: 'offline' }];
  } else if (String(url).includes('consultation-requests.php') && options.method !== 'POST') {
    result.requests = [{ Request_ID: 21, Student_Name: 'Fresh Server Student', Purpose: 'Server request', Request_Date: '2030-01-07', Preferred_Time: '09:00:00', Year_Level: '1', Section: 'A' }];
  } else if (String(url).includes('faculty-schedule.php')) {
    result.slots = [{ value: '9:00 AM - 9:30 AM', available: true, taken: false }];
  }
  return { ok: status === 200, status, json: async () => result, blob: async () => new Blob(['fixture'], { type: 'image/png' }) };
};

const delay = () => new Promise((resolve) => setTimeout(resolve, 50));
function check(condition, message) {
  if (!condition) throw new Error(message);
  recorded.push({ assertion: message });
}
let failure = null;
window.addEventListener('error', (event) => { failure = event.message; });
window.addEventListener('unhandledrejection', (event) => { failure = String(event.reason); });
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await delay();
    if (TEST_CASE === 'faculty') {
      const button = document.getElementById('facultyProfilePhotoEdit');
      check(button.tagName === 'BUTTON' && !button.hidden, 'Faculty photo button is visible and keyboard accessible');
      check(recorded.some((r) => r.url?.includes('profile-photo.php?user_id=1&v=')), 'Faculty photo URL retains its account query parameter');
      document.getElementById('editProfileButton').click();
      check(document.getElementById('editFirstName').value === 'Juan', 'First name remains in the first name field');
      check(document.getElementById('editLastName').value === 'Santos', 'Last name is separate from the suffix');
      check(document.getElementById('editFacultySuffix').value === 'Jr.', 'Suffix reloads into the suffix field');
      document.getElementById('editProfileButton').click();
      await delay();
      const saved = recorded.find((r) => r.url?.includes('faculty-profile.php'));
      const body = JSON.parse(saved.options.body);
      check(!('consultation_hours' in body) && !('office' in body), 'Profile save does not clear consultation hours or office');
      check(body.full_name === 'Juan A. Santos Jr.', 'Suffix survives the profile save round trip');
    } else if (TEST_CASE === 'student') {
      check(recorded.some((r) => r.url?.includes('profile-photo.php?user_id=1&v=')), 'Student photo URL retains its account query parameter');
    } else if (TEST_CASE === 'availability') {
      check(window.getFacultyOnlineStatus() === 'offline', 'Availability loads the server status');
      const next = document.querySelector('.faculty-status-option[data-status="meeting"]');
      next.click();
      failStatusSave = true;
      document.getElementById('saveStatusButton').click();
      await delay();
      check(window.getFacultyOnlineStatus() === 'offline', 'Rejected availability is not applied');
      check(document.getElementById('availabilityStatusLabel').textContent === 'Offline', 'Failed save restores the displayed status');
      check(alerts.includes('Status save rejected'), 'Failed availability save displays the server error');
      failStatusSave = false;
      next.click();
      document.getElementById('saveStatusButton').click();
      await delay();
      check(window.getFacultyOnlineStatus() === 'meeting', 'Confirmed availability save updates the interface');
    } else if (TEST_CASE === 'reschedule') {
      check(document.getElementById('rescheduleStudentName').textContent === 'Fresh Server Student', 'Reschedule loads the request from the server without local storage');
      const schedule = recorded.find((r) => r.url?.includes('faculty-schedule.php'));
      check(schedule.url.includes('request_id=21'), 'Schedule lookup excludes the request being edited');
      const option = [...document.querySelectorAll('#reschedulePreferredTimeOptions li')].find((li) => li.dataset.value === '9:00 AM \u2013 9:30 AM');
      check(option && !option.classList.contains('is-unavailable'), 'Available schedule slot can be selected');
      option.click();
      document.getElementById('rescheduleConsultationForm').dispatchEvent(new Event('submit', { cancelable: true }));
      await delay();
      const posted = recorded.find((r) => r.url?.includes('consultation-requests.php') && r.options.method === 'POST');
      check(JSON.parse(posted.options.body).request_id === 21, 'Reschedule submits the correct server request');
      check(document.getElementById('submitRescheduleButton').disabled, 'Reschedule prevents duplicate submissions');
    }
    check(!document.getElementById('profconsult-auth-lock'), 'Protected page is revealed only after successful session verification');
    const sessionRequest = recorded.find((r) => r.url?.includes('session.php'));
    check(new Headers(sessionRequest.options.headers).get('X-ProfConsult-Tab-Token') === 'a'.repeat(64), 'Protected API requests carry the login proof for this tab');
    if (failure) throw new Error(failure);
    const result = document.createElement('pre');
    result.id = 'regression-result';
    result.textContent = 'PASS ' + TEST_CASE + '\n' + recorded.filter((r) => r.assertion).map((r) => r.assertion).join('\n');
    document.body.appendChild(result);
  } catch (error) {
    const result = document.createElement('pre');
    result.id = 'regression-result';
    result.textContent = 'FAIL ' + TEST_CASE + ': ' + error.message;
    document.body.appendChild(result);
  }
});
