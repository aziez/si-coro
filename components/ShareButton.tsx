'use client';

import React, { useState } from 'react';
import { ShareNetwork, Copy, WhatsappLogo, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface ShareButtonProps {
  title: string;
  text: string;
}

export default function ShareButton({ title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title,
      text,
      url,
    };

    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      setShowOptions(!showOptions);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowOptions(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const shareToWhatsApp = () => {
    const url = window.location.href;
    const waText = encodeURIComponent(`${text}\n\nCek rumah ini di Si-Coro: ${url}`);
    window.open(`https://wa.me/?text=${waText}`, '_blank');
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <Button 
        onClick={handleShare}
        variant="outline"
        className="rounded-full shadow-sm bg-background border-border hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
      >
        <ShareNetwork weight="duotone" className="w-5 h-5" />
        <span className="hidden sm:inline">Bagikan</span>
      </Button>

      {showOptions && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/50 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <button 
            onClick={shareToWhatsApp}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold rounded-xl hover:bg-green-500/10 text-green-600 dark:text-green-400 transition-colors"
          >
            <WhatsappLogo weight="fill" className="w-5 h-5" />
            Bagikan ke WhatsApp
          </button>
          
          <div className="h-px bg-border my-1"></div>
          
          <button 
            onClick={copyToClipboard}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold rounded-xl hover:bg-muted transition-colors text-foreground"
          >
            {copied ? (
              <CheckCircle weight="fill" className="w-5 h-5 text-primary" />
            ) : (
              <Copy weight="duotone" className="w-5 h-5 text-muted-foreground" />
            )}
            {copied ? 'Tautan Disalin!' : 'Salin Tautan'}
          </button>
        </div>
      )}
    </div>
  );
}
