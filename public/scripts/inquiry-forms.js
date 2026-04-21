(function () {
  var TOAST_ID = "contact-success-toast";
  var TOAST_MS = 3800;
  /** Geen API-keys: rechtstreeks naar FormSubmit vanuit de browser (ontvanger hieronder). */
  var OWNER_EMAIL = "heidi.torfs@outlook.be";

  if (window.location.hash === "#cr-email") {
    var emailInp = document.getElementById("cr-email");
    if (emailInp) {
      window.requestAnimationFrame(function () {
        emailInp.scrollIntoView({ behavior: "smooth", block: "center" });
        try {
          emailInp.focus({ preventScroll: true });
        } catch (e) {
          emailInp.focus();
        }
      });
    }
  }

  function ensureToastEl() {
    var el = document.getElementById(TOAST_ID);
    if (el) return el;
    el = document.createElement("div");
    el.id = TOAST_ID;
    el.className = "contact-success-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    el.innerHTML =
      '<div class="contact-success-toast__inner">Je e-mail is verstuurd.</div>';
    document.body.appendChild(el);
    return el;
  }

  function showSuccessToast() {
    var el = ensureToastEl();
    if (el._hideTimer) {
      clearTimeout(el._hideTimer);
      el._hideTimer = null;
    }
    el.hidden = false;
    el.classList.add("contact-success-toast--visible");
    el._hideTimer = setTimeout(function () {
      el.classList.remove("contact-success-toast--visible");
      el.hidden = true;
      el._hideTimer = null;
    }, TOAST_MS);
  }

  function val(form, name) {
    var inp = form.elements.namedItem(name);
    return inp ? String(inp.value || "").trim() : "";
  }

  function parseJson(text) {
    if (!text || !String(text).trim()) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  function formSubmitOk(j) {
    if (!j || j.success == null) return false;
    if (j.success === false) return false;
    if (String(j.success).toLowerCase() === "false") return false;
    return true;
  }

  function humanFormSubmitError(j) {
    var m = (j && typeof j.message === "string" && j.message) || "";
    if (/activation/i.test(m)) {
      return (
        "Eénmalig: de eigenaar moet de bevestigingsmail van het formulier openen en op de link klikken. " +
        "Daarna werkt verzenden automatisch, zonder extra sleutels."
      );
    }
    return m || "Versturen mislukt. Probeer later opnieuw.";
  }

  async function postInquiry(payload) {
    var url = "https://formsubmit.co/ajax/" + encodeURIComponent(OWNER_EMAIL);
    var r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: payload.subject,
        _replyto: payload.email,
        voornaam: payload.voornaam,
        naam: payload.naam,
        email: payload.email,
        telefoon: payload.telefoon,
        bericht: payload.bericht,
      }),
    });
    var text = await r.text();
    var data = parseJson(text);
    if (!data) {
      throw new Error("Versturen mislukt. Controleer je verbinding of probeer later opnieuw.");
    }
    if (!formSubmitOk(data)) {
      throw new Error(humanFormSubmitError(data));
    }
  }

  function wireForm(form, subject, statusId) {
    if (!form) return;
    var statusEl = statusId ? document.getElementById(statusId) : null;
    var submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener(
      "submit",
      async function (e) {
        e.preventDefault();
        if (statusEl) {
          statusEl.textContent = "";
          statusEl.hidden = true;
        }

        var voornaam = val(form, "voornaam");
        var naam = val(form, "naam");
        var email = val(form, "email");
        var telefoon = val(form, "telefoon");
        var bericht = val(form, "bericht");
        var gotcha = val(form, "_gotcha");

        if (!voornaam || !naam || !email || !telefoon || !bericht) {
          if (statusEl) {
            statusEl.hidden = false;
            statusEl.textContent = "Vul alle verplichte velden in.";
          }
          return;
        }
        if (gotcha) {
          return;
        }

        if (submitBtn) submitBtn.disabled = true;
        try {
          await postInquiry({
            subject: subject,
            voornaam: voornaam,
            naam: naam,
            email: email,
            telefoon: telefoon,
            bericht: bericht,
          });
          form.reset();
          showSuccessToast();
        } catch (err) {
          if (statusEl) {
            statusEl.hidden = false;
            statusEl.textContent = err instanceof Error ? err.message : String(err);
          }
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      },
      true
    );
  }

  wireForm(
    document.getElementById("contact-request-form"),
    "Aanvraag beschikbaarheid Casa Pheli",
    "contact-request-status"
  );
  wireForm(document.getElementById("home-inquiry-form"), "Beschikbaarheid Casa Pheli", "home-inquiry-status");
})();
