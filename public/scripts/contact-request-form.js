(function () {
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

  var form = document.getElementById("contact-request-form");
  if (!form) return;

  var statusEl = document.getElementById("contact-request-status");
  var emailTo = "heidi.torfs@outlook.be";

  function val(name) {
    var el = form.elements.namedItem(name);
    return el ? String(el.value || "").trim() : "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (statusEl) {
      statusEl.textContent = "";
      statusEl.hidden = true;
    }

    var voornaam = val("voornaam");
    var naam = val("naam");
    var email = val("email");
    var telefoon = val("telefoon");
    var bericht = val("bericht");

    if (!voornaam || !naam || !email || !telefoon || !bericht) {
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = "Vul alle verplichte velden in.";
      }
      return;
    }

    var body =
      "Voornaam: " + voornaam + "\n" +
      "Naam: " + naam + "\n" +
      "E-mail: " + email + "\n" +
      "Telefoon: " + telefoon + "\n\n" +
      "Bericht:\n" +
      bericht +
      "\n";

    var subject = "Aanvraag beschikbaarheid Casa Pheli";
    var href =
      "mailto:" +
      emailTo +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);

    window.location.href = href;

    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent =
        "Je e-mailprogramma opent zo meteen. Werkt dat niet? Stuur dan handmatig een mailtje naar " +
        emailTo +
        ".";
    }
  });
})();
