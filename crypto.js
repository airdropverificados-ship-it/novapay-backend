export const TOKEN = {
  MAX_SUPPLY: 50000000,
  AIRDROP: 800,
  REFERRAL: 100,
  DEPOSIT_BONUS_PER_USD: 10,
  DEPOSIT_BONUS_CAP: 15000,
  PRICE_START: 0.001,
};

export const STAKING = {
  MIN: 1,
  MAX: 5000,
  MIN_DAYS: 18,
  MAX_DAYS: 365,
  RATE_MIN: 0.005,
  RATE_MAX: 0.01,
};

export const FEE = {
  SWAP: 0.005,
  WITHDRAW: 0.005,
  LP_SHARE: 0.7,
  OWNER_SHARE: 0.3,
  API_FEE: 2.5,
  API_FREE_KEYS: 2,
};

export const COIN_PRICES = {
  USDT: 1,
  BTC: 63000,
  ETH: 1880,
  TON: 1.34,
  BSC: 605.4,
  SOL: 75.1,
  LTC: 44.4,
  TRX: 0.33,
  DOGE: 0.07,
  MATIC: 0.075,
  SHIB: 0.0000045,
  XRP: 1.0,
  BCH: 203.8,
  USDC: 1,
  POL: 0.5,
  GRAM: 1.34,
  XMR: 150,
  DAI: 1,
  NVT: 0.001,
};

export const COIN_LABELS = {
  USDT: 'Tether USD',
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  TON: 'Toncoin',
  BSC: 'BNB Smart Chain',
  SOL: 'Solana',
  LTC: 'Litecoin',
  TRX: 'Tron',
  DOGE: 'Dogecoin',
  MATIC: 'Polygon',
  SHIB: 'Shiba Inu',
  XRP: 'XRP',
  BCH: 'Bitcoin Cash',
  USDC: 'USD Coin',
  POL: 'Polygon',
  GRAM: 'Gram (TON)',
  XMR: 'Monero',
  DAI: 'DAI',
  NVT: 'NovaPay Token',
};

export const COIN_SYMBOL = {
  USDT: '₮',
  BTC: 'BTC',
  ETH: 'ETH',
  TON: 'TON',
  BSC: 'BNB',
  SOL: 'SOL',
  LTC: 'LTC',
  TRX: 'TRX',
  DOGE: 'DOGE',
  MATIC: 'MATIC',
  SHIB: 'SHIB',
  XRP: 'XRP',
  BCH: 'BCH',
  USDC: 'USDC',
  POL: 'POL',
  GRAM: 'GRAM',
  XMR: 'XMR',
  DAI: 'DAI',
  NVT: 'NVT',
};

export const BALANCE_FIELDS = {
  USDT: 'usdt_balance',
  TON: 'ton_balance',
  BSC: 'bsc_balance',
  SOL: 'sol_balance',
  LTC: 'ltc_balance',
  NVT: 'nvt_balance',
};

export const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtPrice = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });

export const fmtCrypto = (n, d = 4) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtUsd = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const genAddress = (prefix = '0x') =>
  prefix + Array.from({ length: 38 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');

export const genApiKey = () =>
  'nv_live_' + Array.from({ length: 32 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');

export const genTxHash = () =>
  '0x' + Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');

export const nextPrice = (price, volumeUsdt) =>
  Number((price * (1 + 0.0009 * (volumeUsdt / 50))).toFixed(6));

export const splitFee = (fee) => ({
  lp: +(fee * FEE.LP_SHARE).toFixed(6),
  owner: +(fee * FEE.OWNER_SHARE).toFixed(6),
});

export const explorerFor = (currency, hash) => {
  const map = {
    USDT: `https://tronscan.org/#/transaction/${hash}`,
    TON: `https://tonscan.org/tx/${hash}`,
    BSC: `https://bscscan.com/tx/${hash}`,
    SOL: `https://solscan.io/tx/${hash}`,
    LTC: `https://blockchair.com/litecoin/transaction/${hash}`,
    NVT: `https://novapay.io/explorer/${hash}`,
  };
  return map[currency] || '#';
};

export const OXA_COIN = { BSC: 'BNB', TON: 'GRAM' };
export const APP_COIN = { BNB: 'BSC', GRAM: 'TON' };
export const oxaCoin = (c) => OXA_COIN[c] || c;
export const appCoin = (c) => APP_COIN[c] || c;

export const getCoinBalance = (member, coin) => {
  if (BALANCE_FIELDS[coin]) return member[BALANCE_FIELDS[coin]] || 0;
  return (member.balances && member.balances[coin]) || 0;
};

export const coinBalanceUpdate = (member, coin, value) => {
  if (BALANCE_FIELDS[coin]) return { [BALANCE_FIELDS[coin]]: +value.toFixed(8) };
  return { balances: { ...(member.balances || {}), [coin]: +value.toFixed(8) } };
};