"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  Drop,
  Train,
  ShieldCheck,
  Play,
  Pause,
  MapTrifold,
  SealCheck,
  ArrowsLeftRight,
  Sparkle,
  WarningCircle,
  CheckCircle,
  Mountains,
  HouseLine,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ScannerScenario {
  id: string
  region: string
  brochureTitle: string
  brochurePrice: string
  brochureClaims: string[]
  realTitle: string
  grade: "A+" | "A" | "B"
  score: number
  floodStatus: string
  floodDetail: string
  elevationLabel: string
  krlStation: string
  krlRoadDetail: string
  trueCostMonthly: string
  kprPart: string
  commutePart: string
  specs: { label: string; value: string }[]
  safePoints: boolean[] // 5-point InaRISK samples: [C, N, E, S, W]
}

const SCENARIOS: ScannerScenario[] = [
  {
    id: "bogor",
    region: "Kab. Bogor",
    brochureTitle: "Griya Hijau Residence",
    brochurePrice: "Rp185 Juta · Cicilan 1 Jutaan*",
    brochureClaims: [
      "10 Menit ke Stasiun KRL*",
      "Bebas Banjir & Sejuk",
      "DP 1% Langsung Akad",
    ],
    realTitle: "Audit X-Ray: Griya Hijau",
    grade: "A+",
    score: 89,
    floodStatus: "Aman Banjir (5/5 Titik)",
    floodDetail: "InaRISK BNPB radius 250m bebas genangan",
    elevationLabel: "Elevasi +54m · Kontur Stabil",
    krlStation: "St. Bojong Gede",
    krlRoadDetail: "3,4 km jalan raya (~9 mnt motor)",
    trueCostMonthly: "Rp1,64 jt/bln",
    kprPart: "Rp1,14 jt KPR",
    commutePart: "Rp500 rb Komuter",
    specs: [
      { label: "Atap", value: "Baja Ringan + Genteng Beton" },
      { label: "Dinding", value: "Double Hebel Plester Aci" },
      { label: "Pondasi", value: "Batu Kali + Sloof Beton" },
    ],
    safePoints: [true, true, true, true, true],
  },
  {
    id: "bekasi",
    region: "Kab. Bekasi",
    brochureTitle: "Pesona Cikarang Asri",
    brochurePrice: "Rp185 Juta · Promo Tanpa DP*",
    brochureClaims: [
      "Strategis Dekat Industri",
      "Akses Commuter Line",
      "Unit Ready Stock",
    ],
    realTitle: "Audit X-Ray: Pesona Cikarang",
    grade: "B",
    score: 68,
    floodStatus: "Waspada Buffer (1/5 Titik)",
    floodDetail: "Titik selatan 250m beririsan zona sedang",
    elevationLabel: "Elevasi +14m · Dataran Rendah",
    krlStation: "St. Metland Telagamurni",
    krlRoadDetail: "4,8 km jalan raya (~13 mnt motor)",
    trueCostMonthly: "Rp1,82 jt/bln",
    kprPart: "Rp1,14 jt KPR",
    commutePart: "Rp680 rb Komuter",
    specs: [
      { label: "Atap", value: "Baja Ringan + Spandek" },
      { label: "Dinding", value: "Batako Plester + Cat" },
      { label: "Pondasi", value: "Batu Kali Standar" },
    ],
    safePoints: [true, true, true, false, true],
  },
  {
    id: "tangerang",
    region: "Kab. Tangerang",
    brochureTitle: "Taman Parung Indah",
    brochurePrice: "Rp215 Juta · Subsidi & Komersil",
    brochureClaims: [
      "Dekat BSD & Stasiun",
      "Kawasan Berkembang",
      "Cicilan Ringan BTN",
    ],
    realTitle: "Audit X-Ray: Taman Parung",
    grade: "A",
    score: 82,
    floodStatus: "Aman Banjir (5/5 Titik)",
    floodDetail: "Radius 250m aman, kontur landai baik",
    elevationLabel: "Elevasi +38m · Drainase Baik",
    krlStation: "St. Parung Panjang",
    krlRoadDetail: "2,9 km jalan raya (~8 mnt motor)",
    trueCostMonthly: "Rp1,79 jt/bln",
    kprPart: "Rp1,31 jt KPR",
    commutePart: "Rp480 rb Komuter",
    specs: [
      { label: "Atap", value: "Baja Ringan + Metal Pasir" },
      { label: "Dinding", value: "Bata Ringan Hebel" },
      { label: "Pondasi", value: "Batu Kali + Beton Bertulang" },
    ],
    safePoints: [true, true, true, true, true],
  },
]

function useCountUp(target: number, durationMs = 1100) {
  const [animatedValue, setAnimatedValue] = useState<number | null>(null)

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }

    let rafId = 0
    const start = performance.now()
    const from = Math.round(target * 0.45)

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedValue(Math.round(from + (target - from) * eased))
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, durationMs])

  return animatedValue ?? target
}

interface XRayHeroScannerProps {
  totalIndexed: number
  isSubsidiActive: boolean
  onOpenMapView: () => void
  onToggleSubsidiQuick: () => void
  onSelectRegionQuick?: (regionName: string) => void
}

export function XRayHeroScanner({
  totalIndexed,
  isSubsidiActive,
  onOpenMapView,
  onToggleSubsidiQuick,
}: XRayHeroScannerProps) {
  const [scanPercent, setScanPercent] = useState(56)
  const [isAutoScanning, setIsAutoScanning] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const scenario = SCENARIOS[scenarioIdx]

  const displayedTotal = useCountUp(totalIndexed > 0 ? totalIndexed : 35483)
  const displayedStations = useCountUp(84, 900)

  // Respect prefers-reduced-motion on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      setPrefersReducedMotion(mq.matches)
      if (mq.matches) setIsAutoScanning(false)
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // Smooth sinusoidal auto-scan sweep (paused on drag, hover, or user Pause click)
  useEffect(() => {
    if (!isAutoScanning || isDragging || prefersReducedMotion) return
    let rafId = 0
    const start = performance.now()
    const initialPhase = Math.asin(Math.max(-1, Math.min(1, (scanPercent - 50) / 36)))

    const animate = (now: number) => {
      const elapsed = (now - start) / 1000
      const next = 50 + 36 * Math.sin(elapsed * 0.72 + initialPhase)
      setScanPercent(next)
      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoScanning, isDragging, prefersReducedMotion])

  const updateScanFromClientX = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const pct = ((clientX - rect.left) / rect.width) * 100
    setScanPercent(Math.max(8, Math.min(92, pct)))
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    setIsAutoScanning(false)
    updateScanFromClientX(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    updateScanFromClientX(e.clientX)
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  const gradeColor =
    scenario.grade === "A+"
      ? "bg-emerald-500 text-slate-950"
      : scenario.grade === "A"
        ? "bg-emerald-400 text-slate-950"
        : "bg-amber-400 text-slate-950"

  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-emerald-500/[0.09] via-card to-sky-500/[0.06] p-5 shadow-sm sm:p-7 lg:p-8">
      {/* Subtle architectural blueprint backdrop */}
      <div
        aria-hidden="true"
        className="blueprint-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_75%_40%,black_25%,transparent_80%)]"
      />
      {/* Ambient emerald glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl"
      />

      <div className="relative grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-8">
        {/* ── Left Column: Brand Philosophy, Counter Stats & Actions ── */}
        <div className="space-y-4 lg:col-span-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-[10.5px] font-extrabold tracking-wider text-emerald-700 uppercase hover:bg-emerald-500/15 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="radar-ring-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-500" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Audit Live SiKumbang · InaRISK · OSRM
            </Badge>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-2xl leading-[1.12] font-black tracking-tight text-foreground sm:text-4xl">
              Cek Isi Rumah,{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 bg-clip-text text-transparent dark:from-emerald-400 dark:via-teal-300 dark:to-sky-400">
                Bukan Kulitnya.
              </span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Jangan cuma percaya brosur marketing. Pindai risiko banjir{" "}
              <strong className="font-bold text-foreground">
                5-titik InaRISK BNPB
              </strong>
              , rute jalan raya aktual ke{" "}
              <strong className="font-bold text-foreground">84 stasiun KRL</strong>
              , dan total cicilan riil{" "}
              <strong className="font-bold text-foreground">
                KPR BTN + ongkos komuter
              </strong>{" "}
              sebelum akad.
            </p>
          </div>

          {/* Animated Live Counter Strip */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 sm:max-w-lg">
            <div className="rounded-2xl border border-border/70 bg-background/80 p-3 backdrop-blur-xs transition-colors hover:border-primary/40">
              <p className="font-mono text-lg font-black tracking-tight text-primary sm:text-xl">
                {displayedTotal.toLocaleString("id-ID")}+
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                Perumahan Terindeks
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-3 backdrop-blur-xs transition-colors hover:border-primary/40">
              <p className="font-mono text-lg font-black tracking-tight text-sky-600 dark:text-sky-400 sm:text-xl">
                {displayedStations}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                Stasiun KRL Akurat
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-3 backdrop-blur-xs transition-colors hover:border-primary/40">
              <p className="font-mono text-lg font-black tracking-tight text-orange-600 dark:text-orange-400 sm:text-xl">
                250m
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                Radar 5-Titik Banjir
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <Button
              size="lg"
              onClick={onOpenMapView}
              className="h-11 gap-2 rounded-full px-5 text-xs font-extrabold shadow-md shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:text-sm"
            >
              <MapTrifold weight="fill" className="h-4 w-4" />
              Jelajahi Peta KRL &amp; Banjir
            </Button>
            <Button
              size="lg"
              variant={isSubsidiActive ? "default" : "outline"}
              onClick={onToggleSubsidiQuick}
              className={cn(
                "h-11 gap-2 rounded-full px-5 text-xs font-extrabold transition-all hover:-translate-y-0.5 sm:text-sm",
                isSubsidiActive
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "border-emerald-500/35 bg-background/85 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
              )}
            >
              <SealCheck weight="fill" className="h-4 w-4" />
              {isSubsidiActive ? "Filter Subsidi Aktif" : "Cari Rumah Subsidi"}
            </Button>
          </div>
        </div>

        {/* ── Right Column: Concept 1 — Interactive "The X-Ray House Scanner" ── */}
        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-slate-950 shadow-xl ring-1 ring-emerald-500/20">
            {/* Scanner Top Bar with Scenario Switcher & WCAG Pause/Play Control */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-900/95 px-3.5 py-2.5 text-white">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-emerald-300 uppercase">
                  <Sparkle weight="fill" className="h-3 w-3" />
                  X-Ray Scanner
                </span>
                <div className="flex items-center gap-1">
                  {SCENARIOS.map((sc, idx) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => setScenarioIdx(idx)}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors",
                        scenarioIdx === idx
                          ? "bg-white text-slate-950"
                          : "text-slate-400 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {sc.region}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAutoScanning((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10.5px] font-bold text-slate-200 transition-colors hover:bg-white/15"
              >
                {isAutoScanning ? (
                  <>
                    <Pause weight="fill" className="h-3 w-3 text-emerald-400" />
                    Jeda Scan
                  </>
                ) : (
                  <>
                    <Play weight="fill" className="h-3 w-3 text-emerald-400" />
                    Auto-Scan
                  </>
                )}
              </button>
            </div>

            {/* Interactive Split Stage (GPU-composited clip-path) */}
            <div
              ref={stageRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative h-[300px] w-full cursor-ew-resize touch-none select-none overflow-hidden sm:h-[320px]"
            >
              {/* ── UNDERLAY: X-RAY AUDIT LAYER ("Isi Rumah" — visible on RIGHT side of laser) ── */}
              <div className="blueprint-grid absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/90 p-4 text-white">
                {/* Top X-Ray HUD */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[9.5px] font-extrabold tracking-wider text-emerald-300 uppercase">
                      <ShieldCheck weight="fill" className="h-3 w-3" />
                      Audit Isi Si-Coro
                    </span>
                    <h2 className="mt-1 text-sm font-black tracking-tight text-white sm:text-base">
                      {scenario.realTitle}
                    </h2>
                  </div>

                  {/* Climate & Agunan Grade Pill */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-900/90 px-2.5 py-1.5 shadow-lg">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black",
                        gradeColor
                      )}
                    >
                      {scenario.grade}
                    </span>
                    <div className="leading-tight">
                      <p className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                        Skor Agunan
                      </p>
                      <p className="font-mono text-xs font-black text-white">
                        {scenario.score}/100
                      </p>
                    </div>
                  </div>
                </div>

                {/* Middle Visual: 5-Point Sonar Radar + Structural X-Ray SVG + OSRM Route */}
                <div className="grid grid-cols-12 items-center gap-2.5 my-1">
                  {/* 5-Point InaRISK Radar */}
                  <div className="col-span-5 flex flex-col items-center justify-center rounded-xl border border-emerald-500/25 bg-slate-900/80 p-2.5">
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      {/* Concentric 250m rings */}
                      <div className="absolute inset-0 rounded-full border border-emerald-500/30" />
                      <div className="absolute inset-3 rounded-full border border-dashed border-emerald-500/35" />
                      <div className="absolute inset-7 rounded-full border border-emerald-400/45" />
                      {/* Rotating radar sweep */}
                      <div
                        className="radar-sweep-spin absolute inset-0 rounded-full"
                        style={{
                          background:
                            "conic-gradient(from 0deg, rgba(16,185,129,0.45) 0deg, rgba(16,185,129,0.08) 55deg, transparent 85deg)",
                        }}
                      />
                      {/* 5 Sample Nodes: Center, North, East, South, West */}
                      {[
                        { top: "50%", left: "50%", label: "C" },
                        { top: "14%", left: "50%", label: "U" },
                        { top: "50%", left: "86%", label: "T" },
                        { top: "86%", left: "50%", label: "S" },
                        { top: "50%", left: "14%", label: "B" },
                      ].map((pt, i) => {
                        const safe = scenario.safePoints[i]
                        return (
                          <span
                            key={pt.label}
                            style={{ top: pt.top, left: pt.left }}
                            className={cn(
                              "absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2",
                              safe
                                ? "bg-emerald-400 ring-emerald-400/30"
                                : "bg-amber-400 ring-amber-400/40"
                            )}
                          />
                        )
                      })}
                    </div>
                    <p className="mt-1.5 flex items-center justify-center gap-1 text-center text-[10px] font-extrabold text-emerald-300">
                      <Drop weight="fill" className="h-3 w-3 shrink-0" />
                      {scenario.floodStatus}
                    </p>
                    <p className="flex items-center gap-1 text-[9.5px] text-slate-400">
                      <Mountains className="h-3 w-3 text-sky-400" />
                      {scenario.elevationLabel}
                    </p>
                  </div>

                  {/* Spec & OSRM Commuter Breakdown */}
                  <div className="col-span-7 space-y-2">
                    {/* OSRM Route Card */}
                    <div className="rounded-xl border border-orange-500/25 bg-orange-500/10 p-2">
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-orange-300">
                        <span className="flex items-center gap-1">
                          <Train weight="fill" className="h-3.5 w-3.5" />
                          Rute OSRM → {scenario.krlStation}
                        </span>
                      </div>
                      {/* Animated SVG track path */}
                      <svg
                        viewBox="0 0 180 22"
                        className="my-1 h-4 w-full"
                        aria-hidden="true"
                      >
                        <path
                          d="M8 14 C 48 4, 96 20, 172 10"
                          fill="none"
                          stroke="rgba(251,146,60,0.3)"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <path
                          d="M8 14 C 48 4, 96 20, 172 10"
                          fill="none"
                          stroke="#fb923c"
                          strokeWidth="2.5"
                          strokeDasharray="6 6"
                          strokeLinecap="round"
                          className="krl-track-flow"
                        />
                        <circle cx="8" cy="14" r="3.5" fill="#10b981" />
                        <circle cx="172" cy="10" r="3.5" fill="#fb923c" />
                      </svg>
                      <p className="text-[10px] font-semibold text-orange-100/90">
                        {scenario.krlRoadDetail}
                      </p>
                    </div>

                    {/* Structural Spec List */}
                    <div className="space-y-1 rounded-xl border border-white/10 bg-white/[0.04] p-2">
                      {scenario.specs.map((sp) => (
                        <div
                          key={sp.label}
                          className="flex items-center justify-between gap-2 text-[10px]"
                        >
                          <span className="font-semibold text-slate-400">
                            {sp.label}
                          </span>
                          <span className="truncate font-bold text-emerald-200">
                            {sp.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom True Affordability Strip */}
                <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/12 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[9.5px] font-bold tracking-wider text-emerald-300 uppercase">
                      True Cost KPR BTN + Komuter
                    </p>
                    <p className="truncate text-[10.5px] text-slate-300">
                      {scenario.kprPart} + {scenario.commutePart}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-black text-emerald-300">
                    {scenario.trueCostMonthly}
                  </span>
                </div>
              </div>

              {/* ── OVERLAY: MARKETING BROCHURE SHELL ("Kulit Brosur" — clipped to LEFT of laser) ── */}
              <div
                style={{
                  clipPath: `inset(0 ${100 - scanPercent}% 0 0)`,
                }}
                className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 text-slate-900 dark:from-slate-100 dark:via-white dark:to-amber-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[9.5px] font-extrabold tracking-wider text-amber-800 uppercase">
                      <WarningCircle weight="fill" className="h-3 w-3" />
                      Tampilan Kulit Brosur
                    </span>
                    <h2 className="mt-1 text-sm font-black tracking-tight text-slate-900 sm:text-base">
                      {scenario.brochureTitle}
                    </h2>
                    <p className="text-xs font-extrabold text-emerald-700">
                      {scenario.brochurePrice}
                    </p>
                  </div>
                </div>

                {/* Stylized Clean Brochure House Illustration */}
                <div className="my-1 grid grid-cols-12 items-center gap-3">
                  <div className="col-span-6 flex items-center justify-center rounded-xl border border-amber-200/80 bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50 p-3">
                    <svg
                      viewBox="0 0 180 120"
                      className="h-28 w-full"
                      aria-hidden="true"
                    >
                      {/* Sun */}
                      <circle cx="145" cy="24" r="11" fill="#fbbf24" opacity="0.85" />
                      {/* Ground */}
                      <rect x="8" y="96" width="164" height="14" rx="7" fill="#86efac" />
                      {/* House body */}
                      <rect x="34" y="54" width="112" height="44" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                      {/* Roof */}
                      <path d="M24 58 L90 18 L156 58 Z" fill="#0f766e" stroke="#115e59" strokeWidth="2" strokeLinejoin="round" />
                      {/* Door */}
                      <rect x="80" y="68" width="20" height="30" rx="2" fill="#92400e" />
                      <circle cx="96" cy="83" r="1.5" fill="#fde68a" />
                      {/* Windows */}
                      <rect x="46" y="66" width="22" height="18" rx="2" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" />
                      <rect x="112" y="66" width="22" height="18" rx="2" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" />
                      {/* Decorative tree */}
                      <rect x="18" y="80" width="4" height="16" fill="#78350f" />
                      <circle cx="20" cy="74" r="10" fill="#16a34a" />
                    </svg>
                  </div>

                  <div className="col-span-6 space-y-1.5">
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Klaim Iklan Umum
                    </p>
                    {scenario.brochureClaims.map((claim) => (
                      <div
                        key={claim}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-2xs"
                      >
                        <CheckCircle
                          weight="fill"
                          className="h-3.5 w-3.5 shrink-0 text-amber-500"
                        />
                        <span className="truncate">{claim}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Brochure Footer */}
                <div className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-[11px] font-semibold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <HouseLine weight="duotone" className="h-4 w-4 text-amber-700" />
                    Geser garis X-Ray untuk cek data asli →
                  </span>
                  <span className="text-[10px] text-amber-700/80">
                    *S&amp;K berlaku
                  </span>
                </div>
              </div>

              {/* ── GLOWING EMERALD X-RAY LASER DIVIDER (GPU compositor translate3d) ── */}
              <div
                style={{
                  transform: `translate3d(${scanPercent}%, 0, 0)`,
                }}
                className="pointer-events-none absolute inset-0 z-20 will-change-transform"
              >
                <div className="relative h-full w-0.5 -translate-x-1/2 bg-emerald-400 shadow-[0_0_16px_3px_rgba(16,185,129,0.9)]">
                  <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-emerald-300 bg-slate-950 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.75)]">
                    <ArrowsLeftRight weight="bold" className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Accessible Keyboard Range Control + Quick Presets Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-slate-900/95 px-3.5 py-2 text-[10.5px] text-slate-300">
              <label className="flex flex-1 items-center gap-2">
                <span className="shrink-0 font-bold text-slate-400">
                  Pindai:
                </span>
                <input
                  type="range"
                  min={8}
                  max={92}
                  value={Math.round(scanPercent)}
                  aria-label="Geser pemindai X-Ray antara brosur dan data audit Si-Coro"
                  onChange={(e) => {
                    setIsAutoScanning(false)
                    setScanPercent(Number(e.target.value))
                  }}
                  className="h-1.5 w-full cursor-pointer accent-emerald-400"
                />
              </label>

              <div className="flex items-center gap-1">
                {[
                  { label: "Brosur", val: 88 },
                  { label: "50/50", val: 50 },
                  { label: "X-Ray Penuh", val: 10 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setIsAutoScanning(false)
                      setScanPercent(preset.val)
                    }}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300 transition-colors hover:border-emerald-400/40 hover:bg-emerald-500/15 hover:text-emerald-200"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
