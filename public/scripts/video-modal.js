(function () {
  var openBtns = document.querySelectorAll("[data-video-modal-open]");
  var modal = document.getElementById("video-modal");
  var player = document.getElementById("video-modal-player");
  if (!modal || openBtns.length === 0 || !player) return;

  var closers = modal.querySelectorAll("[data-video-modal-close]");
  var lastOpener = null;
  var defaultSrc =
    player.getAttribute("src") || "/assets/video/kijk-video.mp4";

  function setSourceFromButton(btn) {
    var src = btn.getAttribute("data-video-src") || defaultSrc;
    if (player.getAttribute("src") !== src) {
      player.src = src;
    }
    player.load();
  }

  function openModal(btn) {
    setSourceFromButton(btn);
    var fill = btn.hasAttribute("data-video-fill");
    modal.classList.toggle("video-modal--fill", fill);

    modal.removeAttribute("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = modal.querySelector(".video-modal__close");
    if (closeBtn) closeBtn.focus();

    var playPromise = player.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {});
    }
  }

  function closeModal() {
    modal.classList.remove("video-modal--fill");
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
      openModal(btn);
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
