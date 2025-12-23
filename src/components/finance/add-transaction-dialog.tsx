
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
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
                <DialogDescription>
                  Enter the details for your transaction below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={(v: TransactionType) => setType(v)}>
                      <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="expense">Expense</SelectItem>
                          <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="account">Account</Label>
                    <Select value={accountId} onValueChange={setAccountId} required>
                        <SelectTrigger id="account">
                            <SelectValue placeholder="Select an account" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger id="category">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {commonCategories[type].map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">{transactionToEdit ? 'Save Changes' : 'Add Transaction'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
}
