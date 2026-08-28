const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

const API_BASE = "https://api.oxapay.com/v1";

export async function getConfig(base44) {
  const list = await db.asServiceRole.entities.OxaPayConfig.filter({ is_active: true });
  return list && list[0] ? list[0] : null;
}

export async function getOrCreateConfig(base44) {
  let cfg = await getConfig(base44);
  if (!cfg) {
    cfg = await db.asServiceRole.entities.OxaPayConfig.create({
      merchant_api_key: "",
      payout_api_key: "",
      webhook_url: "",
      webhook_secret: randomSecret(),
      is_active: true,
    });
  }
  return cfg;
}

export function randomSecret() {
  return Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
}

export async function merchantCall(path, key, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", merchant_api_key: key },
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

export async function merchantGet(path, key, params) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json", merchant_api_key: key },
  });
  return res.json();
}

export async function payoutCall(path, key, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", payout_api_key: key },
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

export async function payoutGet(path, key, params) {
  const url = new URL(`${API_BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json", payout_api_key: key },
  });
  return res.json();
}

export function buildCallback(cfg) {
  if (!cfg || !cfg.webhook_url) return undefined;
  const sep = cfg.webhook_url.includes("?") ? "&" : "?";
  return cfg.webhook_url + sep + "secret=" + encodeURIComponent(cfg.webhook_secret || "");
}