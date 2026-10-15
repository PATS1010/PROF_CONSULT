# PHP file names

Endpoint names describe their action. Files beginning with manage- both read and update data. Shared code uses helpers or config names.

Names already describing their purpose, including profile-photo.php, change-password.php, reset-password.php, delete-account.php, and verify-account-code.php, remain in use.

## Renamed files

| Previous path | Current path |
| --- | --- |
| api/attendance.php | api/record-faculty-attendance.php |
| api/availability.php | api/manage-faculty-availability.php |
| api/bootstrap.php | api/api-helpers.php |
| api/check-account.php | api/check-account-exists.php |
| api/config.php | api/app-config.php |
| api/consultation-requests.php | api/manage-consultation-requests.php |
| api/faculty-directory.php | api/get-faculty-directory.php |
| api/faculty-hours.php | api/manage-consultation-hours.php |
| api/faculty-profile.php | api/update-faculty-profile.php |
| api/faculty-schedule.php | api/get-faculty-schedule.php |
| api/faculty-status.php | api/faculty-presence-helpers.php |
| api/login.php | api/authenticate-user.php |
| api/logout.php | api/logout-user.php |
| api/mailer.php | api/email-delivery-helpers.php |
| api/notification-settings.php | api/manage-notification-preferences.php |
| api/notifications.php | api/manage-notifications.php |
| api/presence.php | api/update-faculty-presence.php |
| api/register.php | api/create-account.php |
| api/request-account-verification-code.php | api/send-account-verification-code.php |
| api/request-reset-code.php | api/send-password-reset-code.php |
| api/schedule-helpers.php | api/consultation-schedule-helpers.php |
| api/session.php | api/get-current-session.php |
| api/student-profile.php | api/update-student-profile.php |
| api/student-public-profile.php | api/get-student-public-profile.php |
| api/submit-consultation.php | api/create-consultation-request.php |
| api/verify-reset-code.php | api/verify-password-reset-code.php |
| database/migrate.php | database/apply-schema-migrations.php |
