(function () {
  var root = document.getElementById("lightbox");
  if (!root) return;

  var img = root.querySelector(".lightbox-img");
  var closeBtn = root.querySelector(".lightbox-close");
  var prevBtn = root.querySelector(".lightbox-prev");
  var nextBtn = root.querySelector(".lightbox-next");

  var items = [];
  var index = 0;

  function thumbFrom(item) {
    return item ? item.querySelector("img") : null;
  }

  /** Galerij zonder groep; homepage gebruikt o.a. discover / highlights. */
  function itemsForGroupKey(key) {
    if (!key || key === "__default__") {
      return Array.prototype.slice.call(
        document.querySelectorAll("[data-lightbox]:not([data-lightbox-group])")
      );
    }
    return Array.prototype.slice.call(
      document.querySelectorAll('[data-lightbox][data-lightbox-group="' + key + '"]')
    );
  }

  function groupKeyFromButton(btn) {
    var g = btn.getAttribute("data-lightbox-group");
    return g == null || g === "" ? "__default__" : g;
  }

  function showAt(i) {
    if (!items.length) return;
    index = (i + items.length) % items.length;
    var thumb = thumbFrom(items[index]);
    if (!thumb) return;
    img.src = thumb.currentSrc || thumb.src;
    img.alt = thumb.alt || "";
  }

  function openAt(i) {
    showAt(i);
    root.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function openFromButton(btn) {
    items = itemsForGroupKey(groupKeyFromButton(btn));
    var i = items.indexOf(btn);
    if (i < 0) return;
    openAt(i);
  }

  function close() {
    root.hidden = true;
    img.removeAttribute("src");
    img.alt = "";
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-lightbox]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openFromButton(btn);
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      showAt(index - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      showAt(index + 1);
    });
  }

  closeBtn.addEventListener("click", close);
  root.addEventListener("click", function (e) {
    if (e.target === root) close();
  });

  document.addEventListener("keydown", function (e) {
    if (root.hidden) return;
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      showAt(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      showAt(index + 1);
    }
  });
})();
