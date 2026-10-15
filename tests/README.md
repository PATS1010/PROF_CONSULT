Run from the repository root with PHP 8.2+, Python 3, and Chrome/Chromium installed:

```powershell
python tests/run_regressions.py
```

The runner starts a local PHP server, executes the actual endpoint bodies against an isolated SQLite database, and runs the actual pages in headless Chrome. PostgreSQL syntax is translated by the fixture adapter; advisory locks are stubbed, so this suite does not verify PostgreSQL concurrency. OTP delivery is simulated. The mail dispatch check uses a PHPMailer double to verify SMTP fallback without sending email.

The router is enabled only with `PROFCONSULT_TEST_MODE=1` under PHP's development server. Test data, sessions, and browser profiles stay in the ignored `tests/runtime/` directory. No production credentials, accounts, or email recipients are used.

Before final tester sign-off, repeat the five reported cases against the deployed PostgreSQL application and confirm receipt of a real verification email. Existing photos saved only on an erased container disk must be uploaded again; new uploads use database storage.

On a host that blocks SMTP, configure `BREVO_API_KEY` and a verified `SMTP_FROM_EMAIL`. For SMTP deployments, leave `BREVO_API_KEY` empty and configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_ENCRYPTION`, and `SMTP_FROM_EMAIL`. The verification interface uses email only; the obsolete mobile-number alternative remains removed.

Protected APIs require both the PHP session cookie and the random login proof in `X-ProfConsult-Tab-Token`. Login screens keep that proof in `sessionStorage`, never in a URL or `localStorage`. Pasting a portal URL into a fresh tab redirects to login. Normal same-tab navigation and refresh retain the proof. A new login for the same role rotates its previous proof; logout revokes the server session. Browser features that explicitly clone a tab can copy its sessionStorage, so this is not a claim of isolation from browser-controlled duplication or developer tools.

Protected pages load the guard in the head and stay hidden until the role/session check succeeds. Private images are fetched with the proof and displayed using blob URLs. Regression checks cover cookie-only and forged-proof rejection, cross-role access, logout revocation, fresh-tab redirects, and actual generic/student/faculty login through dashboard refresh.
