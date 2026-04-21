(function () {
  try {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  } catch (e) {}

  function hasTargetFragment() {
    var raw = (window.location.hash || "").trim();
    if (!raw || /^#(page-top|top)$/i.test(raw)) {
      return false;
    }
    try {
      return !!document.querySelector(raw);
    } catch (err) {
      return false;
    }
  }

  function goTop() {
    window.scrollTo(0, 0);
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }

  function apply() {
    if (!hasTargetFragment()) {
      goTop();
    }
  }

  apply();

  window.addEventListener("load", function () {
    if (!hasTargetFragment()) {
      goTop();
    }
  });

  window.addEventListener("pageshow", function () {
    if (!hasTargetFragment()) {
      goTop();
    }
  });
})();
