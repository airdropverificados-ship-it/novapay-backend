const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ArrowDownToLine, QrCode, Zap, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { fmtCrypto, COIN_SYMBOL, coinBalanceUpdate, getCoinBalance, appCoin, genTxHash, explorerFor } from '@/lib/crypto';
import { rewardReferrer } from '@/lib/ledger';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function Deposit() {
  const { member, update, reload } = useMemberCtx();
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState([]);
  const [loadingCur, setLoadingCur] = useState(true);
  const [coin, setCoin] = useState('USDT');
  const [network, setNetwork] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [demoAmount, setDemoAmount] = useState('');

  useEffect(() => {
    db.functions.invoke('oxapayCurrencies', {})
      .then((res) => {
        const list = res.data?.currencies || [];
        setCurrencies(list);
        const first = list.find((c) => c.symbol === 'USDT') || list[0];
        if (first) { setCoin(first.symbol); setNetwork(first.networks[0]?.network || ''); }
      })
      .finally(() => setLoadingCur(false));
  }, []);

  const cur = currencies.find((c) => c.symbol === coin);
  const networks = cur?.networks || [];
  const net = networks.find((n) => n.network === network) || networks[0];
  const addrKey = `${coin}:${network}`;
  const address = member?.deposit_addresses?.[addrKey];

  const generate = async () => {
    if (!coin || !network) return;
    setGenerating(true); setGenError(null);
    try {
      const res = await db.functions.invoke('oxapayGenerateAddress', { currency: coin, network });
      if (res.data?.address) {
        await reload();
        toast({ title: 'Dirección generada' });
      } else {
        setGenError(res.data?.error || 'No se pudo generar');
        toast({ title: res.data?.error || 'Error', variant: 'destructive' });
      }
    } catch (e) {
      setGenError('OxaPay no configurado');
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
    toast({ title: 'Dirección copiada' });
  };

  const simulate = async () => {
    const amt = parseFloat(demoAmount);
    if (!amt || amt <= 0) return toast({ title: 'Ingresa un monto válido', variant: 'destructive' });
    const appC = appCoin(coin);
    await update(coinBalanceUpdate(member, appC, getCoinBalance(member, appC) + amt));
    const hash = genTxHash();
    await db.entities.Transaction.create({
      member_id: member.id, type: 'deposit', from_currency: appC, amount: amt,
      status: 'completed', tx_hash: hash, explorer_url: explorerFor(appC, hash),
      description: `Depósito ${COIN_SYMBOL[appC] || appC} (demo)`,
    });
    db.functions.invoke('notifyTelegramDeposit', { member_id: member.id, amount: amt, currency: appC, tx_hash: hash }).catch(() => {});
    if (member.referred_by && coin === 'USDT') await rewardReferrer(member, amt * 10, 'deposit');
    await reload(); setDemoAmount('');
    toast({ title: 'Depósito acreditado', description: `${fmtCrypto(amt, 4)} ${COIN_SYMBOL[appC] || appC}` });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Depositar</h1>
        <p className="text-muted-foreground mt-1">Genera una dirección estática única para cualquier moneda soportada por OxaPay.</p>
      </div>

      <Card className="p-6 bg-card/60 glass border-border space-y-5">
        <div className="flex items-center gap-2">
          <ArrowDownToLine className="w-4 h-4 text-accent" />
          <h3 className="font-display font-semibold">Dirección de depósito</h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Moneda</Label>
            <select
              value={coin}
              onChange={(e) => {
                setCoin(e.target.value);
                const c = currencies.find((x) => x.symbol === e.target.value);
                setNetwork(c?.networks[0]?.network || '');
              }}
              className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm outline-none"
              disabled={loadingCur}
            >
              {currencies.map((c) => <option key={c.symbol} value={c.symbol}>{c.symbol} · {c.name}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block">Red</Label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm outline-none"
              disabled={loadingCur || networks.length === 0}
            >
              {networks.map((n) => <option key={n.network} value={n.network}>{n.name}</option>)}
            </select>
          </div>
        </div>

        {net && (
          <p className="text-xs text-muted-foreground">
            Mínimo de depósito: <span className="text-foreground font-medium">{fmtCrypto(net.deposit_min, 6)} {coin}</span>
          </p>
        )}

        <div className="rounded-xl bg-secondary/60 border border-border p-4 break-all font-mono text-xs leading-relaxed min-h-[56px] flex items-center">
          {generating ? (
            <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando dirección estática en OxaPay...</span>
          ) : address ? address : genError ? (
            <span className="text-destructive">{genError}</span>
          ) : (
            <span className="text-muted-foreground">Pulsa generar para obtener tu dirección</span>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={!address || generating} onClick={copy}>
            {copied ? <Check className="w-4 h-4 mr-2 text-success" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copiado' : 'Copiar dirección'}
          </Button>
          <Button variant="ghost" disabled={generating} onClick={generate} title={address ? 'Regenerar' : 'Generar'}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : address ? <RefreshCw className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          </Button>
        </div>

        {!address && !generating && (
          <Button className="w-full bg-gradient-to-r from-primary to-accent" onClick={generate}>
            <QrCode className="w-4 h-4 mr-2" /> Generar dirección
          </Button>
        )}

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Los depósitos se acreditan automáticamente cuando OxaPay confirma la transacción en la red.
        </div>
      </Card>

      <Card className="p-6 bg-card/60 glass border-border">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-accent" />
          <h3 className="font-display font-semibold">Registrar depósito (demo)</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Moneda</Label>
            <select value={coin} onChange={(e) => setCoin(e.target.value)} className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm outline-none">
              {currencies.map((c) => <option key={c.symbol} value={c.symbol}>{c.symbol}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block">Monto</Label>
            <Input type="number" value={demoAmount} onChange={(e) => setDemoAmount(e.target.value)} placeholder="0.00" className="bg-secondary/40" />
          </div>
        </div>
        <Button className="w-full mt-5 bg-gradient-to-r from-primary to-accent" onClick={simulate}>
          <Zap className="w-4 h-4 mr-2" fill="white" /> Acreditar depósito
        </Button>
      </Card>
    </div>
  );
}