(function () {
  var KEY = "casa-pheli-cookie-choice";
  var banner = document.getElementById("cookie-banner");
  if (!banner) return;

  function show() {
    banner.removeAttribute("hidden");
    banner.setAttribute("aria-hidden", "false");
  }

  function hide() {
    banner.setAttribute("hidden", "");
    banner.setAttribute("aria-hidden", "true");
  }

  try {
    if (!localStorage.getItem(KEY)) show();
    else hide();
  } catch (e) {
    show();
  }

  function save(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch (err) {}
    hide();
  }

  var accept = banner.querySelector(".cookie-banner__accept");
  var reject = banner.querySelector(".cookie-banner__reject");
  if (accept) {
    accept.addEventListener("click", function () {
      save("accepted");
    });
  }
  if (reject) {
    reject.addEventListener("click", function () {
      save("essential");
    });
  }
})();
