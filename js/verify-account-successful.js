// Verify Account Successful JS
document.addEventListener("DOMContentLoaded", () => {

  const params =
    new URLSearchParams(
      window.location.search
    );

  const origin =
    params.get("from") === "faculty"
      ? "faculty"
      : "student";

  const originCreateAccountPage =
    origin === "faculty"
      ? "create-faculty-account2.html"
      : "create-student-account2.html";

  const verificationKey =
    origin === "faculty"
      ? "findprof_faculty_account_verified"
      : "student_account_verified";

  const accountStep2StorageKey =
    origin === "faculty"
      ? "findprof_faculty_registration_step2"
      : "findprof_registration_step2_student";

  const backButton =
    document.getElementById(
      "backButton"
    );

  const proceedButton =
    document.getElementById(
      "proceedButton"
    );

  function preserveAccountStep2Data() {

    const existingData =
      sessionStorage.getItem(
        accountStep2StorageKey
      );

    if (existingData !== null) {

      sessionStorage.setItem(
        accountStep2StorageKey,
        existingData
      );

    }

  }

  if (backButton) {

    backButton.setAttribute(
      "href",
      originCreateAccountPage
    );

  }

  document
    .querySelectorAll('[data-nav="back"]')
    .forEach((link) => {

      link.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

          preserveAccountStep2Data();

          window.location.href =
            originCreateAccountPage;

        }
      );

    });

  if (proceedButton) {

    proceedButton.setAttribute(
      "href",
      originCreateAccountPage
    );

  }

  document
    .querySelectorAll('[data-nav="proceed"]')
    .forEach((link) => {

      link.addEventListener(
        "click",
        (event) => {

          event.preventDefault();

          preserveAccountStep2Data();

          sessionStorage.setItem(
            verificationKey,
            "true"
          );

          sessionStorage.setItem(
            "verificationOrigin",
            origin
          );

          window.location.href =
            originCreateAccountPage;

        }
      );

    });

});