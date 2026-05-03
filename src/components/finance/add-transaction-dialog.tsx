
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Transaction, Account, TransactionType } from '@/lib/types';


const commonCategories = {
    expense: ['Food', 'Transport', 'Utilities', 'Housing', 'Entertainment', 'Shopping', 'Health', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
}

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  accounts: Account[];
  transactionToEdit?: Transaction;
}

export default function AddTransactionDialog({ isOpen, onOpenChange, onSave, accounts, transactionToEdit }: AddTransactionDialogProps) {
    const [type, setType] = useState<TransactionType>('expense');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [accountId, setAccountId] = useState<string>('');
    const [category, setCategory] = useState('');
    
    useEffect(() => {
        if (isOpen) {
            if (transactionToEdit) {
                setType(transactionToEdit.type);
                setDescription(transactionToEdit.description);
                setAmount(String(transactionToEdit.amount));
                setDate(new Date(transactionToEdit.date));
                setAccountId(transactionToEdit.accountId);
                setCategory(transactionToEdit.category);
            } else {
                setType('expense');
                setDescription('');
                setAmount('');
                setDate(new Date());
                setAccountId(accounts.length > 0 ? accounts[0].id : '');
                setCategory('');
            }
        }
    }, [transactionToEdit, isOpen, accounts]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim() || !amount || !date || !accountId || !category) return;
        
        onSave({ 
            description, 
            amount: parseFloat(amount),
            type,
            date: date.toISOString(),
            accountId,
            category,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[90vw] w-[440px] max-h-[calc(100dvh-50px)] rounded-[48px] px-6 pt-10 pb-8 sm:px-8 sm:pt-12 sm:pb-10 border border-white/10 bg-[#0F0F0F] text-white shadow-2xl flex flex-col gap-6 sm:gap-8 overflow-hidden z-[300]">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/10" />
            
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white">
                {transactionToEdit ? 'Edit Record' : 'New Entry'}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-white/60">
                Track your flow
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8 overflow-hidden">
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-8 sm:space-y-10 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    {(['expense', 'income'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={cn(
                          "h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2",
                          type === t 
                            ? "bg-white text-black border-white shadow-2xl shadow-white/10" 
                            : "bg-white/5 border-transparent opacity-30 hover:opacity-100 hover:bg-white/10"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Description</Label>
                    <Input 
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                      placeholder="What was this for?" 
                      className="h-16 sm:h-20 rounded-[32px] text-lg sm:text-2xl font-bold bg-white/5 border-2 border-transparent focus:border-indigo-500/50 px-8 transition-all text-white placeholder:text-white/20"
                      autoFocus 
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-lg sm:text-2xl font-black opacity-20">$</span>
                      <Input 
                        type="number"
                        step="0.01"
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        placeholder="0.00" 
                        className="h-16 sm:h-20 rounded-[32px] text-xl sm:text-3xl font-black bg-white/5 border-2 border-transparent focus:border-indigo-500/50 pl-14 pr-8 transition-all text-white placeholder:text-white/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Account</Label>
                      <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger className="h-14 sm:h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white">
                          <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[32px] border-white/10 bg-[#1A1A1A] text-white">
                          {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id} className="rounded-2xl py-4">{acc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("h-14 sm:h-16 w-full rounded-[28px] bg-white/5 border-none px-6 flex items-center justify-between font-bold text-white", !date && "opacity-40")}>
                            {date ? format(date, "MMM d") : "Today"}
                            <CalendarIcon className="h-5 w-5 opacity-30" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-[40px] overflow-hidden border-white/10 bg-[#1A1A1A] shadow-2xl" align="end">
                          <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-6 bg-[#1A1A1A] text-white" />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 ml-2">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-14 sm:h-16 rounded-[28px] bg-white/5 border-none px-6 font-bold text-white transition-all hover:bg-white/10">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-[32px] border-white/10 bg-[#1A1A1A] text-white">
                        {commonCategories[type].map(cat => (
                          <SelectItem key={cat} value={cat} className="rounded-2xl py-4">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </ScrollArea>

              <DialogFooter className="pt-4 sm:pt-6 gap-4 sm:flex-row flex-col">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-16 sm:h-20 flex-1 rounded-[32px] font-bold text-white/40 hover:text-white hover:bg-white/5">
                  Cancel
                </Button>
                <Button type="submit" className="h-16 sm:h-20 flex-[2.5] rounded-[32px] font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 gap-3 active:scale-95 transition-transform">
                  {transactionToEdit ? 'Update' : 'Commit'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
}
