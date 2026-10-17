// Real login -> dashboard -> refresh against the isolated endpoint fixtures.
document.addEventListener('DOMContentLoaded', async () => {
  await new Promise((resolve) => setTimeout(resolve, 30));
  const generic = document.getElementById('loginForm');
  const student = document.getElementById('studentLoginForm');
  const faculty = document.getElementById('facultyLoginForm');
  const form = generic || student || faculty;
  if (form) {
    sessionStorage.clear();
    const role = faculty ? 'faculty' : 'student';
    if (role === 'student') sessionStorage.setItem('profconsult_student_quick_action_shown', '1');
    sessionStorage.setItem('regression_login_role', role);
    document.getElementById(generic ? 'loginIdentifier' : student ? 'studentEmail' : 'facultyEmail').value = role === 'faculty' ? 'test-1@example.test' : 'test-2@example.test';
    document.getElementById(generic ? 'loginPassword' : student ? 'studentPassword' : 'facultyPassword').value = 'TestPassword1';
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    return;
  }
  const role = sessionStorage.getItem('regression_login_role');
  if (!role) return;
  const result = await window.ProfConsultAuth.checkSession();
  const token = sessionStorage.getItem(`profconsult_tab_token_${role}`) || '';
  if (!sessionStorage.getItem('regression_auth_refreshed') && result?.user?.role === role) {
    if (role === 'student') {
      await new Promise((resolve) => setTimeout(resolve, 2250));
      const panel = document.getElementById('quickActionPanel');
      sessionStorage.setItem('regression_student_popup', String(panel && !panel.hidden));
      document.getElementById('quickActionButton').click();
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    sessionStorage.setItem('regression_auth_refreshed', '1');
    location.reload();
    return;
  }
  let passed = result?.user?.role === role && /^[a-f0-9]{64}$/.test(token) && !document.getElementById('profconsult-auth-lock');
  if (role === 'student') {
    passed = passed && !!document.querySelector('#filterPanel [data-status="online"]') && !document.querySelector('#filterPanel [data-status="offline"]');
    await new Promise((resolve) => setTimeout(resolve, 2250));
    const panel = document.getElementById('quickActionPanel');
    passed = passed && sessionStorage.getItem('regression_student_popup') === 'true' && panel && panel.hidden;
    document.getElementById('quickActionButton').click();
    passed = passed && !panel.hidden;
  }
  if (role === 'faculty') {
    passed = passed && !!document.querySelector('#statusPanel [data-status="online"]') && !document.querySelector('#statusPanel [data-status="offline"]');
    await new Promise((resolve) => setTimeout(resolve, 2250));
    const panel = document.getElementById('facultyQuickActionPanel');
    passed = passed && window.getFacultyOnlineStatus() === 'offline' && panel && !panel.hidden;
    document.getElementById('facultyCheckInButton').click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    passed = passed && window.getFacultyOnlineStatus() === 'online';
    document.getElementById('facultyCheckOutButton').click();
    await new Promise((resolve) => setTimeout(resolve, 200));
    passed = passed && window.getFacultyOnlineStatus() === 'offline';
  }
  const output = document.createElement('pre');
  output.id = 'auth-flow-result';
  output.textContent = passed ? 'PASS real login, dashboard navigation, and refresh: ' + role : 'FAIL actual login or session persistence';
  document.body.appendChild(output);
});
