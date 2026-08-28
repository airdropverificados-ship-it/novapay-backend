const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Gift, Copy, Check, TrendingUp, Share2 } from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { fmt, TOKEN } from '@/lib/crypto';

import { Card } from '@/components/ui/card';
import ReferralLeaderboard from '@/components/ReferralLeaderboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export default function Referral() {
  const { member } = useMemberCtx();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);

  const link = `https://t.me/novapay_bot?start=${member?.referral_code || ''}`;

  const load = async () => {
    if (!member) return;
    const list = await db.entities.Referral.filter({ referrer_id: member.id }, '-created_date');
    setReferrals(list);
  };
  useEffect(() => { load(); }, [member]);

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: 'Enlace copiado' });
  };

  const totalEarned = referrals.reduce((s, r) => s + (r.reward_tokens || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Referidos</h1>
        <p className="text-muted-foreground mt-1">Invita amigos y gana 100 NVT cada uno + 10 NVT por USD depositado.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 glass border border-accent/20 glow-accent">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Share2 className="w-4 h-4" /> Tu enlace de invitación</div>
          <div className="flex gap-2 mt-3">
            <Input readOnly value={link} className="bg-secondary/60 font-mono text-sm" />
            <Button onClick={copy} className="bg-gradient-to-r from-primary to-accent">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Código: <span className="font-mono text-accent">{member?.referral_code}</span></p>
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-card/60 glass border-border">
          <Users className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-display font-bold">{fmt(referrals.length, 0)}</p>
          <p className="text-xs text-muted-foreground">Amigos invitados</p>
        </Card>
        <Card className="p-5 bg-card/60 glass border-border">
          <Gift className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-display font-bold">{fmt(totalEarned, 0)}</p>
          <p className="text-xs text-muted-foreground">NVT ganados</p>
        </Card>
        <Card className="p-5 bg-card/60 glass border-border">
          <TrendingUp className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-display font-bold">{fmt(TOKEN.REFERRAL)}</p>
          <p className="text-xs text-muted-foreground">NVT por referido</p>
        </Card>
      </div>

      <Card className="p-6 bg-card/60 glass border-border">
        <h3 className="font-display font-semibold text-lg mb-3">Recompensas de referidos</h3>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Aún no tienes referidos. Comparte tu enlace para empezar a ganar NVT.</p>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
                <div className="flex-1"><p className="text-sm font-medium">Nuevo referido</p><p className="text-xs text-muted-foreground">{new Date(r.created_date).toLocaleDateString()}</p></div>
                <div className="text-right"><p className="text-sm font-semibold text-accent">+{fmt(r.reward_tokens, 0)} NVT</p><p className="text-xs text-success">{r.status}</p></div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ReferralLeaderboard currentMemberId={member?.id} />
    </div>
  );
}