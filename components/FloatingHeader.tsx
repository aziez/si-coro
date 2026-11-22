"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  MagnifyingGlass,
  Moon,
  Sun,
  Heart,
  X,
  SlidersHorizontal,
  Scales,
  ArrowCounterClockwise,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { SearchPanel, type SearchPanelProps } from "./SearchPanel"
import { SiCoroLogo } from "./SiCoroLogo"

// ─── Types ──────────────────────────────────────────────────────────────────

interface FloatingHeaderProps extends SearchPanelProps {
  favoritesCount: number
  compareCount?: number
  showFavoritesOnly: boolean
  onToggleFavorites: () => void
  activeSearchLabel: string // e.g. "Bogor · Subsidi" or ""
  activeFilterCount?: number
  onResetFilters?: () => void
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FloatingHeader({
  favoritesCount,
  compareCount = 0,
  showFavoritesOnly,
  onToggleFavorites,
  activeSearchLabel,
  activeFilterCount = 0,
  onResetFilters,
  ...searchPanelProps
}: FloatingHeaderProps) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element
      // Ignore clicks inside UI portals (Select dropdowns from Base UI / Radix)
      if (
        target.closest('[role="listbox"]') ||
        target.closest('[data-slot^="select-"]') ||
        target.closest("[data-radix-popper-content-wrapper]") ||
        target.closest("[data-radix-select-content]")
      ) {
        return
      }
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Close panel on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const hasActiveSearch = Boolean(activeSearchLabel)

  // Wrap search to also close panel
  const handleSearch = (e?: React.FormEvent) => {
    searchPanelProps.onSearch(e)
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="fixed inset-x-0 top-0 z-50">
      {/* ── Main Header Bar ─────────────────────────────────── */}
      <header className="glass-header border-b border-border/60 shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
          {/* Official Si-Coro Brand Mark */}
          <button
            type="button"
            onClick={() => {
              if (showFavoritesOnly) onToggleFavorites()
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
            className="group flex shrink-0 items-center text-left transition-opacity hover:opacity-90"
            title="Si-Coro — Cek Isi Rumah, Bukan Kulitnya"
          >
            <SiCoroLogo showTagline size="md" />
          </button>

          {/* Search Pill (center, expandable, mobile-friendly 40px touch target) */}
          <div className="relative flex flex-1 items-center justify-center max-w-xl mx-auto">
            <button
              type="button"
              aria-label="Buka filter dan pencarian perumahan"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className={cn(
                "flex h-10 w-full items-center gap-2.5 rounded-full border px-3.5 text-left text-xs sm:text-sm transition-all duration-200",
                isOpen
                  ? "border-primary bg-background shadow-md ring-2 ring-primary/20"
                  : hasActiveSearch
                    ? "border-primary/40 bg-primary/5 hover:border-primary/60 hover:bg-primary/10"
                    : "border-border/80 bg-muted/60 hover:border-border hover:bg-muted/90"
              )}
            >
              <MagnifyingGlass
                weight={isOpen || hasActiveSearch ? "bold" : "regular"}
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isOpen || hasActiveSearch
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />

              {hasActiveSearch ? (
                <span className="flex-1 truncate font-semibold text-foreground">
                  {activeSearchLabel}
                </span>
              ) : (
                <span className="flex-1 truncate text-muted-foreground">
                  <span className="sm:hidden">Cari lokasi / perumahan...</span>
                  <span className="hidden sm:inline">
                    Cari wilayah, nama perumahan, atau filter subsidi...
                  </span>
                </span>
              )}

              <div className="ml-auto flex shrink-0 items-center gap-1.5">
                {activeFilterCount > 0 && !isOpen && (
                  <Badge className="h-5 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </Badge>
                )}
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                    isOpen
                      ? "bg-muted text-foreground"
                      : "bg-background/80 text-muted-foreground border border-border/60"
                  )}
                >
                  {isOpen ? (
                    <X weight="bold" className="h-3.5 w-3.5" />
                  ) : (
                    <SlidersHorizontal weight="bold" className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>
            </button>

            {/* Quick Clear Button outside/adjacent when filters are active */}
            {hasActiveSearch && !isOpen && onResetFilters && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onResetFilters()
                }}
                title="Reset semua filter pencarian"
                className="ml-1.5 hidden sm:inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              >
                <ArrowCounterClockwise weight="bold" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right Actions (40x40px touch targets) */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {/* Compare link button */}
            {compareCount > 0 && (
              <Link href="/compare">
                <Button
                  variant="outline"
                  size="sm"
                  className="relative h-10 rounded-full border-primary/30 bg-primary/5 px-3 text-xs font-bold text-primary hover:bg-primary/15"
                  title={`Bandingkan Properti (${compareCount}/3)`}
                >
                  <Scales weight="fill" className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden md:inline">Bandingkan</span>
                  <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-foreground">
                    {compareCount}
                  </span>
                </Button>
              </Link>
            )}

            {/* Favorites toggle */}
            <Button
              variant={showFavoritesOnly ? "default" : "ghost"}
              size="sm"
              className={cn(
                "relative h-10 rounded-full px-2.5 sm:px-3",
                showFavoritesOnly && "shadow-sm shadow-primary/25"
              )}
              onClick={onToggleFavorites}
              title={
                showFavoritesOnly
                  ? "Kembali ke Pencarian"
                  : `Properti Favorit (${favoritesCount})`
              }
            >
              <Heart
                weight={
                  showFavoritesOnly || favoritesCount > 0 ? "fill" : "regular"
                }
                className={cn(
                  "h-4 w-4",
                  !showFavoritesOnly && favoritesCount > 0 && "text-red-500"
                )}
              />
              <span className="ml-1.5 hidden text-xs font-bold lg:inline">
                Favorit
              </span>
              {favoritesCount > 0 && !showFavoritesOnly && (
                <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                  {favoritesCount > 99 ? "99+" : favoritesCount}
                </span>
              )}
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Ganti tema terang/gelap"
              aria-label="Ganti tema terang atau gelap"
            >
              {theme === "dark" ? (
                <Sun weight="fill" className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon weight="duotone" className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Search Dropdown Panel ───────────────────────────── */}
      {isOpen && (
        <>
          {/* Mobile backdrop scrim */}
          <div
            className="fixed inset-0 top-16 z-40 bg-black/25 backdrop-blur-[2px] sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="glass-panel relative z-50 border-b border-border/60 shadow-2xl animate-in slide-in-from-top-2 fade-in duration-150">
            <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
              <SearchPanel
                {...searchPanelProps}
                onSearch={handleSearch}
                onResetFilters={() => {
                  onResetFilters?.()
                  setIsOpen(false)
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
