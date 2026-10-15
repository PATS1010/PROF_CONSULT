"""Run isolated endpoint and real-browser regressions; no production accounts/mail."""
import base64
import http.cookiejar
import json
import os
from pathlib import Path
import re
import shutil
import socket
import sqlite3
import subprocess
import time
import urllib.error
import urllib.request
from browser_driver import login_flow

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / 'tests/runtime'
RUNTIME.mkdir(exist_ok=True)
db_file = RUNTIME / 'fixture.sqlite'
if db_file.exists():
    db_file.unlink()
db = sqlite3.connect(db_file)
php = shutil.which('php') or r'C:\xampp\php\php.exe'
fixture_password = subprocess.check_output([php, '-r', 'echo password_hash("TestPassword1", PASSWORD_DEFAULT);'], text=True)
schema = (ROOT / 'database/schema.sql').read_text()
schema = schema.replace(' CASCADE;', ';').replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY')
db.executescript(schema)
db.executescript('CREATE TABLE test_mail (Email TEXT, Code TEXT);')
for i, role in [(1, 'faculty'), (2, 'student'), (3, 'student')]:
    db.execute('INSERT INTO users (User_ID,Username,Password,Full_Name,Email,Mobile_Number,Role) VALUES (?,?,?,?,?,?,?)', (i, f'test-{i}', fixture_password, 'Juan A. Santos Jr.', f'test-{i}@example.test', '9123456789', role))
db.execute('INSERT INTO faculty (Faculty_ID,User_ID,Department,Office,Consultation_Hours) VALUES (1,1,?,?,?)', ('Computer Engineering', 'Room 12', 'Monday: 9:00 AM - 11:00 AM'))
for i in [2, 3]:
    db.execute('INSERT INTO students (Student_ID,User_ID,Program,Year_Level,Section) VALUES (?,?,?,?,?)', (i, i, 'Computer Engineering', '1', 'A'))
for i, clock in [(21, '09:00:00'), (22, '10:00:00')]:
    db.execute("INSERT INTO consultation_requests (Request_ID,Student_ID,Faculty_ID,Purpose,Request_Date,Preferred_Time,Status) VALUES (?,2,1,'Test consultation','2030-01-07',?,'pending')", (i, clock))
db.commit()
db.close()

with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    port = sock.getsockname()[1]
base = f'http://127.0.0.1:{port}'
env = dict(os.environ, PROFCONSULT_TEST_MODE='1')
php = shutil.which('php') or r'C:\xampp\php\php.exe'
log = (RUNTIME / 'server.log').open('w')
server = subprocess.Popen([php, '-d', f'upload_tmp_dir={RUNTIME}', '-S', f'127.0.0.1:{port}', 'tests/router.php'], cwd=ROOT, env=env, stdout=log, stderr=log, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
checks = 0
active_token = ''

def request(path, payload=None, raw=None, content_type=None, proof=True):
    global active_token
    data = json.dumps(payload).encode() if payload is not None else raw
    headers = {'Content-Type': content_type or 'application/json'} if data is not None else {}
    if proof:
        headers['X-ProfConsult-Tab-Token'] = active_token if proof is True else proof
    req = urllib.request.Request(base + path, data=data, headers=headers)
    try:
        response = opener.open(req, timeout=10)
    except urllib.error.HTTPError as error:
        response = error
    body = response.read()
    result = json.loads(body) if 'application/json' in response.headers.get('Content-Type', '') else body
    if isinstance(result, dict) and result.get('ok') and result.get('tab_token'):
        active_token = result['tab_token']
    return response.status, result

def check(condition, label):
    global checks
    if not condition:
        raise AssertionError(label)
    checks += 1
    print('PASS', label, flush=True)

try:
    migration_tests = subprocess.run([php, 'tests/database-migration.php'], cwd=ROOT, capture_output=True, text=True)
    check(migration_tests.returncode == 0, 'Deployment migration lifecycle: ' + migration_tests.stderr.strip())
    print(migration_tests.stdout, end='', flush=True)
    status_tests = subprocess.run([php, 'tests/faculty-status.php'], cwd=ROOT, capture_output=True, text=True)
    check(status_tests.returncode == 0, 'All deterministic faculty status boundary checks: ' + status_tests.stderr.strip())
    print(status_tests.stdout, end='', flush=True)
    for mode in ['smtp', 'missing']:
        result = subprocess.run([php, 'tests/mail-dispatch.php', mode], cwd=ROOT, capture_output=True, text=True)
        check(result.returncode == 0 and 'PASS mail provider selection:' in result.stdout, 'TC1 mail provider selection: ' + mode + ' ' + result.stderr.strip())
    for _ in range(50):
        try:
            request('/_test/session?id=1')
            break
        except OSError:
            time.sleep(.1)
    status, result = request('/api/faculty-profile.php', {'full_name': 'Juan A. Santos Jr.', 'email': 'test-1@example.test', 'phone': '9123456789', 'department': 'Computer Engineering'})
    check(status == 200 and result['ok'], 'TC2 faculty profile saves')
    check(result['profile']['Office'] == 'Room 12' and result['profile']['Consultation_Hours'] == 'Monday: 9:00 AM - 11:00 AM', 'TC2 profile editing preserves the office and consultation hours')
    status, result = request('/api/availability.php', {'status': 'online', 'date': '1900-01-01', 'time': '00:00:00'})
    check(status == 201 and result['status'] == 'available', 'TC4 availability status persists with API mapping')
    _, result = request('/api/availability.php?role=faculty&latest=1')
    check(result['availability'][0]['Date'] != '1900-01-01', 'TC4 server time overrides an incorrect device clock')
    _, result = request('/api/faculty-directory.php')
    check(result['faculty'][0]['Current_Status'] == 'available', 'TC9 saved faculty status reaches the student directory')
    status, result = request('/api/availability.php', {'status': 'invalid'})
    check(status == 422, 'TC4 invalid status is rejected')
    db = sqlite3.connect(db_file)
    db.execute("INSERT INTO availability (Faculty_ID,Status,Date,Time) VALUES (1,'meeting','2099-01-01','09:00:00')")
    db.commit()
    db.close()
    request('/api/availability.php', {'status': 'online'})
    _, result = request('/api/faculty-directory.php')
    check(result['faculty'][0]['Current_Status'] == 'available', 'TC4 newly saved status supersedes older records with an incorrect future timestamp')

    _, result = request('/api/faculty-schedule.php?date=2030-01-07&request_id=21')
    slots = {s['start']: s for s in result['slots']}
    check(slots['09:00:00']['available'] and not slots['09:00:00']['taken'], 'TC6 own booking remains selectable during rescheduling')
    check(slots['10:00:00']['taken'], 'TC6 other bookings remain unavailable')
    status, result = request('/api/consultation-requests.php', {'role': 'faculty', 'request_id': 21, 'status': 'rescheduled', 'preferred_date': '2030-01-07', 'preferred_time': '9:30 AM - 10:00 AM', 'response': 'Please use the new time.'})
    check(status == 200 and result['ok'], 'TC6 legacy saved schedule supports rescheduling')
    status, result = request('/api/consultation-requests.php', {'role': 'faculty', 'request_id': 21, 'status': 'rescheduled', 'preferred_date': '2030-01-07', 'preferred_time': '10:00 AM - 10:30 AM'})
    check(status == 409, 'TC6 conflicting reschedule is rejected')
    request('/_test/session?id=2')
    _, result = request('/api/consultation-requests.php?role=student')
    moved = next(r for r in result['requests'] if r['Request_ID'] == 21)
    check(moved['Preferred_Time'] == '09:30:00' and moved['Status'] == 'rescheduled', 'TC12 student receives the persisted revised schedule')
    db = sqlite3.connect(db_file)
    check('January 7, 2030 at 9:30 AM' in db.execute('SELECT Message FROM notifications WHERE User_ID=2 ORDER BY Notification_ID DESC LIMIT 1').fetchone()[0], 'TC12 notification contains the revised consultation schedule')
    db.close()
    status, _ = request('/api/faculty-schedule.php?faculty_id=1&date=2030-01-07&request_id=21')
    check(status == 403, 'TC6 student cannot exclude a faculty booking from the schedule')

    db = sqlite3.connect(db_file)
    db.execute("INSERT INTO consultation_requests (Request_ID,Student_ID,Faculty_ID,Purpose,Request_Date,Preferred_Time,Status) VALUES (61,2,1,'Finished consultation','2000-01-01','09:00:00','approved')")
    db.executescript("CREATE TRIGGER fail_completion BEFORE INSERT ON notifications WHEN NEW.User_ID=1 AND NEW.Message LIKE '%has been completed.' BEGIN SELECT RAISE(ABORT, 'Simulated notification failure'); END;")
    db.commit()
    check(request('/api/consultation-requests.php?role=student')[0] == 500, 'Completion notification failure is reported')
    check(db.execute('SELECT Status FROM consultation_requests WHERE Request_ID=61').fetchone()[0] == 'approved' and db.execute("SELECT COUNT(*) FROM notifications WHERE Message LIKE '%has been completed.'").fetchone()[0] == 0, 'Failed completion rolls back both notifications and status')
    db.execute('DROP TRIGGER fail_completion')
    db.commit()
    check(request('/api/consultation-requests.php?role=student')[0] == 200, 'Completion retries successfully after a failure')
    request('/api/consultation-requests.php?role=student')
    counts = db.execute("SELECT User_ID, COUNT(*) FROM notifications WHERE Message LIKE '%has been completed.' GROUP BY User_ID ORDER BY User_ID").fetchall()
    check(counts == [(1, 1), (2, 1)] and db.execute('SELECT Status FROM consultation_requests WHERE Request_ID=61').fetchone()[0] == 'completed', 'Repeated refresh produces one completion notification for each participant')
    db.close()

    image = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6ioAAAAASUVORK5CYII=')
    boundary = 'profconsult-test-upload'
    upload = (f'--{boundary}\r\nContent-Disposition: form-data; name="role"\r\n\r\nstudent\r\n--{boundary}\r\nContent-Disposition: form-data; name="profile_photo"; filename="avatar.png"\r\nContent-Type: image/png\r\n\r\n'.encode() + image + f'\r\n--{boundary}--\r\n'.encode())
    status, result = request('/api/profile-photo.php', raw=upload, content_type=f'multipart/form-data; boundary={boundary}')
    check(status == 200 and result['ok'], 'TC3 real multipart photo upload saves successfully')
    photo_path = result['profile_photo']
    _, result = request('/api/session.php?role=student')
    check(result['user']['profile_photo'] == photo_path, 'TC3 session reload retains the saved photo path')
    request('/_test/session?id=2')
    status, body = request('/' + photo_path)
    check(status == 200 and body == image, 'TC3 saved image survives a new login without a local upload file')
    request('/_test/session?id=3')
    check(request('/' + photo_path)[0] == 403, 'TC18 another student cannot read a private student photo')

    status, result = request('/api/request-account-verification-code.php', {'role': 'student', 'email': 'new@example.test', 'method': 'email'})
    check(status == 200 and result['ok'], 'TC1 verification request succeeds with the delivery fixture')
    token = result['token']
    _, mail = request('/_test/mail')
    code = mail['mail']['Code']
    check(request('/api/verify-account-code.php', {'role': 'student', 'token': token, 'code': code})[0] == 200, 'TC1 delivered OTP verifies the account')
    check(request('/api/verify-account-code.php', {'role': 'student', 'token': token, 'code': '000000'})[0] == 422, 'TC1 incorrect OTP is rejected')
    request('/_test/fail-mail')
    check(request('/api/request-account-verification-code.php', {'role': 'student', 'email': 'fail@example.test'})[0] == 500, 'TC1 failed delivery is reported')
    _, result = request('/_test/old-mail')
    check(len(result['codes']) == 1 and result['codes'][0]['Token'] == 'old-token' and result['codes'][0]['Consumed_At'] is None, 'TC1 failed resend preserves the previous code and removes the unsent code')

    request('/api/login.php', {'role': 'faculty', 'identifier': 'test-1@example.test', 'password': 'TestPassword1'})
    _, status_data = request('/api/availability.php?role=faculty&latest=1')
    check(status_data['availability'][0]['Status'] == 'offline', 'Faculty password login resets status to offline')
    _, status_data = request('/api/presence.php', {'page_id': 'active-page', 'action': 'heartbeat'})
    check(status_data['status'] == 'offline' and not status_data['checked_in'], 'Heartbeat alone does not check in the professor')
    request('/api/availability.php', {'status': 'online', 'page_id': 'active-page'})
    _, status_data = request('/api/presence.php', {'page_id': 'active-page', 'action': 'heartbeat'})
    check(status_data['status'] == 'available' and status_data['checked_in'], 'Check-in plus heartbeat keeps the professor online')
    _, status_data = request('/api/presence.php', {'page_id': 'active-page', 'action': 'leave'})
    check(status_data['status'] == 'offline', 'Page leave makes the professor offline')
    request('/api/presence.php', {'page_id': 'new-page', 'action': 'heartbeat'})
    _, status_data = request('/api/presence.php', {'page_id': 'active-page', 'action': 'leave'})
    check(status_data['status'] == 'available', 'Old page leave cannot override a new page heartbeat')
    request('/api/logout.php', {})
    request('/_test/session?id=3')
    _, directory = request('/api/faculty-directory.php')
    check(directory['faculty'][0]['Current_Status'] == 'offline', 'Student directory shows offline after professor logout')

    # Same cookies, but no sessionStorage proof: model a pasted URL in a fresh tab.
    for protected in ['/api/session.php?role=student', '/api/faculty-directory.php', '/api/faculty-schedule.php?faculty_id=1&date=2030-01-07', '/api/availability.php?faculty_id=1', '/' + photo_path]:
        check(request(protected, proof=False)[0] == 401, 'Fresh tab cannot access ' + protected.split('?')[0] + ' using cookies alone')
    check(request('/api/session.php?role=student', proof='b' * 64)[0] == 401, 'Forged tab proof is rejected')
    check(request('/api/session.php?role=faculty')[0] == 403, 'Student tab proof cannot access a faculty session')
    status, result = request('/api/login.php', {'identifier': 'test-2@example.test', 'password': 'TestPassword1'})
    check(status == 200 and len(result.get('tab_token', '')) == 64, 'Real password login issues a fresh tab proof')
    check(request('/api/session.php?role=student')[0] == 200, 'Authenticated tab can reload its session')
    check(request('/api/logout.php', {}, proof=False)[0] == 401, 'A fresh tab cannot log out another tab using cookies alone')
    check(request('/api/logout.php', {})[0] == 200, 'Authenticated logout succeeds')
    check(request('/api/session.php?role=student')[0] == 401, 'Logout revokes the proof and prevents session reuse')

    chrome = next((p for p in [shutil.which('google-chrome'), shutil.which('chromium'), r'C:\Program Files\Google\Chrome\Application\chrome.exe'] if p and Path(p).exists()), None)
    if not chrome:
        raise RuntimeError('Chrome/Chromium is required for the browser regression checks.')
    for case in ['faculty', 'student', 'availability', 'reschedule']:
        process = subprocess.run([chrome, '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', f'--user-data-dir={RUNTIME / ("chrome-" + case)}', '--dump-dom', '--virtual-time-budget=1200', base + '/_test/ui/' + case + '?request_id=21'], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=30)
        (RUNTIME / (case + '.html')).write_text(process.stdout, encoding='utf-8')
        match = re.search(r'<pre id="regression-result">(.*?)</pre>', process.stdout, re.S)
        check(bool(match and match[1].startswith('PASS ')), 'Browser ' + case + ': ' + (match[1] if match else 'no result; see tests/runtime/' + case + '.html'))
    for case in ['fresh-tab', 'wrong-role']:
        process = subprocess.run([chrome, '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', f'--user-data-dir={RUNTIME / ("chrome-" + case)}', '--dump-dom', '--virtual-time-budget=1200', base + '/_test/ui/' + case], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=30)
        (RUNTIME / (case + '.html')).write_text(process.stdout, encoding='utf-8')
        check('id="loginForm"' in process.stdout and 'id="facultyProfileView"' not in process.stdout, 'Browser ' + case + ' redirects to login before revealing the faculty portal')
    for role in ['faculty', 'student']:
        process = subprocess.run([chrome, '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', f'--user-data-dir={RUNTIME / ("chrome-popup-" + role)}', '--dump-dom', '--virtual-time-budget=1500', base + '/tests/notification-popup.html?role=' + role], capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=30)
        (RUNTIME / ('notification-popup-' + role + '.html')).write_text(process.stdout, encoding='utf-8')
        match = re.search(r'<pre id="regression-result">(.*?)</pre>', process.stdout, re.S)
        check(bool(match and match[1].startswith('PASS ')), 'Browser notification popup: ' + (match[1] if match else 'no result'))
    for entry in ['login.html', 'student-login.html', 'faculty-login.html']:
        result, html = login_flow(chrome, base + '/_test/login/' + entry, RUNTIME / ('chrome-login-' + entry + '-' + str(port)), RUNTIME / ('login-flow-' + entry + '.log'))
        (RUNTIME / ('login-flow-' + entry)).write_text(html, encoding='utf-8')
        check(result.startswith('PASS '), 'Browser actual ' + entry + ' signs in, opens its dashboard, and refreshes successfully')
    print(f'Completed {checks} regression checks plus 17 deterministic status checks. SQLite fixture and mocked browser delivery; no production email sent.')
finally:
    server.terminate()
    server.wait(timeout=10)
    log.close()
