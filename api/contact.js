/**
 * POST /api/contact — JSON { subject?, voornaam, naam, email, telefoon, bericht, _gotcha? }
 * Stuurt één plain-text mail naar de eigenaar via Resend.
 *
 * Vercel → Environment Variables (Production):
 *   RESEND_API_KEY   — API key van https://resend.com
 *   RESEND_FROM      — geverifieerd afzenderadres (bv. contact@jouwdomein.be)
 *   CONTACT_TO_EMAIL — optioneel, ontvanger (default heidi.torfs@outlook.be)
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
    throw new Error(typeof msg === "string" ? msg : "Resend-fout");
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

  const resendKey = getEnvTrim("RESEND_API_KEY");
  const resendFrom = getEnvTrim("RESEND_FROM");
  if (!(resendKey && resendFrom)) {
    console.warn("[contact] Ontbrekend: RESEND_API_KEY en/of RESEND_FROM in Vercel.");
    return sendJson(res, 503, {
      ok: false,
      error: "Je bericht kon niet worden verstuurd. Probeer later opnieuw.",
    });
  }

  const to = getEnvTrim("CONTACT_TO_EMAIL") || DEFAULT_TO;
  const text = buildTextBody({ voornaam, naam, email, telefoon, bericht });

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
    console.error("[contact] Resend mislukt:", msg);
    return sendJson(res, 502, {
      ok: false,
      error: "Versturen mislukt. Probeer later opnieuw.",
    });
  }

  return sendJson(res, 200, { ok: true });
}
