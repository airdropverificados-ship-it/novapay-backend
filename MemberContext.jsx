import React, { createContext, useContext } from 'react';
import { useMember } from '@/hooks/useMember';

const Ctx = createContext(null);

export function MemberProvider({ children }) {
  const value = useMember();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMemberCtx() {
  return useContext(Ctx);
}