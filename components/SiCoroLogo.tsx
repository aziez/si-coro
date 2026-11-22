import React from "react"
import { cn } from "@/lib/utils"

interface SiCoroLogoProps {
  className?: string
  showTagline?: boolean
  size?: "sm" | "md" | "lg"
  iconOnly?: boolean
  /** Pulses the emerald core dot like a radar sonar while scanning/loading data */
  scanning?: boolean
}

/**
 * Official Si-Coro Brand Mark & Wordmark
 * Roof + C + Emerald Core Dot ("Cek Isi Rumah, Bukan Kulitnya")
 */
export function SiCoroLogo({
  className,
  showTagline = false,
  size = "md",
  iconOnly = false,
  scanning = false,
}: SiCoroLogoProps) {
  const iconDimensions = {
    sm: "h-7 w-7",
    md: "h-8 w-8 sm:h-9 sm:w-9",
    lg: "h-11 w-11",
  }[size]

  const titleClasses = {
    sm: "text-base",
    md: "text-lg sm:text-xl",
    lg: "text-2xl",
  }[size]

  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      {/* Official Roof + C + Emerald Dot Vector Symbol with Sonar Micro-Animation */}
      <svg
        viewBox="0 0 100 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          "shrink-0 transition-transform duration-300 group-hover:scale-105",
          iconDimensions
        )}
        aria-hidden="true"
      >
        {/* Roof ^ */}
        <path
          d="M8 42L50 8L92 42"
          className="stroke-slate-900 dark:stroke-white"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Outer 'C' */}
        <path
          d="M72 46.5C66.8 39.8 58.9 35.5 50 35.5C34.5 35.5 22 48 22 63.5C22 79 34.5 91.5 50 91.5C58.9 91.5 66.8 87.2 72 80.5"
          className="stroke-slate-900 dark:stroke-white"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Radar Sonar Ring when scanning or hovered */}
        <circle
          cx="50"
          cy="63.5"
          r="12"
          style={{ transformOrigin: "50px 63.5px" }}
          className={cn(
            "fill-none stroke-emerald-500/70 transition-opacity",
            scanning
              ? "radar-ring-pulse opacity-100"
              : "opacity-0 group-hover:radar-ring-pulse group-hover:opacity-100"
          )}
          strokeWidth="4"
        />
        {/* Inner Emerald Core ("Isi Rumah") */}
        <circle
          cx="50"
          cy="63.5"
          r="9.5"
          className="fill-emerald-600 dark:fill-emerald-400"
        />
      </svg>

      {!iconOnly && (
        <div className="flex flex-col justify-center leading-none">
          <div
            className={cn(
              "flex items-baseline font-black tracking-tight",
              titleClasses
            )}
          >
            <span className="text-slate-900 dark:text-white">Si-</span>
            <span className="text-emerald-600 dark:text-emerald-400">Coro</span>
          </div>
          {showTagline && (
            <span className="mt-0.5 hidden text-[8.5px] font-bold tracking-[0.14em] text-muted-foreground uppercase sm:block">
              Cek Isi Rumah, Bukan Kulitnya
            </span>
          )}
        </div>
      )}
    </div>
  )
}
