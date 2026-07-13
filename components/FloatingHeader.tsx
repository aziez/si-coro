'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlass, Moon, Sun, Heart, X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { SearchPanel, type SearchPanelProps } from './SearchPanel';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FloatingHeaderProps extends SearchPanelProps {
  favoritesCount: number;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  activeSearchLabel: string; // e.g. "Bogor · Subsidi" or ""
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FloatingHeader({
  favoritesCount,
  showFavoritesOnly,
  onToggleFavorites,
  activeSearchLabel,
  ...searchPanelProps
}: FloatingHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      // Ignore clicks inside UI portals (like the Select dropdowns from Base UI / Radix)
      if (
        target.closest('[role="listbox"]') || 
        target.closest('[data-slot^="select-"]') ||
        target.closest('[data-radix-popper-content-wrapper]') ||
        target.closest('[data-radix-select-content]')
      ) {
        return;
      }
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close panel on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const hasActiveSearch = Boolean(activeSearchLabel);

  // Wrap search to also close panel
  const handleSearch = (e?: React.FormEvent) => {
    searchPanelProps.onSearch(e);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="fixed top-0 inset-x-0 z-50">
      {/* ── Main Header Bar ─────────────────────────────────── */}
      <header className="glass-header border-b border-border/50 h-14 flex items-center px-4 gap-3">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 select-none">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm shadow-primary/25">
            <MagnifyingGlass weight="bold" className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-teal-500 hidden sm:block">
            Si-Coro
          </span>
        </div>

        {/* Search Pill (center, expandable) */}
        <button
          aria-label="Buka form pencarian"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(v => !v)}
          className={cn(
            'flex-1 max-w-2xl mx-auto h-9 flex items-center gap-2.5 px-3.5 rounded-full border text-sm transition-all duration-200 cursor-pointer',
            isOpen
              ? 'bg-background border-primary/60 ring-2 ring-primary/20 shadow-sm'
              : 'bg-muted/70 border-border/60 hover:border-border hover:bg-muted'
          )}
        >
          <MagnifyingGlass
            weight={isOpen ? 'bold' : 'regular'}
            className={cn('w-4 h-4 shrink-0 transition-colors', isOpen ? 'text-primary' : 'text-muted-foreground')}
          />
          {hasActiveSearch ? (
            <span className="text-foreground font-medium truncate">{activeSearchLabel}</span>
          ) : (
            <span className="text-muted-foreground truncate">Cari perumahan di seluruh Indonesia...</span>
          )}
          {hasActiveSearch && !isOpen && (
            <Badge variant="secondary" className="ml-auto shrink-0 text-[10px] h-5 px-1.5 font-semibold">
              Aktif
            </Badge>
          )}
          {isOpen && (
            <X weight="bold" className="ml-auto w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Favorites toggle */}
          <Button
            variant={showFavoritesOnly ? 'default' : 'ghost'}
            size="icon"
            className="relative rounded-full h-9 w-9"
            onClick={onToggleFavorites}
            title={showFavoritesOnly ? 'Kembali ke Pencarian' : `Favorit (${favoritesCount})`}
          >
            <Heart weight={showFavoritesOnly ? 'fill' : 'regular'} className="w-4 h-4" />
            {favoritesCount > 0 && !showFavoritesOnly && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none pointer-events-none">
                {favoritesCount > 99 ? '99+' : favoritesCount}
              </span>
            )}
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-9 w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Ganti tema"
          >
            {theme === 'dark'
              ? <Sun weight="fill" className="w-4 h-4" />
              : <Moon weight="fill" className="w-4 h-4" />
            }
          </Button>
        </div>
      </header>

      {/* ── Search Dropdown Panel ───────────────────────────── */}
      {isOpen && (
        <div className="glass-panel border-b border-border/50 shadow-xl animate-in slide-in-from-top-2 fade-in duration-150">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <SearchPanel {...searchPanelProps} onSearch={handleSearch} />
          </div>
        </div>
      )}
    </div>
  );
}
