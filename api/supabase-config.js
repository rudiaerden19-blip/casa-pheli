/**
 * GET /api/supabase-config
 * Levert URL + anon key uit Vercel env (niet in git).
 * Veilig mits RLS op je Supabase-tabellen staat (zie supabase/schema.sql).
 */
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    return res.end("Method Not Allowed");
  }
  const url = process.env.SUPABASE_URL || "";
  const anonKey = process.env.SUPABASE_ANON_KEY || "";
  if (!url || !anonKey) {
    return sendJson(res, 503, {
      ok: false,
      error: "not_configured",
      message: "Stel SUPABASE_URL en SUPABASE_ANON_KEY in bij Vercel → Environment Variables.",
    });
  }
  return sendJson(res, 200, { ok: true, url, anonKey });
}
