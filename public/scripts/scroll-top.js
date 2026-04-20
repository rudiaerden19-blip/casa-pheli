(function () {
  var btn = document.getElementById("home-scroll-top");
  if (!btn) return;

  var hideNearSel = btn.getAttribute("data-hide-near");
  var hideNearEl = hideNearSel ? document.querySelector(hideNearSel) : null;

  function sectionCoversViewport(el) {
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    if (vh <= 0) return false;
    // Sectie merkbaar in beeld: knop verbergen (o.a. homepage “Waarom Casa Pheli”)
    return rect.top < vh * 0.9 && rect.bottom > vh * 0.1;
  }

  function sync() {
    var y = window.scrollY || document.documentElement.scrollTop || 0;
    var visible = y > 280;
    if (visible && hideNearEl && sectionCoversViewport(hideNearEl)) {
      visible = false;
    }
    btn.classList.toggle("is-visible", visible);
  }

  sync();
  window.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync, { passive: true });
})();
