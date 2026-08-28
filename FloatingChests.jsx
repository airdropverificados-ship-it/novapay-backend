const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useMemberCtx } from '@/lib/MemberContext';

import { useToast } from '@/components/ui/use-toast';

const HOUR = 3600 * 1000;
const THREE_H = 3 * HOUR;

export default function FloatingChests() {
  const { config } = useTheme();
  const { member, reload } = useMemberCtx();
  const { toast } = useToast();
  const [chest, setChest] = useState(null);

  const spawn = useCallback(() => {
    const x = 8 + Math.random() * 64;
    const y = 20 + Math.random() * 50;
    setChest({ x, y });
  }, []);

  useEffect(() => {
    if (config?.chests_enabled === false) {
      setChest(null);
      return;
    }
    const last = member?.last_chest_at ? new Date(member.last_chest_at).getTime() : 0;
    let delay;
    if (!last) {
      delay = THREE_H + Math.random() * HOUR;
    } else {
      const elapsed = Date.now() - last;
      if (elapsed >= THREE_H) delay = Math.random() * HOUR;
      else delay = (THREE_H - elapsed) + Math.random() * HOUR;
    }
    const t = setTimeout(spawn, delay);
    return () => clearTimeout(t);
  }, [config?.chests_enabled, member?.last_chest_at, spawn]);

  const claim = async () => {
    setChest(null);
    try {
      const res = await db.functions.invoke('claimChest', {});
      if (res.data?.ok && res.data?.prize != null) {
        await reload();
        toast({ title: `🎁 +${res.data.prize} NVT`, description: 'Cofre del tesoro reclamado' });
      } else {
        toast({ title: res.data?.error || 'Sin recompensa', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Error de conexión', variant: 'destructive' });
    }
  };

  if (!chest) return null;

  return (
    <AnimatePresence>
      <motion.button
        key="chest"
        initial={{ scale: 0, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        onClick={claim}
        className="fixed z-[9999] flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl glow-accent"
        style={{ left: `${chest.x}%`, top: `${chest.y}%` }}
        title="Cofre del tesoro · toca para reclamar"
      >
        <Gift className="w-7 h-7 text-white" />
        <motion.span
          className="absolute -inset-1 rounded-2xl border-2 border-amber-300/60"
          animate={{ scale: [1, 1.18, 1], opacity: [0.85, 0.3, 0.85] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      </motion.button>
    </AnimatePresence>
  );
}