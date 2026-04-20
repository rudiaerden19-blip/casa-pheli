/**
 * Kalender via /api/calendar + Vercel Blob. Beheer: één geheime code (CALENDAR_ADMIN_TOKEN), bewaard in sessionStorage.
 */
(function () {
  var TOKEN_KEY = "casa-pheli-cal-admin";

  function getToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function setToken(t) {
    try {
      if (t) sessionStorage.setItem(TOKEN_KEY, t);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

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

  var rootEl = document.getElementById("cp-cal-root");
  var statusEl = document.getElementById("cp-cal-status");
  var setupHint = document.getElementById("cp-cal-setup-hint");
  var btnOpen = document.getElementById("cp-cal-login-open");
  var toolbarUser = document.getElementById("cp-cal-toolbar-user");
  var toolbarStatus = document.getElementById("cp-cal-toolbar-email");
  var btnLogout = document.getElementById("cp-cal-logout");
  var modal = document.getElementById("cp-login-modal");
  var form = document.getElementById("cp-login-form");
  var inpCode = document.getElementById("cp-cal-admin-code");
  var loginError = document.getElementById("cp-login-error");

  if (!rootEl || !window.CpCal) return;

  var booked = new Set();
  var sections = [];
  var serverConfigured = false;

  function setErr(msg) {
    if (!loginError) return;
    if (msg) {
      loginError.textContent = msg;
      loginError.hidden = false;
    } else {
      loginError.textContent = "";
      loginError.hidden = true;
    }
  }

  /** Voorkomt r.json() op HTML-foutpagina's (Safari meldt dan o.a. "expected pattern"). */
  function parseJsonResponse(r) {
    return r.text().then(function (text) {
      var t = (text || "").trim();
      if (!t) {
        throw new Error("Leeg antwoord van server (HTTP " + r.status + ").");
      }
      if (t.charAt(0) !== "{" && t.charAt(0) !== "[") {
        throw new Error(
          "Geen JSON van /api/calendar (HTTP " +
            r.status +
            "). Controleer in Vercel: Root Directory = repository-root (niet alleen public), zodat api/calendar.js mee deployt."
        );
      }
      try {
        return JSON.parse(t);
      } catch (e) {
        throw new Error("Ongeldige JSON van server (HTTP " + r.status + ").");
      }
    });
  }

  function openModal() {
    if (!modal) return;
    modal.removeAttribute("hidden");
    setErr("");
    if (inpCode) inpCode.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute("hidden", "");
    setErr("");
  }

  function updateToolbar() {
    var unlocked = !!getToken();
    if (btnOpen) btnOpen.hidden = !serverConfigured || unlocked;
    if (toolbarUser) toolbarUser.hidden = !unlocked;
    if (toolbarStatus) toolbarStatus.textContent = unlocked ? "Beheer actief — klik op dagen om zand/vrij te wisselen." : "";
  }

  function renderMonths() {
    var interactive = !!getToken();
    rootEl.innerHTML = "";
    sections = [];
    var now = new Date();
    var y = now.getFullYear();
    var m = now.getMonth();
    for (var i = 0; i < 18; i++) {
      var cur = stepMonth(y, m, i);
      var sec = window.CpCal.monthBlock(cur.y, cur.m, booked, {
        interactive: interactive,
        onToggle: function (iso) {
          if (!getToken()) return;
          if (booked.has(iso)) booked.delete(iso);
          else booked.add(iso);
          for (var s = 0; s < sections.length; s++) {
            window.CpCal.syncMonth(sections[s], booked);
          }
          var arr = Array.from(booked).sort();
          if (statusEl) statusEl.textContent = "Opslaan…";
          fetch("/api/calendar", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + getToken(),
            },
            body: JSON.stringify({ booked: arr }),
          })
            .then(function (r) {
              return parseJsonResponse(r).then(function (j) {
                if (!r.ok) {
                  throw new Error((j && j.error) || "HTTP " + r.status);
                }
                return j;
              });
            })
            .then(function () {
              if (statusEl) statusEl.textContent = "Opgeslagen.";
            })
            .catch(function (e) {
              if (statusEl) statusEl.textContent = "Opslaan mislukt: " + (e.message || "");
            });
        },
      });
      sections.push(sec);
      rootEl.appendChild(sec);
    }
  }

  function loadFromServer() {
    if (statusEl) statusEl.textContent = "Kalender laden…";
    return fetch("/api/calendar", { cache: "no-store" })
      .then(function (r) {
        return parseJsonResponse(r).then(function (data) {
          if (!r.ok) {
            throw new Error((data && data.error) || "HTTP " + r.status);
          }
          return data;
        });
      })
      .then(function (data) {
        serverConfigured = data.configured === true;
        if (data.configured === false) {
          if (setupHint) {
            setupHint.hidden = false;
            setupHint.innerHTML =
              "Nog <strong>geen opslag</strong> gekoppeld (geen Vercel Blob-token). Alle dagen tonen als vrij. " +
              "In Vercel: <strong>Storage → Blob</strong> een store maken (past meestal in het gratis Vercel-plafond bij weinig data). " +
              "Zet ook <code>CALENDAR_ADMIN_TOKEN</code> (eigen geheime code) in Environment Variables en deploy opnieuw. " +
              "Daarna verschijnt <strong>Beheer (vakjes kleuren)</strong>.";
          }
          if (btnOpen) btnOpen.hidden = true;
          if (statusEl) statusEl.textContent = "";
        } else {
          if (setupHint) setupHint.hidden = true;
          if (btnOpen) btnOpen.hidden = !!getToken();
        }
        booked.clear();
        (data.booked || []).forEach(function (d) {
          booked.add(d);
        });
        if (statusEl && serverConfigured && data.updatedAt) {
          statusEl.textContent = "Laatst bijgewerkt: " + new Date(data.updatedAt).toLocaleString("nl-BE");
        } else if (statusEl && serverConfigured && !getToken()) {
          statusEl.textContent = "";
        }
        updateToolbar();
        renderMonths();
      })
      .catch(function () {
        serverConfigured = false;
        if (btnOpen) btnOpen.hidden = true;
        if (setupHint) setupHint.hidden = true;
        if (statusEl) statusEl.textContent = "Kon de kalender niet laden.";
        booked.clear();
        updateToolbar();
        renderMonths();
      });
  }

  if (btnOpen) {
    btnOpen.addEventListener("click", function () {
      openModal();
    });
  }
  if (btnLogout) {
    btnLogout.addEventListener("click", function () {
      setToken("");
      updateToolbar();
      loadFromServer();
    });
  }
  if (modal) {
    modal.querySelectorAll("[data-cp-login-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        closeModal();
      });
    });
  }
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var code = (inpCode && inpCode.value) || "";
      code = code.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
      if (!code) {
        setErr("Vul de beheercode in.");
        return;
      }
      setErr("");
      fetch("/api/calendar", { cache: "no-store" })
        .then(function (r) {
          return parseJsonResponse(r).then(function (d) {
            if (!r.ok) {
              throw new Error((d && d.error) || "Kalender laden mislukt (HTTP " + r.status + ").");
            }
            return d;
          });
        })
        .then(function (d) {
          return fetch("/api/calendar", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + code,
            },
            body: JSON.stringify({ booked: d.booked || [] }),
          }).then(function (r2) {
            return parseJsonResponse(r2).then(function (j) {
              if (!r2.ok) {
                var errKey = (j && j.error) || "";
                if (r2.status === 401 || /unauthorized/i.test(errKey)) {
                  throw new Error("Die code komt niet overeen met CALENDAR_ADMIN_TOKEN in Vercel.");
                }
                throw new Error(errKey || "Opslaan geweigerd (HTTP " + r2.status + ").");
              }
              return j;
            });
          });
        })
        .then(function () {
          setToken(code);
          if (inpCode) inpCode.value = "";
          closeModal();
          updateToolbar();
          renderMonths();
          if (statusEl) statusEl.textContent = "Beheer ontgrendeld. Klik op dagen om te wijzigen.";
        })
        .catch(function (err) {
          setErr((err && err.message) || "Code geweigerd.");
        });
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.hasAttribute("hidden")) closeModal();
  });

  if (getToken()) {
    updateToolbar();
  }
  loadFromServer();
})();
