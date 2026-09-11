// The landing page ("/") lives in its own hidden tab (see docs.json), so no
// tab in the visible nav bar actually corresponds to it. Mintlify still picks
// a fallback "active" tab when the current path matches nothing - in this
// case the first visible tab, "Get Started" - and marks it with data-active
// plus an orange underline, which reads as "you are in Get Started" even
// though you're on the standalone home page. There's no docs.json setting
// for this, so this sets data-on-landing on <body> for style.css to key off.
// pushState/replaceState are patched (alongside popstate and the initial
// load) because Mintlify's nav is a client-side app shell, not a full page
// reload per link.
(function () {
  var LANDING_PATHS = ["/", "/index"];

  function syncLandingState() {
    var onLanding = LANDING_PATHS.indexOf(window.location.pathname) !== -1;
    document.body.setAttribute("data-on-landing", onLanding ? "true" : "false");
  }

  var pushState = history.pushState;
  history.pushState = function () {
    pushState.apply(this, arguments);
    syncLandingState();
  };

  var replaceState = history.replaceState;
  history.replaceState = function () {
    replaceState.apply(this, arguments);
    syncLandingState();
  };

  window.addEventListener("popstate", syncLandingState);
  document.addEventListener("DOMContentLoaded", syncLandingState);
  syncLandingState();
})();
