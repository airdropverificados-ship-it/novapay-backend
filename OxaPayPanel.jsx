const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { ShieldCheck, KeyRound, Link2, Zap, Loader2, CheckCircle2, XCircle, Copy } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function OxaPayPanel() {
  const { toast } = useToast();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState(null);
  const [form, setForm] = useState({ merchant_api_key: '', payout_api_key: '', webhook_url: '', webhook_secret: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await db.functions.invoke('oxapayAdmin', { action: 'get_config' });
      const cfg = res.data?.config;
      setConfig(cfg);
      if (cfg) setForm((f) => ({ ...f, webhook_url: cfg.webhook_url || '', webhook_secret: cfg.webhook_secret || '' }));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await db.functions.invoke('oxapayAdmin', { action: 'save_config', ...form });
      if (res.data?.ok) {
        setConfig(res.data.config);
        setForm((f) => ({ ...f, merchant_api_key: '', payout_api_key: '' }));
        toast({ title: 'Configuración de OxaPay guardada' });
      } else {
        toast({ title: res.data?.error || 'Error al guardar', variant: 'destructive' });
      }
    } finally {
      setSaving(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTest(null);
    try {
      const res = await db.functions.invoke('oxapayAdmin', { action: 'test' });
      setTest(res.data);
      if (res.data?.error) toast({ title: res.data.error, variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado' });
  };

  return (
    <Card className="p-6 bg-card/60 glass border-border space-y-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-accent" />
        <h3 className="font-display font-semibold text-lg">Pasarela OxaPay</h3>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full ${config?.has_merchant ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
          {config?.has_merchant ? 'Conectado' : 'Sin configurar'}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Cargando configuración...</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Merchant API Key (depósitos)</Label>
              <Input
                type="password"
                value={form.merchant_api_key}
                onChange={(e) => setForm({ ...form, merchant_api_key: e.target.value })}
                placeholder={config?.merchant_api_key_masked || 'Pega tu Merchant API Key'}
                className="bg-secondary/40 font-mono text-sm"
              />
            </div>
            <div>
              <Label className="mb-1.5 flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Payout API Key (retiros)</Label>
              <Input
                type="password"
                value={form.payout_api_key}
                onChange={(e) => setForm({ ...form, payout_api_key: e.target.value })}
                placeholder={config?.payout_api_key_masked || 'Pega tu Payout API Key'}
                className="bg-secondary/40 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> Webhook URL (callback de depósitos)</Label>
            <Input
              value={form.webhook_url}
              onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
              placeholder="https://api.db.com/.../functions/oxapayPaymentWebhook"
              className="bg-secondary/40 font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Pégala desde Code → Functions → oxapayPaymentWebhook. OxaPay enviará aquí las confirmaciones de pago.</p>
          </div>

          <div>
            <Label className="mb-1.5 block">Webhook secret</Label>
            <div className="flex gap-2">
              <Input
                value={form.webhook_secret}
                onChange={(e) => setForm({ ...form, webhook_secret: e.target.value })}
                placeholder="Secreto de verificación"
                className="bg-secondary/40 font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={() => copy(form.webhook_secret)}><Copy className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-primary to-accent">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Guardar claves
            </Button>
            <Button variant="outline" onClick={runTest} disabled={testing || !config?.has_merchant}>
              {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Verificar conexión
            </Button>
          </div>

          {test && !test.error && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className={`rounded-xl p-3 border ${test.merchant?.ok ? 'border-success/40 bg-success/10' : 'border-destructive/40 bg-destructive/10'}`}>
                <div className="flex items-center gap-2">
                  {test.merchant?.ok ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive" />}
                  <p className="text-sm font-medium">Depósitos (Merchant)</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{test.merchant?.message}</p>
              </div>
              <div className={`rounded-xl p-3 border ${test.payout?.ok ? 'border-success/40 bg-success/10' : 'border-destructive/40 bg-destructive/10'}`}>
                <div className="flex items-center gap-2">
                  {test.payout?.ok ? <CheckCircle2 className="w-4 h-4 text-success" /> : <XCircle className="w-4 h-4 text-destructive" />}
                  <p className="text-sm font-medium">Retiros (Payout)</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{test.payout?.message}</p>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}