
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Account } from '@/lib/types';

interface InitialBalanceDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (account: Omit<Account, 'id'>) => void;
}

export default function InitialBalanceDialog({ isOpen, onOpenChange, onSave }: InitialBalanceDialogProps) {
    const [name, setName] = useState('Main Account');
    const [balance, setBalance] = useState('');
    const [type, setType] = useState<Account['type']>('checking');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !balance) return;
        
        onSave({ 
            name,
            balance: parseFloat(balance),
            type,
        });
        onOpenChange(false);
    };

    return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[440px] max-h-[calc(100dvh-50px)] rounded-[48px] px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 border border-white/10 bg-[#0F0F0F] text-white shadow-2xl flex flex-col gap-6 sm:gap-8 overflow-hidden z-[300]">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/10" />
        
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
            Genesis Node
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-white/60">
            Initialize your financial intelligence
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8 overflow-hidden">
          <div className="space-y-8 sm:space-y-10 pb-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Node Identifier</Label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Main Operations" 
                className="h-16 sm:h-20 rounded-[32px] text-lg sm:text-2xl font-bold bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 transition-all text-white placeholder:text-white/20"
                autoFocus 
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Initial Liquidity</Label>
              <div className="relative">
                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-lg sm:text-2xl font-black opacity-20">$</span>
                <Input 
                  type="number"
                  step="0.01"
                  value={balance} 
                  onChange={e => setBalance(e.target.value)} 
                  placeholder="0.00" 
                  className="h-16 sm:h-20 rounded-[32px] text-xl sm:text-3xl font-black bg-white/5 border-2 border-transparent focus:border-indigo-500/50 pl-14 pr-8 transition-all text-white placeholder:text-white/10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">System Type</Label>
              <Select value={type} onValueChange={(v: Account['type']) => setType(v)}>
                <SelectTrigger className="h-14 sm:h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white transition-all hover:bg-white/10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-[32px] border-white/10 bg-[#1A1A1A] text-white">
                  <SelectItem value="checking" className="rounded-2xl py-4">Checking</SelectItem>
                  <SelectItem value="savings" className="rounded-2xl py-4">Savings</SelectItem>
                  <SelectItem value="investment" className="rounded-2xl py-4">Investment</SelectItem>
                  <SelectItem value="credit" className="rounded-2xl py-4">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4 sm:pt-6 mt-auto">
            <Button type="submit" className="h-16 sm:h-20 w-full rounded-[32px] font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 gap-3 active:scale-95 transition-transform">
              Initialize System
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
      );
}
