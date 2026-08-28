import React, { createContext, useContext } from 'react';
import { useTokenState } from '@/hooks/useTokenState';

const Ctx = createContext(null);

export function TokenProvider({ children }) {
  const value = useTokenState();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTokenCtx() {
  return useContext(Ctx);
}