'use client';

import React from 'react';
import Link from 'next/link';
import { Scales, X } from '@phosphor-icons/react';
import { Perumahan } from './HouseCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

interface CompareFloatingBarProps {
  compareList: Perumahan[];
  onRemove: (house: Perumahan) => void;
  onClear: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CompareFloatingBar({ compareList, onRemove, onClear }: CompareFloatingBarProps) {
  if (compareList.length === 0) return null;

  const resolveImg = (url: string) =>
    url.startsWith('http') ? url : `https://sikumbang.tapera.go.id${url.startsWith('/') ? '' : '/'}${url}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pointer-events-none flex justify-center animate-in slide-in-from-bottom-6 fade-in duration-300">
      <div className="glass-card border border-border/60 shadow-2xl rounded-2xl px-4 py-3 w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto">
        {/* Left: Icon + label */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-primary/10 p-2 rounded-full hidden sm:flex">
            <Scales weight="duotone" className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm">Bandingkan Properti</h4>
              <Badge variant="secondary" className="text-xs px-1.5 h-5">{compareList.length}/3</Badge>
            </div>
            <button onClick={onClear} className="text-xs text-destructive hover:underline mt-0.5 cursor-pointer">
              Hapus Semua
            </button>
          </div>
        </div>

        <Separator orientation="vertical" className="h-10 hidden sm:block" />

        {/* Center: Thumbnails */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          {compareList.map(house => (
            <div
              key={house.idLokasi}
              className="relative group rounded-lg overflow-hidden border border-border w-14 h-14 shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={house.foto?.[0] ? resolveImg(house.foto[0]) : ''}
                alt={house.namaPerumahan}
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48L3N2Zz4=';
                }}
              />
              <button
                onClick={() => onRemove(house)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Hapus"
              >
                <X weight="bold" className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: 3 - compareList.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-14 h-14 rounded-lg border-2 border-dashed border-border/60 flex items-center justify-center text-muted-foreground/40 shrink-0"
            >
              <span className="text-lg font-light">+</span>
            </div>
          ))}
        </div>

        {/* Right: CTA */}
        <Link href="/compare" className="w-full sm:w-auto shrink-0">
          <Button
            disabled={compareList.length < 2}
            className={cn('w-full sm:w-auto px-5 text-sm font-semibold h-9',
              compareList.length >= 2 && 'shadow-sm shadow-primary/25 hover:-translate-y-0.5 transition-all'
            )}
          >
            {compareList.length < 2 ? `Pilih ${2 - compareList.length} lagi` : 'Bandingkan Sekarang'}
          </Button>
        </Link>
      </div>
    </div>
  );
}
