(function () {
  var root = document.getElementById("lightbox");
  if (!root) return;

  var img = root.querySelector(".lightbox-img");
  var closeBtn = root.querySelector(".lightbox-close");
  var prevBtn = root.querySelector(".lightbox-prev");
  var nextBtn = root.querySelector(".lightbox-next");

  var items = Array.prototype.slice.call(document.querySelectorAll("[data-lightbox]"));
  var index = 0;

  function thumbFrom(item) {
    return item ? item.querySelector("img") : null;
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

  function close() {
    root.hidden = true;
    img.removeAttribute("src");
    img.alt = "";
    document.body.style.overflow = "";
  }

  items.forEach(function (btn, i) {
    btn.addEventListener("click", function () {
      openAt(i);
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
