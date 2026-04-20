/**
 * GET  /api/calendar  — { booked: string[], configured: boolean }
 * POST /api/calendar  — body { booked: string[] }, Authorization: Bearer <CALENDAR_ADMIN_TOKEN>
 * Opslag: Vercel Blob (één JSON-bestand). Gebruik @vercel/blob 2.x (past bij huidige Blob-API).
 */
import { get, put } from "@vercel/blob";

const CALENDAR_PATH = "casa-pheli/booking-calendar.json";

function getBlobToken() {
  const raw = process.env.BLOB_READ_WRITE_TOKEN;
  if (typeof raw !== "string") return "";
  let t = raw.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

function getAdminToken() {
  const raw = process.env.CALENDAR_ADMIN_TOKEN;
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

async function getCalendarJson(blobToken, access) {
  const result = await get(CALENDAR_PATH, {
    access,
    token: blobToken,
    useCache: false,
  });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }
  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

async function readCalendar(blobToken) {
  if (!blobToken) {
    return { booked: [], configured: false };
  }
  try {
    // Private blobs vereisen get() met token; blote fetch(url) geeft 403 → lege kalender na afmelden.
    let j = null;
    try {
      j = await getCalendarJson(blobToken, "private");
    } catch {
      /* private-pad faalt bv. bij ontbrekend bestand */
    }
    if (!j) {
      try {
        j = await getCalendarJson(blobToken, "public");
      } catch {
        /* geen legacy public-bestand */
      }
    }
    if (!j) {
      return { booked: [], configured: true };
    }
    const booked = Array.isArray(j.booked) ? j.booked.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)) : [];
    return { booked, configured: true, updatedAt: j.updatedAt || null };
  } catch (e) {
    console.error("[calendar] read failed", e);
    return { booked: [], configured: true };
  }
}

export default async function handler(req, res) {
  const blobToken = getBlobToken();

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Allow", "GET, POST, OPTIONS");
    return res.end();
  }

  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    const data = await readCalendar(blobToken);
    return sendJson(res, 200, data);
  }

  if (req.method === "POST") {
    const expected = getAdminToken();
    const auth = (req.headers.authorization || "").trim();
    if (!expected || auth !== `Bearer ${expected}`) {
      return sendJson(res, 401, { error: "Unauthorized" });
    }
    if (!blobToken) {
      return sendJson(res, 503, {
        error: "Blob niet geconfigureerd. Zet BLOB_READ_WRITE_TOKEN in Environment Variables (Production).",
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
    try {
      await put(CALENDAR_PATH, payload, {
        access: "private",
        token: blobToken,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[calendar] put failed", e);
      return sendJson(res, 500, {
        error: "Kalender opslaan in Blob mislukt.",
        detail: msg.slice(0, 500),
      });
    }
    return sendJson(res, 200, { ok: true, booked });
  }

  res.setHeader("Allow", "GET, POST, OPTIONS");
  return sendJson(res, 405, { error: "Method not allowed" });
}
