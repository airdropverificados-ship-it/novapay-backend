const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Crown, Lock, Unlock, Wallet, Users, TrendingUp, DollarSign, Zap,
  ArrowUpFromLine, Plus, Minus, Settings, Palette, Gift, Disc3, Check,
} from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { useTokenCtx } from '@/lib/TokenContext';
import { fmt, fmtUsd, fmtPrice, fmtCrypto, COIN_PRICES, COIN_SYMBOL, BALANCE_FIELDS } from '@/lib/crypto';
import { getTreasury } from '@/lib/ledger';

import AdminAnalytics from '@/components/AdminAnalytics';
import OxaPayPanel from '@/components/OxaPayPanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const COINS = ['USDT', 'TON', 'BSC', 'SOL', 'LTC', 'NVT'];

export default function Admin() {
  const { member } = useMemberCtx();
  const { state: token, update: updateToken } = useTokenCtx();
  const { toast } = useToast();
  const [treasury, setTreasury] = useState(null);
  const [stats, setStats] = useState({ members: 0, volume: 0, swaps: 0 });
  const [adjust, setAdjust] = useState({ id: '', coin: 'USDT', amount: '', mode: 'add' });
  const [appCfg, setAppCfg] = useState(null);

  const THEMES = [
    { id: 'normal', label: 'Normal' },
    { id: 'christmas', label: 'Navideño' },
    { id: 'halloween', label: 'Halloween' },
    { id: 'spring', label: 'Primavera' },
    { id: 'cyberpunk', label: 'Cyberpunk Neon' },
    { id: 'darkgold', label: 'DeFi Dark Gold' },
    { id: 'glass', label: 'Glassmorphism' },
    { id: 'emerald', label: 'Minimalist Emerald' },
  ];

  useEffect(() => {
    db.entities.AppConfig.list().then((l) => setAppCfg(l && l[0] ? l[0] : null));
  }, []);

  const saveCfg = async (patch) => {
    const res = await db.functions.invoke('updateAppConfig', patch);
    if (res.data?.ok) {
      setAppCfg((c) => ({ ...(c || {}), ...patch }));
      toast({ title: 'Configuración global actualizada', description: 'Los cambios se reflejan en tiempo real para todos los usuarios.' });
    } else {
      toast({ title: res.data?.error || 'Error', variant: 'destructive' });
    }
  };

  const load = async () => {
    setTreasury(await getTreasury('USDT'));
    const members = await db.entities.Member.list();
    const txs = await db.entities.Transaction.list();
    setStats({ members: members.length, volume: txs.reduce((s, t) => s + (t.amount || 0), 0), swaps: (token?.total_swaps || 0) });
  };
  useEffect(() => { load(); }, [token?.total_swaps]);

  const toggleTrading = async () => {
    await updateToken({ is_trading_enabled: !token.is_trading_enabled });
    toast({ title: token.is_trading_enabled ? 'NVT bloqueado' : 'NVT liberado' });
  };

  const ownerWithdraw = async () => {
    if (!treasury || treasury.owner_profit <= 0) return toast({ title: 'Sin ganancias disponibles', variant: 'destructive' });
    await db.entities.Treasury.update(treasury.id, { owner_profit: 0 });
    await db.entities.Transaction.create({ member_id: member.id, type: 'admin_adjust', from_currency: 'USDT', amount: treasury.owner_profit, description: `Retiro de ganancias del propietario ${fmtUsd(treasury.owner_profit)}` });
    load();
    toast({ title: 'Ganancias retiradas', description: fmtUsd(treasury.owner_profit) });
  };

  const adjustBalance = async (mode) => {
    const amt = parseFloat(adjust.amount);
    if (!adjust.id || !amt) return toast({ title: 'Completa todos los campos', variant: 'destructive' });
    setAdjust((a) => ({ ...a, mode }));
    const list = await db.entities.Member.filter({ $or: [{ telegram_id: adjust.id }, { referral_code: adjust.id }] });
    const target = list[0];
    if (!target) return toast({ title: 'Usuario no encontrado', variant: 'destructive' });
    const field = BALANCE_FIELDS[adjust.coin];
    const cur = target[field] || 0;
    const next = mode === 'add' ? cur + amt : Math.max(0, cur - amt);
    await db.entities.Member.update(target.id, { [field]: +next.toFixed(6) });
    await db.entities.Transaction.create({ member_id: target.id, type: 'admin_adjust', from_currency: adjust.coin, amount: amt, description: `${mode === 'add' ? '+' : '-'}${fmtCrypto(amt, 4)} ${COIN_SYMBOL[adjust.coin]} por admin` });
    load();
    setAdjust({ ...adjust, amount: '' });
    toast({ title: 'Balance ajustado', description: `${target.username}: ${fmtCrypto(next, 4)} ${COIN_SYMBOL[adjust.coin]}` });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Control maestro · tesorería · analíticas · gestión de tokens.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Usuarios', value: fmt(stats.members, 0) },
          { icon: TrendingUp, label: 'Volumen total', value: fmtUsd(stats.volume) },
          { icon: Zap, label: 'Swaps', value: fmt(stats.swaps, 0) },
          { icon: Wallet, label: 'Precio NVT', value: fmtPrice(token?.nvt_price) },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5 bg-card/60 glass border-border">
              <s.icon className="w-5 h-5 text-accent mb-2" />
              <p className="text-2xl font-display font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Analytics */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-display text-xl font-bold">Analíticas</h2>
          <span className="text-xs text-muted-foreground">Volumen · staking · tesorería</span>
        </div>
        <AdminAnalytics />
      </div>

      {/* Treasury + Token control */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/60 glass border-border">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-lg">Tesorería</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-sm text-muted-foreground">Total comisiones</span><span className="font-semibold">{fmtUsd(treasury?.total_collected || 0)}</span></div>
            <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-sm text-muted-foreground">LP inyectado (70%)</span><span className="font-semibold text-primary">{fmtUsd(treasury?.lp_injected || 0)}</span></div>
            <div className="flex justify-between p-3 rounded-xl bg-secondary/40"><span className="text-sm text-muted-foreground">Ganancia propietario (30%)</span><span className="font-semibold text-success">{fmtUsd(treasury?.owner_profit || 0)}</span></div>
          </div>
          <Button className="w-full mt-4 bg-gradient-to-r from-primary to-accent" onClick={ownerWithdraw}>
            <ArrowUpFromLine className="w-4 h-4 mr-2" /> Retirar ganancias
          </Button>
        </Card>

        <Card className="p-6 bg-card/60 glass border-border">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-accent" />
            <h3 className="font-display font-semibold text-lg">Control de $NVT</h3>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/40">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${token?.is_trading_enabled ? 'bg-success/15' : 'bg-warning/15'}`}>
                {token?.is_trading_enabled ? <Unlock className="w-5 h-5 text-success" /> : <Lock className="w-5 h-5 text-warning" />}
              </div>
              <div>
                <p className="font-medium text-sm">{token?.is_trading_enabled ? 'Comercio habilitado' : 'Comercio pausado'}</p>
                <p className="text-xs text-muted-foreground">is_trading_enabled = {String(token?.is_trading_enabled)}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Al pausar, cualquier swap con NVT muestra "Tokens bloqueados y aumentando su liquidez".</p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button variant="outline" onClick={toggleTrading} disabled={token?.is_trading_enabled}>
              <Unlock className="w-4 h-4 mr-2" /> Liberar NVT
            </Button>
            <Button variant="outline" onClick={toggleTrading} disabled={!token?.is_trading_enabled}>
              <Lock className="w-4 h-4 mr-2" /> Bloquear NVT
            </Button>
          </div>
        </Card>
      </div>

      {/* Apariencia y gamificación */}
      <Card className="p-6 bg-card/60 glass border-border">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-accent" />
          <h3 className="font-display font-semibold text-lg">Apariencia y gamificación</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Tema visual activo (se aplica en tiempo real a todos los usuarios vía suscripción).</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {THEMES.map((t) => {
            const active = (appCfg?.active_theme || 'normal') === t.id;
            return (
              <button
                key={t.id}
                onClick={() => saveCfg({ active_theme: t.id })}
                className={`relative rounded-xl border p-3 text-left text-sm transition-all ${active ? 'border-primary bg-primary/15 glow-primary' : 'border-border bg-secondary/40 hover:border-primary/40'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.label}</span>
                  {active && <Check className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className="mt-2 flex gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: `hsl(var(--${t.id === 'normal' ? 'primary' : 'primary'}))` }} />
                  <span className="w-4 h-4 rounded-full" style={{ background: 'hsl(var(--accent))' }} />
                  <span className="w-4 h-4 rounded-full" style={{ background: 'hsl(var(--card))' }} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          <button
            onClick={() => saveCfg({ roulette_enabled: !appCfg?.roulette_enabled })}
            className={`rounded-xl border p-4 text-left transition-all ${appCfg?.roulette_enabled !== false ? 'border-accent/50 bg-accent/10' : 'border-border bg-secondary/40'}`}
          >
            <Disc3 className="w-5 h-5 text-accent mb-2" />
            <p className="font-medium text-sm">Ruleta de la suerte</p>
            <p className="text-xs text-muted-foreground">{appCfg?.roulette_enabled !== false ? 'Habilitada' : 'Deshabilitada'}</p>
          </button>
          <button
            onClick={() => saveCfg({ chests_enabled: !appCfg?.chests_enabled })}
            className={`rounded-xl border p-4 text-left transition-all ${appCfg?.chests_enabled !== false ? 'border-accent/50 bg-accent/10' : 'border-border bg-secondary/40'}`}
          >
            <Gift className="w-5 h-5 text-accent mb-2" />
            <p className="font-medium text-sm">Cofres flotantes</p>
            <p className="text-xs text-muted-foreground">{appCfg?.chests_enabled !== false ? 'Habilitados' : 'Deshabilitados'}</p>
          </button>
          <div className="rounded-xl border border-border bg-secondary/40 p-4">
            <p className="text-xs text-muted-foreground mb-1">Tope de airdrop (NVT)</p>
            <p className="font-display text-xl font-bold text-accent">{(appCfg?.airdrop_cap_nvt || 15000).toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Límite inquebrantable por usuario.</p>
          </div>
        </div>
      </Card>

      {/* OxaPay gateway */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="font-display text-xl font-bold">Pasarela de pagos</h2>
          <span className="text-xs text-muted-foreground">OxaPay · depósitos y retiros automáticos</span>
        </div>
        <OxaPayPanel />
      </div>

      {/* Adjust user balance */}
      <Card className="p-6 bg-card/60 glass border-border">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-accent" />
          <h3 className="font-display font-semibold text-lg">Ajustar balance de usuario</h3>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Telegram ID o código de referido</Label>
            <Input value={adjust.id} onChange={(e) => setAdjust({ ...adjust, id: e.target.value })} placeholder="764290521 o NVTXXXXXX" className="bg-secondary/40" />
          </div>
          <div>
            <Label className="mb-1.5 block">Moneda</Label>
            <select value={adjust.coin} onChange={(e) => setAdjust({ ...adjust, coin: e.target.value })} className="w-full bg-secondary/40 border border-border rounded-xl px-3 py-2.5 text-sm outline-none">
              {COINS.map((c) => <option key={c} value={c}>{COIN_SYMBOL[c]}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block">Monto</Label>
            <Input type="number" value={adjust.amount} onChange={(e) => setAdjust({ ...adjust, amount: e.target.value })} placeholder="0.00" className="bg-secondary/40" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" className="border-success/40 text-success hover:bg-success/10" onClick={() => adjustBalance('add')}>
            <Plus className="w-4 h-4 mr-2" /> Agregar saldo
          </Button>
          <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => adjustBalance('subtract')}>
            <Minus className="w-4 h-4 mr-2" /> Quitar saldo
          </Button>
        </div>
      </Card>
    </div>
  );
}