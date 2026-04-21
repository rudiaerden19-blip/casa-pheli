(function () {
  var TOAST_ID = "contact-success-toast";
  var TOAST_MS = 3800;
  /** FormSubmit AJAX — moet vanuit de echte browser (FormSubmit weigert server-side fetch). */
  var FORMSUBMIT_TO = "heidi.torfs@outlook.be";

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

  function parseJsonFromResponse(text) {
    if (!text || !String(text).trim()) return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  }

  function formSubmitSuccess(j) {
    if (!j || j.success == null) return false;
    if (j.success === false) return false;
    if (String(j.success).toLowerCase() === "false") return false;
    return true;
  }

  async function postViaFormSubmitBrowser(payload) {
    var url = "https://formsubmit.co/ajax/" + encodeURIComponent(FORMSUBMIT_TO);
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
    var data = parseJsonFromResponse(text);
    if (!data) {
      throw new Error("Versturen mislukt (onverwacht antwoord). Probeer later opnieuw.");
    }
    if (!formSubmitSuccess(data)) {
      var msg =
        (typeof data.message === "string" && data.message) ||
        "Versturen mislukt. Controleer je verbinding of probeer later opnieuw.";
      throw new Error(msg);
    }
  }

  async function postInquiry(payload) {
    var r = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    var text = await r.text();
    var data = parseJsonFromResponse(text);

    if (r.ok && data && data.ok === true) {
      return;
    }

    var useBrowser =
      r.status === 501 ||
      (data && data.fallback === true) ||
      (r.status >= 500 && r.status <= 504);

    if (useBrowser) {
      await postViaFormSubmitBrowser(payload);
      return;
    }

    if (r.status === 400 && data && typeof data.error === "string") {
      throw new Error(data.error);
    }

    var msg =
      (data && (typeof data.error === "string" ? data.error : null)) ||
      (data && (typeof data.message === "string" ? data.message : null)) ||
      "Versturen mislukt. Probeer later opnieuw.";
    throw new Error(msg);
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
          _gotcha: gotcha,
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
