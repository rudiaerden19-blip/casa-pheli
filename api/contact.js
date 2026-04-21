/**
 * POST /api/contact — JSON { subject?, voornaam, naam, email, telefoon, bericht, _gotcha? }
 * Verstuurt een mail naar de eigenaar via Resend wanneer geconfigureerd.
 * Zonder Resend: antwoord 501 + fallback — de browser stuurt rechtstreeks naar FormSubmit
 * (FormSubmit accepteert geen server-side Node-fetch).
 *
 * Vercel env (optioneel):
 * - CONTACT_TO_EMAIL — ontvanger (default: heidi.torfs@outlook.be)
 * - RESEND_API_KEY + RESEND_FROM — dan via Resend (from = geverifieerd domein)
 */

const DEFAULT_TO = "heidi.torfs@outlook.be";
const ALLOWED_SUBJECTS = new Set([
  "Aanvraag beschikbaarheid Casa Pheli",
  "Beschikbaarheid Casa Pheli",
]);

function getEnvTrim(name) {
  const raw = process.env[name];
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

function clampStr(s, max) {
  if (typeof s !== "string") return "";
  const t = s.trim();
  return t.length > max ? t.slice(0, max) : t;
}

function isReasonableEmail(s) {
  if (s.length < 5 || s.length > 254) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return false;
  return true;
}

function buildTextBody({ voornaam, naam, email, telefoon, bericht }) {
  return (
    `Voornaam: ${voornaam}\n` +
    `Naam: ${naam}\n` +
    `E-mail: ${email}\n` +
    `Telefoon: ${telefoon}\n\n` +
    `Bericht:\n${bericht}\n`
  );
}

async function sendViaResend({ to, from, apiKey, replyTo, subject, text }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject,
      text,
    }),
  });
  const raw = await r.text();
  let j = null;
  try {
    j = raw ? JSON.parse(raw) : null;
  } catch {
    /* ignore */
  }
  if (!r.ok) {
    const msg = (j && j.message) || raw || r.statusText;
    throw new Error(`Resend: ${msg}`);
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "POST, OPTIONS");
    return res.end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const raw = await getRawBody(req);
  let body;
  try {
    body = JSON.parse(raw.length ? raw.toString("utf8") : "{}");
  } catch {
    return sendJson(res, 400, { error: "Ongeldige JSON" });
  }

  const gotcha = typeof body._gotcha === "string" ? body._gotcha.trim() : "";
  if (gotcha) {
    return sendJson(res, 400, { error: "Ongeldige aanvraag." });
  }

  const voornaam = clampStr(body.voornaam, 120);
  const naam = clampStr(body.naam, 120);
  const email = clampStr(body.email, 254).toLowerCase();
  const telefoon = clampStr(body.telefoon, 60);
  const bericht = clampStr(body.bericht, 8000);

  let subject = clampStr(body.subject, 120);
  if (!subject || !ALLOWED_SUBJECTS.has(subject)) {
    subject = "Aanvraag beschikbaarheid Casa Pheli";
  }

  if (!voornaam || !naam || !email || !telefoon || !bericht) {
    return sendJson(res, 400, { error: "Vul alle verplichte velden in." });
  }
  if (!isReasonableEmail(email)) {
    return sendJson(res, 400, { error: "Ongeldig e-mailadres." });
  }

  const to = getEnvTrim("CONTACT_TO_EMAIL") || DEFAULT_TO;
  const text = buildTextBody({ voornaam, naam, email, telefoon, bericht });

  const resendKey = getEnvTrim("RESEND_API_KEY");
  const resendFrom = getEnvTrim("RESEND_FROM");

  if (!(resendKey && resendFrom)) {
    return sendJson(res, 501, {
      ok: false,
      fallback: true,
      error: "Server-mail niet geconfigureerd; de site gebruikt browser-verzending.",
    });
  }

  try {
    await sendViaResend({
      to,
      from: resendFrom,
      apiKey: resendKey,
      replyTo: email,
      subject,
      text,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[contact] send failed", e);
    return sendJson(res, 502, {
      ok: false,
      fallback: true,
      error: "Versturen via de server mislukt. Er wordt opnieuw geprobeerd vanuit je browser.",
      detail: msg.slice(0, 300),
    });
  }

  return sendJson(res, 200, { ok: true });
}
