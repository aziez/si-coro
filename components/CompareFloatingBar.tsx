"use client"

import React from "react"
import Link from "next/link"
import { Scales, X, ArrowRight } from "@phosphor-icons/react"
import { Perumahan } from "./HouseCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────

interface CompareFloatingBarProps {
  compareList: Perumahan[]
  onRemove: (house: Perumahan) => void
  onClear: () => void
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CompareFloatingBar({
  compareList,
  onRemove,
  onClear,
}: CompareFloatingBarProps) {
  if (compareList.length === 0) return null

  const resolveImg = (url: string) =>
    url.startsWith("http")
      ? url
      : `https://sikumbang.tapera.go.id${url.startsWith("/") ? "" : "/"}${url}`

  return (
    <div className="pb-safe pointer-events-none fixed right-0 bottom-0 left-0 z-40 flex justify-center p-3 animate-in slide-in-from-bottom-6 fade-in duration-300">
      <div className="glass-card pointer-events-auto flex w-full max-w-3xl flex-col items-center justify-between gap-3 rounded-2xl border border-primary/30 px-4 py-3 shadow-2xl sm:flex-row">
        {/* Left: Icon + label */}
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Scales weight="duotone" className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold sm:text-sm">
                  Bandingkan Rumah
                </h4>
                <Badge
                  variant="secondary"
                  className="h-5 bg-primary/15 px-1.5 text-[11px] font-bold text-primary"
                >
                  {compareList.length}/3
                </Badge>
              </div>
              <button
                type="button"
                onClick={onClear}
                className="mt-0.5 text-[11px] font-semibold text-destructive hover:underline"
              >
                Reset Pilihan
              </button>
            </div>
          </div>

          {/* Mobile CTA inline */}
          <Link href="/compare" className="sm:hidden">
            <Button
              size="sm"
              disabled={compareList.length < 2}
              className="h-9 gap-1 rounded-xl px-3.5 text-xs font-bold"
            >
              {compareList.length < 2
                ? `+${2 - compareList.length} Lagi`
                : "Bandingkan"}
              <ArrowRight weight="bold" className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <Separator orientation="vertical" className="hidden h-10 sm:block" />

        {/* Center: Thumbnails with always-visible remove badge for mobile touch */}
        <div className="flex w-full flex-1 items-center justify-start gap-2.5 overflow-x-auto py-0.5 sm:justify-center">
          {compareList.map((house) => (
            <div
              key={house.idLokasi}
              className="relative flex h-12 flex-1 items-center gap-2 rounded-xl border border-border/80 bg-background/90 p-1.5 pr-7 shadow-2xs sm:max-w-44"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={house.foto?.[0] ? resolveImg(house.foto[0]) : ""}
                alt={house.namaPerumahan}
                className="h-9 w-9 shrink-0 rounded-lg bg-muted object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48L3N2Zz4="
                }}
              />
              <span className="line-clamp-2 text-[11px] font-bold leading-tight text-foreground">
                {house.namaPerumahan}
              </span>
              <button
                type="button"
                onClick={() => onRemove(house)}
                aria-label={`Hapus ${house.namaPerumahan} dari perbandingan`}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
                title="Hapus"
              >
                <X weight="bold" className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 3 - compareList.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex h-12 min-w-24 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border/60 px-2 text-center text-[11px] font-medium text-muted-foreground/60 sm:max-w-36"
            >
              + Pilih Rumah
            </div>
          ))}
        </div>

        {/* Right: Desktop CTA */}
        <Link href="/compare" className="hidden shrink-0 sm:block">
          <Button
            disabled={compareList.length < 2}
            className={cn(
              "h-10 gap-1.5 rounded-xl px-5 text-xs font-bold sm:text-sm",
              compareList.length >= 2 &&
                "shadow-md shadow-primary/25 transition-all hover:-translate-y-0.5"
            )}
          >
            {compareList.length < 2
              ? `Pilih ${2 - compareList.length} Lagi`
              : "Bandingkan Sekarang"}
            <ArrowRight weight="bold" className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
