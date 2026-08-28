import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useTokenCtx } from '@/lib/TokenContext';
import { fmt, fmtPrice, fmtUsd, COIN_LABELS, COIN_SYMBOL } from '@/lib/crypto';
import { useLivePrices, livePrice, liveChange } from '@/hooks/useLivePrices';
import { Card } from '@/components/ui/card';

const MARKETS = ['USDT', 'BTC', 'ETH', 'TON', 'BSC', 'SOL', 'LTC', 'TRX', 'DOGE', 'MATIC', 'SHIB', 'XRP', 'BCH'];

export default function Markets() {
  const { state: token } = useTokenCtx();
  const { prices } = useLivePrices();
  const nvtPrice = token?.nvt_price || 0.001;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Mercados</h1>
        <p className="text-muted-foreground mt-1">Cotizaciones en tiempo real y precio algorítmico de $NVT.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 glass border border-primary/20 glow-primary">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <div>
              <p className="font-display font-bold">NVT / USDT</p>
              <p className="text-xs text-muted-foreground">NovaPay Token</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold text-gradient">{fmtPrice(nvtPrice)}</p>
            <p className="text-xs text-success flex items-center gap-1 justify-end"><TrendingUp className="w-3.5 h-3.5" /> +{fmt((token?.total_swaps || 0) * 0.09, 2)}%</p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-3 mt-5 text-sm">
          <div className="rounded-xl bg-secondary/40 p-3"><p className="text-[11px] text-muted-foreground uppercase">Volumen</p><p className="font-semibold">{fmtUsd(token?.total_volume_usdt || 0)}</p></div>
          <div className="rounded-xl bg-secondary/40 p-3"><p className="text-[11px] text-muted-foreground uppercase">Suministro máx.</p><p className="font-semibold">50M</p></div>
          <div className="rounded-xl bg-secondary/40 p-3"><p className="text-[11px] text-muted-foreground uppercase">Swaps</p><p className="font-semibold">{fmt(token?.total_swaps || 0, 0)}</p></div>
        </div>
      </motion.div>

      <Card className="p-2 bg-card/60 glass border-border">
        <div className="px-4 py-3 grid grid-cols-4 text-xs uppercase tracking-wide text-muted-foreground">
          <span>Activo</span><span className="text-right">Precio</span><span className="text-right">24h</span><span className="text-right">Valor</span>
        </div>
        {MARKETS.map((c) => {
          const price = livePrice(prices, c);
          const change = liveChange(prices, c);
          const up = change >= 0;
          return (
            <div key={c} className="px-4 py-3.5 grid grid-cols-4 items-center border-t border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-secondary/30 border border-border flex items-center justify-center font-display font-bold text-xs">{COIN_SYMBOL[c].slice(0, 1)}</div>
                <div><p className="font-medium text-sm">{COIN_SYMBOL[c]}</p><p className="text-[11px] text-muted-foreground">{COIN_LABELS[c]}</p></div>
              </div>
              <p className="text-right font-medium text-sm">{fmtUsd(price)}</p>
              <p className={`text-right text-sm flex items-center gap-1 justify-end ${up ? 'text-success' : 'text-destructive'}`}>
                {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {up ? '+' : ''}{fmt(change, 2)}%
              </p>
              <p className="text-right text-sm text-muted-foreground">{fmtUsd(price * 1000)}</p>
            </div>
          );
        })}
      </Card>
    </div>
  );
}