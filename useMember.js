const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState, useCallback } from 'react';

import { TOKEN, genAddress } from '@/lib/crypto';
import { getTelegramUser, readyTelegramWebApp, inTelegram } from '@/lib/telegram';

const LANG_MAP = { es: 'es', en: 'en', ru: 'ru', pt: 'pt', de: 'de', fr: 'fr' };

function tgUsername(u) {
  if (u.username) return u.username;
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim();
  return name || 'novapay_user';
}

async function createMemberFromTelegram(u) {
  const tid = String(u.id);
  const m = await db.entities.Member.create({
    telegram_id: tid,
    username: tgUsername(u),
    language: LANG_MAP[u.language_code] || 'es',
    referral_code: 'NVT' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    nvt_balance: TOKEN.AIRDROP,
    usdt_balance: 0,
    evm_deposit_address: genAddress('0x'),
    trc20_deposit_address: genAddress('T'),
    is_pin_set: false,
    is_admin: false,
  });
  await db.entities.Transaction.create({
    member_id: m.id,
    type: 'airdrop',
    from_currency: 'NVT',
    amount: TOKEN.AIRDROP,
    status: 'completed',
    description: 'Airdrop de bienvenida $NVT',
  });
  return m;
}

export function useMember() {
  const [member, setMember] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // Modo Telegram Mini App: identificar por telegram_id.
    const tgUser = getTelegramUser();
    if (tgUser) {
      readyTelegramWebApp();
      setMe({ id: String(tgUser.id), full_name: tgUsername(tgUser), telegram_id: String(tgUser.id) });
      let list = await db.entities.Member.filter({ telegram_id: String(tgUser.id) });
      let m = list[0];
      if (!m) m = await createMemberFromTelegram(tgUser);
      setMember(m);
      return m;
    }

    // Fallback navegador/preview: sesión Base44 existente.
    try {
      const user = await db.auth.me();
      setMe(user);
      let list = await db.entities.Member.filter({ created_by_id: user.id });
      let m = list[0];
      if (!m) {
        m = await db.entities.Member.create({
          telegram_id: String(user.id),
          username: user.full_name || user.email || 'novapay_user',
          language: 'es',
          referral_code: 'NVT' + Math.random().toString(36).slice(2, 8).toUpperCase(),
          nvt_balance: TOKEN.AIRDROP,
          usdt_balance: 0,
          evm_deposit_address: genAddress('0x'),
          trc20_deposit_address: genAddress('T'),
          is_pin_set: false,
          is_admin: false,
        });
        await db.entities.Transaction.create({
          member_id: m.id,
          type: 'airdrop',
          from_currency: 'NVT',
          amount: TOKEN.AIRDROP,
          status: 'completed',
          description: 'Airdrop de bienvenida $NVT',
        });
      }
      setMember(m);
      return m;
    } catch (e) {
      console.error('useMember', e);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const update = async (data) => {
    const m = await db.entities.Member.update(member.id, data);
    setMember(m);
    return m;
  };

  const reload = async () => load();

  return { member, me, loading, update, reload, setMember, inTelegram: inTelegram() };
}