(function () {
  var section = document.querySelector(".section--amenities");
  var grid = section && section.querySelector(".amenities-grid");
  if (!section || !grid) return;

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    grid.classList.add("is-revealed");
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
    window.removeEventListener("scroll", tryReveal, true);
    window.removeEventListener("resize", tryReveal);
  }

  tryReveal();
  window.addEventListener("scroll", tryReveal, { passive: true });
  window.addEventListener("resize", tryReveal);
})();
