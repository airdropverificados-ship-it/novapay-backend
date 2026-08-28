const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, TrendingUp, Calendar, Coins, Award } from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { fmt, fmtUsd, fmtCrypto, STAKING, genTxHash } from '@/lib/crypto';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const DURATIONS = [
  { days: 18, label: '18 días' },
  { days: 90, label: '3 meses' },
  { days: 180, label: '6 meses' },
  { days: 365, label: '12 meses' },
];

export default function Stake() {
  const { member, update, reload } = useMemberCtx();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [days, setDays] = useState(90);
  const [stakes, setStakes] = useState([]);

  const loadStakes = async () => {
    if (!member) return;
    const list = await db.entities.Stake.filter({ member_id: member.id }, '-created_date');
    setStakes(list);
  };
  useEffect(() => { loadStakes(); }, [member]);

  const amt = parseFloat(amount) || 0;
  const dailyRate = (STAKING.RATE_MIN + STAKING.RATE_MAX) / 2;
  const dailyEst = amt * dailyRate;

  const create = async () => {
    if (amt < STAKING.MIN) return toast({ title: `Mínimo ${STAKING.MIN} USD`, variant: 'destructive' });
    if (amt > STAKING.MAX) return toast({ title: `Máximo ${STAKING.MAX} USD por usuario`, variant: 'destructive' });
    if (amt > (member.usdt_balance || 0)) return toast({ title: 'Saldo USDT insuficiente', variant: 'destructive' });

    const rate = +(STAKING.RATE_MIN + Math.random() * (STAKING.RATE_MAX - STAKING.RATE_MIN)).toFixed(4);
    const start = new Date();
    const end = new Date(start.getTime() + days * 86400000);
    await update({ usdt_balance: +((member.usdt_balance || 0) - amt).toFixed(6) });
    await db.entities.Stake.create({
      member_id: member.id,
      amount_usd: amt,
      currency: 'USDT',
      duration_days: days,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      daily_rate: rate,
      accumulated_reward: 0,
      status: 'active',
      last_reward_date: start.toISOString(),
    });
    const hash = genTxHash();
    await db.entities.Transaction.create({
      member_id: member.id,
      type: 'stake',
      from_currency: 'USDT',
      amount: amt,
      status: 'completed',
      tx_hash: hash,
      description: `Stake ${fmtUsd(amt)} por ${days} días @ ${(rate * 100).toFixed(2)}% diario`,
    });
    await reload();
    loadStakes();
    setAmount('');
    toast({ title: 'Staking activado', description: `${fmtUsd(amt)} bloqueados por ${days} días` });
  };

  const claim = async (s) => {
    const now = new Date();
    const last = new Date(s.last_reward_date || s.start_date);
    const elapsedDays = Math.max(0, (now - last) / 86400000);
    if (elapsedDays < 1) return toast({ title: 'Aún no hay recompensa disponible hoy', variant: 'destructive' });
    const reward = +(s.amount_usd * s.daily_rate * Math.floor(elapsedDays)).toFixed(6);
    const finished = now >= new Date(s.end_date);
    await db.entities.Stake.update(s.id, {
      accumulated_reward: +(s.accumulated_reward + reward).toFixed(6),
      last_reward_date: now.toISOString(),
      status: finished ? 'completed' : 'active',
    });
    await update({ usdt_balance: +((member.usdt_balance || 0) + reward + (finished ? s.amount_usd : 0)).toFixed(6) });
    await db.entities.Transaction.create({
      member_id: member.id,
      type: 'staking_reward',
      from_currency: 'USDT',
      amount: reward,