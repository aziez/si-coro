"use client"

import React, { useMemo } from "react"
import {
  ShieldCheck,
  WarningCircle,
  Drop,
  Train,
  Mountains,
  Buildings,
  Leaf,
  CheckCircle,
  Path,
} from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { StationRouteCandidate } from "@/app/api/route-krl/route"

export interface FloodElevationData {
  riskLevel: string
  centerRiskLevel?: string | null
  pixelValue?: number | null
  maxSurroundingPixelValue?: number | null
  affectedSurroundingCount?: number | null
  sampleCount?: number
  bufferWarning?: string | null
  /** null = InaRISK returned no hazard data (unknown, NOT safe) */
  isFloodFree: boolean | null
  elevation?: {
    elevationMeters: number | null
    surroundingAvgMeters: number | null
    relativeToSurroundingMeters: number | null
    topographyLabel: string
    isLowlandBasin: boolean
  }
}

interface BuildingSpecInput {
  spesifikasiAtap?: string
  spesifikasiDinding?: string
  spesifikasiLantai?: string
  spesifikasiPondasi?: string
}

interface ClimateAgunanScoreCardProps {
  distanceToJakartaKm?: number
  bestStationRoute?: StationRouteCandidate | null
  alternatives?: StationRouteCandidate[]
  /** false when the property is outside KRL Commuter Line coverage */
  krlApplicable?: boolean
  floodData?: FloodElevationData | null
  sampleSpec?: BuildingSpecInput | null
}

interface ScoreComponent {
  key: "flood" | "elev" | "transit" | "spec"
  label: string
  max: number
  /** null = not measured (no data, still loading, or not applicable) */
  score: number | null
  missingReason: string
}

function scoreFlood(flood: FloodElevationData | null | undefined) {
  if (!flood || flood.isFloodFree === null) return null
  switch (flood.riskLevel) {
    case "Aman":
      return flood.bufferWarning ? 39 : 45
    case "Rendah":
      return 34
    case "Sedang":
      return 20
    case "Tinggi":
      return 8
    default:
      return null
  }
}

function scoreElevation(elev: FloodElevationData["elevation"]) {
  if (!elev || elev.elevationMeters === null) return null
  if (elev.isLowlandBasin) return 9
  if (
    elev.elevationMeters >= 50 ||
    (elev.relativeToSurroundingMeters ?? 0) >= 1.0
  )
    return 20
  if (elev.elevationMeters >= 20) return 17
  return 13
}

function scoreTransit(route: StationRouteCandidate | null | undefined) {
  const roadKm = route?.roadDistanceKm ?? route?.straightDistanceKm ?? null
  if (roadKm === null) return null
  if (roadKm <= 3.5) return 20
  if (roadKm <= 6.5) return 17
  if (roadKm <= 11) return 14
  if (roadKm <= 18) return 10
  return 6
}

function scoreSpec(spec: BuildingSpecInput | null | undefined) {
  const combined = [
    spec?.spesifikasiAtap,
    spec?.spesifikasiDinding,
    spec?.spesifikasiLantai,
    spec?.spesifikasiPondasi,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  if (!combined.trim()) return null
  let pts = 8
  if (/baja ringan|genteng beton|keramik|granit/.test(combined)) pts += 3
  if (/hebel|bata ringan|bata merah|double dinding/.test(combined)) pts += 2
  if (/batu kali|beton bertulang|cakar ayam|sloof/.test(combined)) pts += 2
  return Math.min(15, pts)
}

export function ClimateAgunanScoreCard({
  distanceToJakartaKm,
  bestStationRoute,
  alternatives = [],
  krlApplicable = true,
  floodData,
  sampleSpec,
}: ClimateAgunanScoreCardProps) {
  const scoreSummary = useMemo(() => {
    // Weights: flood 45, elevation 20, transit 20, building spec 15.
    // Unmeasured components are excluded and the rest is re-normalised to
    // 100 — missing data must never inflate (or deflate) the grade.
    const components: ScoreComponent[] = [
      {
        key: "flood",
        label: "Bahaya banjir",
        max: 45,
        score: scoreFlood(floodData),
        missingReason: floodData ? "Data InaRISK tidak tersedia" : "Memuat…",
      },
      {
        key: "elev",
        label: "Elevasi & drainase",
        max: 20,
        score: scoreElevation(floodData?.elevation),
        missingReason: floodData ? "Data DEM tidak tersedia" : "Memuat…",
      },
      {
        key: "transit",
        label: "Akses KRL",
        max: 20,
        score: krlApplicable ? scoreTransit(bestStationRoute) : null,
        missingReason: krlApplicable ? "Memuat…" : "Tidak berlaku",
      },
      {
        key: "spec",
        label: "Spesifikasi bangunan",
        max: 15,
        score: scoreSpec(sampleSpec),
        missingReason: "Tidak ada data",
      },
    ]

    const measured = components.filter((c) => c.score !== null)
    const measuredMax = measured.reduce((a, c) => a + c.max, 0)
    const measuredPts = measured.reduce((a, c) => a + (c.score ?? 0), 0)
    const floodMeasured = components[0].score !== null

    // Flood hazard carries the climate grade; without it we only show partial info.
    if (!floodMeasured || measuredMax === 0) {
      return {
        components,
        totalScore: null as number | null,
        grade: "–",
        label: floodData
          ? "Data bahaya banjir belum tersedia"
          : "Menganalisis data lokasi…",
        badgeClass: "bg-muted text-muted-foreground border-border",
        lowClimateRisk: false,
        partial: true,
      }
    }

    const totalScore = Math.round((measuredPts / measuredMax) * 100)

    let grade: string
    let label: string
    let badgeClass: string
    if (totalScore >= 85) {
      grade = "A+"
      label = "Sangat Baik · Risiko Iklim Rendah"
      badgeClass =
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    } else if (totalScore >= 75) {
      grade = "A"
      label = "Baik · Risiko Iklim Rendah"
      badgeClass =
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    } else if (totalScore >= 62) {
      grade = "B"
      label = "Cukup · Risiko Terkendali"
      badgeClass =
        "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
    } else if (totalScore >= 48) {
      grade = "C"
      label = "Perlu Verifikasi Drainase Lapangan"
      badgeClass =
        "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
    } else {
      grade = "D"
      label = "Risiko Iklim Tinggi · Perlu Mitigasi"
      badgeClass =
        "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
    }

    return {
      components,
      totalScore: totalScore as number | null,
      grade,
      label,
      badgeClass,
      // "Tangguh iklim" requires both flood AND elevation data, not just a high total
      lowClimateRisk: totalScore >= 75 && components[1].score !== null,
      partial: measuredMax < 100,
    }
  }, [floodData, bestStationRoute, sampleSpec, krlApplicable])

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-border/50 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent p-5 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
            >
              <Leaf className="mr-1 h-3.5 w-3.5" weight="fill" />
              Analisis Risiko Spasial · Data Publik
            </Badge>
            {scoreSummary.lowClimateRisk && (
              <Badge className="bg-emerald-600 text-[10px] font-semibold text-white">
                <CheckCircle className="mr-1 h-3 w-3" weight="fill" />
                Hunian Tangguh Iklim
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-extrabold tracking-tight">
            Analisis Risiko Lingkungan, Akses KRL &amp; Indikasi Kualitas Agunan
          </h3>
          <p className="text-xs text-muted-foreground">
            Diukur dengan rute jalan raya OSRM, 5-titik buffer InaRISK BNPB
            (radius 250m), dan kontur elevasi DEM.
          </p>
        </div>

        {/* Score Pill */}
        <div className="flex shrink-0 items-center gap-3 rounded-2xl border bg-background/90 px-4 py-3 shadow-sm">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl border text-xl font-black",
              scoreSummary.badgeClass
            )}
          >
            {scoreSummary.grade}
          </div>
          <div>
            {scoreSummary.totalScore !== null && (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-foreground">
                  {scoreSummary.totalScore}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            )}
            <p className="text-xs font-semibold text-muted-foreground">
              {scoreSummary.label}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 p-5">
        {/* Transparent score breakdown */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {scoreSummary.components.map((c) => (
            <div
              key={c.key}
              className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
            >
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
              <p className="text-sm font-bold text-foreground">
                {c.score !== null ? (
                  <>
                    {c.score}
                    <span className="text-xs font-medium text-muted-foreground">
                      {" "}
                      / {c.max}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    {c.missingReason}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
        {scoreSummary.partial && scoreSummary.totalScore !== null && (
          <p className="text-[11px] text-muted-foreground">
            Skor dihitung dari komponen yang tersedia; bobotnya dinormalisasi ke
            100.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {!krlApplicable && (
            <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Train className="h-5 w-5" weight="duotone" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Di luar jangkauan KRL Commuter Line
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Akses transit tidak dinilai untuk lokasi ini dan tidak
                  mengurangi skor.
                </p>
              </div>
            </div>
          )}
          {/* 1. OSRM Road Route to Nearest KRL Station */}
          {bestStationRoute && (
            <div className="flex flex-col justify-between gap-2 rounded-xl border border-orange-200/60 bg-orange-50/70 p-3.5 dark:border-orange-800/30 dark:bg-orange-950/20">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 dark:text-orange-400">
                  <Train className="h-5 w-5" weight="duotone" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-orange-950 dark:text-orange-200">
                      Akses Stasiun KRL Terdekat
                    </p>
                    <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold text-orange-700 uppercase dark:text-orange-300">
                      {bestStationRoute.source === "osrm"
                        ? "Rute Jalan OSRM"
                        : "Estimasi Rute"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm font-extrabold text-foreground">
                    {bestStationRoute.station.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Jarak tempuh jalan:{" "}
                    <strong className="text-foreground">
                      {bestStationRoute.roadDistanceKm} km
                    </strong>{" "}
                    (~{bestStationRoute.roadDurationMinutes} menit berkendara)
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-orange-200/50 pt-2 text-[11px] text-muted-foreground dark:border-orange-800/30">
                <span className="flex items-center gap-1">
                  <Path className="h-3.5 w-3.5" />
                  Garis lurus (Haversine): {
                    bestStationRoute.straightDistanceKm
                  }{" "}
                  km
                </span>
                {alternatives.length > 1 && (
                  <span>
                    Alt: {alternatives[1].station.name.replace("Stasiun ", "")}{" "}
                    ({alternatives[1].roadDistanceKm} km)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 2. Elevation & DEM Topography + Distance to Jakarta */}
          <div className="flex flex-col justify-between gap-2 rounded-xl border border-blue-200/60 bg-blue-50/70 p-3.5 dark:border-blue-800/30 dark:bg-blue-950/20">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Mountains className="h-5 w-5" weight="duotone" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-blue-950 dark:text-blue-200">
                    Elevasi Tanah &amp; Posisi Regional
                  </p>
                  <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                    DEM 90m
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-extrabold text-foreground">
                  {floodData?.elevation?.elevationMeters !== null &&
                  floodData?.elevation?.elevationMeters !== undefined
                    ? `${floodData.elevation.elevationMeters} mdpl · ${floodData.elevation.topographyLabel}`
                    : "Memuat kontur elevasi..."}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {floodData?.elevation?.relativeToSurroundingMeters !== null &&
                  floodData?.elevation?.relativeToSurroundingMeters !==
                    undefined ? (
                    <>
                      Selisih thd radius 250m:{" "}
                      <strong className="text-foreground">
                        {floodData.elevation.relativeToSurroundingMeters > 0
                          ? `+${floodData.elevation.relativeToSurroundingMeters}`
                          : floodData.elevation
                              .relativeToSurroundingMeters}{" "}
                        m
                      </strong>{" "}
                      (rata-rata sekitar{" "}
                      {floodData.elevation.surroundingAvgMeters} mdpl)
                    </>
                  ) : (
                    "Analisis kemiringan drainase sekitar perumahan"
                  )}
                </p>
              </div>
            </div>
            {distanceToJakartaKm !== undefined && krlApplicable && (
              <div className="flex items-center justify-between border-t border-blue-200/50 pt-2 text-[11px] text-muted-foreground dark:border-blue-800/30">
                <span className="flex items-center gap-1">
                  <Buildings className="h-3.5 w-3.5" />
                  Jarak ke Pusat Jakarta (Monas):
                </span>
                <strong className="text-foreground">
                  {distanceToJakartaKm.toFixed(1)} km
                </strong>
              </div>
            )}
          </div>

          {/* 3. Multi-Point Flood Buffer Audit (InaRISK BNPB) */}
          {floodData && floodData.isFloodFree === null && (
            <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3.5 md:col-span-2">
              <WarningCircle
                className="mt-0.5 h-6 w-6 shrink-0 text-muted-foreground"
                weight="duotone"
              />
              <div>
                <p className="text-sm font-extrabold text-foreground">
                  Data bahaya banjir InaRISK belum tersedia untuk titik ini
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Status banjir tidak bisa disimpulkan aman. Lakukan pengecekan
                  lapangan atau tanyakan riwayat genangan ke warga sekitar.
                </p>
              </div>
            </div>
          )}
          {floodData && floodData.isFloodFree !== null && (
            <div
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-3.5 md:col-span-2",
                floodData.isFloodFree
                  ? "border-emerald-200/60 bg-emerald-50/70 dark:border-emerald-800/30 dark:bg-emerald-950/20"
                  : "border-red-200/60 bg-red-50/70 dark:border-red-800/30 dark:bg-red-950/20"
              )}
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  {floodData.isFloodFree ? (
                    <ShieldCheck
                      className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400"
                      weight="duotone"
                    />
                  ) : (
                    <WarningCircle
                      className="mt-0.5 h-6 w-6 shrink-0 text-red-600 dark:text-red-400"
                      weight="duotone"
                    />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "text-sm font-extrabold",
                          floodData.isFloodFree
                            ? "text-emerald-800 dark:text-emerald-300"
                            : "text-red-800 dark:text-red-300"
                        )}
                      >
                        {floodData.isFloodFree
                          ? "Audit Multi-Titik: Relatif Aman dari Bahaya Banjir"
                          : "Audit Multi-Titik: Terdeteksi Kawasan Rawan Banjir"}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold"
                      >
                        {floodData.sampleCount ?? 5} Titik Sampel (Radius 250m)
                      </Badge>
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Drop className="h-3.5 w-3.5" />
                        Risiko Kawasan:{" "}
                        <strong className="text-foreground">
                          {floodData.riskLevel}
                        </strong>{" "}
                        (InaRISK BNPB)
                      </span>
                      {floodData.centerRiskLevel && (
                        <span>
                          · Titik Pusat:{" "}
                          <strong>{floodData.centerRiskLevel}</strong>
                        </span>
                      )}
                      {typeof floodData.affectedSurroundingCount ===
                        "number" && (
                        <span>
                          · Titik Buffer Terdampak:{" "}
                          <strong>
                            {floodData.affectedSurroundingCount} dari 4 arah
                          </strong>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {floodData.bufferWarning && (
                <p className="rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                  ⚠️ Catatan Akses Jalan: {floodData.bufferWarning}
                </p>
              )}
            </div>
          )}
        </div>

        <p className="border-t border-border/50 pt-3 text-[11px] leading-relaxed text-muted-foreground">
          Skor indikatif dari data publik (InaRISK BNPB, DEM, OSRM, SiKumbang).
          Bukan penilaian agunan, appraisal, atau keputusan kredit resmi dari
          bank mana pun.
        </p>
      </CardContent>
    </Card>
  )
}
