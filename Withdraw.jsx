const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { ArrowUpFromLine, AlertCircle, Loader2 } from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { fmtCrypto, COIN_SYMBOL, COIN_LABELS, FEE, getCoinBalance, oxaCoin } from '@/lib/crypto';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function Withdraw() {
  const { member, reload } = useMemberCtx();
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState([]);
  const [coin, setCoin] = useState('');
  const [network, setNetwork] = useState('');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    db.functions.invoke('oxapayCurrencies', {}).then((res) => setCurrencies(res.data?.currencies || []));
  }, []);

  const legacyHeld = ['USDT', 'TON', 'BSC', 'SOL', 'LTC'].filter((c) => getCoinBalance(member, c) > 0);
  const jsonHeld = member?.balances ? Object.keys(member.balances).filter((c) => (member.balances[c] || 0) > 0) : [];
  const coinOptions = [...new Set([...legacyHeld, ...jsonHeld])];

  useEffect(() => {
    if (!coin && coinOptions.length) setCoin(coinOptions[0]);
  }, [coinOptions.length]);

  const oxaSymbol = oxaCoin(coin);
  const cur = currencies.find((c) => c.symbol === oxaSymbol);
  const networks = cur?.networks || [];
  const net = networks.find((n) => n.network === network) || networks[0];

  useEffect(() => {
    if (networks.length && !networks.find((n) => n.network === network)) {
      setNetwork(networks[0]?.network || '');
    }
  }, [coin]);

  const balance = getCoinBalance(member, coin);
  const amt = parseFloat(amount) || 0;
  const platformFee = +(amt * FEE.WITHDRAW).toFixed(8);
  const networkFee = net?.withdraw_fee || 0;
  const receive = +(amt - platformFee - networkFee).toFixed(8);

  const submit = async () => {
    if (!member.is_pin_set) return toast({ title: 'Configura tu PIN primero en Seguridad', variant: 'destructive' });
    if (member.pin_code !== pin) return toast({ title: 'PIN incorrecto', variant: 'destructive' });
    if (amt <= 0) return toast({ title: 'Monto inválido', variant: 'destructive' });
    if (!address) return toast({ title: 'Ingresa la dirección de destino', variant: 'destructive' });
    if (amt > balance) return toast({ title: 'Saldo insuficiente', variant: 'destructive' });
    if (receive <= 0) return toast({ title: 'El monto no cubre las comisiones', variant: 'destructive' });
    setSending(true);
    try {
      const res = await db.functions.invoke('oxapayPayout', {
        address, amount: amt, currency: oxaSymbol, network: net?.payout_net || '', networkFee, pin,
      });
      if (res.data?.ok) {
        await reload();
        setAmount(''); setAddress(''); setPin('');
        toast({ title: 'Retiro enviado a OxaPay', description: `${fmtCrypto(res.data.receive, 6)} ${COIN_SYMBOL[coin] || coin} · track ${res.data.track_id}` });
      } else {
        toast({ title: res.data?.error || 'Error en el retiro', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error de conexión', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Retirar</h1>
        <p className="text-muted-foreground mt-1">Retiros automáticos vía OxaPay. Comisión plataforma 0.5% + tarifa de red aparte, descontadas del monto.</p>
      </div>

      <Card className="p-6 bg-card/60 glass border-border space-y-4">
        <div>
          <Label className="mb-1.5 block">Moneda</Label>
          <select value={coin} onChange={(e) => setCoin(e.target.value)} className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm outline-none">
            {coinOptions.length === 0 && <option value="">Sin saldos disponibles</option>}
            {coinOptions.map((c) => <option key={c} value={c}>{COIN_SYMBOL[c] || c} · {COIN_LABELS[c] || c}</option>)}
          </select>
          <p className="text-xs text-muted-foreground mt-2">Disponible: {fmtCrypto(balance, 6)} {COIN_SYMBOL[coin] || coin}</p>