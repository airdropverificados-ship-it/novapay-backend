const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import {
  Home, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Coins, Lock,
  TrendingUp, History, Users, ShieldCheck, KeyRound, Crown, Zap, LogOut, Menu, X, Copy, Check,
} from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { fmt, fmtUsd, COIN_PRICES, BALANCE_FIELDS } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import FloatingChests from '@/components/FloatingChests';
import SupportButton from '@/components/SupportButton';

const NAV = [
  { to: '/', label: 'Billetera', icon: Home, group: 'main' },
  { to: '/deposit', label: 'Depositar', icon: ArrowDownToLine, group: 'main' },
  { to: '/withdraw', label: 'Retirar', icon: ArrowUpFromLine, group: 'main' },
  { to: '/swap', label: 'Intercambiar', icon: ArrowLeftRight, group: 'main' },
  { to: '/tokens', label: 'Mis Tokens NVT', icon: Coins, group: 'token' },
  { to: '/stake', label: 'Staking', icon: Lock, group: 'token' },
  { to: '/markets', label: 'Mercados', icon: TrendingUp, group: 'token' },
  { to: '/history', label: 'Historial', icon: History, group: 'more' },
  { to: '/referral', label: 'Referidos', icon: Users, group: 'more' },
  { to: '/security', label: 'Seguridad PIN', icon: ShieldCheck, group: 'more' },
  { to: '/api', label: 'Mis APIs', icon: KeyRound, group: 'more' },
  { to: '/admin', label: 'Admin', icon: Crown, group: 'admin' },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
        <Zap className="w-5 h-5 text-white" fill="white" />
      </div>
      <div className="leading-none">
        <p className="font-display font-bold text-lg tracking-tight">NovaPay</p>
        <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Wallet · Swap · Stake</p>
      </div>
    </div>
  );
}

export default function Layout() {
  const { member, loading } = useMemberCtx();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const portfolio = () => {
    if (!member) return 0;
    return ['USDT', 'TON', 'BSC', 'SOL', 'LTC'].reduce(
      (sum, c) => sum + (member[BALANCE_FIELDS[c]] || 0) * COIN_PRICES[c], 0
    );
  };

  const logout = async () => {
    await db.auth.logout('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6">
        <Logo />
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/15 text-primary glow-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`
            }
          >
            <item.icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="glass rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Valor del portafolio</p>
          <p className="font-display text-2xl font-bold mt-1 text-gradient">{fmtUsd(portfolio())}</p>
          <Button
            variant="ghost"
            size="sm"