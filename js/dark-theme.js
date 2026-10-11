(function () {
  var THEME_STORAGE_KEY = "profconsult_theme";

  var BUTTON_STORAGE_KEY = "profconsult_theme_button";
  var BUTTON_DEFAULT_VISIBLE = true;

  var SURFACE = "pc-dark-surface";
  var INNER = "pc-dark-surface-inner";
  var TXT = "pc-dark-text";
  var SOFT = "pc-dark-text-soft";
  var HEAD = "pc-dark-header";
  var GRAD = "pc-dark-gradient-text";
  var DEEP = "pc-dark-surface-deep";

  var ALL_CLASSES = [SURFACE, INNER, DEEP, TXT, SOFT, HEAD, GRAD];

  var KEEP_LIGHT_SELECTOR = ".message-display, .pc-keep-light";

  var COLOR_CARD = "#301315";
  var COLOR_SUBCARD = "#4a1c1f";
  var COLOR_SUBCARD_DEEP = "#5c2427";
  var COLOR_BORDER = "rgba(255,255,255,.14)";

  var COLOR_MOON = "#1a1a1a";

  var SKIP_SURFACE_TAGS = " A BUTTON INPUT SELECT TEXTAREA OPTION IMG SVG SCRIPT STYLE NOSCRIPT HTML BODY ";
  var SKIP_TEXT_TAGS = " SCRIPT STYLE NOSCRIPT TEMPLATE ";

  var observer = null;
  var scanQueued = false;

  var currentScript = document.currentScript;
  var IS_PUBLIC = !!(currentScript && currentScript.getAttribute("data-scope") === "public");

  var MOON_SVG =
    '<svg class="pc-icon-moon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/></svg>';

  var SUN_SVG =
    '<svg class="pc-icon-sun" viewBox="0 0 24 24" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="4.2" fill="currentColor"/>' +
    '<path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" ' +
    'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';

  var NAV_CSS =
    '.pc-nav-theme-toggle{flex-shrink:0;width:40px;height:40px;padding:0;border:none;border-radius:50%;' +
      'background:rgba(255,255,255,.15);color:#ffffff;display:flex;align-items:center;justify-content:center;' +
      'cursor:pointer;transition:background-color .2s ease;}' +
    '.pc-nav-theme-toggle:hover{background:rgba(255,255,255,.28);}' +
    '.pc-nav-theme-toggle:focus-visible{outline:2px solid #ffffff;outline-offset:2px;}' +
    '.pc-nav-theme-toggle svg{width:20px;height:20px;color:#ffffff;}' +
    '.pc-nav-theme-toggle .pc-icon-moon{color:' + COLOR_MOON + ';}' +
    '.pc-nav-theme-toggle .pc-icon-sun{display:none;}' +
    'html[data-theme="dark"] .pc-nav-theme-toggle .pc-icon-sun{display:block;}' +
    'html[data-theme="dark"] .pc-nav-theme-toggle .pc-icon-moon{display:none;}';

  var PUBLIC_BG =
    'radial-gradient(ellipse 70% 70% at 0% 0%,rgba(40,8,12,.8) 0%,rgba(40,8,12,.38) 45%,rgba(40,8,12,0) 100%),' +
    'radial-gradient(ellipse 65% 65% at 100% 100%,rgba(40,8,12,.75) 0%,rgba(40,8,12,.34) 45%,rgba(40,8,12,0) 100%),' +
    'linear-gradient(135deg,rgba(78,21,16,.86) 0%,rgba(117,27,14,.82) 55%,rgba(165,34,10,.84) 100%)';

  var PUBLIC_CSS =
    '.pc-theme-toggle{position:fixed;top:20px;right:20px;z-index:1000;width:40px;height:40px;padding:0;' +
      'border:none;border-radius:50%;cursor:pointer;background:#ffffff;display:flex;align-items:center;' +
      'justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,.28);' +
      'transition:background-color .25s ease,box-shadow .25s ease;}' +
    '.pc-theme-toggle:focus-visible{outline:2px solid #ff4a00;outline-offset:3px;}' +
    '.pc-theme-toggle svg{width:20px;height:20px;}' +
    '.pc-theme-toggle .pc-icon-moon{color:' + COLOR_MOON + ';}' +
    '.pc-theme-toggle .pc-icon-sun{display:none;color:#ffffff;}' +
    'html[data-theme="dark"] .pc-theme-toggle{background:#3a1a1d;' +
      'box-shadow:inset 0 0 0 1px rgba(255,255,255,.28),0 6px 16px rgba(0,0,0,.45);}' +
    'html[data-theme="dark"] .pc-theme-toggle .pc-icon-sun{display:block;}' +
    'html[data-theme="dark"] .pc-theme-toggle .pc-icon-moon{display:none;}' +
    'html[data-theme="dark"][data-pc-scope="public"] body::after{content:"";position:fixed;top:0;left:0;' +
      'right:0;bottom:0;z-index:-1;pointer-events:none;' +
      'background:' + PUBLIC_BG + ';}' +
    'html[data-theme="dark"][data-pc-scope="public"] ' +
      'body:has(.page-background-overlay,.faculty-page-background-overlay)::after{display:none;}' +
    'html[data-theme="dark"][data-pc-scope="public"] .page-background-overlay{' +
      'background:' + PUBLIC_BG + '!important;' +
      'opacity:1!important;}' +
    'html[data-theme="dark"][data-pc-scope="public"] .pc-dark-surface{border-color:rgba(255,255,255,.78)!important;}' +
    'html[data-theme="dark"][data-pc-scope="public"] .create-account-link::after{background:rgba(255,255,255,.85)!important;}';

  var SWITCH_CSS =
    'html[data-pc-button="off"] #pcThemeToggle{display:none!important;}' +
    '#darkModeCheckbox{display:none!important;}' +
    '.pc-switch{flex-shrink:0;position:relative;width:52px;height:28px;padding:0;border:none;' +
      'border-radius:999px;background:#cfcfcf;cursor:pointer;transition:background .25s ease;}' +
    '.pc-switch::before{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;' +
      'border-radius:50%;background:#ffffff;box-shadow:0 2px 5px rgba(0,0,0,.3);' +
      'transition:transform .25s ease;}' +
    '.pc-switch[aria-checked="true"]{background:linear-gradient(90deg,#7a1010,#f2601c);}' +
    '.pc-switch[aria-checked="true"]::before{transform:translateX(24px);}' +
    '.pc-switch:focus-visible{outline:2px solid #ff4a00;outline-offset:3px;}';

  var AUTO_CSS =
    'html[data-theme="dark"] .pc-dark-surface{' +
      'background-color:' + COLOR_CARD + '!important;' +
      'box-shadow:inset 0 0 0 1px ' + COLOR_BORDER + ',0 14px 36px rgba(0,0,0,.45)!important;}' +
    'html[data-theme="dark"] .pc-dark-surface-inner{' +
      'background-color:' + COLOR_SUBCARD + '!important;' +
      'box-shadow:inset 0 0 0 1px ' + COLOR_BORDER + '!important;}' +
    'html[data-theme="dark"] .pc-dark-surface-deep{' +
      'background-color:' + COLOR_SUBCARD_DEEP + '!important;' +
      'box-shadow:inset 0 0 0 1px ' + COLOR_BORDER + '!important;}' +
    'html[data-theme="dark"] .pc-dark-text{color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;}' +
    'html[data-theme="dark"] .pc-dark-text-soft{color:#e6dcdd!important;-webkit-text-fill-color:#e6dcdd!important;}' +
    'html[data-theme="dark"] .pc-dark-header{' +
      'background-image:none!important;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;}' +
    'html[data-theme="dark"] .profile-photo,' +
    'html[data-theme="dark"] .faculty-profile-photo,' +
    'html[data-theme="dark"] .student-profile-photo{background-color:#ffffff!important;}' +
    'html.pc-scanning *,html.pc-scanning *::before,html.pc-scanning *::after{transition:none!important;}' +
    NAV_CSS +
    PUBLIC_CSS +
    SWITCH_CSS;

  function injectCss() {
    if (document.getElementById("pc-dark-auto-style")) return;
    var style = document.createElement("style");
    style.id = "pc-dark-auto-style";
    style.textContent = AUTO_CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function getButtonVisible() {
    try {
      var saved = window.localStorage.getItem(BUTTON_STORAGE_KEY);
      if (saved === "on") return true;
      if (saved === "off") return false;
    } catch (error) {
    }
    return BUTTON_DEFAULT_VISIBLE;
  }

  function applyButtonVisibility() {
    document.documentElement.setAttribute("data-pc-button", getButtonVisible() ? "on" : "off");
  }

  function setButtonVisible(visible) {
    try {
      window.localStorage.setItem(BUTTON_STORAGE_KEY, visible ? "on" : "off");
    } catch (error) {
    }
    applyButtonVisibility();
    syncSwitch();
    if (!visible) setTheme("light");
  }

  function syncSwitch() {
    var switches = document.querySelectorAll(".pc-switch");
    for (var i = 0; i < switches.length; i++) {
      switches[i].setAttribute("aria-checked", getButtonVisible() ? "true" : "false");
    }
  }

  function getTheme() {
    if (!getButtonVisible()) return "light";
    try {
      return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
    } catch (error) {
      return "light";
    }
  }

  function isDark() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    syncToggle();
    syncAutoSurfaces();
  }

  function syncToggle() {
    var button = document.getElementById("pcThemeToggle");
    if (!button) return;
    var dark = isDark();
    var label = dark ? "Switch to light mode" : "Switch to dark mode";
    button.setAttribute("aria-pressed", dark ? "true" : "false");
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  function buildNavToggle() {
    if (!document.body || document.getElementById("pcThemeToggle")) return;

    var navRight = document.querySelector(".navbar-right, .faculty-navbar-right");
    if (!navRight) return;

    var button = document.createElement("button");
    button.type = "button";
    button.id = "pcThemeToggle";
    button.className = "pc-nav-theme-toggle";
    button.innerHTML = MOON_SVG + SUN_SVG;
    button.addEventListener("click", function () {
      setTheme(isDark() ? "light" : "dark");
    });

    navRight.insertBefore(button, navRight.firstChild);
    syncToggle();
  }

  function buildPublicToggle() {
    if (!document.body || document.getElementById("pcThemeToggle")) return;

    var button = document.createElement("button");
    button.type = "button";
    button.id = "pcThemeToggle";
    button.className = "pc-theme-toggle";
    button.innerHTML = MOON_SVG + SUN_SVG;
    button.addEventListener("click", function () {
      setTheme(isDark() ? "light" : "dark");
    });

    document.body.appendChild(button);
    syncToggle();
  }

  function setTheme(theme) {
    var normalized = theme === "dark" ? "dark" : "light";
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch (error) {
    }
    applyTheme(normalized);
  }

  function parseColor(value) {
    var match = /rgba?\(([^)]+)\)/.exec(value || "");
    if (!match) return null;
    var parts = match[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    if (parts.length < 3) return null;
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }

  function channelMin(c) { return Math.min(c.r, c.g, c.b); }
  function channelMax(c) { return Math.max(c.r, c.g, c.b); }

  function isLight(c, minChannel) {
    return channelMin(c) >= minChannel && channelMax(c) - channelMin(c) <= 24;
  }

  function isSvg(el) {
    return el.tagName && el.tagName.toLowerCase() === "svg";
  }

  function hasOwnText(el) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var node = el.childNodes[i];
      if (node.nodeType === 3 && node.nodeValue.trim() !== "") return true;
    }
    return false;
  }

  function isPlainWhite(c) {
    return channelMin(c) >= 228 &&
      channelMax(c) - channelMin(c) <= 14 &&
      c.g <= c.r + 2 &&
      c.b <= c.r + 2;
  }

  function isSurface(cs, el) {
    if (cs.backgroundImage !== "none") return false;
    var c = parseColor(cs.backgroundColor);
    if (!c || c.a < 0.8 || !isPlainWhite(c)) return false;
    var radius = cs.borderTopLeftRadius || "";
    if (radius.indexOf("%") !== -1) return false;
    if (parseFloat(radius) >= 10) return true;
    return IS_PUBLIC && el.offsetWidth >= 280 && el.offsetHeight >= 200;
  }

  function isCardEl(el) {
    return el.classList.contains(SURFACE) || el.classList.contains(INNER) || el.classList.contains(DEEP);
  }

  function isKeepLight(el) {
    return !!(el.matches && el.matches(KEEP_LIGHT_SELECTOR));
  }

  function isField(el) {
    var tag = el.tagName.toUpperCase();
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  function cardDepth(el) {
    var depth = 0;
    for (var p = el.parentElement; p; p = p.parentElement) {
      if (isCardEl(p)) depth++;
    }
    return depth;
  }

  function contextOf(el) {
    for (var n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      if (isCardEl(n)) return "surface";
      var cs = window.getComputedStyle(n);
      if (cs.backgroundImage !== "none") return "colored";
      var c = parseColor(cs.backgroundColor);
      if (c && c.a >= 0.5) {
        if (isLight(c, 190)) return "light";
        if (channelMax(c) <= 90) return "surface";
        return "colored";
      }
    }
    return "page";
  }

  function darkTextClass(c) {
    if (channelMax(c) > 150 || channelMax(c) - channelMin(c) > 32) return null;
    return (c.r + c.g + c.b) / 3 <= 90 ? TXT : SOFT;
  }

  function hasMarker(el) {
    for (var i = 0; i < ALL_CLASSES.length; i++) {
      if (el.classList.contains(ALL_CLASSES[i])) return true;
    }
    return false;
  }

  function scan() {
    if (!document.body || !isDark()) return;

    stopObserving();

    document.documentElement.classList.add("pc-scanning");
    clearAll();

    var all = document.body.getElementsByTagName("*");
    var i, el, cs;

    for (i = 0; i < all.length; i++) {
      el = all[i];
      if (isCardEl(el)) continue;
      if (isKeepLight(el)) continue;
      if (SKIP_SURFACE_TAGS.indexOf(" " + el.tagName.toUpperCase() + " ") !== -1) continue;
      if (el.offsetWidth < 160 || el.offsetHeight < 64) continue;

      cs = window.getComputedStyle(el);
      if (isSurface(cs, el)) {
        var depth = cardDepth(el);
        el.classList.add(depth === 0 ? SURFACE : depth === 1 ? INNER : DEEP);
      }
    }

    for (i = 0; i < all.length; i++) {
      el = all[i];
      if (SKIP_TEXT_TAGS.indexOf(" " + el.tagName.toUpperCase() + " ") !== -1) continue;
      if (isCardEl(el)) continue;
      if (el.classList.contains(TXT) || el.classList.contains(SOFT) ||
          el.classList.contains(HEAD) || el.classList.contains(GRAD)) continue;

      cs = window.getComputedStyle(el);

      var clip = cs.webkitBackgroundClip || cs.backgroundClip;
      if (clip === "text") {
        var headingContext = contextOf(el.parentElement || el);
        if (headingContext === "page" || headingContext === "surface") el.classList.add(HEAD);
        continue;
      }

      if (!hasOwnText(el) && !isSvg(el) && !isField(el)) continue;

      var c = parseColor(cs.color);
      if (!c || c.a < 0.5) continue;

      var context = contextOf(el);

      if (context === "page") {
        if (channelMin(c) < 200) el.classList.add(TXT);
      } else if (context === "surface") {
        var cls = darkTextClass(c);
        if (!cls && IS_PUBLIC && el.tagName.toUpperCase() === "A" && c.r >= 170 && c.g <= 90 && c.b <= 90) {
          cls = TXT;
        }
        if (cls) el.classList.add(cls);
      }
    }

    void document.body.offsetWidth;
    document.documentElement.classList.remove("pc-scanning");

    startObserving();
  }

  function clearAll() {
    var marked = document.querySelectorAll(
      "." + ALL_CLASSES.join(", .")
    );
    for (var i = 0; i < marked.length; i++) {
      for (var j = 0; j < ALL_CLASSES.length; j++) {
        marked[i].classList.remove(ALL_CLASSES[j]);
      }
    }
  }

  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    window.requestAnimationFrame(function () {
      scanQueued = false;
      scan();
    });
  }

  function startObserving() {
    if (!document.body) return;
    if (!observer) observer = new MutationObserver(queueScan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "hidden", "style"]
    });
  }

  function stopObserving() {
    if (observer) observer.disconnect();
  }

  function syncAutoSurfaces() {
    if (!document.body) return;
    if (isDark()) {
      scan();
    } else {
      stopObserving();
      clearAll();
    }
  }

  if (IS_PUBLIC) {
    document.documentElement.setAttribute("data-pc-scope", "public");
  }

  injectCss();
  applyButtonVisibility();
  applyTheme(getTheme());

  window.ProfConsultTheme = {
    get: getTheme,
    set: setTheme,
    getButton: getButtonVisible,
    setButton: setButtonVisible
  };

  window.addEventListener("storage", function (event) {
    if (event.key === THEME_STORAGE_KEY) {
      applyTheme(getTheme());
    }
    if (event.key === BUTTON_STORAGE_KEY) {
      applyButtonVisibility();
      applyTheme(getTheme());
      syncSwitch();
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    if (IS_PUBLIC) buildPublicToggle();
    else buildNavToggle();
    syncAutoSurfaces();

    var darkModeCheckbox = document.getElementById("darkModeCheckbox");
    if (darkModeCheckbox && darkModeCheckbox.parentNode && !document.getElementById("pcSettingsSwitch")) {
      var settingsSwitch = document.createElement("button");
      settingsSwitch.type = "button";
      settingsSwitch.id = "pcSettingsSwitch";
      settingsSwitch.className = "pc-switch";
      settingsSwitch.setAttribute("role", "switch");
      settingsSwitch.setAttribute("aria-checked", getButtonVisible() ? "true" : "false");
      settingsSwitch.setAttribute("aria-label", "Show dark mode button");
      settingsSwitch.addEventListener("click", function () {
        setButtonVisible(!getButtonVisible());
      });
      var control = darkModeCheckbox;
      while (control.parentElement && control.parentElement !== document.body &&
             control.parentElement.textContent.trim() === "") {
        control = control.parentElement;
      }
      var leftovers = [darkModeCheckbox, control];
      for (var sib = control.nextElementSibling; sib; sib = sib.nextElementSibling) {
        if (sib.tagName === "BUTTON" || sib.textContent.trim() !== "") break;
        leftovers.push(sib);
      }
      control.parentNode.insertBefore(settingsSwitch, control);
      for (var h = 0; h < leftovers.length; h++) {
        leftovers[h].style.setProperty("display", "none", "important");
      }
      syncSwitch();
    }
  });

  window.addEventListener("load", syncAutoSurfaces);

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      if (isDark()) scan();
    }, 150);
  });
})();