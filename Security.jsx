import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, KeyRound, Check } from 'lucide-react';
import { useMemberCtx } from '@/lib/MemberContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function Security() {
  const { member, update } = useMemberCtx();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');

  const save = async () => {
    if (!/^\d{4}$/.test(pin)) return toast({ title: 'El PIN debe tener 4 dígitos', variant: 'destructive' });
    if (pin !== confirm) return toast({ title: 'Los PIN no coinciden', variant: 'destructive' });
    await update({ pin_code: pin, is_pin_set: true });
    setPin(''); setConfirm('');
    toast({ title: 'PIN configurado', description: 'Tu clave de seguridad está activa.' });
  };

  const dots = [0, 1, 2, 3].map((i) => (pin.length > i ? '●' : '○')).join(' ');

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Seguridad PIN</h1>
        <p className="text-muted-foreground mt-1">Clave de 4 dígitos obligatoria para retiros y operaciones delicadas.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 glass border border-primary/20 glow-primary flex flex-col items-center">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary mb-4">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <p className="font-display text-2xl font-bold">{member?.is_pin_set ? 'PIN activo' : 'Configura tu PIN'}</p>
        <p className="text-3xl tracking-[0.6em] text-muted-foreground mt-2 font-mono">{dots}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {member?.is_pin_set ? 'Tu clave protege cada retiro de fondos.' : 'Aún no has configurado una clave.'}
        </p>
      </motion.div>

      <Card className="p-6 bg-card/60 glass border-border space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-4 h-4 text-accent" />
          <h3 className="font-display font-semibold">{member?.is_pin_set ? 'Cambiar PIN' : 'Crear PIN'}</h3>
        </div>
        <div>
          <Label className="mb-1.5 block">Nuevo PIN (4 dígitos)</Label>
          <Input type="password" inputMode="numeric" maxLength={4} value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="••••"
            className="bg-secondary/40 tracking-[0.5em] text-center" />
        </div>
        <div>
          <Label className="mb-1.5 block">Confirmar PIN</Label>
          <Input type="password" inputMode="numeric" maxLength={4} value={confirm}
            onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))} placeholder="••••"
            className="bg-secondary/40 tracking-[0.5em] text-center" />
        </div>
        <Button className="w-full bg-gradient-to-r from-primary to-accent" onClick={save}>
          {member?.is_pin_set ? <Check className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
          {member?.is_pin_set ? 'Actualizar PIN' : 'Guardar PIN'}
        </Button>
      </Card>
    </div>
  );
}