(function () {
  var bubble = document.querySelector(".hosts-thought-bubble");
  var section = document.querySelector(".section.section--hosts");
  if (!bubble || !section) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealed = false;
  var timerId = null;

  function reveal() {
    if (revealed) return;
    revealed = true;
    if (timerId) clearTimeout(timerId);
    var delay = reduced ? 0 : 4000;
    timerId = window.setTimeout(function () {
      bubble.classList.add("hosts-thought-bubble--show");
    }, delay);
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) reveal();
      });
    },
    {
      root: null,
      rootMargin: "-28% 0px -28% 0px",
      threshold: [0, 0.05, 0.1],
    }
  );

  io.observe(section);
})();
