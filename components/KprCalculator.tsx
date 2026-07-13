'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// ─── Types & Helpers ─────────────────────────────────────────────────────────

interface TipeRumah {
  id: number;
  nama: string;
  harga: number;
  status: string;
}

interface KprCalculatorProps {
  tipeRumahList: TipeRumah[];
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const TENOR_OPTIONS = [10, 15, 20, 25, 30];

// ─── Component ──────────────────────────────────────────────────────────────

export default function KprCalculator({ tipeRumahList }: KprCalculatorProps) {
  const sorted = [...tipeRumahList].sort((a, b) => a.harga - b.harga);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [dpPercent, setDpPercent] = useState(5);
  const [bunga, setBunga] = useState(5.0);
  const [tenorTahun, setTenorTahun] = useState(15);

  const selected = sorted[selectedIdx] ?? sorted[0];
  const harga = selected?.harga ?? 0;

  // Auto-adjust defaults based on type
  useEffect(() => {
    if (!selected) return;
    if (selected.status === 'subsidi') {
      setBunga(5.0);
      setDpPercent(1);
    } else {
      setBunga(8.5);
      setDpPercent(10);
    }
  }, [selected]);

  if (!harga) return null;

  // Calculations
  const dpNominal = (harga * dpPercent) / 100;
  const plafon = harga - dpNominal;
  const r = (bunga / 100) / 12;
  const n = tenorTahun * 12;
  const cicilan = r > 0
    ? plafon * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    : plafon / n;
  const gajiMin = cicilan / 0.3;

  const isSubsidi = selected?.status === 'subsidi';

  return (
    <Card className="overflow-hidden border-border/50 shadow-lg shadow-primary/5">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-primary/8 to-transparent border-b border-border/50 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary" weight="duotone" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">Kalkulator KPR</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Estimasi cicilan berdasarkan harga perumahan ini</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Inputs ──────────────────────────────── */}
        <div className="space-y-5">
          {/* Tipe Rumah */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Pilih Tipe Rumah</label>
            <Select value={String(selectedIdx)} onValueChange={v => setSelectedIdx(Number(v))}>
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sorted.map((t, i) => (
                  <SelectItem key={t.id} value={String(i)}>
                    {t.nama} — {formatRupiah(t.harga)}
                    <Badge
                      variant="secondary"
                      className={cn('ml-2 text-[10px] uppercase',
                        t.status === 'subsidi' ? 'text-emerald-600' : 'text-blue-600'
                      )}
                    >
                      {t.status}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* DP & Bunga sliders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold">Uang Muka</label>
                <span className="text-primary font-bold text-sm">{dpPercent}%</span>
              </div>
              <input
                type="range" min={0} max={50} step={1}
                value={dpPercent} onChange={e => setDpPercent(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground text-right">{formatRupiah(dpNominal)}</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold">Suku Bunga</label>
                <span className="text-primary font-bold text-sm">{bunga}%</span>
              </div>
              <input
                type="range" min={1} max={15} step={0.5}
                value={bunga} onChange={e => setBunga(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground text-right">Per tahun</p>
            </div>
          </div>

          {/* Tenor buttons */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Tenor</label>
            <div className="flex flex-wrap gap-2">
              {TENOR_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTenorTahun(t)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg border text-sm font-semibold transition-all duration-150',
                    tenorTahun === t
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20'
                      : 'bg-background border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                >
                  {t}th
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Output ──────────────────────────────── */}
        <div className="bg-muted/40 rounded-2xl p-5 border border-border/50 flex flex-col justify-center gap-4">
          {/* Plafon */}
          <div className="text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Plafon Pinjaman</p>
            <p className="text-lg font-bold">{formatRupiah(plafon)}</p>
          </div>

          <Separator />

          {/* Cicilan */}
          <div className="bg-background rounded-xl px-4 py-5 border border-border/50 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Estimasi Cicilan Bulanan</p>
            <p className="text-3xl font-black text-primary tracking-tight">{formatRupiah(cicilan)}</p>
            <p className="text-xs text-muted-foreground mt-1">Selama {n} bulan</p>
          </div>

          {/* Gaji minimal info */}
          <div className={cn(
            'rounded-xl p-4 flex items-start gap-3 border',
            isSubsidi
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-400'
          )}>
            <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
              {isSubsidi
                ? <CheckCircle className="w-4 h-4 text-emerald-600" weight="fill" />
                : <WarningCircle className="w-4 h-4 text-blue-600" weight="fill" />
              }
            </div>
            <div>
              <p className="text-sm font-bold mb-0.5">Gaji Minimal yang Disarankan</p>
              <p className="text-xs opacity-80 mb-1.5">Maksimal 30% dari penghasilan untuk cicilan.</p>
              <p className="font-black text-base">{formatRupiah(gajiMin)} <span className="text-xs font-normal opacity-70">/ bln</span></p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
