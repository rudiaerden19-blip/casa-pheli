(function () {
  var viewport = document.querySelector("[data-highlights-carousel]");
  if (!viewport) return;

  var track = viewport.querySelector(".highlights-slider-track");
  var slides = [].slice.call(viewport.querySelectorAll(".highlights-slider-slide"));
  if (!track || slides.length === 0) return;

  var index = 0;
  var intervalMs = 2000;

  function slideWidth() {
    var w = viewport.getBoundingClientRect().width;
    return w ? Math.floor(w) : 0;
  }

  function layout() {
    var w = slideWidth();
    if (!w) return;
    slides.forEach(function (slide) {
      slide.style.width = w + "px";
    });
    track.style.transform = "translateX(" + -index * w + "px)";
  }

  function goNext() {
    var w = slideWidth();
    if (!w) return;
    if (index >= slides.length - 1) {
      track.style.transition = "none";
      track.style.transform = "translateX(0)";
      index = 0;
      void track.offsetWidth;
      track.style.transition = "";
      return;
    }
    index += 1;
    track.style.transform = "translateX(" + -index * w + "px)";
  }

  layout();
  window.addEventListener("load", layout, false);

  window.addEventListener(
    "resize",
    function () {
      layout();
    },
    false
  );

  window.setInterval(function () {
    goNext();
  }, intervalMs);
})();
