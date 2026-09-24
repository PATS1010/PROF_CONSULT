// =========================================================
// VERIFY ACCOUNT SUCCESSFUL PAGE
// Prof Consult
//
// FRONTEND ONLY
//
// Origin:
//
// ?from=student
//     -> Student account flow
//
// ?from=faculty
//     -> Faculty account flow
//
// BACK:
//     Student -> create-student-account2.html
//     Faculty -> create-faculty-account2.html
//
// PROCEED:
//     Student -> create-student-account2.html
//     Faculty -> create-faculty-account2.html
//
// IMPORTANT:
// - Email and contact number are NOT removed.
// - Existing Create Account 2 sessionStorage is preserved.
// - Proceed marks the correct account as verified.
// =========================================================


document.addEventListener("DOMContentLoaded", () => {


  // =======================================================
  // DETERMINE ORIGIN
  // =======================================================

  const params =
    new URLSearchParams(
      window.location.search
    );


  const origin =
    params.get("from") === "faculty"
      ? "faculty"
      : "student";



  // =======================================================
  // CREATE ACCOUNT 2 DESTINATION
  // =======================================================

  const originCreateAccountPage =
    origin === "faculty"
      ? "create-faculty-account2.html"
      : "create-student-account2.html";



  // =======================================================
  // VERIFICATION STORAGE KEY
  //
  // Student:
  //   student_account_verified
  //
  // Faculty:
  //   findprof_faculty_account_verified
  // =======================================================

  const verificationKey =
    origin === "faculty"
      ? "findprof_faculty_account_verified"
      : "student_account_verified";



  // =======================================================
  // CREATE ACCOUNT 2 STORAGE KEY
  //
  // These are ONLY identified here so we can make sure
  // nothing is accidentally removed.
  // =======================================================

  const accountStep2StorageKey =
    origin === "faculty"
      ? "findprof_faculty_registration_step2"
      : "findprof_registration_step2_student";



  // =======================================================
  // GET BUTTONS
  // =======================================================

  const backButton =
    document.getElementById(
      "backButton"
    );


  const proceedButton =
    document.getElementById(
      "proceedButton"
    );



  // =======================================================
  // PRESERVE ACCOUNT 2 INFORMATION
  //
  // We do NOT create new data here.
  //
  // The email and contact number were already saved by
  // Create Account 2.
  //
  // This function simply makes sure that saved information
  // remains untouched while moving through verification.
  // =======================================================

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



  // =======================================================
  // SET BACK BUTTON DESTINATION
  //
  // Back returns to the correct Create Account 2 page.
  //
  // The saved email/contact number remains in sessionStorage.
  // =======================================================

  if (backButton) {

    backButton.setAttribute(
      "href",
      originCreateAccountPage
    );

  }



  // =======================================================
  // BACK BUTTON CLICK
  // =======================================================

  document
    .querySelectorAll('[data-nav="back"]')
    .forEach((link) => {

      link.addEventListener(
        "click",
        (event) => {

          event.preventDefault();


          // Preserve existing account information.
          preserveAccountStep2Data();


          // Return to the correct Create Account 2 page.
          window.location.href =
            originCreateAccountPage;

        }
      );

    });



  // =======================================================
  // SET PROCEED BUTTON DESTINATION
  // =======================================================

  if (proceedButton) {

    proceedButton.setAttribute(
      "href",
      originCreateAccountPage
    );

  }



  // =======================================================
  // PROCEED BUTTON CLICK
  //
  // IMPORTANT:
  //
  // 1. Preserve email/contact information.
  // 2. Mark the correct account as verified.
  // 3. Preserve the verification origin.
  // 4. Return to Create Account 2.
  //
  // The Create Account 2 page will then restore the saved
  // email/contact information and display:
  //
  //     Account Verified
  //
  // =======================================================

  document
    .querySelectorAll('[data-nav="proceed"]')
    .forEach((link) => {

      link.addEventListener(
        "click",
        (event) => {

          event.preventDefault();


          // -------------------------------------------------
          // PRESERVE EMAIL + CONTACT NUMBER
          // -------------------------------------------------

          preserveAccountStep2Data();


          // -------------------------------------------------
          // MARK ACCOUNT AS VERIFIED
          // -------------------------------------------------

          sessionStorage.setItem(
            verificationKey,
            "true"
          );


          // -------------------------------------------------
          // PRESERVE VERIFICATION ORIGIN
          // -------------------------------------------------

          sessionStorage.setItem(
            "verificationOrigin",
            origin
          );


          // -------------------------------------------------
          // RETURN TO CREATE ACCOUNT 2
          // -------------------------------------------------

          window.location.href =
            originCreateAccountPage;

        }
      );

    });

});
