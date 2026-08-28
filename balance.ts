const LEGACY = {
  USDT: 'usdt_balance',
  TON: 'ton_balance',
  BSC: 'bsc_balance',
  SOL: 'sol_balance',
  LTC: 'ltc_balance',
  NVT: 'nvt_balance',
};

const APP_TO_OXA = { BSC: 'BNB', TON: 'GRAM' };
const OXA_TO_APP = { BNB: 'BSC', GRAM: 'TON' };

export function appCoin(oxaSymbol) {
  return OXA_TO_APP[oxaSymbol] || oxaSymbol;
}

export function oxaCoin(appSymbol) {
  return APP_TO_OXA[appSymbol] || appSymbol;
}

export function getBalance(member, coin) {
  if (LEGACY[coin]) return member[LEGACY[coin]] || 0;
  return (member.balances && member.balances[coin]) || 0;
}

export function setBalancePatch(member, coin, value) {
  if (LEGACY[coin]) return { [LEGACY[coin]]: +value.toFixed(8) };
  return { balances: { ...(member.balances || {}), [coin]: +value.toFixed(8) } };
}

export const PLATFORM_FEE = 0.005;

export function splitFee(fee) {
  return { lp: +(fee * 0.7).toFixed(8), owner: +(fee * 0.3).toFixed(8) };
}