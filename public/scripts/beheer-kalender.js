(function () {
  var root = document.getElementById("cp-cal-root");
  var status = document.getElementById("cp-cal-status");
  var saveBtn = document.getElementById("cp-cal-save");
  var tokenInput = document.getElementById("cp-cal-token");
  if (!root || !saveBtn || !tokenInput || !window.CpCal) return;

  var booked = new Set();
  var sections = [];

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

  function rebuild() {
    root.innerHTML = "";
    sections = [];
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth();
    for (var i = 0; i < 18; i++) {
      var cur = stepMonth(y, m, i);
      var sec = window.CpCal.monthBlock(cur.y, cur.m, booked, {
        interactive: true,
        onToggle: function (iso) {
          if (booked.has(iso)) booked.delete(iso);
          else booked.add(iso);
          for (var s = 0; s < sections.length; s++) {
            window.CpCal.syncMonth(sections[s], booked);
          }
          if (status) status.textContent = "Wijzigingen nog niet opgeslagen.";
        },
      });
      sections.push(sec);
      root.appendChild(sec);
    }
  }

  function load() {
    if (status) status.textContent = "Laden…";
    fetch("/api/calendar", { cache: "no-store" })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        booked = new Set(data.booked || []);
        rebuild();
        if (status) {
          status.textContent =
            "Klik op een dag om bezet (zandkleur) of vrij te schakelen. Kies daarna «Opslaan».";
        }
      })
      .catch(function () {
        booked = new Set();
        rebuild();
        if (status) status.textContent = "API niet bereikbaar.";
      });
  }

  saveBtn.addEventListener("click", function () {
    var tok = (tokenInput.value || "").trim();
    if (!tok) {
      if (status) {
        status.textContent =
          "Vul de beheercode in (dezelfde waarde als CALENDAR_ADMIN_TOKEN in Vercel → Settings → Environment Variables).";
      }
      return;
    }
    saveBtn.disabled = true;
    if (status) status.textContent = "Opslaan…";
    fetch("/api/calendar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + tok,
      },
      body: JSON.stringify({ booked: Array.from(booked).sort() }),
    })
      .then(function (r) {
        if (!r.ok) {
          return r.json().then(function (j) {
            throw new Error(j.error || "HTTP " + r.status);
          });
        }
        return r.json();
      })
      .then(function () {
        if (status) status.textContent = "Opgeslagen. De publieke pagina toont deze wijzigingen na verversen.";
      })
      .catch(function (e) {
        if (status) status.textContent = "Opslaan mislukt: " + (e.message || "onbekende fout");
      })
      .finally(function () {
        saveBtn.disabled = false;
      });
  });

  load();
})();
