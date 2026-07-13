'use client';

import React from 'react';
import { MapPin, Buildings, MagnifyingGlass } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Wilayah {
  kodeWilayah: string;
  namaWilayah: string;
}

export interface Asosiasi {
  id: number;
  nama: string;
  singkatan: string;
}

export interface SearchPanelProps {
  // Data
  provinces: Wilayah[];
  kabupatens: Wilayah[];
  kecamatans: Wilayah[];
  asosiasiList: Asosiasi[];
  // Values
  selectedProvinsi: string;
  selectedKabupaten: string;
  selectedKecamatan: string;
  selectedAsosiasi: string;
  keyword: string;
  isSubsidi: boolean;
  // Handlers
  onProvinsiChange: (value: string) => void;
  onKabupatenChange: (value: string) => void;
  onKecamatanChange: (value: string) => void;
  onAsosiasiChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  onSubsidiChange: (checked: boolean) => void;
  onSearch: (e?: React.FormEvent) => void;
}

// Sentinel to represent "no selection" in Base UI Select (avoids empty string issues)
const NONE = '';
const toSel = (v: string) => v || NONE;
const fromSel = (v: string | null): string => (v == null || v === NONE ? '' : v);

// ─── Component ──────────────────────────────────────────────────────────────

export function SearchPanel({
  provinces, kabupatens, kecamatans, asosiasiList,
  selectedProvinsi, selectedKabupaten, selectedKecamatan, selectedAsosiasi,
  keyword, isSubsidi,
  onProvinsiChange, onKabupatenChange, onKecamatanChange, onAsosiasiChange,
  onKeywordChange, onSubsidiChange, onSearch,
}: SearchPanelProps) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Location dropdowns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Select value={toSel(selectedProvinsi)} onValueChange={(v: string | null) => onProvinsiChange(fromSel(v))}>
          <SelectTrigger className="h-9 text-sm gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Semua Provinsi">
              {selectedProvinsi ? provinces.find(p => p.kodeWilayah === selectedProvinsi)?.namaWilayah : "Semua Provinsi"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Semua Provinsi</SelectItem>
            {provinces.map(p => (
              <SelectItem key={p.kodeWilayah} value={p.kodeWilayah}>{p.namaWilayah}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={toSel(selectedKabupaten)}
          onValueChange={(v: string | null) => onKabupatenChange(fromSel(v))}
          disabled={!selectedProvinsi || kabupatens.length === 0}
        >
          <SelectTrigger className="h-9 text-sm gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Kab / Kota">
              {selectedKabupaten ? kabupatens.find(k => k.kodeWilayah === selectedKabupaten)?.namaWilayah : "Semua Kab / Kota"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Semua Kab / Kota</SelectItem>
            {kabupatens.map(k => (
              <SelectItem key={k.kodeWilayah} value={k.kodeWilayah}>{k.namaWilayah}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={toSel(selectedKecamatan)}
          onValueChange={(v: string | null) => onKecamatanChange(fromSel(v))}
          disabled={!selectedKabupaten || kecamatans.length === 0}
        >
          <SelectTrigger className="h-9 text-sm gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Kecamatan">
              {selectedKecamatan ? kecamatans.find(k => k.kodeWilayah === selectedKecamatan)?.namaWilayah : "Semua Kecamatan"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Semua Kecamatan</SelectItem>
            {kecamatans.map(k => (
              <SelectItem key={k.kodeWilayah} value={k.kodeWilayah}>{k.namaWilayah}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={toSel(selectedAsosiasi)} onValueChange={(v: string | null) => onAsosiasiChange(fromSel(v))}>
          <SelectTrigger className="h-9 text-sm gap-1.5">
            <Buildings className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Asosiasi">
              {selectedAsosiasi 
                ? (() => {
                    const aso = asosiasiList.find(a => String(a.id) === selectedAsosiasi);
                    return aso ? `${aso.singkatan} — ${aso.nama}` : selectedAsosiasi;
                  })()
                : "Semua Asosiasi"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Semua Asosiasi</SelectItem>
            {asosiasiList.map(a => (
              <SelectItem key={a.id} value={String(a.id)}>{a.singkatan} — {a.nama}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Keyword + submit */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Nama perumahan (opsional)..."
            className="pl-9 h-9 text-sm"
            value={keyword}
            onChange={e => onKeywordChange(e.target.value)}
          />
        </div>
        <Button type="submit" className="shrink-0 px-5 h-9 text-sm font-semibold">
          Cari Sekarang
        </Button>
      </div>

      <Separator className="my-1" />

      {/* Subsidi toggle */}
      <div className="flex items-center gap-2.5">
        <Switch
          id="subsidi-filter"
          checked={isSubsidi}
          onCheckedChange={onSubsidiChange}
          className="scale-90"
        />
        <label htmlFor="subsidi-filter" className="text-sm text-muted-foreground cursor-pointer select-none">
          Hanya tampilkan <span className="font-semibold text-foreground">Rumah Subsidi</span> tersedia
        </label>
      </div>
    </form>
  );
}
