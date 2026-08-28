const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Clock } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useMemberCtx } from '@/lib/MemberContext';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const WHEEL = [1, 2, 5, 8, 10, 15, 25];
const SEG = 360 / WHEEL.length;
const COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--primary))', 'hsl(var(--accent))',
];
const COOLDOWN = 12 * 3600 * 1000;

function fmtRemaining(ms) {
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function LuckyRoulette() {
  const { config } = useTheme();
  const { member, reload } = useMemberCtx();
  const { toast } = useToast();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastPrize, setLastPrize] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  if (config?.roulette_enabled === false) return null;

  const last = member?.last_roulette_at ? new Date(member.last_roulette_at).getTime() : 0;
  const remaining = COOLDOWN - (now - last);
  const onCooldown = last > 0 && remaining > 0;

  const spin = async () => {
    if (spinning || onCooldown) return;
    setSpinning(true);
    setLastPrize(null);
    try {
      const res = await db.functions.invoke('rouletteSpin', {});
      const prize = res.data?.prize;
      if (res.data?.error || prize == null) {
        toast({ title: res.data?.error || 'No se pudo girar', variant: 'destructive' });
        setSpinning(false);
        return;
      }
      const idx = WHEEL.indexOf(prize);
      const target = 360 * 6 + (360 - (idx * SEG + SEG / 2));
      setRotation((prev) => prev - (prev % 360) + target);
      setTimeout(async () => {
        setLastPrize(prize);
        await reload();
        setNow(Date.now());
        toast({
          title: `🎉 Ganaste ${prize} NVT`,
          description: prize === 25 ? '¡Premio mayor!' : 'Recompensa acreditada',
        });
        setSpinning(false);
      }, 4200);
    } catch (e) {
      toast({ title: 'Error de conexión', variant: 'destructive' });
      setSpinning(false);
    }
  };

  return (
    <Card className="p-6 bg-card/60 glass border-border">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-accent" />
        <h3 className="font-display font-semibold text-lg">Ruleta de la Suerte</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">1 giro cada 12h</span>
      </div>
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-56 h-56">
          <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-8 border-r-8 border-t-[16px] border-l-transparent border-r-transparent border-t-foreground" />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-border shadow-2xl overflow-hidden"
            style={{
              background: `conic-gradient(${WHEEL.map((v, i) => `${COLORS[i]} ${i * SEG}deg ${(i + 1) * SEG}deg`).join(',')})`,
            }}
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
          >
            {WHEEL.map((v, i) => (
              <div key={v} className="absolute inset-0" style={{ transform: `rotate(${i * SEG + SEG / 2}deg)` }}>
                <span className="absolute top-3 left-1/2 -translate-x-1/2 text-white font-display font-bold drop-shadow">{v}</span>
              </div>
            ))}
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-card border-2 border-border flex items-center justify-center text-[10px] font-bold">NVT</div>
          </div>
        </div>
        <Button className="bg-gradient-to-r from-primary to-accent" onClick={spin} disabled={spinning || onCooldown}>
          {onCooldown ? <Clock className="w-4 h-4 mr-2" /> : spinning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {spinning ? 'Girando...' : onCooldown ? `Disponible en ${fmtRemaining(remaining)}` : 'Girar ruleta'}
        </Button>
        {lastPrize != null && !spinning && !onCooldown && (
          <p className="text-sm text-muted-foreground">Último premio: <span className="text-accent font-semibold">{lastPrize} NVT</span></p>
        )}
      </div>
    </Card>
  );
}