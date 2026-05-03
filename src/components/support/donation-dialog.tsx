'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import GoogleAdBanner from '@/components/shared/google-ad-banner';

const HIDE_KEY = 'donation_hide_forever';
const LAST_KEY = 'donation_last_shown_at';

export default function DonationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  useEffect(() => {
    if (!open) return;
    try {
      localStorage.setItem(LAST_KEY, String(Date.now()));
    } catch {}
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleCoffee = () => {
    try {
      window.open('https://nexarismodule.gumroad.com/coffee', '_blank', 'noopener,noreferrer');
    } catch {}
    handleClose();
  };
  const handleMonthly = () => {
    try {
      window.open('https://nexarismodule.gumroad.com/l/rhyybu?_gl=1*1codf41*_ga*NTIyMzc0NjQwLjE3NjU0NzM3NDY.*_ga_6LJN6D94N6*czE3NjY0NDA3MjEkbzE4JGcwJHQxNzY2NDQwNzIxJGo2MCRsMCRoMA..', '_blank', 'noopener,noreferrer');
    } catch {}
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="pt-2">
            <GoogleAdBanner 
                adSlot="8273615243" 
                adFormat="auto" 
                className="w-full h-40 mb-4 rounded-lg overflow-hidden border bg-muted/50 flex items-center justify-center text-[10px] text-muted-foreground"
            />
        </div>
        <DialogHeader>
          <DialogTitle>Support Nexaris Module</DialogTitle>
          <DialogDescription>
            Nexaris Module is free and supported by voluntary donations. If the app helps you, consider contributing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCoffee}>Buy us a coffee</Button>
            <Button className="flex-1" onClick={handleMonthly}>Monthly support</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
