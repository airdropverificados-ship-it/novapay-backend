const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Lock, Coins, TrendingUp,
  Wallet, Zap, Plus,
} from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { useTokenCtx } from '@/lib/TokenContext';
import {
  fmt, fmtCrypto, fmtUsd, fmtPrice, COIN_LABELS, COIN_SYMBOL, BALANCE_FIELDS, TOKEN, getCoinBalance,
} from '@/lib/crypto';
import { useLivePrices, livePrice } from '@/hooks/useLivePrices';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LuckyRoulette from '@/components/LuckyRoulette';

const ASSETS = ['USDT', 'TON', 'BSC', 'SOL', 'LTC'];

export default function Dashboard() {
  const { member } = useMemberCtx();
  const { state: token } = useTokenCtx();
  const { prices } = useLivePrices();
  const [txs, setTxs] = useState([]);

  useEffect(() => {
    if (!member) return;
    db.entities.Transaction.filter({ member_id: member.id }, '-created_date', 5).then(setTxs);
  }, [member]);

  const extraAssets = member.balances ? Object.keys(member.balances).filter((c) => !BALANCE_FIELDS[c] && c !== 'NVT' && (member.balances[c] || 0) > 0) : [];
  const portfolio = ASSETS.reduce((s, c) => s + (member[BALANCE_FIELDS[c]] || 0) * livePrice(prices, c), 0)
    + extraAssets.reduce((s, c) => s + (member.balances[c] || 0) * livePrice(prices, c), 0);
  const nvtValue = (member.nvt_balance || 0) * (token?.nvt_price || TOKEN.PRICE_START);

  const quick = [
    { to: '/deposit', label: 'Depositar', icon: ArrowDownToLine, color: 'from-emerald-400 to-teal-500' },
    { to: '/withdraw', label: 'Retirar', icon: ArrowUpFromLine, color: 'from-rose-400 to-pink-500' },
    { to: '/swap', label: 'Intercambiar', icon: ArrowLeftRight, color: 'from-violet-400 to-indigo-500' },
    { to: '/stake', label: 'Staking', icon: Lock, color: 'from-amber-400 to-orange-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero balance card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 md:p-8 glass glow-primary border border-primary/20"
      >
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-10 -bottom-20 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Wallet className="w-4 h-4" /> Valor total del portafolio
          </div>
          <p className="font-display text-4xl md:text-5xl font-bold mt-2 text-gradient">{fmtUsd(portfolio)}</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="text-muted-foreground">+ NVT <span className="text-accent font-semibold">{fmtCrypto(member.nvt_balance, 2)}</span></span>
            <span className="text-muted-foreground">≈ <span className="text-accent font-semibold">{fmtUsd(nvtValue)}</span></span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {quick.map((q) => (
              <Link key={q.to} to={q.to}>
                <div className="group rounded-2xl p-3 bg-secondary/50 border border-border hover:border-primary/40 transition-all">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${q.color} flex items-center justify-center mb-2`}>
                    <q.icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <p className="text-sm font-medium">{q.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Asset list */}
        <Card className="lg:col-span-2 p-6 bg-card/60 glass border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Mis activos</h3>
            <Link to="/deposit"><Button variant="ghost" size="sm" className="text-primary"><Plus className="w-4 h-4 mr-1" />Añadir</Button></Link>
          </div>
          <div className="space-y-1">
            {ASSETS.map((c) => {
              const bal = member[BALANCE_FIELDS[c]] || 0;
              const usd = bal * livePrice(prices, c);
              return (
                <div key={c} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary/40 border border-border flex items-center justify-center font-display font-bold text-sm">
                    {COIN_SYMBOL[c].slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{COIN_SYMBOL[c]}</p>
                    <p className="text-xs text-muted-foreground truncate">{COIN_LABELS[c]}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{fmtCrypto(bal, 4)}</p>
                    <p className="text-xs text-muted-foreground">{fmtUsd(usd)}</p>
                  </div>
                </div>
              );
            })}
            {extraAssets.map((c) => {
              const bal = member.balances[c] || 0;
              const usd = bal * livePrice(prices, c);
              return (
                <div key={c} className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary/40 border border-border flex items-center justify-center font-display font-bold text-sm">
                    {(COIN_SYMBOL[c] || c).slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{COIN_SYMBOL[c] || c}</p>
                    <p className="text-xs text-muted-foreground truncate">{COIN_LABELS[c] || c}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{fmtCrypto(bal, 4)}</p>
                    <p className="text-xs text-muted-foreground">{fmtUsd(usd)}</p>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" fill="white" />
              </div>
              <div className="flex-1">
                <p className="font-medium">NVT</p>
                <p className="text-xs text-muted-foreground">NovaPay Token</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">{fmtCrypto(member.nvt_balance, 2)}</p>
                <p className="text-xs text-muted-foreground">{fmtUsd(nvtValue)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* NVT + market snapshot */}
        <div className="space-y-6">
          <Card className="p-6 bg-card/60 glass border-border">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-accent" />
              <h3 className="font-display font-semibold">$NVT en vivo</h3>
            </div>
            <p className="text-3xl font-display font-bold text-gradient mt-2">{fmtPrice(token?.nvt_price)} USDT</p>
            <p className="text-xs text-muted-foreground mt-1">Incremento algorítmico por transacción</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase">Suministro máx.</p>
                <p className="font-semibold">{fmt(TOKEN.MAX_SUPPLY / 1e6, 0)}M</p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3">
                <p className="text-[11px] text-muted-foreground uppercase">Swaps totales</p>
                <p className="font-semibold">{fmt(token?.total_swaps || 0, 0)}</p>
              </div>
            </div>
            <Link to="/markets"><Button variant="outline" size="sm" className="w-full mt-4"><TrendingUp className="w-4 h-4 mr-2" />Ver mercados</Button></Link>
          </Card>
        </div>
      </div>

      {/* Ruleta de la suerte */}
      <LuckyRoulette />

      {/* Recent activity */}
      <Card className="p-6 bg-card/60 glass border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-lg">Actividad reciente</h3>
          <Link to="/history" className="text-sm text-primary hover:underline">Ver todo</Link>
        </div>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Aún no hay movimientos. Realiza tu primer depósito.</p>
        ) : (
          <div className="space-y-1">
            {txs.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize">{t.type.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.description || `${t.from_currency || ''} ${t.to_currency ? '→ ' + t.to_currency : ''}`}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fmtCrypto(t.amount, 4)} {t.from_currency || ''}</p>
                  <p className={`text-xs ${t.status === 'completed' ? 'text-success' : 'text-warning'}`}>{t.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}