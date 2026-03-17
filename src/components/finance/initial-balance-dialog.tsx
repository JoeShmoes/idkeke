
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
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Welcome to the Budgeting Hub!</DialogTitle>
                <DialogDescription>
                  Let's get started by setting up your first account.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="account-name">Account Name</Label>
                    <Input id="account-name" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="account-type">Account Type</Label>
                    <Select value={type} onValueChange={(v: Account['type']) => setType(v)}>
                        <SelectTrigger id="account-type">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="checking">Checking</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="investment">Investment</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="balance">Current Balance</Label>
                    <Input id="balance" type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="e.g. 1500.00" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Get Started</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );
}
