/**
 * Kalender + optioneel Supabase (pas na project + env op Vercel).
 * Verwacht window.CpCal van calendar-core.js (niet-module, eerder geladen).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const TABLE = "booked_days";

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
  return { y, m };
}

function normDay(v) {
  if (v == null) return null;
  return String(v).slice(0, 10);
}

const rootEl = document.getElementById("cp-cal-root");
const statusEl = document.getElementById("cp-cal-status");
const setupHint = document.getElementById("cp-cal-setup-hint");
const btnOpenLogin = document.getElementById("cp-cal-login-open");
const toolbarUser = document.getElementById("cp-cal-toolbar-user");
const toolbarEmail = document.getElementById("cp-cal-toolbar-email");
const btnLogout = document.getElementById("cp-cal-logout");
const modal = document.getElementById("cp-login-modal");
const formLogin = document.getElementById("cp-login-form");
const inpEmail = document.getElementById("cp-login-email");
const inpPassword = document.getElementById("cp-login-password");
const loginError = document.getElementById("cp-login-error");

let client = null;
let configured = false;
/** @type {import('@supabase/supabase-js').Session | null} */
let session = null;
const booked = new Set();
let sections = [];

function setLoginError(msg) {
  if (!loginError) return;
  if (msg) {
    loginError.textContent = msg;
    loginError.hidden = false;
  } else {
    loginError.textContent = "";
    loginError.hidden = true;
  }
}

function openModal() {
  if (!modal) return;
  modal.removeAttribute("hidden");
  setLoginError("");
  if (inpEmail) inpEmail.focus();
}

function closeModal() {
  if (!modal) return;
  modal.setAttribute("hidden", "");
  setLoginError("");
}

function renderMonths() {
  if (!rootEl || !window.CpCal) return;
  const interactive = !!(session && session.user);
  rootEl.innerHTML = "";
  sections = [];
  const now = new Date();
  let y = now.getFullYear();
  let m = now.getMonth();
  for (let i = 0; i < 18; i++) {
    const cur = stepMonth(y, m, i);
    const sec = window.CpCal.monthBlock(cur.y, cur.m, booked, {
      interactive,
      onToggle: async (iso) => {
        if (!interactive || !client) return;
        const was = booked.has(iso);
        if (was) booked.delete(iso);
        else booked.add(iso);
        sections.forEach((s) => window.CpCal.syncMonth(s, booked));
        if (statusEl) statusEl.textContent = "Bezig met opslaan…";
        let err;
        if (was) {
          ({ error: err } = await client.from(TABLE).delete().eq("day", iso));
        } else {
          ({ error: err } = await client.from(TABLE).insert({ day: iso }));
        }
        if (err) {
          if (was) booked.add(iso);
          else booked.delete(iso);
          sections.forEach((s) => window.CpCal.syncMonth(s, booked));
          if (statusEl) statusEl.textContent = "Opslaan mislukt: " + err.message;
        } else if (statusEl) {
          statusEl.textContent = "Opgeslagen.";
        }
      },
    });
    sections.push(sec);
    rootEl.appendChild(sec);
  }
}

function updateAuthUi() {
  const logged = !!(session && session.user);
  if (btnOpenLogin) btnOpenLogin.hidden = !configured || logged;
  if (toolbarUser) toolbarUser.hidden = !logged;
  if (toolbarEmail && session?.user?.email) toolbarEmail.textContent = session.user.email;
  renderMonths();
}

async function loadBooked() {
  booked.clear();
  if (!client) {
    renderMonths();
    return;
  }
  const { data, error } = await client.from(TABLE).select("day");
  if (error) {
    if (statusEl) statusEl.textContent = "Kon kalender niet laden: " + error.message;
    renderMonths();
    return;
  }
  for (const row of data || []) {
    const d = normDay(row.day);
    if (d) booked.add(d);
  }
  if (statusEl && configured && !error) {
    if (!session?.user) statusEl.textContent = "";
  }
  renderMonths();
}

async function init() {
  if (!rootEl) return;
  try {
    const r = await fetch("/api/supabase-config", { cache: "no-store" });
    const j = await r.json();
    if (!r.ok || !j.ok || !j.url || !j.anonKey) {
      configured = false;
      client = null;
      if (setupHint) {
        setupHint.hidden = false;
        setupHint.innerHTML =
          "Er is <strong>nog geen Supabase-koppeling</strong> voor deze site. Tot die tijd zie je alle dagen als <strong>vrij</strong> (indicatief). " +
          "Later: maak op <a href=\"https://supabase.com\" rel=\"noopener noreferrer\">supabase.com</a> een project, voer het script " +
          "<code>supabase/schema.sql</code> uit in de SQL Editor, maak één gebruiker onder <strong>Authentication</strong>, " +
          "en zet in Vercel de variabelen <code>SUPABASE_URL</code> en <code>SUPABASE_ANON_KEY</code>. Daarna verschijnt hier de knop <strong>Inloggen (verhuurder)</strong>.";
      }
      if (btnOpenLogin) btnOpenLogin.hidden = true;
      if (statusEl) statusEl.textContent = "";
      renderMonths();
      return;
    }
    configured = true;
    client = createClient(j.url, j.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    if (setupHint) setupHint.hidden = true;
    const {
      data: { session: s },
    } = await client.auth.getSession();
    session = s;
    client.auth.onAuthStateChange((_event, newSession) => {
      session = newSession;
      loadBooked().then(updateAuthUi);
    });
    await loadBooked();
    updateAuthUi();
  } catch (e) {
    if (statusEl) statusEl.textContent = "Kon de verbinding niet initialiseren.";
    renderMonths();
  }
}

if (btnOpenLogin) {
  btnOpenLogin.addEventListener("click", () => openModal());
}
if (btnLogout) {
  btnLogout.addEventListener("click", async () => {
    if (client) await client.auth.signOut();
    session = null;
    await loadBooked();
    updateAuthUi();
  });
}
if (modal) {
  modal.querySelectorAll("[data-cp-login-close]").forEach((el) => {
    el.addEventListener("click", () => closeModal());
  });
}
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!client) return;
    setLoginError("");
    const email = (inpEmail && inpEmail.value) || "";
    const password = (inpPassword && inpPassword.value) || "";
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError(error.message || "Inloggen mislukt.");
      return;
    }
    closeModal();
    if (inpPassword) inpPassword.value = "";
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && !modal.hasAttribute("hidden")) closeModal();
});

init();
