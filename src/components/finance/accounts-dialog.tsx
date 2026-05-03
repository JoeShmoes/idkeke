

'use client';

import { useState, useEffect } from 'react';
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
import { Trash2 } from 'lucide-react';
import type { Account } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { useApp } from '../layout/app-provider';
import { cn } from '@/lib/utils';

interface AccountsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  accounts: Account[];
  onSave: (accounts: Account[]) => void;
}

export default function AccountsDialog({ isOpen, onOpenChange, accounts, onSave }: AccountsDialogProps) {
    const { appSettings } = useApp();
    const [localAccounts, setLocalAccounts] = useState<Account[]>([]);
    
    useEffect(() => {
        if(isOpen) {
            setLocalAccounts(JSON.parse(JSON.stringify(accounts))); // Deep copy
        }
    }, [isOpen, accounts]);

    const handleAddAccount = () => {
        const newAccount: Account = {
            id: `acc-${Date.now()}`,
            name: 'New Account',
            balance: 0,
            type: 'checking',
        };
        setLocalAccounts(prev => [...prev, newAccount]);
    };

    const handleUpdateAccount = (id: string, field: keyof Account, value: string | number) => {
        setLocalAccounts(prev => prev.map(acc => 
            acc.id === id ? { ...acc, [field]: value } : acc
        ));
    };

    const handleDeleteAccount = (id: string) => {
        setLocalAccounts(prev => prev.filter(acc => acc.id !== id));
    };
    
    const handleSaveChanges = () => {
        onSave(localAccounts);
        onOpenChange(false);
    }
    
    const privacyClass = appSettings.finance.privacyMode ? 'blur' : '';


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[90vw] w-[600px] max-h-[calc(100dvh-50px)] rounded-[48px] px-8 pt-12 pb-10 border border-white/10 bg-[#0F0F0F] text-white shadow-2xl flex flex-col gap-8 overflow-hidden z-[300]">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/10" />
            
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-4xl font-black italic uppercase tracking-tighter text-white">
                Asset Nodes
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-white/60">
                Configure your financial stack
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 -mx-4 px-4 scrollbar-none">
              <div className="space-y-6 pb-6">
                {localAccounts.map(account => (
                  <div key={account.id} className="flex flex-col gap-4 p-6 rounded-[32px] bg-white/5 border border-white/5 relative group transition-all hover:bg-white/[0.08]">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-2">Node Name</Label>
                        <Input 
                          value={account.name}
                          onChange={e => handleUpdateAccount(account.id, 'name', e.target.value)}
                          placeholder="e.g. Primary Checking"
                          className="h-12 rounded-2xl bg-black/40 border-none px-4 font-bold text-white transition-all focus:bg-black/60"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-2">Node Type</Label>
                        <Select value={account.type} onValueChange={(v: any) => handleUpdateAccount(account.id, 'type', v)}>
                          <SelectTrigger className="h-12 rounded-2xl bg-black/40 border-none px-4 font-bold text-white transition-all hover:bg-black/60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-white/10 bg-[#1A1A1A] text-white">
                            <SelectItem value="checking" className="rounded-xl">Checking</SelectItem>
                            <SelectItem value="savings" className="rounded-xl">Savings</SelectItem>
                            <SelectItem value="investment" className="rounded-xl">Investment</SelectItem>
                            <SelectItem value="credit" className="rounded-xl">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-end gap-4">
                      <div className="flex-1 space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-2">Current Liquidity</Label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black opacity-20">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={account.balance}
                            onChange={e => handleUpdateAccount(account.id, 'balance', parseFloat(e.target.value) || 0)}
                            className={cn("h-12 rounded-2xl bg-black/40 border-none pl-8 pr-4 font-black text-white transition-all focus:bg-black/60", privacyClass)}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAccount(account.id)}
                        className="h-12 w-12 rounded-2xl text-white/20 hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button 
                  onClick={handleAddAccount}
                  className="w-full h-16 rounded-[28px] bg-white/5 border-2 border-dashed border-white/10 text-white/40 font-bold hover:bg-white/10 hover:border-white/20 transition-all gap-3"
                >
                  Deploy New Node
                </Button>
              </div>
            </ScrollArea>

            <DialogFooter className="pt-6 gap-4 sm:flex-row flex-col">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-20 flex-1 rounded-[32px] font-bold text-white/40 hover:text-white hover:bg-white/5">
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} className="h-20 flex-[2.5] rounded-[32px] font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 gap-3 active:scale-95 transition-transform">
                Commit Assets
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    );
}
