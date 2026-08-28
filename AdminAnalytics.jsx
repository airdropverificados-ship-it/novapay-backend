const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { Activity, Lock, Landmark } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { fmt, fmtUsd, fmtCrypto } from '@/lib/crypto';
import { getTreasury } from '@/lib/ledger';

const DAY_MS = 86400000;

function dayKey(d) {
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
}

function lastNDays(n) {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const t = new Date(today.getTime() - i * DAY_MS);
    days.push(t);
  }
  return days;
}

export default function AdminAnalytics() {
  const [txs, setTxs] = useState([]);
  const [stakes, setStakes] = useState([]);
  const [treasury, setTreasury] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, s, tr] = await Promise.all([
          db.entities.Transaction.list('-created_date', 1000),
          db.entities.Stake.list('-created_date', 1000),
          getTreasury('USDT'),
        ]);
        setTxs(t);
        setStakes(s);
        setTreasury(tr);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { swapVolume, treasuryGrowth, stakedGrowth, totalStaked, activeStaked } = useMemo(() => {
    const days = lastNDays(14);
    const dayIdx = new Map(days.map((d, i) => [d.toISOString().slice(0, 10), i]));

    const swap = days.map((d) => ({ day: dayKey(d), volume: 0 }));
    const fees = days.map((d) => ({ day: dayKey(d), fees: 0 }));
    const staked = days.map((d) => ({ day: dayKey(d), staked: 0 }));

    let cumFees = 0;
    let totalStakedSum = 0;
    let activeStakedSum = 0;

    for (const tx of txs) {
      const key = new Date(tx.created_date).toISOString().slice(0, 10);
      const idx = dayIdx.get(key);
      if (tx.type === 'swap' && idx != null) swap[idx].volume += tx.amount || 0;
      if (idx != null) {
        cumFees += tx.fee || 0;
        fees[idx].fees = cumFees;
      }
    }

    for (const s of stakes) {
      totalStakedSum += s.amount_usd || 0;
      if (s.status === 'active') activeStakedSum += s.amount_usd || 0;
      const key = new Date(s.created_date).toISOString().slice(0, 10);
      const idx = dayIdx.get(key);
      if (idx != null) staked[idx].staked += s.amount_usd || 0;
    }

    // cumulative fees (treasury growth) — fill forward
    let run = 0;
    const treasuryGrowth = fees.map((f) => {
      if (f.fees > 0) run = f.fees;
      return { day: f.day, total: run };
    });

    return { swapVolume: swap, treasuryGrowth, stakedGrowth: staked, totalStaked: totalStakedSum, activeStaked: activeStakedSum };
  }, [txs, stakes]);

  if (loading) {
    return <Card className="p-6 bg-card/60 glass border-border text-center text-sm text-muted-foreground">Cargando analíticas...</Card>;
  }

  const summary = [
    { icon: Activity, label: 'Volumen swaps (14d)', value: fmtUsd(swapVolume.reduce((s, d) => s + d.volume, 0)), color: 'text-primary' },
    { icon: Lock, label: 'Total apostado', value: fmtUsd(totalStaked), color: 'text-accent' },
    { icon: Landmark, label: 'Comisiones tesorería', value: fmtUsd(treasury?.total_collected || 0), color: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        {summary.map((s) => (
          <Card key={s.label} className="p-5 bg-card/60 glass border-border">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-card/60 glass border-border">
        <h3 className="font-display font-semibold text-lg mb-4">Volumen diario de swaps</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={swapVolume} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gSwap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(263 85% 66%)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(263 85% 66%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 26% 19%)" />
            <XAxis dataKey="day" stroke="hsl(215 18% 58%)" fontSize={11} tickLine={false} />
            <YAxis stroke="hsl(215 18% 58%)" fontSize={11} tickFormatter={(v) => fmt(v, 0)} />
            <Tooltip contentStyle={{ background: 'hsl(230 38% 11%)', border: '1px solid hsl(230 26% 19%)', borderRadius: 12 }} formatter={(v) => fmtUsd(v)} />
            <Area type="monotone" dataKey="volume" stroke="hsl(263 85% 66%)" strokeWidth={2} fill="url(#gSwap)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/60 glass border-border">
          <h3 className="font-display font-semibold text-lg mb-4">Tokens apostados por día</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stakedGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 26% 19%)" />
              <XAxis dataKey="day" stroke="hsl(215 18% 58%)" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(215 18% 58%)" fontSize={11} tickFormatter={(v) => fmt(v, 0)} />
              <Tooltip contentStyle={{ background: 'hsl(230 38% 11%)', border: '1px solid hsl(230 26% 19%)', borderRadius: 12 }} formatter={(v) => fmtUsd(v)} />
              <Bar dataKey="staked" fill="hsl(174 72% 51%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-3">Activo ahora: <span className="text-accent font-semibold">{fmtUsd(activeStaked)}</span></p>
        </Card>

        <Card className="p-6 bg-card/60 glass border-border">
          <h3 className="font-display font-semibold text-lg mb-4">Crecimiento de la tesorería</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={treasuryGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 26% 19%)" />
              <XAxis dataKey="day" stroke="hsl(215 18% 58%)" fontSize={11} tickLine={false} />
              <YAxis stroke="hsl(215 18% 58%)" fontSize={11} tickFormatter={(v) => fmt(v, 0)} />
              <Tooltip contentStyle={{ background: 'hsl(230 38% 11%)', border: '1px solid hsl(230 26% 19%)', borderRadius: 12 }} formatter={(v) => fmtUsd(v)} />
              <Line type="monotone" dataKey="total" stroke="hsl(152 62% 48%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-3">Ganancia propietario: <span className="text-success font-semibold">{fmtUsd(treasury?.owner_profit || 0)}</span></p>
        </Card>
      </div>
    </div>
  );
}