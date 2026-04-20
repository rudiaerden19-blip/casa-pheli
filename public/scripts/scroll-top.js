(function () {
  var btn = document.getElementById("home-scroll-top");
  if (!btn) return;
  function sync() {
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    btn.classList.toggle("is-visible", y > 280);
  }
  sync();
  window.addEventListener("scroll", sync, { passive: true });
})();
