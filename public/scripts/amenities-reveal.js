(function () {
  var section = document.querySelector(".section--amenities");
  var grid = section && section.querySelector(".amenities-grid");
  if (!section || !grid) return;

  var keyholder = section.querySelector(".amenities-keyholder");
  /** Sync met styles.css: 9e kaart transition-delay + opacity-duur */
  var NINTH_CARD_DELAY_S = 3.6;
  var CARD_REVEAL_DURATION_S = 0.42;
  var KEYHOLDER_AFTER_NINTH_MS = 40;

  function showKeyholder() {
    if (keyholder) keyholder.classList.add("is-visible");
  }

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    grid.classList.add("is-revealed");
    showKeyholder();
    return;
  }

  var done = false;

  function viewportMidInSection() {
    var r = section.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var mid = vh / 2;
    return r.top < mid && r.bottom > mid;
  }

  function tryReveal() {
    if (done) return;
    if (!viewportMidInSection()) return;
    done = true;
    grid.classList.add("is-revealed");
    window.removeEventListener("scroll", tryReveal, scrollOpts);
    window.removeEventListener("resize", tryReveal);
    var delayMs =
      Math.round((NINTH_CARD_DELAY_S + CARD_REVEAL_DURATION_S) * 1000) + KEYHOLDER_AFTER_NINTH_MS;
    window.setTimeout(showKeyholder, delayMs);
  }

  var scrollOpts = { passive: true };

  tryReveal();
  window.addEventListener("scroll", tryReveal, scrollOpts);
  window.addEventListener("resize", tryReveal);
})();
