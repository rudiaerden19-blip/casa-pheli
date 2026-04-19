(function () {
  var root = document.getElementById("lightbox");
  if (!root) return;

  var img = root.querySelector(".lightbox-img");
  var closeBtn = root.querySelector(".lightbox-close");

  function open(src, alt) {
    img.src = src;
    img.alt = alt || "";
    root.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function close() {
    root.hidden = true;
    img.removeAttribute("src");
    img.alt = "";
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-lightbox]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var thumb = btn.querySelector("img");
      if (!thumb) return;
      open(thumb.currentSrc || thumb.src, thumb.alt);
    });
  });

  closeBtn.addEventListener("click", close);
  root.addEventListener("click", function (e) {
    if (e.target === root) close();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !root.hidden) close();
  });
})();
