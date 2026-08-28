const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Lock, Gift, Coins, ExternalLink, KeyRound, Settings, Search } from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { fmtCrypto, fmtUsd, fmt } from '@/lib/crypto';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const FILTERS = [
  { key: 'all', label: 'Todos', types: null },
  { key: 'deposit', label: 'Depósitos', types: ['deposit'] },
  { key: 'withdraw', label: 'Retiros', types: ['withdraw'] },
  { key: 'swap', label: 'Cambios', types: ['swap'] },
];

const ICONS = {
  deposit: ArrowDownToLine, withdraw: ArrowUpFromLine, swap: ArrowLeftRight,
  stake: Lock, unstake: Lock, staking_reward: Coins, referral: Gift,
  airdrop: Gift, api_fee: KeyRound, admin_adjust: Settings,
};
const COLORS = {
  deposit: 'text-success', withdraw: 'text-destructive', swap: 'text-primary',
  stake: 'text-warning', staking_reward: 'text-accent', airdrop: 'text-accent',
  referral: 'text-accent', api_fee: 'text-muted-foreground', admin_adjust: 'text-primary',
};

export default function History() {
  const { member } = useMemberCtx();
  const [txs, setTxs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!member) return;
    db.entities.Transaction.filter({ member_id: member.id }, '-created_date', 200).then(setTxs);
  }, [member]);

  const filtered = useMemo(() => {
    const types = FILTERS.find((f) => f.key === filter)?.types;
    const q = query.trim().toLowerCase();
    return txs.filter((t) => {
      if (types && !types.includes(t.type)) return false;
      if (!q) return true;
      const hay = `${t.type} ${t.from_currency || ''} ${t.to_currency || ''} ${t.description || ''} ${t.tx_hash || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [txs, filter, query]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Historial</h1>
        <p className="text-muted-foreground mt-1">Extracto de tus últimas operaciones con enlaces a exploradores.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                filter === f.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card/60 text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por moneda, descripción o hash..."
            className="pl-9"
          />
        </div>
      </div>

      <Card className="p-2 bg-card/60 glass border-border">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Sin movimientos que coincidan.</p>
        ) : (
          filtered.map((t) => {
            const Icon = ICONS[t.type] || Coins;
            const color = COLORS[t.type] || 'text-muted-foreground';
            return (
              <div key={t.id} className="px-4 py-3.5 flex items-center gap-3 border-b border-border/50 last:border-0">
                <div className={`w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center ${color}`}>
                  <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize">{t.type.replace('_', ' ')} {t.from_currency ? `${t.from_currency}${t.to_currency ? ' → ' + t.to_currency : ''}` : ''}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.description || new Date(t.created_date).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fmtCrypto(t.amount, 4)} {t.from_currency || ''}</p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className={`text-xs ${t.status === 'completed' ? 'text-success' : t.status === 'pending' ? 'text-warning' : 'text-destructive'}`}>{t.status}</span>
                    {t.explorer_url && t.explorer_url !== '#' && (
                      <a href={t.explorer_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}