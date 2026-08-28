const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { KeyRound, Plus, Trash2, Copy, Webhook, AlertCircle } from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { fmtUsd, fmtCrypto, genApiKey, genTxHash, FEE } from '@/lib/crypto';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function ApiB2b() {
  const { member, update, reload } = useMemberCtx();
  const { toast } = useToast();
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState('');

  const load = async () => {
    if (!member) return;
    const list = await db.entities.ApiKeyB2b.filter({ member_id: member.id }, '-created_date');
    setKeys(list);
  };
  useEffect(() => { load(); }, [member]);

  const create = async () => {
    if (!name.trim()) return toast({ title: 'Asigna un nombre a la API', variant: 'destructive' });
    let charge = 0;
    if (keys.length >= FEE.API_FREE_KEYS) {
      charge = FEE.API_FEE;
      if ((member.usdt_balance || 0) < charge) return toast({ title: 'Saldo USDT insuficiente para la tarifa de API', variant: 'destructive' });
      await update({ usdt_balance: +((member.usdt_balance || 0) - charge).toFixed(6) });
      await db.entities.Transaction.create({
        member_id: member.id, type: 'api_fee', from_currency: 'USDT', amount: charge,
        status: 'completed', description: `Cargo por API adicional "${name}"`,
      });
    }
    const key = genApiKey();
    await db.entities.ApiKeyB2b.create({ member_id: member.id, name: name.trim(), api_key: key, is_active: true });
    await reload();
    load();
    setName('');
    toast({ title: charge > 0 ? `API creada · cobro ${fmtUsd(charge)}` : 'API creada' });
  };

  const remove = async (k) => {
    await db.entities.ApiKeyB2b.delete(k.id);
    load();
    toast({ title: 'API eliminada' });
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast({ title: 'Clave copiada' }); };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Mis APIs B2B</h1>
        <p className="text-muted-foreground mt-1">Conecta proyectos externos con claves únicas. Las primeras 2 son gratis; desde la 3ra, {fmtUsd(FEE.API_FEE)}.</p>
      </div>

      <Card className="p-6 bg-card/60 glass border-border space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Plus className="w-4 h-4 text-accent" />
          <h3 className="font-display font-semibold">Generar nueva API</h3>
        </div>
        <div>
          <Label className="mb-1.5 block">Nombre del proyecto</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Bot de inversión" className="bg-secondary/40" />
        </div>
        <Button className="w-full bg-gradient-to-r from-primary to-accent" onClick={create}>
          <KeyRound className="w-4 h-4 mr-2" /> Crear clave API
        </Button>
        {keys.length >= FEE.API_FREE_KEYS && (
          <div className="flex items-start gap-2 text-xs text-warning">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Ya tienes {FEE.API_FREE_KEYS} claves gratuitas. La siguiente tendrá un cargo de {fmtUsd(FEE.API_FEE)}.
          </div>
        )}
      </Card>

      <Card className="p-6 bg-card/60 glass border-border">
        <div className="flex items-center gap-2 mb-3">
          <Webhook className="w-4 h-4 text-accent" />
          <h3 className="font-display font-semibold">Claves activas ({keys.length})</h3>
        </div>
        {keys.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Aún no tienes claves API.</p>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <div key={k.id} className="rounded-2xl bg-secondary/40 border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center"><KeyRound className="w-4 h-4 text-primary" /></div>
                    <div><p className="font-medium text-sm">{k.name}</p><p className="text-[11px] text-muted-foreground">{new Date(k.created_date).toLocaleDateString()}</p></div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(k)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-background/60 border border-border p-2.5">
                  <code className="flex-1 text-xs font-mono text-muted-foreground truncate">{k.api_key}</code>
                  <Button size="sm" variant="ghost" onClick={() => copy(k.api_key)}><Copy className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}