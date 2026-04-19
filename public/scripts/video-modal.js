(function () {
  var openBtns = document.querySelectorAll("[data-video-modal-open]");
  var modal = document.getElementById("video-modal");
  var player = document.getElementById("video-modal-player");
  if (!modal || openBtns.length === 0) return;

  var closers = modal.querySelectorAll("[data-video-modal-close]");
  var lastOpener = null;

  function openModal() {
    modal.removeAttribute("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = modal.querySelector(".video-modal__close");
    if (closeBtn) closeBtn.focus();
    if (player) {
      var p = player.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    }
  }

  function closeModal() {
    modal.setAttribute("hidden", "");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (player) {
      player.pause();
      player.currentTime = 0;
    }
    if (lastOpener && typeof lastOpener.focus === "function") {
      lastOpener.focus();
    } else if (openBtns[0]) {
      openBtns[0].focus();
    }
  }

  openBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      lastOpener = btn;
      openModal();
    });
  });

  closers.forEach(function (el) {
    el.addEventListener("click", function () {
      closeModal();
    });
  });

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key === "Escape" && !modal.hasAttribute("hidden")) {
        closeModal();
      }
    },
    false
  );
})();
