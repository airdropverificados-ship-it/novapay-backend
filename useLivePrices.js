const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';

import { COIN_PRICES } from '@/lib/crypto';

const STATIC = Object.fromEntries(
  Object.entries(COIN_PRICES).map(([k, v]) => [k, { price: v, change: 0 }])
);

export function useLivePrices() {
  const [prices, setPrices] = useState(STATIC);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await db.functions.invoke('getCryptoPrices', {});
        if (active && res.data?.prices) {
          setPrices((prev) => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(res.data.prices).map(([k, v]) => [k, { price: v.price ?? v, change: v.change ?? 0 }])
            ),
          }));
        }
      } catch (e) {
        // keep static fallback
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { prices, loading };
}

export const livePrice = (prices, sym) => prices[sym]?.price ?? COIN_PRICES[sym] ?? 0;
export const liveChange = (prices, sym) => prices[sym]?.change ?? 0;