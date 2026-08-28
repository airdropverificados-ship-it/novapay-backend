const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useEffect, useState, useCallback } from 'react';

import { TOKEN } from '@/lib/crypto';

export function useTokenState() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let list = await db.entities.TokenState.list();
    let s = list[0];
    if (!s) {
      s = await db.entities.TokenState.create({
        nvt_price: TOKEN.PRICE_START,
        max_supply: TOKEN.MAX_SUPPLY,
        circulating_supply: 0,
        is_trading_enabled: false,
        total_swaps: 0,
        total_volume_usdt: 0,
      });
    }
    setState(s);
    return s;
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const update = async (data) => {
    const s = await db.entities.TokenState.update(state.id, data);
    setState(s);
    return s;
  };

  return { state, loading, update, reload: load, setState };
}