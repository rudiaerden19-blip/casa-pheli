(function () {
  var root = document.getElementById("cp-cal-root");
  var status = document.getElementById("cp-cal-status");
  if (!root || !window.CpCal) return;

  function stepMonth(y, m, delta) {
    m += delta;
    while (m > 11) {
      m -= 12;
      y++;
    }
    while (m < 0) {
      m += 12;
      y--;
    }
    return { y: y, m: m };
  }

  function render(bookedArr) {
    var booked = new Set(bookedArr || []);
    root.innerHTML = "";
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth();
    for (var i = 0; i < 18; i++) {
      var cur = stepMonth(y, m, i);
      root.appendChild(window.CpCal.monthBlock(cur.y, cur.m, booked, {}));
    }
  }

  function load() {
    if (status) status.textContent = "Kalender laden…";
    fetch("/api/calendar", { cache: "no-store" })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        render(data.booked);
        if (!status) return;
        if (data.configured === false) {
          status.textContent =
            "Alle dagen worden als vrij getoond tot de kalender op de server is geconfigureerd (Vercel Blob + API).";
        } else if (data.updatedAt) {
          status.textContent = "Laatst bijgewerkt: " + new Date(data.updatedAt).toLocaleString("nl-BE");
        } else {
          status.textContent = "";
        }
      })
      .catch(function () {
        if (status) status.textContent = "Kon de kalender niet laden. Probeer later opnieuw.";
        render([]);
      });
  }

  load();
})();
