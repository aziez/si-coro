'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, Money, Percent, CalendarBlank, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka);
};

interface TipeRumah {
  id: number;
  nama: string;
  harga: number;
  status: string;
}

interface KprCalculatorProps {
  tipeRumahList: TipeRumah[];
}

export default function KprCalculator({ tipeRumahList }: KprCalculatorProps) {
  // Sort types by price so we start with the cheapest
  const sortedTypes = [...tipeRumahList].sort((a, b) => a.harga - b.harga);
  
  const [selectedTipeIndex, setSelectedTipeIndex] = useState(0);
  const [dpPercent, setDpPercent] = useState(5);
  const [bunga, setBunga] = useState(5.0); // 5% flat FLPP default
  const [tenorTahun, setTenorTahun] = useState(15);
  
  const selectedTipe = sortedTypes[selectedTipeIndex] || sortedTypes[0];
  const harga = selectedTipe ? selectedTipe.harga : 0;
  
  // Update default interest based on type status
  useEffect(() => {
    if (selectedTipe) {
      if (selectedTipe.status === 'subsidi') {
        setBunga(5.0);
        setDpPercent(1); // Subsidi often allows 1% DP
      } else {
        setBunga(8.5); // Average commercial rate
        setDpPercent(10);
      }
    }
  }, [selectedTipe]);

  // Calculations
  const dpNominal = (harga * dpPercent) / 100;
  const plafonPinjaman = harga - dpNominal;
  
  // Rumus Anuitas Bulanan: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
  // r = monthly interest rate
  // n = total months
  const monthlyRate = (bunga / 100) / 12;
  const totalMonths = tenorTahun * 12;
  
  let cicilanPerBulan = 0;
  if (monthlyRate > 0) {
    cicilanPerBulan = plafonPinjaman * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  } else {
    cicilanPerBulan = plafonPinjaman / totalMonths; // If 0% interest
  }

  // DSR (Debt Service Ratio) is typically max 30-35%
  const minimalGaji = cicilanPerBulan / 0.3;

  if (!harga) return null;

  return (
    <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-lg shadow-primary/5">
      <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 md:p-8 border-b border-border/50">
        <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
          <Calculator className="w-8 h-8 text-primary" weight="duotone" />
          Kalkulator KPR Pintar
        </h2>
        <p className="text-muted-foreground mt-2">
          Estimasi cicilan rumah impian Anda. Sesuaikan uang muka dan jangka waktu.
        </p>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        {/* Left Col: Inputs */}
        <div className="space-y-6">
          {/* Tipe Rumah Select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Pilih Tipe Rumah</label>
            <select 
              value={selectedTipeIndex}
              onChange={(e) => setSelectedTipeIndex(Number(e.target.value))}
              className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {sortedTypes.map((tipe, idx) => (
                <option key={tipe.id} value={idx}>
                  Tipe {tipe.nama} - {formatRupiah(tipe.harga)} ({tipe.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Uang Muka (DP) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span>Uang Muka (DP)</span>
                <span className="text-primary font-bold">{dpPercent}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="1"
                value={dpPercent}
                onChange={(e) => setDpPercent(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground text-right">{formatRupiah(dpNominal)}</p>
            </div>

            {/* Suku Bunga */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span>Suku Bunga / Tahun</span>
                <span className="text-primary font-bold">{bunga}%</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="15" 
                step="0.5"
                value={bunga}
                onChange={(e) => setBunga(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground text-right">Fixed Rate</p>
            </div>
          </div>

          {/* Tenor */}
          <div className="space-y-3 pt-2">
            <label className="text-sm font-semibold text-foreground">Jangka Waktu (Tenor)</label>
            <div className="grid grid-cols-3 gap-3">
              {[10, 15, 20].map((thn) => (
                <button
                  key={thn}
                  onClick={() => setTenorTahun(thn)}
                  className={cn(
                    "py-2 px-4 rounded-xl border text-sm font-semibold transition-all duration-200",
                    tenorTahun === thn 
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" 
                      : "bg-background border-border/50 text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {thn} Tahun
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Output */}
        <div className="bg-muted/50 rounded-3xl p-6 md:p-8 flex flex-col justify-center border border-border/50">
          <div className="text-center space-y-2 mb-8">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Plafon Pinjaman</p>
            <p className="text-xl font-bold">{formatRupiah(plafonPinjaman)}</p>
          </div>

          <div className="bg-background rounded-2xl p-6 shadow-sm border border-border/50 text-center mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">Estimasi Cicilan Bulanan</p>
            <p className="text-4xl font-black text-primary tracking-tight">
              {formatRupiah(cicilanPerBulan)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Selama {totalMonths} bulan</p>
          </div>

          <div className={cn(
            "rounded-2xl p-4 flex items-start gap-3 border",
            selectedTipe.status === 'subsidi' 
              ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400"
              : "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400"
          )}>
            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              {selectedTipe.status === 'subsidi' ? (
                <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
              ) : (
                <WarningCircle className="w-5 h-5 text-blue-600" weight="fill" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold mb-1">Syarat Gaji Minimal</p>
              <p className="text-xs opacity-90 leading-relaxed mb-2">
                Bank biasanya mensyaratkan cicilan maksimal 30% dari penghasilan. Direkomendasikan gaji Anda minimal:
              </p>
              <p className="text-lg font-black tracking-tight">{formatRupiah(minimalGaji)} <span className="text-xs font-normal opacity-80">/ bulan</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
