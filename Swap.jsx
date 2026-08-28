const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, ArrowDown, Lock, Zap } from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { useTokenCtx } from '@/lib/TokenContext';
import {
  fmtCrypto, COIN_SYMBOL, COIN_LABELS, BALANCE_FIELDS, FEE, genTxHash, explorerFor,
} from '@/lib/crypto';
import { useLivePrices, livePrice } from '@/hooks/useLivePrices';
import { addFeeToTreasury, bumpTokenPrice, rewardReferrer } from '@/lib/ledger';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const COINS = ['USDT', 'TON', 'BSC', 'SOL', 'LTC', 'NVT'];

export default function Swap() {
  const { member, update, reload } = useMemberCtx();
  const { state: token, update: updateToken } = useTokenCtx();
  const { prices } = useLivePrices();
  const { toast } = useToast();
  const [from, setFrom] = useState('USDT');
  const [to, setTo] = useState('TON');
  const [amount, setAmount] = useState('');

  const fromField = BALANCE_FIELDS[from];
  const balance = member[fromField] || 0;
  const amt = parseFloat(amount) || 0;
  const fromPrice = livePrice(prices, from);
  const toPrice = to === 'NVT' ? (token?.nvt_price || 0.001) : livePrice(prices, to);
  const usdValue = amt * fromPrice;
  const fee = +(usdValue * FEE.SWAP).toFixed(6);
  const outNet = usdValue - fee;
  const output = +(outNet / toPrice).toFixed(6);

  const involvesNvt = from === 'NVT' || to === 'NVT';
  const tradingBlocked = involvesNvt && !token?.is_trading_enabled;

  useEffect(() => {
    if (from === to) setTo(COINS.find((c) => c !== from));
  }, [from]);

  const flip = () => { setFrom(to); setTo(from); };

  const submit = async () => {
    if (tradingBlocked) return toast({ title: 'Tokens bloqueados y aumentando su liquidez', variant: 'destructive' });
    if (amt <= 0) return toast({ title: 'Monto inválido', variant: 'destructive' });
    if (amt > balance) return toast({ title: 'Saldo insuficiente', variant: 'destructive' });

    const updates = {
      [fromField]: +(balance - amt).toFixed(6),
      [BALANCE_FIELDS[to]]: +((member[BALANCE_FIELDS[to]] || 0) + output).toFixed(6),
    };
    await update(updates);

    await addFeeToTreasury('USDT', fee);
    if (involvesNvt) await bumpTokenPrice(usdValue, token, updateToken);
    if (member.referred_by) await rewardReferrer(member, 0.5, 'swap');

    const hash = genTxHash();
    await db.entities.Transaction.create({
      member_id: member.id,
      type: 'swap',
      from_currency: from,
      to_currency: to,
      amount: amt,
      amount_out: output,
      fee,
      status: 'completed',
      tx_hash: hash,
      explorer_url: explorerFor(to, hash),
      description: `Swap ${fmtCrypto(amt, 4)} ${COIN_SYMBOL[from]} → ${fmtCrypto(output, 4)} ${COIN_SYMBOL[to]}`,
    });
    await reload();
    setAmount('');
    toast({ title: 'Lightning Swap completado', description: `${fmtCrypto(output, 4)} ${COIN_SYMBOL[to]} recibidos` });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Intercambiar</h1>
        <p className="text-muted-foreground mt-1">Lightning Swaps instantáneos dentro de la plataforma.</p>
      </div>

      <Card className="p-6 bg-card/60 glass border-border space-y-3">
        {/* From */}
        <div className="rounded-2xl bg-secondary/40 border border-border p-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Desde</span>
            <span>Saldo: {fmtCrypto(balance, 4)} {COIN_SYMBOL[from]}</span>
          </div>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="bg-transparent border-0 text-2xl font-display font-bold px-0 focus-visible:ring-0"
            />
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-secondary border border-border rounded-xl px-3 py-2 font-medium text-sm outline-none cursor-pointer"
            >
              {COINS.map((c) => <option key={c} value={c}>{COIN_SYMBOL[c]}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-center -my-1">
          <button onClick={flip} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:rotate-180 transition-transform duration-300">
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        {/* To */}
        <div className="rounded-2xl bg-secondary/40 border border-border p-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Hacia</span>
            <span>Saldo: {fmtCrypto(member[BALANCE_FIELDS[to]] || 0, 4)} {COIN_SYMBOL[to]}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-2xl font-display font-bold text-muted-foreground">{output || '0.00'}</div>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-secondary border border-border rounded-xl px-3 py-2 font-medium text-sm outline-none cursor-pointer"
            >
              {COINS.map((c) => <option key={c} value={c}>{COIN_SYMBOL[c]}</option>)}
            </select>
          </div>
        </div>

        {tradingBlocked ? (
          <div className="flex items-center gap-2 rounded-xl bg-warning/10 border border-warning/30 p-3.5 text-sm text-warning">
            <Lock className="w-4 h-4 shrink-0" /> Tokens bloqueados y aumentando su liquidez
          </div>
        ) : (
          <div className="rounded-xl bg-secondary/40 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Comisión (0.5%)</span><span>{fmtCrypto(fee, 6)} USDT</span></div>
            <div className="flex justify-between text-muted-foreground"><span>70% → LP · 30% → Tesorería</span><span>Auto</span></div>
            <div className="flex justify-between font-medium"><span>Tasa</span><span>1 {COIN_SYMBOL[from]} = {fmtCrypto(toPrice / fromPrice, 6)} {COIN_SYMBOL[to]}</span></div>
          </div>
        )}

        <Button className="w-full bg-gradient-to-r from-primary to-accent" onClick={submit}>
          <ArrowLeftRight className="w-4 h-4 mr-2" /> Ejecutar Lightning Swap
        </Button>
      </Card>
    </div>
  );
}