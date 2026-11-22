"use client"

import React from "react"
import {
  MapPin,
  Buildings,
  MagnifyingGlass,
  ArrowCounterClockwise,
  SealCheck,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Wilayah {
  kodeWilayah: string
  namaWilayah: string
}

export interface Asosiasi {
  id: number
  nama: string
  singkatan: string
}

export interface SearchPanelProps {
  // Data
  provinces: Wilayah[]
  kabupatens: Wilayah[]
  kecamatans: Wilayah[]
  asosiasiList: Asosiasi[]
  // Values
  selectedProvinsi: string
  selectedKabupaten: string
  selectedKecamatan: string
  selectedAsosiasi: string
  keyword: string
  isSubsidi: boolean
  // Handlers
  onProvinsiChange: (value: string) => void
  onKabupatenChange: (value: string) => void
  onKecamatanChange: (value: string) => void
  onAsosiasiChange: (value: string) => void
  onKeywordChange: (value: string) => void
  onSubsidiChange: (checked: boolean) => void
  onSearch: (e?: React.FormEvent) => void
  onResetFilters?: () => void
}

// Sentinel to represent "no selection" in Base UI Select
const NONE = ""
const toSel = (v: string) => v || NONE
const fromSel = (v: string | null): string =>
  v == null || v === NONE ? "" : v

// ─── Component ──────────────────────────────────────────────────────────────

export function SearchPanel({
  provinces,
  kabupatens,
  kecamatans,
  asosiasiList,
  selectedProvinsi,
  selectedKabupaten,
  selectedKecamatan,
  selectedAsosiasi,
  keyword,
  isSubsidi,
  onProvinsiChange,
  onKabupatenChange,
  onKecamatanChange,
  onAsosiasiChange,
  onKeywordChange,
  onSubsidiChange,
  onSearch,
  onResetFilters,
}: SearchPanelProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(e)
  }

  const hasAnySelection = Boolean(
    selectedProvinsi ||
      selectedKabupaten ||
      selectedKecamatan ||
      selectedAsosiasi ||
      keyword ||
      isSubsidi
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header row with title & quick reset */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Filter Lokasi &amp; Kriteria Perumahan
          </h3>
          <p className="text-xs text-muted-foreground">
            Sumber data resmi terindeks dari SiKumbang BP Tapera
          </p>
        </div>
        {hasAnySelection && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <ArrowCounterClockwise weight="bold" className="h-3.5 w-3.5" />
            Reset Semua
          </button>
        )}
      </div>

      {/* Location dropdowns (1 col on very small, 2 cols on mobile/tablet, 4 cols on desktop) */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">
            Provinsi
          </label>
          <Select
            value={toSel(selectedProvinsi)}
            onValueChange={(v: string | null) => onProvinsiChange(fromSel(v))}
          >
            <SelectTrigger className="h-10 w-full gap-1.5 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <SelectValue placeholder="Semua Provinsi">
                {selectedProvinsi
                  ? provinces.find((p) => p.kodeWilayah === selectedProvinsi)
                      ?.namaWilayah
                  : "Semua Provinsi"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Semua Provinsi</SelectItem>
              {provinces.map((p) => (
                <SelectItem key={p.kodeWilayah} value={p.kodeWilayah}>
                  {p.namaWilayah}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">
            Kabupaten / Kota
          </label>
          <Select
            value={toSel(selectedKabupaten)}
            onValueChange={(v: string | null) => onKabupatenChange(fromSel(v))}
            disabled={!selectedProvinsi || kabupatens.length === 0}
          >
            <SelectTrigger className="h-10 w-full gap-1.5 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <SelectValue placeholder="Semua Kab / Kota">
                {selectedKabupaten
                  ? kabupatens.find((k) => k.kodeWilayah === selectedKabupaten)
                      ?.namaWilayah
                  : "Semua Kab / Kota"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Semua Kab / Kota</SelectItem>
              {kabupatens.map((k) => (
                <SelectItem key={k.kodeWilayah} value={k.kodeWilayah}>
                  {k.namaWilayah}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">
            Kecamatan
          </label>
          <Select
            value={toSel(selectedKecamatan)}
            onValueChange={(v: string | null) => onKecamatanChange(fromSel(v))}
            disabled={!selectedKabupaten || kecamatans.length === 0}
          >
            <SelectTrigger className="h-10 w-full gap-1.5 text-sm">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <SelectValue placeholder="Semua Kecamatan">
                {selectedKecamatan
                  ? kecamatans.find((k) => k.kodeWilayah === selectedKecamatan)
                      ?.namaWilayah
                  : "Semua Kecamatan"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Semua Kecamatan</SelectItem>
              {kecamatans.map((k) => (
                <SelectItem key={k.kodeWilayah} value={k.kodeWilayah}>
                  {k.namaWilayah}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">
            Asosiasi Pengembang
          </label>
          <Select
            value={toSel(selectedAsosiasi)}
            onValueChange={(v: string | null) => onAsosiasiChange(fromSel(v))}
          >
            <SelectTrigger className="h-10 w-full gap-1.5 text-sm">
              <Buildings className="h-4 w-4 shrink-0 text-primary" />
              <SelectValue placeholder="Semua Asosiasi">
                {selectedAsosiasi
                  ? (() => {
                      const aso = asosiasiList.find(
                        (a) => String(a.id) === selectedAsosiasi
                      )
                      return aso
                        ? `${aso.singkatan} — ${aso.nama}`
                        : selectedAsosiasi
                    })()
                  : "Semua Asosiasi"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Semua Asosiasi</SelectItem>
              {asosiasiList.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.singkatan} — {a.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subsidi card toggle + Keyword + Submit */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Highlighted Subsidi Toggle Card */}
        <label
          htmlFor="subsidi-filter"
          className={cn(
            "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-all select-none sm:w-auto",
            isSubsidi
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
              : "border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted/70"
          )}
        >
          <div className="flex items-center gap-2">
            <SealCheck
              weight="fill"
              className={cn(
                "h-4 w-4 shrink-0",
                isSubsidi ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}
            />
            <span className="text-xs font-bold sm:text-sm">
              Khusus Rumah Subsidi Tersedia
            </span>
          </div>
          <Switch
            id="subsidi-filter"
            checked={isSubsidi}
            onCheckedChange={onSubsidiChange}
          />
        </label>

        {/* Keyword input + Search CTA */}
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Ketik nama perumahan (opsional)..."
              className="h-10 pl-10 text-sm"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            className="h-10 shrink-0 px-6 text-sm font-bold shadow-sm shadow-primary/25"
          >
            Terapkan
          </Button>
        </div>
      </div>
    </form>
  )
}
