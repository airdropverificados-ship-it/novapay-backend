const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { Trophy, Crown, Medal } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { fmt } from '@/lib/crypto';

export default function ReferralLeaderboard({ currentMemberId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [referrals, members] = await Promise.all([
          db.entities.Referral.list('-created_date', 500),
          db.entities.Member.list(),
        ]);
        const nameById = Object.fromEntries(members.map((m) => [m.id, m.username || m.referral_code || m.telegram_id]));
        const agg = {};
        for (const r of referrals) {
          const key = r.referrer_id;
          if (!key) continue;
          if (!agg[key]) agg[key] = { id: key, invites: 0, nvt: 0, name: nameById[key] || 'Usuario' };
          agg[key].invites += 1;
          agg[key].nvt += r.reward_tokens || 0;
        }
        const sorted = Object.values(agg)
          .sort((a, b) => b.invites - a.invites || b.nvt - a.nvt)
          .slice(0, 10);
        setRows(sorted);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const top = rows[0]?.invites || 1;

  return (
    <Card className="p-6 bg-card/60 glass border-border">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-warning" />
        <h3 className="font-display font-semibold text-lg">Tabla de posiciones</h3>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Cargando ranking...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Aún no hay datos de ranking.</p>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-12 gap-2 px-2 pb-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/50">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Usuario</div>
            <div className="col-span-3 text-right">Invitados</div>
            <div className="col-span-2 text-right">NVT</div>
            <div className="col-span-2 text-right">Progreso</div>
          </div>
          {rows.map((r, i) => {
            const isMe = r.id === currentMemberId;
            const progress = Math.round((r.invites / top) * 100);
            return (
              <div
                key={r.id}
                className={`grid grid-cols-12 gap-2 items-center px-2 py-2.5 rounded-xl ${isMe ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/40'}`}
              >
                <div className="col-span-1 flex items-center">
                  {i === 0 ? <Crown className="w-4 h-4 text-warning" /> : i < 3 ? <Medal className="w-4 h-4 text-accent" /> : <span className="text-sm font-semibold text-muted-foreground">{i + 1}</span>}
                </div>
                <div className="col-span-4 truncate">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  {isMe && <p className="text-[10px] text-primary">Tú</p>}
                </div>
                <div className="col-span-3 text-right text-sm font-semibold">{fmt(r.invites, 0)}</div>
                <div className="col-span-2 text-right text-sm font-semibold text-accent">{fmt(r.nvt, 0)}</div>
                <div className="col-span-2 flex justify-end">
                  <div className="w-full max-w-[60px] h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}