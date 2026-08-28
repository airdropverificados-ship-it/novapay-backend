import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Zap, Gift, TrendingUp, Lock } from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { useTokenCtx } from '@/lib/TokenContext';
import { fmt, fmtUsd, fmtPrice, TOKEN } from '@/lib/crypto';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const BENEFITS = [
  { title: 'Pagar gas sin comisión', desc: 'Usa NVT para cubrir el gas de retiros y evita la tarifa de red.' },
  { title: 'Recompensas de referidos', desc: 'Acumula 100 NVT por cada amigo y 10 NVT por cada USD depositado.' },
  { title: 'Staking premium', desc: 'Accede a rendimientos diarios del 0.5%–1% respaldados por comisiones reales.' },
  { title: 'Gobernanza futura', desc: 'NVT dará acceso a votaciones y descuentos en comisiones de la plataforma.' },
];

export default function Tokens() {
  const { member } = useMemberCtx();
  const { state: token } = useTokenCtx();
  const balance = member.nvt_balance || 0;
  const value = balance * (token?.nvt_price || TOKEN.PRICE_START);
  const progress = Math.min((balance / TOKEN.DEPOSIT_BONUS_CAP) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Mis Tokens NVT</h1>
        <p className="text-muted-foreground mt-1">Tu token nativo NovaPay. Suministro total 50M · precio algorítmico.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 glass border border-accent/20 glow-accent">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
            <Zap className="w-8 h-8 text-white" fill="white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance $NVT</p>
            <p className="font-display text-4xl font-bold text-gradient">{fmt(balance, 2)}</p>
            <p className="text-sm text-muted-foreground">≈ {fmtUsd(value)} · precio {fmtPrice(token?.nvt_price)} USDT</p>
          </div>
        </div>
        <div className="relative mt-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progreso de acumulación</span>
            <span>{fmt(balance, 0)} / {fmt(TOKEN.DEPOSIT_BONUS_CAP, 0)} NVT</span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Alcanza el tope para maximizar tus bonificaciones por depósito.</p>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-card/60 glass border-border">
          <Gift className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-display font-bold">+{TOKEN.AIRDROP}</p>
          <p className="text-xs text-muted-foreground">Airdrop de bienvenida</p>
        </Card>
        <Card className="p-5 bg-card/60 glass border-border">
          <TrendingUp className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-display font-bold">+{TOKEN.REFERRAL}</p>
          <p className="text-xs text-muted-foreground">Por referido</p>
        </Card>
        <Card className="p-5 bg-card/60 glass border-border">
          <Coins className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-display font-bold">+{TOKEN.DEPOSIT_BONUS_PER_USD}</p>
          <p className="text-xs text-muted-foreground">NVT por USD depositado</p>
        </Card>
      </div>

      <Card className="p-6 bg-card/60 glass border-border">
        <h3 className="font-display font-semibold text-lg mb-4">Beneficios del token</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{b.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link to="/stake"><Button variant="outline"><Lock className="w-4 h-4 mr-2" />Stakear NVT</Button></Link>
          <Link to="/swap"><Button variant="outline"><Zap className="w-4 h-4 mr-2" />Intercambiar</Button></Link>