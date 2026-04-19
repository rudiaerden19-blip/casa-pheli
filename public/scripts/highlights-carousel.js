(function () {
  var root = document.querySelector("[data-highlights-carousel]");
  if (!root) return;

  var panel = root.querySelector(".highlights-panel");
  var img = root.querySelector(".highlights-photo");
  if (!panel || !img) return;

  var slides = [
    { src: "/assets/gallery/galerij-01.png", alt: "Woonkamer Casa Pheli" },
    { src: "/assets/gallery/galerij-03.png", alt: "Slaapkamer Casa Pheli" },
    { src: "/assets/gallery/galerij-19.png", alt: "Badkamer en suite" },
    { src: "/assets/gallery/galerij-05.png", alt: "Zwembad en residentie" },
    { src: "/assets/gallery/galerij-09.png", alt: "Binnenzwembad en spa" },
    { src: "/assets/gallery/galerij-08.png", alt: "Fitnessruimte" },
    { src: "/assets/gallery/galerij-10.png", alt: "Padelterrein Area Beach III" },
    { src: "/assets/gallery/galerij-04.png", alt: "Terras met uitzicht" },
    { src: "/assets/gallery/galerij-02.png", alt: "Keuken Casa Pheli" },
    { src: "/assets/gallery/galerij-06.png", alt: "Residentieel complex vanuit de lucht" }
  ];

  var i = 0;
  var betweenMs = 550;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function applySlide() {
    var s = slides[i];
    img.src = s.src;
    img.alt = s.alt;
  }

  function nextSlide() {
    i = (i + 1) % slides.length;
    applySlide();
  }

  if (reduceMotion) {
    setInterval(function () {
      nextSlide();
    }, 5500);
    return;
  }

  function startSpin() {
    panel.classList.add("is-rotating");
  }

  panel.addEventListener(
    "animationend",
    function () {
      panel.classList.remove("is-rotating");
      nextSlide();
      void panel.offsetWidth;
      window.setTimeout(startSpin, betweenMs);
    },
    false
  );

  window.setTimeout(startSpin, 850);
})();
