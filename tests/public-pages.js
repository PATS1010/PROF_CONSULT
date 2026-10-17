// Exercise real public-page navigation without creating an account.
document.addEventListener('DOMContentLoaded', async () => {
  const wait = (ms = 80) => new Promise(resolve => setTimeout(resolve, ms));
  const check = (value, label) => { if (!value) throw Error(label); };
  const finish = text => {
    const result = document.createElement('pre');
    result.id = 'regression-result';
    result.textContent = text;
    document.body.append(result);
  };
  try {
    await wait();
    if (document.querySelector('.hero')) {
      const chart = document.querySelector('.team-chart');
      check(chart.querySelectorAll('.team-member').length === 7, 'All original team members are present');
      const image = chart.querySelector('.team-chart-image');
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      check(context.getImageData(0, 0, 1, 1).data[3] === 0, 'Team chart canvas has a transparent background');
      check(context.getImageData(Math.round(canvas.width * .441), Math.round(canvas.height * .0865), 1, 1).data[3] === 0, 'Background inside the portrait is transparent');
      for (const theme of ['light', 'dark']) {
        window.ProfConsultTheme.set(theme);
        await wait(300);
        const background = getComputedStyle(chart).backgroundColor;
        check(theme === 'dark' ? background !== 'rgb(255, 255, 255)' : background === 'rgb(255, 255, 255)', 'Team background follows ' + theme + ' mode');
        for (const img of chart.querySelectorAll('img')) await img.decode();
        check(document.documentElement.scrollWidth <= innerWidth, 'Team layout fits the phone width');
      }
      document.getElementById('about-us').scrollIntoView({behavior: 'instant'});
      const originalPath = location.pathname;
      document.getElementById('navToggle').click();
      document.querySelector('#navLinks [data-nav="home"]').click();
      await wait(1300);
      check(location.pathname === originalPath && scrollY < 5, 'Home returns to the title section on the landing page');
      check(!document.getElementById('navLinks').classList.contains('is-open'), 'Home closes the phone menu');
      document.getElementById('about-us').scrollIntoView({behavior: 'instant'});
      const previewTheme = new URLSearchParams(location.search).get('theme');
      if (previewTheme === 'light' || previewTheme === 'dark') window.ProfConsultTheme.set(previewTheme);
      await wait();
      finish('PASS landing Home navigation, team portraits, light/dark backgrounds, and responsive layout');
      return;
    }
    if (document.querySelector('#loginForm, #studentLoginForm, #facultyLoginForm')) {
      const links = document.querySelectorAll('.create-account-link');
      check(links.length === 1 && links[0].textContent.trim() === 'Register', 'Login has one Register link');
      check(links[0].getAttribute('href') === 'choose-account.html', 'Register points to account selection');
      sessionStorage.setItem('public_registration_role', new URLSearchParams(location.search).get('role') || 'student');
      links[0].click();
      return;
    }
    const role = sessionStorage.getItem('public_registration_role');
    if (!role) return;
    if (document.querySelector('.account-cards')) {
      check(document.querySelectorAll('.account-card-button').length === 2, 'Account picker offers student and professor');
      document.querySelector(`[data-nav="${role}"]`).click();
      return;
    }
    check(!!document.getElementById(role === 'faculty' ? 'facultyIdNumber' : 'studentNumber'), 'Selected account type opens its registration form');
    check(location.search.includes('from=choose-account'), 'Registration retains its back destination');
    sessionStorage.removeItem('public_registration_role');
    finish('PASS Register opens account selection then the ' + role + ' registration form');
  } catch (error) { finish('FAIL ' + error.message); }
});
