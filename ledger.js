const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


import { FEE, splitFee, nextPrice, TOKEN } from './crypto';

export async function getTreasury(currency) {
  const list = await db.entities.Treasury.filter({ currency });
  let t = list[0];
  if (!t) t = await db.entities.Treasury.create({ currency, total_collected: 0, lp_injected: 0, owner_profit: 0 });
  return t;
}

export async function addFeeToTreasury(currency, fee) {
  const t = await getTreasury(currency);
  const { lp, owner } = splitFee(fee);
  return db.entities.Treasury.update(t.id, {
    total_collected: +(t.total_collected + fee).toFixed(6),
    lp_injected: +(t.lp_injected + lp).toFixed(6),
    owner_profit: +(t.owner_profit + owner).toFixed(6),
  });
}

export async function bumpTokenPrice(volumeUsdt, tokenState, updateToken) {
  const p = nextPrice(tokenState.nvt_price, volumeUsdt);
  await updateToken({
    nvt_price: p,
    total_swaps: (tokenState.total_swaps || 0) + 1,
    total_volume_usdt: +((tokenState.total_volume_usdt || 0) + volumeUsdt).toFixed(2),
    circulating_supply: +((tokenState.circulating_supply || 0)).toFixed(2),
  });
  return p;
}

export async function rewardReferrer(member, tokens, reason = 'deposit') {
  if (!member.referred_by) return null;
  const refs = await db.entities.Member.filter({ referral_code: member.referred_by });
  const r = refs[0];
  if (!r) return null;
  await db.entities.Member.update(r.id, {
    nvt_balance: +((r.nvt_balance || 0) + tokens).toFixed(2),
  });
  await db.entities.Referral.create({
    referrer_id: r.id,
    referred_id: member.id,
    reward_tokens: tokens,
    deposit_bonus_tokens: reason === 'deposit' ? tokens : 0,
    status: 'paid',
  });
  return r;
}