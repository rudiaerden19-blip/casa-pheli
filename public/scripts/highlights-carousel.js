(function () {
  var viewport = document.querySelector("[data-highlights-carousel]");
  if (!viewport) return;

  var track = viewport.querySelector(".highlights-slider-track");
  var slides = [].slice.call(viewport.querySelectorAll(".highlights-slider-slide"));
  if (!track || slides.length === 0) return;

  var index = 0;
  var intervalMs = 2000;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function syncAria() {
    slides.forEach(function (slide, i) {
      var on = i === index;
      slide.classList.toggle("is-active", on);
      slide.setAttribute("aria-hidden", on ? "false" : "true");
    });
  }

  function goNext() {
    if (slides.length < 2) return;
    index = (index + 1) % slides.length;
    syncAria();
  }

  syncAria();

  if (!reduced && slides.length > 1) {
    window.setInterval(goNext, intervalMs);
  }
})();
