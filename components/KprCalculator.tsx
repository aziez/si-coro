"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Calculator,
  CheckCircle,
  WarningCircle,
  Train,
  Motorcycle,
  Clock,
  ArrowsLeftRight,
  Bank,
  WhatsappLogo,
  Copy,
  ArrowSquareOut,
  ShieldCheck,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Credenza,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaDescription,
} from "@/components/ui/credenza"
import {
  KRL_STATIONS,
  POPULAR_WORK_STATIONS,
  calculateFirstMileCost,
  calculateKrlRoute,
  type FirstMileMode,
} from "@/lib/geoUtils"
import type { StationRouteCandidate } from "@/app/api/route-krl/route"

// ─── Types & Helpers ─────────────────────────────────────────────────────────

interface TipeRumah {
  id: number
  nama: string
  harga: number
  status: string
}

interface KprCalculatorProps {
  tipeRumahList: TipeRumah[]
  bestStationRoute?: StationRouteCandidate | null
  workStation?: string
  onWorkStationChange?: (stationName: string) => void
  propertyName?: string
  developerName?: string
  propertyAddress?: string
  developerPhone?: string
  floodRiskLabel?: string
}

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

const TENOR_OPTIONS = [10, 15, 20, 25, 30]
const WORKDAYS_OPTIONS = [12, 16, 20, 22, 25]

// ─── Component ──────────────────────────────────────────────────────────────

export default function KprCalculator({
  tipeRumahList,
  bestStationRoute,
  workStation: controlledWorkStation,
  onWorkStationChange,
  propertyName = "Perumahan Pilihan",
  developerName = "Pengembang Terdaftar",
  propertyAddress = "",
  developerPhone = "",
  floodRiskLabel = "Terverifikasi InaRISK",
}: KprCalculatorProps) {
  const sorted = useMemo(
    () => [...tipeRumahList].sort((a, b) => a.harga - b.harga),
    [tipeRumahList]
  )

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [dpPercent, setDpPercent] = useState(5)
  const [bunga, setBunga] = useState(5.0)
  const [tenorTahun, setTenorTahun] = useState(15)

  // Commuter simulation state
  const [includeCommute, setIncludeCommute] = useState(true)
  const [internalWorkStation, setInternalWorkStation] =
    useState("Stasiun Sudirman")
  const [firstMileMode, setFirstMileMode] = useState<FirstMileMode>("motor")
  const [workDaysPerMonth, setWorkDaysPerMonth] = useState(22)

  // Pre-screening modal state (Step 5: Ajukan KPR BTN)
  const [showBtnModal, setShowBtnModal] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)

  const workStation = controlledWorkStation ?? internalWorkStation
  const handleWorkStationSelect = (val: string | null) => {
    if (!val) return
    setInternalWorkStation(val)
    onWorkStationChange?.(val)
  }

  const selected = sorted[selectedIdx] ?? sorted[0]
  const harga = selected?.harga ?? 0

  // Auto-adjust defaults based on type
  useEffect(() => {
    if (!selected) return
    if (selected.status === "subsidi") {
      setBunga(5.0)
      setDpPercent(1)
    } else {
      setBunga(8.5)
      setDpPercent(10)
    }
  }, [selected])

  // Commuter calculation (OSRM Road + KAI Commuter Network Graph)
  const commuteDetail = useMemo(() => {
    if (!bestStationRoute) return null
    const firstMileOptions = calculateFirstMileCost(
      bestStationRoute.roadDistanceKm,
      bestStationRoute.roadDurationMinutes
    )
    const chosenFirstMile = firstMileOptions[firstMileMode]
    const krlRoute = calculateKrlRoute(
      bestStationRoute.station.name,
      workStation
    )
    const krlDailyRoundTrip = (krlRoute?.fareOneWay ?? 4000) * 2
    const dailyTotal = chosenFirstMile.dailyRoundTripCost + krlDailyRoundTrip
    const monthlyCommuteCost = dailyTotal * workDaysPerMonth
    const oneWayTotalMinutes =
      chosenFirstMile.oneWayDurationMinutes +
      (krlRoute?.railDurationMinutes ?? 0)

    return {
      firstMileOptions,
      chosenFirstMile,
      krlRoute,
      krlDailyRoundTrip,
      dailyTotal,
      monthlyCommuteCost,
      oneWayTotalMinutes,
    }
  }, [bestStationRoute, firstMileMode, workStation, workDaysPerMonth])

  if (!harga) return null

  // KPR Calculations
  const dpNominal = (harga * dpPercent) / 100
  const plafon = harga - dpNominal
  const r = bunga / 100 / 12
  const n = tenorTahun * 12
  const cicilan =
    r > 0
      ? (plafon * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
      : plafon / n

  const monthlyCommute =
    includeCommute && commuteDetail ? commuteDetail.monthlyCommuteCost : 0
  const trueMonthlyCost = cicilan + monthlyCommute

  const kprSharePct =
    trueMonthlyCost > 0 ? Math.round((cicilan / trueMonthlyCost) * 100) : 100
  const commuteSharePct = 100 - kprSharePct

  // Bank standard: KPR <= 30% income, or (KPR + Commute) <= 38% income
  const gajiMinKprOnly = cicilan / 0.3
  const gajiIdealTrueCost = Math.max(gajiMinKprOnly, trueMonthlyCost / 0.38)

  const isSubsidi = selected?.status === "subsidi"

  const orderedStations = [
    ...POPULAR_WORK_STATIONS,
    ...KRL_STATIONS.map((s) => s.name).filter(
      (name) => !POPULAR_WORK_STATIONS.includes(name)
    ),
  ]

  // Build text summary for WhatsApp / Copy
  const summaryText = [
    `*RINGKASAN SIMULASI KPR BTN — SI-CORO*`,
    `Perumahan: ${propertyName}`,
    `Pengembang: ${developerName}`,
    propertyAddress ? `Lokasi: ${propertyAddress}` : null,
    `Tipe Rumah: ${selected.nama} (${selected.status.toUpperCase()})`,
    `Harga Jual: ${formatRupiah(harga)}`,
    `Uang Muka (DP ${dpPercent}%): ${formatRupiah(dpNominal)}`,
    `Plafon KPR: ${formatRupiah(plafon)} (Tenor ${tenorTahun} thn, Bunga ${bunga}%)`,
    `Angsuran KPR: ${formatRupiah(cicilan)}/bln`,
    includeCommute && commuteDetail && bestStationRoute
      ? `Ongkos Komuter (${bestStationRoute.station.name} → ${workStation}, ${workDaysPerMonth} hr): ${formatRupiah(commuteDetail.monthlyCommuteCost)}/bln`
      : null,
    `*Total Beban Bulanan Riil: ${formatRupiah(trueMonthlyCost)}/bln*`,
    `Rekomendasi Penghasilan Sehat: ${formatRupiah(gajiIdealTrueCost)}/bln`,
    `Audit Risiko Banjir (InaRISK): ${floodRiskLabel}`,
  ]
    .filter(Boolean)
    .join("\n")

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText)
      setCopiedSummary(true)
      setTimeout(() => setCopiedSummary(false), 2500)
    } catch (err) {
      console.error(err)
    }
  }

  const cleanWaPhone = developerPhone
    ? `62${developerPhone.split(" ")[0].replace(/[^0-9]/g, "").replace(/^0/, "")}`
    : ""

  const waUrl = cleanWaPhone
    ? `https://wa.me/${cleanWaPhone}?text=${encodeURIComponent(
        `Halo Tim Pemasaran ${propertyName}, saya telah melakukan simulasi KPR & cek lokasi melalui Si-Coro dan tertarik untuk konsultasi/pengajuan KPR:\n\n${summaryText}`
      )}`
    : `https://wa.me/?text=${encodeURIComponent(summaryText)}`

  return (
    <>
      <Card
        id="kpr-calculator"
        className="overflow-hidden rounded-2xl border-border/60 shadow-lg shadow-primary/5"
      >
        {/* Header */}
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/12 via-blue-500/5 to-transparent px-5 py-5 sm:px-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Calculator className="h-6 w-6 text-primary" weight="duotone" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold sm:text-xl">
                    Kalkulator True Affordability KPR BTN
                  </h2>
                  <Badge
                    variant="secondary"
                    className="bg-primary/15 text-[10px] font-bold text-primary"
                  >
                    Cicilan + Ongkos Komuter KRL
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  Simulasi cicilan KPR digabung dengan biaya komuter aktual
                  (rute jalan OSRM &amp; tarif KRL)
                </p>
              </div>
            </div>

            {bestStationRoute && (
              <button
                type="button"
                onClick={() => setIncludeCommute((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-2 self-start rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors sm:self-auto",
                  includeCommute
                    ? "border-orange-500/40 bg-orange-500/15 text-orange-700 dark:text-orange-300"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                <Train className="h-4 w-4" weight="duotone" />
                {includeCommute
                  ? "Simulasi Komuter KRL: Aktif"
                  : "Aktifkan Simulasi Komuter KRL"}
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-8 p-5 sm:p-6 lg:grid-cols-12">
          {/* ── Left Column: KPR & Commuter Inputs (7 cols) ────────────────── */}
          <div className="space-y-6 lg:col-span-7">
            {/* 1. Parameter KPR */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground sm:text-sm">
                  1. Parameter KPR Bank BTN
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    isSubsidi
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                  )}
                >
                  {isSubsidi
                    ? "Skema KPR Subsidi FLPP"
                    : "Skema KPR Komersial"}
                </Badge>
              </div>

              {/* Tipe Rumah */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold sm:text-sm">
                  Pilih Tipe Rumah
                </label>
                <Select
                  value={String(selectedIdx)}
                  onValueChange={(v) => setSelectedIdx(Number(v))}
                >
                  <SelectTrigger className="h-11 text-sm font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sorted.map((t, i) => (
                      <SelectItem key={t.id} value={String(i)}>
                        {t.nama} — {formatRupiah(t.harga)}
                        <Badge
                          variant="secondary"
                          className={cn(
                            "ml-2 text-[10px] uppercase",
                            t.status === "subsidi"
                              ? "text-emerald-600"
                              : "text-blue-600"
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 rounded-xl border bg-muted/25 p-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold">Uang Muka (DP)</label>
                    <span className="text-sm font-black text-primary">
                      {dpPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={dpPercent}
                    onChange={(e) => setDpPercent(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer accent-primary"
                  />
                  <p className="text-right text-xs font-semibold text-muted-foreground">
                    {formatRupiah(dpNominal)}
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border bg-muted/25 p-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold">Suku Bunga KPR</label>
                    <span className="text-sm font-black text-primary">
                      {bunga}% / thn
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={0.5}
                    value={bunga}
                    onChange={(e) => setBunga(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer accent-primary"
                  />
                  <p className="text-right text-xs font-medium text-muted-foreground">
                    {isSubsidi ? "FLPP Subsidi 5% tetap" : "Estimasi bunga KPR"}
                  </p>
                </div>
              </div>

              {/* Tenor buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">
                  Tenor Pinjaman
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {TENOR_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTenorTahun(t)}
                      className={cn(
                        "h-10 rounded-xl border text-xs font-bold transition-all duration-150",
                        tenorTahun === t
                          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "border-border/70 bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {t} Thn
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Simulasi Komuter Pintu-ke-Stasiun (If coordinates exist) */}
            {bestStationRoute && includeCommute && commuteDetail && (
              <>
                <Separator />
                <div className="space-y-4 rounded-2xl border border-orange-500/25 bg-orange-500/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-orange-800 dark:text-orange-300">
                      <Train className="h-4 w-4" weight="duotone" />
                      2. Rute &amp; Biaya Komuter Harian (First-Mile + KRL)
                    </h3>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Stasiun Awal:{" "}
                      <strong className="text-foreground">
                        {bestStationRoute.station.name}
                      </strong>{" "}
                      ({bestStationRoute.roadDistanceKm} km)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Stasiun Tujuan Kerja */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold">
                        Stasiun KRL Tujuan Kerja
                      </label>
                      <Select
                        value={workStation}
                        onValueChange={handleWorkStationSelect}
                      >
                        <SelectTrigger className="h-10 bg-background text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderedStations.map((stName) => (
                            <SelectItem key={stName} value={stName}>
                              {stName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Hari Kerja per Bulan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold">
                        Frekuensi Komuter (Hari/Bulan)
                      </label>
                      <div className="flex gap-1.5">
                        {WORKDAYS_OPTIONS.map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setWorkDaysPerMonth(days)}
                            className={cn(
                              "h-10 flex-1 rounded-xl border text-xs font-bold transition-colors",
                              workDaysPerMonth === days
                                ? "border-orange-600 bg-orange-600 text-white"
                                : "bg-background text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {days}hr
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* First-Mile Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1 text-xs font-bold">
                      <Motorcycle className="h-3.5 w-3.5" />
                      Moda Rumah → {bestStationRoute.station.name} (
                      {bestStationRoute.roadDistanceKm} km PP)
                    </label>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {(["motor", "ojol", "angkot"] as FirstMileMode[]).map(
                        (modeKey) => {
                          const opt = commuteDetail.firstMileOptions[modeKey]
                          const active = firstMileMode === modeKey
                          return (
                            <button
                              key={modeKey}
                              type="button"
                              onClick={() => setFirstMileMode(modeKey)}
                              className={cn(
                                "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                                active
                                  ? "border-orange-500 bg-background shadow-sm ring-1 ring-orange-500/40"
                                  : "border-border/60 bg-background/60 hover:bg-background"
                              )}
                            >
                              <span className="text-xs font-bold text-foreground">
                                {opt.label}
                              </span>
                              <span className="mt-0.5 text-xs font-extrabold text-orange-600 dark:text-orange-400">
                                {formatRupiah(opt.dailyRoundTripCost)} / hari
                              </span>
                              <span className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                                {opt.note}
                              </span>
                            </button>
                          )
                        }
                      )}
                    </div>
                  </div>

                  {/* KRL Route Summary Strip */}
                  {commuteDetail.krlRoute && (
                    <div className="flex flex-col justify-between gap-2 rounded-xl border bg-background/90 p-3 text-xs sm:flex-row sm:items-center">
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5 font-bold text-foreground">
                          <span>{commuteDetail.krlRoute.fromStation}</span>
                          <ArrowsLeftRight className="h-3.5 w-3.5 text-orange-500" />
                          <span>{commuteDetail.krlRoute.toStation}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {commuteDetail.krlRoute.railDistanceKm} km rel (
                            {commuteDetail.krlRoute.stationCount} stasiun)
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {commuteDetail.krlRoute.linesUsed.join(" → ")}
                          {commuteDetail.krlRoute.transits.length > 0
                            ? ` · Transit di ${commuteDetail.krlRoute.transits.join(", ")}`
                            : " · Langsung tanpa transit"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 border-t pt-2 sm:border-t-0 sm:pt-0">
                        <div className="text-right">
                          <p className="flex items-center gap-1 font-bold text-foreground">
                            <Clock className="h-3.5 w-3.5 text-orange-500" />~
                            {commuteDetail.oneWayTotalMinutes} mnt
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Total 1x jalan
                          </p>
                        </div>
                        <div className="h-7 w-px bg-border" />
                        <div className="text-right">
                          <p className="font-extrabold text-orange-600 dark:text-orange-400">
                            {formatRupiah(commuteDetail.krlRoute.fareOneWay)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Tarif KRL 1x
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Right Column: True Affordability Output + Step 5 Ajukan KPR BTN (5 cols) ── */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-muted/35 p-5 lg:col-span-5">
            <div className="space-y-4">
              {/* Plafon & DP Summary */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl border bg-background/80 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Plafon KPR
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold">
                    {formatRupiah(plafon)}
                  </p>
                </div>
                <div className="rounded-xl border bg-background/80 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Uang Muka ({dpPercent}%)
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold">
                    {formatRupiah(dpNominal)}
                  </p>
                </div>
              </div>

              {/* Breakdown: Cicilan KPR + Ongkos Komuter */}
              <div className="space-y-3 rounded-xl border border-border/70 bg-background p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    Angsuran KPR ({n} bln)
                  </span>
                  <span className="font-extrabold text-foreground">
                    {formatRupiah(cicilan)} / bln
                  </span>
                </div>

                {includeCommute && commuteDetail && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                      Ongkos Komuter ({workDaysPerMonth} hr PP)
                    </span>
                    <span className="font-extrabold text-orange-600 dark:text-orange-400">
                      + {formatRupiah(commuteDetail.monthlyCommuteCost)} / bln
                    </span>
                  </div>
                )}

                {/* Visual Stacked Proportion Bar */}
                {includeCommute && commuteDetail && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${kprSharePct}%` }}
                      />
                      <div
                        className="h-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${commuteSharePct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>KPR {kprSharePct}%</span>
                      <span className="text-orange-600 dark:text-orange-400">
                        Transport {commuteSharePct}%
                      </span>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="pt-1 text-center">
                  <p className="text-xs font-bold text-muted-foreground">
                    {includeCommute && commuteDetail
                      ? "Total Beban Bulanan Riil (Hunian + Transport)"
                      : "Estimasi Cicilan KPR Bulanan"}
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-primary">
                    {formatRupiah(trueMonthlyCost)}
                  </p>
                  {includeCommute && commuteDetail && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Ongkos komuter menyumbang{" "}
                      <strong className="text-foreground">
                        {commuteSharePct}%
                      </strong>{" "}
                      dari total beban bulanan rumah ini
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Gaji Ideal & KPR Eligibility Recommendation */}
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4",
                isSubsidi
                  ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-800 dark:text-emerald-300"
                  : "border-blue-500/25 bg-blue-500/8 text-blue-800 dark:text-blue-300"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background shadow-xs">
                {isSubsidi ? (
                  <CheckCircle
                    className="h-4 w-4 text-emerald-600"
                    weight="fill"
                  />
                ) : (
                  <WarningCircle
                    className="h-4 w-4 text-blue-600"
                    weight="fill"
                  />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-extrabold sm:text-sm">
                  Rekomendasi Penghasilan Minimal Sehat
                </p>
                <p className="text-[11px] opacity-85">
                  Agar rasio cicilan ≤30% &amp; total hunian+transport ≤38%
                  penghasilan:
                </p>
                <div className="pt-0.5">
                  <p className="text-lg font-black">
                    {formatRupiah(gajiIdealTrueCost)}{" "}
                    <span className="text-xs font-normal opacity-75">
                      / bulan
                    </span>
                  </p>
                  {includeCommute && commuteDetail && (
                    <p className="text-[11px] opacity-80">
                      (Min. {formatRupiah(gajiMinKprOnly)}/bln bila hanya
                      menghitung cicilan KPR)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 5 Pitch Deck CTA: Ajukan KPR BTN */}
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                onClick={() => setShowBtnModal(true)}
                className="h-12 w-full gap-2 rounded-xl bg-blue-700 text-sm font-extrabold text-white shadow-lg shadow-blue-700/25 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <Bank weight="fill" className="h-5 w-5" />
                Ajukan KPR BTN &amp; Simpan Simulasi
              </Button>
              <p className="text-center text-[10.5px] text-muted-foreground">
                Membawa ringkasan lokasi, skor risiko, &amp; simulasi beban riil
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Pre-Screening / Ringkasan Pengajuan KPR BTN Modal ── */}
      <Credenza open={showBtnModal} onOpenChange={setShowBtnModal}>
        <CredenzaContent className="max-w-lg overflow-hidden p-0">
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 p-5 text-white">
            <CredenzaHeader>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 text-[10px] font-bold text-white backdrop-blur-xs">
                  Si-Coro × KPR BTN Pre-Screening
                </Badge>
              </div>
              <CredenzaTitle className="mt-1 text-lg font-black text-white sm:text-xl">
                Ringkasan Kesiapan Pengajuan KPR
              </CredenzaTitle>
              <CredenzaDescription className="text-xs text-blue-100">
                Isi rumah, risiko lingkungan, dan beban bulanan riil sudah
                terhitung sebelum akad.
              </CredenzaDescription>
            </CredenzaHeader>
          </div>

          <div className="space-y-4 p-5 text-sm">
            {/* Property & Type Summary */}
            <div className="rounded-xl border bg-muted/35 p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Perumahan &amp; Tipe
                  </p>
                  <p className="font-extrabold text-foreground">
                    {propertyName} — Tipe {selected.nama}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {developerName}
                  </p>
                </div>
                <Badge
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    isSubsidi
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 text-white"
                  )}
                >
                  {selected.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-t pt-2 text-xs">
                <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                  <ShieldCheck
                    weight="fill"
                    className="h-4 w-4 text-emerald-600"
                  />
                  Audit Risiko Lingkungan:
                </span>
                <span className="font-bold text-foreground">
                  {floodRiskLabel}
                </span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="rounded-xl border p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Harga Jual</span>
                <span className="font-bold">{formatRupiah(harga)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Uang Muka (DP {dpPercent}%) &amp; Plafon
                </span>
                <span className="font-bold">
                  {formatRupiah(dpNominal)} / {formatRupiah(plafon)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Angsuran KPR ({tenorTahun} thn · {bunga}%)
                </span>
                <span className="font-bold">{formatRupiah(cicilan)}/bln</span>
              </div>
              {includeCommute && commuteDetail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Ongkos Komuter KRL ({workDaysPerMonth} hr PP)
                  </span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    + {formatRupiah(commuteDetail.monthlyCommuteCost)}/bln
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex items-baseline justify-between pt-1">
                <span className="font-bold text-foreground">
                  Total Beban Bulanan Riil
                </span>
                <span className="text-base font-black text-primary">
                  {formatRupiah(trueMonthlyCost)}/bln
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">
                  Rekomendasi Penghasilan Minimal
                </span>
                <span className="font-extrabold text-foreground">
                  {formatRupiah(gajiIdealTrueCost)}/bln
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                <Button className="h-11 w-full gap-2 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700">
                  <WhatsappLogo weight="fill" className="h-5 w-5" />
                  {cleanWaPhone
                    ? "Kirim Pengajuan & Simulasi ke Developer"
                    : "Bagikan Ringkasan Simulasi ke WhatsApp"}
                </Button>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopySummary}
                  className="h-10 gap-1.5 rounded-xl text-xs font-bold"
                >
                  {copiedSummary ? (
                    <>
                      <CheckCircle
                        weight="fill"
                        className="h-4 w-4 text-emerald-600"
                      />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy weight="bold" className="h-4 w-4" />
                      Salin Ringkasan
                    </>
                  )}
                </Button>

                <a
                  href="https://www.btnproperti.co.id/"
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full gap-1.5 rounded-xl border-blue-500/30 text-xs font-bold text-blue-700 hover:bg-blue-500/10 dark:text-blue-300"
                  >
                    Portal BTN Properti
                    <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CredenzaContent>
      </Credenza>
    </>
  )
}
