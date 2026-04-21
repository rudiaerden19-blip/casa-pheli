/**
 * POST /api/contact — stuurt aanvragen naar de eigenaar (Resend).
 *
 * Vercel Environment Variables:
 * - RESEND_API_KEY (verplicht)
 * - CONTACT_FROM — geverifieerde afzender, bv. "Casa Pheli <contact@casa-pheli.be>"
 * - CONTACT_TO_EMAIL — optioneel; standaard heidi.torfs@outlook.be
 */
import { Resend } from "resend";

const DEFAULT_TO = "heidi.torfs@outlook.be";
const MAX = { voornaam: 120, naam: 120, email: 254, telefoon: 40, bericht: 12000, subject: 200 };

function trimEnv(raw) {
  if (typeof raw !== "string") return "";
  let t = raw.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "POST, OPTIONS");
    return res.end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return sendJson(res, 405, { success: false, message: "Method not allowed" });
  }

  const apiKey = trimEnv(process.env.RESEND_API_KEY);
  const from = trimEnv(process.env.CONTACT_FROM);
  const to = trimEnv(process.env.CONTACT_TO_EMAIL) || DEFAULT_TO;

  if (!apiKey) {
    return sendJson(res, 503, {
      success: false,
      message: "E-mail is nog niet geconfigureerd op de server. Neem contact op met de beheerder.",
    });
  }
  if (!from) {
    return sendJson(res, 503, {
      success: false,
      message: "Afzender niet geconfigureerd (CONTACT_FROM in Vercel).",
    });
  }

  const raw = await getRawBody(req);
  let body;
  try {
    body = JSON.parse(raw.length ? raw.toString("utf8") : "{}");
  } catch {
    return sendJson(res, 400, { success: false, message: "Ongeldige aanvraag." });
  }

  if (body._gotcha) {
    return sendJson(res, 200, { success: true });
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const voornaam = typeof body.voornaam === "string" ? body.voornaam.trim() : "";
  const naam = typeof body.naam === "string" ? body.naam.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const telefoon = typeof body.telefoon === "string" ? body.telefoon.trim() : "";
  const bericht = typeof body.bericht === "string" ? body.bericht.trim() : "";

  if (!voornaam || !naam || !email || !telefoon || !bericht) {
    return sendJson(res, 400, { success: false, message: "Vul alle verplichte velden in." });
  }
  if (!EMAIL_RE.test(email)) {
    return sendJson(res, 400, { success: false, message: "Geef een geldig e-mailadres op." });
  }
  if (subject.length > MAX.subject) {
    return sendJson(res, 400, { success: false, message: "Onderwerp te lang." });
  }
  if (voornaam.length > MAX.voornaam || naam.length > MAX.naam) {
    return sendJson(res, 400, { success: false, message: "Naam te lang." });
  }
  if (email.length > MAX.email || telefoon.length > MAX.telefoon) {
    return sendJson(res, 400, { success: false, message: "E-mail of telefoon te lang." });
  }
  if (bericht.length > MAX.bericht) {
    return sendJson(res, 400, { success: false, message: "Bericht te lang." });
  }

  const safeSubject = subject || "Aanvraag Casa Pheli";
  const text = [
    `Onderwerp: ${safeSubject}`,
    "",
    `Voornaam: ${voornaam}`,
    `Naam: ${naam}`,
    `E-mail: ${email}`,
    `Telefoon: ${telefoon}`,
    "",
    "Bericht:",
    bericht,
  ].join("\n");

  const html = `
    <p><strong>Onderwerp:</strong> ${escapeHtml(safeSubject)}</p>
    <p><strong>Voornaam:</strong> ${escapeHtml(voornaam)}<br/>
    <strong>Naam:</strong> ${escapeHtml(naam)}<br/>
    <strong>E-mail:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a><br/>
    <strong>Telefoon:</strong> ${escapeHtml(telefoon)}</p>
    <p><strong>Bericht</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(bericht)}</p>
  `;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: email,
    subject: `[Casa Pheli] ${safeSubject}`,
    text,
    html,
  });

  if (error) {
    console.error("[contact] Resend error", error);
    return sendJson(res, 502, {
      success: false,
      message: "Versturen mislukt. Probeer later opnieuw of mail rechtstreeks.",
    });
  }

  return sendJson(res, 200, { success: true });
}
