(function () {
  var openers = document.querySelectorAll("[data-legal-modal-open]");
  var modals = document.querySelectorAll(".legal-modal");
  if (!openers.length || !modals.length) return;

  var lastOpener = null;

  function getModal(id) {
    return document.getElementById("legal-modal-" + id);
  }

  function openModal(id, opener) {
    var modal = getModal(id);
    if (!modal) return;
    lastOpener = opener;
    modal.removeAttribute("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var closeBtn = modal.querySelector(".legal-modal__close");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.setAttribute("hidden", "");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastOpener && typeof lastOpener.focus === "function") {
      lastOpener.focus();
    }
    lastOpener = null;
  }

  function closeAnyOpen() {
    modals.forEach(function (m) {
      if (!m.hasAttribute("hidden")) closeModal(m);
    });
  }

  openers.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-legal-modal-open");
      if (id) openModal(id, btn);
    });
  });

  document.querySelectorAll("[data-legal-modal-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      var modal = el.closest(".legal-modal");
      if (modal) closeModal(modal);
      else closeAnyOpen();
    });
  });

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "Escape") return;
      modals.forEach(function (m) {
        if (!m.hasAttribute("hidden")) closeModal(m);
      });
    },
    false
  );
})();
