# PROF CONSULT - Pats’s Test Case Documentation

Prepared for Pats | PROF CONSULT | 15 October 2026

This document records Pats’s Action Taken and Resolved entries after implementing the reported system fixes. All 29 regression checks passed, including real-page browser checks and endpoint checks against an isolated SQLite fixture. Email delivery was simulated, and PostgreSQL concurrency was not exercised. Deployment retesting and final tester sign-off remain pending. Original tester Status values are preserved for reference.

## Action Taken and Resolved

| Test case | Module | Reported error | Action Taken - Pats | Resolved - Pats | Original tester Status |
| --- | --- | --- | --- | --- | --- |
| TC1 | Login and Authentication | Email verification was not received during account creation; the mobile-number alternative did not work. | Enabled SMTP verification-email delivery when no Brevo API key is configured, documented the HTTPS email configuration, and prevented a failed resend from invalidating an earlier code. Verified SMTP selection, OTP acceptance and rejection, and failed-resend recovery using isolated fixtures. The verification interface remains email-only; the obsolete mobile-number alternative was already removed. Actual inbox delivery still requires a deployed-service retest. | Local checks passed; deployment retest pending | OK |
| TC2 | Faculty Profile Management | The profile photo upload button was missing; entering a suffix placed name components in the wrong fields. | Made the faculty photo upload control visible without entering Edit Profile and accessible as a keyboard-operable button. Prevented profile saves from clearing consultation hours and office details. Confirmed that first name, last name, and suffix remain in their correct fields and that the suffix survives saving. Local endpoint and browser checks passed; deployed tester confirmation remains pending. | Local checks passed; deployment retest pending | Blank |
| TC3 | Student Profile Management | The uploaded student profile photo was not saved correctly. | Changed student and faculty photo uploads to save validated image content in the database, avoiding loss when an application container is restarted or redeployed. Added an authenticated image endpoint and corrected photo URLs so account parameters survive cache refreshes. Confirmed multipart upload, session reload, image retrieval after a new login, and access restrictions in isolated tests. Previously erased local photos must be uploaded again. | Local checks passed; deployment retest pending | Blank |
| TC4 | Faculty Availability Management | The faculty availability status did not update. | Changed availability updates to apply only after successful server confirmation and to show errors instead of silently displaying an unsaved status. Failed saves restore the displayed selection. Server timestamps and insertion order prevent incorrect device clocks from hiding the latest update. Verified persistence, status mapping, student-directory visibility, and rejected-save feedback using local endpoint and browser checks. | Local checks passed; deployment retest pending | Blank |
| TC5 | Consultation Request | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC6 | Consultation Management | Consultation rescheduling did not work. | Changed rescheduling to reload the selected request from the server using its request ID rather than relying on browser-stored copies. Unified booking and rescheduling schedule parsing, including legacy saved hours. Excluded only the owned request from its slot lookup, guarded against stale responses and duplicate submission, and added a shared booking lock plus transactional request/notification updates. Confirmed successful rescheduling, conflict rejection, persisted student schedule, and notification content in isolated tests. | Local checks passed; deployment retest pending | Blank |
| TC7 | Notification | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC8 | Login and User Roles | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC9 | Faculty Availability and Student Portal | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC10 | Faculty Schedule and Availability | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC11 | Consultation Request and Faculty Portal | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC12 | Consultation Response and Notification | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC13 | Database and System Modules | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | Pending testing evidence | Blank |
| TC14 | Functionality | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | Pending testing evidence | Blank |
| TC15 | Usability | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC16 | User Interface | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC17 | Performance | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC18 | Security | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC19 | Compatibility | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | N/A - no reported defect | OK |
| TC20 | User Acceptance Testing (UAT) | No error recorded in the supplied sheet. | No corrective action recorded; no error was listed in the supplied test sheet. | Pending testing evidence | Blank |

The supplied PDF already marks TC1 as OK in the tester Status column while retaining its reported error. That existing result is preserved; current email delivery has not been independently verified. No new OK or FIX result has been assigned. Change a pending Resolved entry to OK only after the corresponding retest succeeds; the tester controls the final Status column.

## Retest checklist

- **TC1:** Create an account using a controlled email inbox, receive and verify the code, and complete registration. Confirm the verification page offers email only. Test invalid and expired codes.
- **TC2:** Open Edit Profile and confirm the photo upload control is visible. Upload a valid image and check it after refresh and a new sign-in. Save a name such as Juan A. Santos Jr., then reopen editing and confirm every component remains in its proper field.
- **TC3:** Upload a valid student photo, refresh, and sign out and back in. Confirm the same photo appears. Check rejection of unsupported files and files exceeding 5 MB.
- **TC4:** Save each supported availability status, refresh the faculty page, and inspect the same faculty account from a student session. Confirm the displayed status agrees with the saved selection.
- **TC6:** Reschedule an existing request to an available future slot. Confirm the revised date, time, and faculty message after refresh and from the student account. Check the notification and rejection of a conflicting or unavailable slot.
- **TC13, TC14, TC20:** Record actual database integration, complete functionality, and intended-user acceptance results. No completion evidence or tester status was supplied for these cases.

## Source code reviewed

- **TC1:** verify-account.html; js/verify-account.js; api/request-account-verification-code.php; api/verify-account-code.php; api/register.php; api/mailer.php
- **TC2:** faculty-profile.html; js/faculty-profile.js; api/faculty-profile.php; api/profile-photo.php
- **TC3:** js/student-profile.js; api/profile-photo.php
- **TC4:** js/faculty-shared.js; js/faculty-availability.js; api/availability.php; js/faculty-directory.js; api/faculty-directory.php
- **TC6:** js/faculty-consultation-requests.js; js/reschedule-consultation.js; api/consultation-requests.php

## Implementation validation

Run `python tests/run_regressions.py`. All 29 checks passed. See `tests/README.md` for the fixture boundaries and deployment configuration. New uploads persist in `user_profile_photos`; old photos lost from container storage require re-upload.
