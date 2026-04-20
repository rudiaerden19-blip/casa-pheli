/**
 * GET  /api/calendar  — { booked: string[], configured: boolean }
 * POST /api/calendar  — body { booked: string[] }, Authorization: Bearer <CALENDAR_ADMIN_TOKEN>
 * Opslag: Vercel Blob (één JSON-bestand). Geen aparte betaalde database nodig.
 */
import { list, put } from "@vercel/blob";

const CALENDAR_PATH = "casa-pheli/booking-calendar.json";

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

async function readCalendar(token) {
  if (!token) {
    return { booked: [], configured: false };
  }
  try {
    const { blobs } = await list({ prefix: "casa-pheli/", token, limit: 50 });
    const hit = blobs.find((b) => b.pathname === CALENDAR_PATH);
    if (!hit) {
      return { booked: [], configured: true };
    }
    const r = await fetch(hit.url, { cache: "no-store" });
    if (!r.ok) {
      return { booked: [], configured: true };
    }
    const j = await r.json();
    const booked = Array.isArray(j.booked) ? j.booked.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
    return { booked, configured: true, updatedAt: j.updatedAt || null };
  } catch {
    return { booked: [], configured: false };
  }
}

export default async function handler(req, res) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.end();
  }

  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    const data = await readCalendar(token);
    return sendJson(res, 200, data);
  }

  if (req.method === "POST") {
    const expected = process.env.CALENDAR_ADMIN_TOKEN;
    const auth = req.headers.authorization || "";
    if (!expected || auth !== `Bearer ${expected}`) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    if (!token) {
      return sendJson(res, 503, {
        error: "Blob niet geconfigureerd. Voeg Vercel Blob toe (Storage) aan dit project.",
      });
    }
    const raw = await getRawBody(req);
    let body;
    try {
      body = JSON.parse(raw.length ? raw.toString("utf8") : "{}");
    } catch {
      return sendJson(res, 400, { error: "Ongeldige JSON" });
    }
    if (!Array.isArray(body.booked)) {
      return sendJson(res, 400, { error: "booked moet een array van YYYY-MM-DD zijn" });
    }
    const booked = [...new Set(body.booked.filter((d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
    const payload = JSON.stringify({
      booked,
      updatedAt: new Date().toISOString(),
    });
    await put(CALENDAR_PATH, payload, {
      access: "public",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return sendJson(res, 200, { ok: true, booked });
  }

  res.setHeader("Allow", "GET, POST, OPTIONS");
  return sendJson(res, 405, { error: "Method not allowed" });
}
