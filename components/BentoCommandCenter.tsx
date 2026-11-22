"use client"

import React, { useState } from "react"
import {
  Drop,
  Train,
  ShieldCheck,
  Compass,
  ArrowUpRight,
  Sparkle,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface BentoCommandCenterProps {
  onLaunchFloodMap: () => void
  onLaunchKrlMap: () => void
  onSortClosestJakarta: () => void
  onOpenFirstPropertyTour: () => void
}

const GRADE_PREVIEW = [
  { grade: "A+", score: 91, label: "Sangat Layak", color: "#10b981", pct: 91 },
  { grade: "A", score: 81, label: "Layak & Aman", color: "#34d399", pct: 81 },
  { grade: "B", score: 69, label: "Cukup Baik", color: "#3b82f6", pct: 69 },
  { grade: "C", score: 54, label: "Perlu Survei", color: "#f59e0b", pct: 54 },
] as const

const SITEPLAN_PLOTS: Array<"avail" | "sold" | "promo"> = [
  "sold",
  "sold",
  "avail",
  "promo",
  "sold",
  "avail",
  "sold",
  "avail",
  "avail",
  "sold",
  "promo",
  "avail",
]

export function BentoCommandCenter({
  onLaunchFloodMap,
  onLaunchKrlMap,
  onSortClosestJakarta,
  onOpenFirstPropertyTour,
}: BentoCommandCenterProps) {
  const [gradeIdx, setGradeIdx] = useState(0)
  const activeGrade = GRADE_PREVIEW[gradeIdx]

  // Semi-circle SVG arc math (r = 38, circumference half = PI * 38 ≈ 119.38)
  const arcLen = 119.38
  const dashOffset = arcLen - (arcLen * activeGrade.pct) / 100

  return (
    <section
      aria-label="Command Center Fitur Si-Coro"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {/* ── Tile 1: Live InaRISK 5-Point Flood Sonar ── */}
      <button
        type="button"
        onClick={onLaunchFloodMap}
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/75 bg-card p-4 text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/45 hover:shadow-lg hover:shadow-emerald-500/10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl transition-opacity group-hover:opacity-100"
        />

        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
            <Drop weight="duotone" className="h-5 w-5" />
          </div>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 transition-transform group-hover:translate-x-0.5 dark:text-emerald-300">
            Buka Layer
            <ArrowUpRight weight="bold" className="h-3 w-3" />
          </span>
        </div>

        {/* Live Animated Sonar Visual */}
        <div className="my-3 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-slate-950/[0.03] p-2.5 dark:bg-slate-950/60">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-emerald-500/25" />
            <span className="absolute inset-2.5 rounded-full border border-dashed border-emerald-500/35" />
            <span
              className="radar-sweep-spin absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(16,185,129,0.5) 0deg, transparent 80deg)",
              }}
            />
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="absolute top-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-400" />
            <span className="absolute right-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-emerald-400" />
            <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-400" />
            <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-emerald-400" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-mono text-[10.5px] font-extrabold text-emerald-700 dark:text-emerald-300">
              INARISK 5-TITIK
            </p>
            <p className="text-[10.5px] leading-snug text-muted-foreground">
              Audit radius 250m + kontur elevasi DEM 90m.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-extrabold tracking-tight text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
            Live InaRISK Flood Sonar
          </h3>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Aktifkan peta bahaya banjir BNPB secara langsung
          </p>
        </div>
      </button>

      {/* ── Tile 2: KRL Jabodetabek Network Pulse ── */}
      <button
        type="button"
        onClick={onLaunchKrlMap}
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/75 bg-card p-4 text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/45 hover:shadow-lg hover:shadow-orange-500/10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-orange-500/10 blur-2xl"
        />

        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/12 text-orange-600 dark:text-orange-400">
            <Train weight="duotone" className="h-5 w-5" />
          </div>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-extrabold text-orange-700 transition-transform group-hover:translate-x-0.5 dark:text-orange-300">
            84 Stasiun
            <ArrowUpRight weight="bold" className="h-3 w-3" />
          </span>
        </div>

        {/* Mini Stylized KRL Corridor Map with Animated Pulses */}
        <div className="my-3 rounded-xl border border-orange-500/20 bg-slate-950/[0.03] p-2.5 dark:bg-slate-950/60">
          <svg
            viewBox="0 0 200 62"
            className="h-14 w-full"
            aria-hidden="true"
          >
            {/* Lin Bogor (Red) */}
            <path
              d="M96 8 L96 56"
              stroke="#e11d48"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.35"
            />
            <path
              d="M96 8 L96 56"
              stroke="#e11d48"
              strokeWidth="2.4"
              strokeDasharray="6 8"
              strokeLinecap="round"
              className="krl-track-flow"
            />
            {/* Lin Cikarang Loop (Sky Blue) */}
            <path
              d="M72 16 Q96 24 188 30"
              fill="none"
              stroke="#0284c7"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.35"
            />
            <path
              d="M72 16 Q96 24 188 30"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.4"
              strokeDasharray="6 8"
              strokeLinecap="round"
              className="krl-track-flow"
            />
            {/* Lin Rangkasbitung (Green) */}
            <path
              d="M76 26 Q42 36 10 50"
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.35"
            />
            <path
              d="M76 26 Q42 36 10 50"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2.4"
              strokeDasharray="6 8"
              strokeLinecap="round"
              className="krl-track-flow"
            />
            {/* Lin Tangerang (Amber/Brown) */}
            <path
              d="M72 18 L18 22"
              stroke="#b45309"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Interchange Hubs */}
            <circle cx="96" cy="26" r="4.5" fill="#fff" stroke="#0f172a" strokeWidth="2" />
            <circle cx="76" cy="24" r="3.5" fill="#fff" stroke="#0f172a" strokeWidth="1.8" />
            <circle cx="188" cy="30" r="3" fill="#0284c7" />
            <circle cx="96" cy="56" r="3" fill="#e11d48" />
            <circle cx="10" cy="50" r="3" fill="#16a34a" />
          </svg>
        </div>

        <div>
          <h3 className="text-sm font-extrabold tracking-tight text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400">
            Jalur KRL Akurat &amp; OSRM
          </h3>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            7 koridor rel asli OSM + rute jalan raya stasiun
          </p>
        </div>
      </button>

      {/* ── Tile 3: Climate & Agunan Score Dial ── */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/75 bg-card p-4 text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/45 hover:shadow-lg hover:shadow-blue-500/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-blue-500/10 blur-2xl"
        />

        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/12 text-blue-600 dark:text-blue-400">
            <ShieldCheck weight="duotone" className="h-5 w-5" />
          </div>
          <button
            type="button"
            onClick={onSortClosestJakarta}
            className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 transition-transform hover:translate-x-0.5 dark:text-blue-300"
          >
            Urut Terdekat
            <ArrowUpRight weight="bold" className="h-3 w-3" />
          </button>
        </div>

        {/* Interactive Animated Gauge Dial */}
        <div className="my-3 flex items-center justify-between gap-2 rounded-xl border border-blue-500/20 bg-slate-950/[0.03] px-3 py-2 dark:bg-slate-950/60">
          <div className="relative h-14 w-24 shrink-0">
            <svg viewBox="0 0 100 58" className="h-full w-full" aria-hidden="true">
              <path
                d="M12 50 A 38 38 0 0 1 88 50"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.14"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M12 50 A 38 38 0 0 1 88 50"
                fill="none"
                stroke={activeGrade.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={arcLen}
                strokeDashoffset={dashOffset}
                className="transition-[stroke-dashoffset,stroke] duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0.5 text-center leading-none">
              <span className="text-base font-black text-foreground">
                {activeGrade.grade}
              </span>
              <span className="ml-1 font-mono text-[10px] font-bold text-muted-foreground">
                {activeGrade.score}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-extrabold text-foreground">
              {activeGrade.label}
            </span>
            <div className="flex items-center gap-1">
              {GRADE_PREVIEW.map((g, idx) => (
                <button
                  key={g.grade}
                  type="button"
                  onClick={() => setGradeIdx(idx)}
                  aria-label={`Lihat simulasi skor grade ${g.grade}`}
                  className={cn(
                    "h-5 min-w-5 rounded-md px-1 text-[9.5px] font-black transition-all",
                    gradeIdx === idx
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                  )}
                >
                  {g.grade}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-extrabold tracking-tight text-foreground">
            Skor Agunan &amp; KPR BTN
          </h3>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Grade A+ s/d D + simulasi cicilan &amp; komuter riil
          </p>
        </div>
      </div>

      {/* ── Tile 4: Live Siteplan & 360° ChellTour ── */}
      <button
        type="button"
        onClick={onOpenFirstPropertyTour}
        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/75 bg-card p-4 text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/45 hover:shadow-lg hover:shadow-indigo-500/10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl"
        />

        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/12 text-indigo-600 dark:text-indigo-400">
            <Compass weight="duotone" className="h-5 w-5" />
          </div>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 transition-transform group-hover:translate-x-0.5 dark:text-indigo-300">
            Coba Intip
            <ArrowUpRight weight="bold" className="h-3 w-3" />
          </span>
        </div>

        {/* Animated Interactive Kavling Siteplan & 360° Horizon */}
        <div className="my-3 flex items-center gap-2.5 rounded-xl border border-indigo-500/20 bg-slate-950/[0.03] p-2.5 dark:bg-slate-950/60">
          <div className="grid shrink-0 grid-cols-4 gap-1">
            {SITEPLAN_PLOTS.map((status, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-3.5 w-3.5 rounded-[4px] transition-transform duration-300 group-hover:scale-105",
                  status === "avail" && "bg-emerald-500/85 shadow-2xs",
                  status === "promo" && "bg-indigo-500 shadow-2xs",
                  status === "sold" && "bg-muted-foreground/25"
                )}
              />
            ))}
          </div>
          <div className="min-w-0 space-y-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/15 px-1.5 py-0.5 text-[9.5px] font-extrabold text-indigo-700 dark:text-indigo-300">
              <Sparkle weight="fill" className="h-2.5 w-2.5" />
              360° ChellTour
            </span>
            <p className="text-[10.5px] leading-snug text-muted-foreground">
              Cek stok kavling hijau &amp; interior rumah contoh.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-extrabold tracking-tight text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            Siteplan Live &amp; Tur 360°
          </h3>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            Jelajahi ruang dalam sebelum survei lokasi
          </p>
        </div>
      </button>
    </section>
  )
}
