'use client';

import React from 'react';
import Link from 'next/link';
import { Scales, X } from '@phosphor-icons/react';
import { Perumahan } from './HouseCard';

interface CompareFloatingBarProps {
  compareList: Perumahan[];
  onRemove: (house: Perumahan) => void;
  onClear: () => void;
}

export function CompareFloatingBar({ compareList, onRemove, onClear }: CompareFloatingBarProps) {
  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none flex justify-center animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-4 w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex bg-primary/10 p-3 rounded-full">
            <Scales weight="duotone" className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm md:text-base">Bandingkan Properti ({compareList.length}/3)</h4>
            <button onClick={onClear} className="text-xs text-red-500 hover:underline mt-0.5">
              Hapus Semua
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {compareList.map((house) => (
            <div key={house.idLokasi} className="relative group rounded-xl overflow-hidden border border-border w-16 h-16 md:w-20 md:h-20 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={house.foto && house.foto[0] ? `https://sikumbang.tapera.go.id${house.foto[0].startsWith('/') ? '' : '/'}${house.foto[0]}` : '/placeholder.jpg'} 
                alt={house.namaPerumahan}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48L3N2Zz4=' }}
              />
              <button 
                onClick={() => onRemove(house)}
                className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X weight="bold" className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: 3 - compareList.length }).map((_, i) => (
            <div key={`empty-${i}`} className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/50 text-muted-foreground/50 shrink-0">
              <span className="text-xl font-light">+</span>
            </div>
          ))}
        </div>

        <Link href="/compare" className="w-full md:w-auto">
          <button 
            disabled={compareList.length < 2}
            className={`w-full px-6 py-3 rounded-xl font-bold transition-all shadow-sm ${
              compareList.length >= 2 
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:-translate-y-0.5' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {compareList.length < 2 ? 'Pilih minimal 2' : 'Bandingkan Sekarang'}
          </button>
        </Link>
      </div>
    </div>
  );
}
