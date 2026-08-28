const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Utilidad para identificar al usuario dentro de Telegram Mini App.
// Telegram expone window.Telegram.WebApp con initDataUnsafe.user cuando la app
// se abre dentro de Telegram. Fuera de Telegram (p. ej. preview en navegador)
// devuelve null para usar el fallback de sesión de db.

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

export function getTelegramUser() {
  const wa = getTelegramWebApp();
  const user = wa?.initDataUnsafe?.user;
  if (user && user.id) return user;
  return null;
}

export function getTelegramInitData() {
  return getTelegramWebApp()?.initData || '';
}

export function inTelegram() {
  return !!getTelegramUser();
}

// Expande el viewport y aplica el tema de Telegram al montar la Mini App.
export function readyTelegramWebApp() {
  const wa = getTelegramWebApp();
  if (!wa) return;
  try { wa.ready(); wa.expand(); } catch (e) { /* noop */ }
}