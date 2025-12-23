'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const HIDE_KEY = 'donation_hide_forever';
const LAST_KEY = 'donation_last_shown_at';

export default function DonationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!open) return;
    try {
      localStorage.setItem(LAST_KEY, String(Date.now()));
    } catch {}
  }, [open]);

  const handleClose = () => {
    try {
      if (dontShowAgain) localStorage.setItem(HIDE_KEY, 'true');
    } catch {}
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
        <DialogHeader>
          <DialogTitle>Support Nexaris Module</DialogTitle>
          <DialogDescription>
            Nexaris Module is free and supported by voluntary donations. If the app helps you, consider contributing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              id="dont-show"
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <label htmlFor="dont-show" className="text-sm">Don’t show this again</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleClose}>Not now</Button>
            <Button variant="outline" onClick={handleCoffee}>Buy us a coffee</Button>
            <Button onClick={handleMonthly}>Monthly support</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
