// Loaded into the real pages by the local test router, before application scripts.
const recorded = [];
const alerts = [];
const STATUS_CASES = [
  ['available', 'online', 'Online'],
  ['meeting', 'meeting', 'Meeting'],
  ['consultation', 'consultation', 'Consultation'],
  ['on leave', 'onleave', 'On Leave'],
  ['offline', 'offline', 'Offline'],
];
let failStatusSave = false;
let fixtureFacultyStatus = 'offline';
let failPhotoFetch = false;
let directoryFacultyStatus = 'online';
const intervalTasks = [];
const nativeSetInterval = window.setInterval.bind(window);
window.setInterval = (callback, milliseconds, ...args) => {
  intervalTasks.push({ callback, milliseconds });
  return nativeSetInterval(callback, milliseconds, ...args);
};
window.alert = (message) => alerts.push(message);
localStorage.clear();
sessionStorage.clear();
const fixtureRole = ['student', 'student-dashboard', 'request', 'wrong-role', 'directory'].includes(TEST_CASE) ? 'student' : 'faculty';
if (TEST_CASE !== 'fresh-tab') {
  sessionStorage.setItem('profconsult_tab_role', fixtureRole);
  sessionStorage.setItem(`profconsult_tab_token_${fixtureRole}`, 'a'.repeat(64));
}
const user = { id: 1, role: fixtureRole, name: 'Juan A. Santos Jr.', username: '24-00001', email: 'juan@example.test', phone: '9123456789', profile_photo: 'api/profile-photo.php?user_id=1' };
const profile = { Department: 'Computer Engineering', Office: 'Room 12', Consultation_Hours: '[{"day":"Monday","times":["9:00 AM - 9:30 AM"]}]', Program: 'Computer Engineering', Year_Level: '1', Section: 'A' };
window.fetch = async (url, options = {}) => {
  recorded.push({ url: String(url), options });
  let result = { ok: true };
  let status = 200;
  if (String(url).includes('profile-photo.php') && failPhotoFetch) status = 404;
  if (String(url).includes('get-current-session.php')) result = { ok: true, user: TEST_CASE === 'wrong-role' ? { ...user, role: 'student' } : user, profile };
  else if (String(url).includes('get-faculty-directory.php')) result.faculty = [
    { Faculty_ID: 1, Full_Name: 'Sean Test III', Department: 'Computer Engineering', Current_Status: directoryFacultyStatus, Consultation_Hours: JSON.stringify([{ day: 'Monday', time: '8:00 AM - 11:00 AM, 11:30 AM - 12:50 PM, 2:30 PM - 3:00 PM, 4:00 PM - 5:00 PM' }]) },
    { Faculty_ID: 2, Full_Name: 'Offline Faculty', Department: 'Civil Engineering', Current_Status: 'offline' },
  ];
  else if (String(url).includes('update-faculty-profile.php')) result = { ok: true, user: { ...user, name: JSON.parse(options.body).full_name }, profile };
  else if (String(url).includes('manage-consultation-hours.php')) result.consultation_hours = profile.Consultation_Hours;
  else if (String(url).includes('update-faculty-presence.php')) result = { ok: true, status: fixtureFacultyStatus, checked_in: fixtureFacultyStatus !== 'offline' };
  else if (String(url).includes('manage-faculty-availability.php')) {
    if (options.method === 'POST') {
      if (failStatusSave) { result = { ok: false, message: 'Status save rejected' }; status = 422; }
      else {
        fixtureFacultyStatus = JSON.parse(options.body).status;
        result.status = fixtureFacultyStatus;
        result.checked_in = fixtureFacultyStatus !== 'offline';
      }
    } else result.availability = [{ Status: fixtureFacultyStatus }];
  } else if (String(url).includes('manage-consultation-requests.php') && options.method !== 'POST') {
    result.requests = [{ Request_ID: 21, Student_Name: 'Fresh Server Student', Purpose: 'Server request', Request_Date: '2030-01-07', Preferred_Time: '09:00:00', Year_Level: '1', Section: 'A' }];
  } else if (String(url).includes('get-faculty-schedule.php')) {
    result.slots = [{ value: '9:00 AM - 9:30 AM', available: true, taken: false }];
  }
  return { ok: status === 200, status, json: async () => result, blob: async () => new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII='), (char) => char.charCodeAt(0))], { type: 'image/png' }) };
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
    if (TEST_CASE === 'directory') {
      const filters = document.querySelectorAll('#filterPanel .filter-option');
      check(filters.length === 3 && !document.querySelector('#filterPanel [data-status]'), 'Directory filter contains only departments');
      check(document.querySelectorAll('#facultyList .faculty-card:not([hidden])').length === 2, 'Directory shows both online and offline professors');
      document.querySelector('[data-department="civil-engineering"].filter-option').click();
      check(document.querySelectorAll('#facultyList .faculty-card:not([hidden])').length === 1, 'Department filtering still works');
      document.querySelector('[data-department="civil-engineering"].filter-option').click();
      document.querySelector('.view-profile-button[data-faculty-id="1"]').click();
      await new Promise(resolve => setTimeout(resolve, 550));
      const panel = document.getElementById('directoryProfilePanel');
      const rect = panel.getBoundingClientRect();
      const slots = panel.querySelectorAll('.profile-hours-slot');
      check(slots.length === 4, 'Each consultation range displays on its own line');
      check(Array.from(slots).every(slot => { const box = slot.getBoundingClientRect(); return box.left >= rect.left && box.right <= rect.right; }), 'All consultation times stay within the profile card');
      check(document.documentElement.scrollWidth <= innerWidth, 'Directory profile does not overflow the screen horizontally');
      if (innerWidth <= 480) check(panel.querySelector('.profile-hours-day').getBoundingClientRect().bottom <= slots[0].getBoundingClientRect().top, 'Phone schedule places time ranges below the day');
      window.scrollTo(0, 100);
      const scrollBeforeRefresh = scrollY;
      directoryFacultyStatus = 'offline';
      window.dispatchEvent(new StorageEvent('storage', { key: 'facultyTestOnlineStatus', newValue: 'offline' }));
      await delay();
      check(panel.querySelector('.profile-status-label').textContent === 'Status: Offline', 'Open profile follows check-out reported by the server');
      check(document.querySelector('#facultyList [data-faculty-id="1"]').dataset.status === 'offline', 'Profile and directory list display the same server status');
      check(scrollY === scrollBeforeRefresh, 'Background status refresh preserves profile scroll position');
      directoryFacultyStatus = 'meeting';
      window.dispatchEvent(new Event('focus'));
      await delay();
      check(panel.querySelector('.profile-status-label').textContent === 'Status: Meeting', 'Returning to the page refreshes the actual professor status');
      directoryFacultyStatus = 'available';
      intervalTasks.find(task => task.milliseconds === 5000).callback();
      await delay();
      check(panel.querySelector('.profile-status-label').textContent === 'Status: Online', 'Regular polling follows check-in without reopening the profile');
      for (const [apiStatus, cssStatus, label] of STATUS_CASES) {
        directoryFacultyStatus = apiStatus;
        intervalTasks.find(task => task.milliseconds === 5000).callback();
        await delay();
        check(panel.querySelector('.profile-status-label').textContent === 'Status: ' + label && !!panel.querySelector('.status-' + cssStatus), 'Directory profile synchronizes ' + label + ' text and indicator');
        check(document.querySelector('#facultyList [data-faculty-id="1"]').dataset.status === cssStatus, 'Directory list synchronizes ' + label);
      }
    }
    if (TEST_CASE === 'student-dashboard') {
      for (const [apiStatus, cssStatus, label] of STATUS_CASES) {
        directoryFacultyStatus = apiStatus;
        intervalTasks.find(task => task.milliseconds === 5000).callback();
        await delay();
        const card = document.querySelector('.professor-card[data-faculty-id="1"]');
        check(card.dataset.status === cssStatus && card.querySelector('.professor-meta').textContent.endsWith(label) && !!card.querySelector('.status-' + cssStatus), 'Student dashboard synchronizes ' + label + ' text and indicator');
      }
    }
    if (TEST_CASE === 'faculty-dashboard') {
      for (const [apiStatus, uiStatus, label] of STATUS_CASES.filter(item => item[1] !== 'offline')) {
        document.getElementById('changeStatusButton').click();
        document.querySelector(`.faculty-status-option[data-status="${uiStatus}"]`).click();
        const confirmedLabel = document.getElementById('currentStatusLabel').textContent;
        intervalTasks.filter(task => task.milliseconds === 5000).forEach(task => task.callback());
        await delay();
        check(document.querySelector(`.faculty-status-option[data-status="${uiStatus}"]`).classList.contains('is-selected'), 'Professor dashboard heartbeat preserves the ' + label + ' draft');
        check(document.getElementById('currentStatusLabel').textContent === confirmedLabel, 'Unsaved ' + label + ' does not change the dashboard status');
        document.getElementById('saveStatusButton').click();
        await delay();
        check(window.getFacultyOnlineStatus() === uiStatus && document.getElementById('currentStatusLabel').textContent === label && document.getElementById('currentStatusDot').classList.contains('status-' + uiStatus), 'Professor dashboard synchronizes ' + label + ' text and indicator');
        await new Promise(resolve => setTimeout(resolve, 220));
      }
      document.getElementById('facultyCheckOutButton').click();
      await delay();
      check(document.getElementById('currentStatusLabel').textContent === 'Offline', 'Professor dashboard synchronizes Offline after Check Out');
    }
    if (TEST_CASE === 'faculty' || TEST_CASE === 'student') {
      const photo = document.getElementById(TEST_CASE === 'faculty' ? 'facultyProfilePhoto' : 'profilePhoto');
      await photo.decode();
      check(photo.src.startsWith('blob:') && photo.naturalWidth > 0, 'Uploaded photo loads through authenticated fetch');
      async function expectDefault(source, message) {
        photo.src = source;
        for (let attempt = 0; attempt < 15 && !photo.src.endsWith('/images/default-profile.jpg'); attempt++) await delay();
        await photo.decode();
        check(photo.src.endsWith('/images/default-profile.jpg') && photo.naturalWidth > 0, message);
      }
      await expectDefault('uploads/profile-photos/deleted.jpg', 'Missing legacy upload displays the default image');
      failPhotoFetch = true;
      await expectDefault('api/profile-photo.php?user_id=1&missing=1', 'Missing private photo displays the default image');
      failPhotoFetch = false;
      const corrupt = URL.createObjectURL(new Blob(['broken'], { type: 'image/png' }));
      await expectDefault(corrupt, 'Invalid image data displays the default image');
      URL.revokeObjectURL(corrupt);
      photo.src = 'api/profile-photo.php?user_id=1&restored=1';
      await delay();
      await photo.decode();
      check(photo.src.startsWith('blob:') && photo.naturalWidth > 0, 'A valid uploaded photo can replace the fallback');
    }
    if (TEST_CASE === 'request' || TEST_CASE === 'reschedule') {
      const isRequest = TEST_CASE === 'request';
      const date = document.getElementById(isRequest ? 'preferredDate' : 'reschedulePreferredDate');
      const time = document.getElementById(isRequest ? 'preferredTime' : 'reschedulePreferredTime');
      const form = document.getElementById(isRequest ? 'requestConsultationForm' : 'rescheduleConsultationForm');
      const initialDate = date.value;
      check(/^\d{4}-\d{2}-\d{2}$/.test(date.min), 'Calendar has a minimum date');
      date.value = '2000-01-03';
      time.value = '9:00 AM - 9:30 AM';
      date.dispatchEvent(new Event('change'));
      check(date.value === '' && time.value === '', 'Past date entry clears the date and selected time');
      date.value = '2000-01-03';
      time.value = '9:00 AM - 9:30 AM';
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      check(!recorded.some((r) => r.options?.method === 'POST' && r.url?.includes(isRequest ? 'create-consultation-request.php' : 'manage-consultation-requests.php')), 'Past date cannot be submitted');
      date.value = date.min;
      date.dispatchEvent(new Event('change'));
      await delay();
      check(date.value === date.min, 'Today remains selectable');
      date.value = initialDate;
      date.dispatchEvent(new Event('change'));
      await delay();
    }
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
      const saved = recorded.find((r) => r.url?.includes('update-faculty-profile.php'));
      const body = JSON.parse(saved.options.body);
      check(!('consultation_hours' in body) && !('office' in body), 'Profile save does not clear consultation hours or office');
      check(body.full_name === 'Juan A. Santos Jr.', 'Suffix survives the profile save round trip');
      document.getElementById('facultyCheckInButton').click();
      await delay();
      const leaveCount = () => recorded.filter(record => record.url?.includes('update-faculty-presence.php') && JSON.parse(record.options.body).action === 'leave').length;
      const previousLeaves = leaveCount();
      const previousHeartbeats = recorded.filter(record => record.url?.includes('update-faculty-presence.php')).length;
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      intervalTasks.filter(task => task.milliseconds === 5000).forEach(task => task.callback());
      await delay();
      check(leaveCount() === previousLeaves, 'Switching away from the professor tab does not mark them offline');
      check(recorded.filter(record => record.url?.includes('update-faculty-presence.php')).length > previousHeartbeats, 'An open background professor tab continues its heartbeat');
      check(window.getFacultyOnlineStatus() === 'online', 'Checked-in professor remains online after switching tabs');
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
      await delay();
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
      for (const [apiStatus, uiStatus, label] of STATUS_CASES.filter(item => item[1] !== 'offline')) {
        document.getElementById('changeStatusButton').click();
        const confirmedStatus = window.getFacultyOnlineStatus();
        document.querySelector(`.faculty-status-option[data-status="${uiStatus}"]`).click();
        check(document.getElementById('availabilityStatusLabel').textContent === window.FACULTY_STATUS_LABELS[confirmedStatus], 'Draft ' + label + ' is not displayed as the saved status');
        intervalTasks.filter(task => task.milliseconds === 5000).forEach(task => task.callback());
        await delay();
        check(document.querySelector(`.faculty-status-option[data-status="${uiStatus}"]`).classList.contains('is-selected'), 'Heartbeat preserves the ' + label + ' draft selection');
        document.getElementById('saveStatusButton').click();
        await delay();
        check(window.getFacultyOnlineStatus() === uiStatus && document.getElementById('availabilityStatusLabel').textContent === label, 'Saving ' + label + ' updates the confirmed status');
        const statusWritesBefore = recorded.filter(record => record.url?.includes('manage-faculty-availability.php') && record.options.method === 'POST').length;
        document.getElementById('editHoursButton').click();
        document.getElementById('saveHoursButton').click();
        await delay();
        check(window.getFacultyOnlineStatus() === uiStatus && recorded.filter(record => record.url?.includes('manage-faculty-availability.php') && record.options.method === 'POST').length === statusWritesBefore, 'Saving hours preserves ' + label + ' without changing status');
        await new Promise(resolve => setTimeout(resolve, 220));
      }
      document.getElementById('facultyCheckOutButton').click();
      await delay();
      check(window.getFacultyOnlineStatus() === 'offline' && document.getElementById('availabilityStatusLabel').textContent === 'Offline', 'Check Out synchronizes Offline on the availability page');
    } else if (TEST_CASE === 'reschedule') {
      check(document.getElementById('rescheduleStudentName').textContent === 'Fresh Server Student', 'Reschedule loads the request from the server without local storage');
      const schedule = recorded.find((r) => r.url?.includes('get-faculty-schedule.php'));
      check(schedule.url.includes('request_id=21'), 'Schedule lookup excludes the request being edited');
      const option = [...document.querySelectorAll('#reschedulePreferredTimeOptions li')].find((li) => li.dataset.value === '9:00 AM \u2013 9:30 AM');
      check(option && !option.classList.contains('is-unavailable'), 'Available schedule slot can be selected');
      option.click();
      document.getElementById('rescheduleConsultationForm').dispatchEvent(new Event('submit', { cancelable: true }));
      await delay();
      const posted = recorded.find((r) => r.url?.includes('manage-consultation-requests.php') && r.options.method === 'POST');
      check(JSON.parse(posted.options.body).request_id === 21, 'Reschedule submits the correct server request');
      check(document.getElementById('submitRescheduleButton').disabled, 'Reschedule prevents duplicate submissions');
    }
    check(!document.getElementById('profconsult-auth-lock'), 'Protected page is revealed only after successful session verification');
    const sessionRequest = recorded.find((r) => r.url?.includes('get-current-session.php'));
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
