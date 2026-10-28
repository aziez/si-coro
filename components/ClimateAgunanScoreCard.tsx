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
  centerRiskLevel?: string
  pixelValue?: number
  maxSurroundingPixelValue?: number
  affectedSurroundingCount?: number
  sampleCount?: number
  bufferWarning?: string | null
  isFloodFree: boolean
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
  floodData?: FloodElevationData | null
  sampleSpec?: BuildingSpecInput | null
}

export function ClimateAgunanScoreCard({
  distanceToJakartaKm,
  bestStationRoute,
  alternatives = [],
  floodData,
  sampleSpec,
}: ClimateAgunanScoreCardProps) {
  const scoreSummary = useMemo(() => {
    // 1. Flood Risk Score (max 45 pts)
    let floodScore = 38
    if (floodData) {
      if (floodData.riskLevel === "Aman") {
        floodScore = floodData.bufferWarning ? 39 : 45
      } else if (floodData.riskLevel === "Rendah") {
        floodScore = 34
      } else if (floodData.riskLevel === "Sedang") {
        floodScore = 20
      } else {
        floodScore = 8
      }
    }

    // 2. Elevation & Drainage Topography Score (max 20 pts)
    let elevScore = 15
    const elev = floodData?.elevation
    if (elev && elev.elevationMeters !== null) {
      if (elev.isLowlandBasin) {
        elevScore = 9
      } else if (
        elev.elevationMeters >= 50 ||
        (elev.relativeToSurroundingMeters ?? 0) >= 1.0
      ) {
        elevScore = 20
      } else if (elev.elevationMeters >= 20) {
        elevScore = 17
      } else {
        elevScore = 13
      }
    }

    // 3. Low-Carbon TOD Transit Accessibility Score (max 20 pts)
    let todScore = 12
    const roadKm =
      bestStationRoute?.roadDistanceKm ??
      bestStationRoute?.straightDistanceKm ??
      null
    if (roadKm !== null) {
      if (roadKm <= 3.5) todScore = 20
      else if (roadKm <= 6.5) todScore = 17
      else if (roadKm <= 11) todScore = 14
      else if (roadKm <= 18) todScore = 10
      else todScore = 6
    }

    // 4. Structural Material Durability Score (max 15 pts)
    let specScore = 11
    if (sampleSpec) {
      const combined = [
        sampleSpec.spesifikasiAtap,
        sampleSpec.spesifikasiDinding,
        sampleSpec.spesifikasiLantai,
        sampleSpec.spesifikasiPondasi,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      let pts = 8
      if (/baja ringan|genteng beton|keramik|granit/.test(combined)) pts += 3
      if (/hebel|bata ringan|bata merah|double dinding/.test(combined)) pts += 2
      if (/batu kali|beton bertulang|cakar ayam|sloof/.test(combined)) pts += 2
      specScore = Math.min(15, pts)
    }

    const totalScore = Math.min(
      100,
      Math.max(20, floodScore + elevScore + todScore + specScore)
    )

    let grade = "B"
    let label = "Layak Agunan KPR"
    let badgeClass =
      "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
    let greenEligible = false

    if (totalScore >= 85) {
      grade = "A+"
      label = "Sangat Layak · Prioritas Green KPR BTN"
      badgeClass =
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
      greenEligible = true
    } else if (totalScore >= 75) {
      grade = "A"
      label = "Layak Utama · Eligible Eco-Mortgage BTN"
      badgeClass =
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
      greenEligible = true
    } else if (totalScore >= 62) {
      grade = "B"
      label = "Layak Standar · Risiko Terkendali"
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
      totalScore,
      grade,
      label,
      badgeClass,
      greenEligible,
      floodScore,
      elevScore,
      todScore,
      specScore,
    }
  }, [floodData, bestStationRoute, sampleSpec])

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
              BTN ESG &amp; Spatial Risk Intelligence
            </Badge>
            {scoreSummary.greenEligible && (
              <Badge className="bg-emerald-600 text-[10px] font-semibold text-white">
                <CheckCircle className="mr-1 h-3 w-3" weight="fill" />
                Kandidat Green Mortgage
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-extrabold tracking-tight">
            Analisis Risiko Lingkungan, Akses KRL &amp; Kelayakan Agunan
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
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-foreground">
                {scoreSummary.totalScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              {scoreSummary.label}
            </p>
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                    <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-700 dark:text-orange-300">
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
                  Garis lurus (Haversine): {bestStationRoute.straightDistanceKm}{" "}
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
                          : floodData.elevation.relativeToSurroundingMeters}{" "}
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
            {distanceToJakartaKm !== undefined && (
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
          {floodData && (
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
      </CardContent>
    </Card>
  )
}
