(function () {
  var root = document.querySelector("[data-hero-slider]");
  if (!root) return;

  var slides = root.querySelectorAll(".hero-slide");
  var dots = document.querySelectorAll("[data-hero-dot]");
  if (!slides.length) return;

  var i = 0;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function show(index) {
    var idx = ((index % slides.length) + slides.length) % slides.length;
    slides.forEach(function (el, j) {
      el.classList.toggle("is-active", j === idx);
    });
    dots.forEach(function (el, j) {
      var on = j === idx;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
    });
    i = idx;
  }

  dots.forEach(function (el, j) {
    el.addEventListener("click", function () {
      show(j);
    });
  });

  if (reduced) return;

  window.setInterval(function () {
    show(i + 1);
  }, 3000);
})();
