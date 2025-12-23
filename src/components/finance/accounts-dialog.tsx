

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
          <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Manage Accounts</DialogTitle>
                <DialogDescription>
                  Add, edit, or remove your financial accounts.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] -mx-6 px-6">
                <div className="space-y-4 py-4">
                    {localAccounts.map(account => (
                        <div key={account.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4">
                                <Label htmlFor={`name-${account.id}`} className="sr-only">Name</Label>
                                <Input 
                                    id={`name-${account.id}`}
                                    value={account.name}
                                    onChange={e => handleUpdateAccount(account.id, 'name', e.target.value)}
                                    placeholder="Account Name"
                                />
                            </div>
                            <div className="col-span-3">
                                <Label htmlFor={`balance-${account.id}`} className="sr-only">Balance</Label>
                                <Input
                                    id={`balance-${account.id}`}
                                    type="number"
                                    value={account.balance}
                                    onChange={e => handleUpdateAccount(account.id, 'balance', parseFloat(e.target.value) || 0)}
                                    placeholder="Balance"
                                    className={privacyClass}
                                />
                            </div>
                            <div className="col-span-4">
                                <Label htmlFor={`type-${account.id}`} className="sr-only">Type</Label>
                                <Select 
                                    value={account.type}
                                    onValueChange={(value: Account['type']) => handleUpdateAccount(account.id, 'type', value)}
                                >
                                    <SelectTrigger id={`type-${account.id}`}>
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="checking">Checking</SelectItem>
                                        <SelectItem value="savings">Savings</SelectItem>
                                        <SelectItem value="investment">Investment</SelectItem>
                                        <SelectItem value="credit">Credit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteAccount(account.id)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={handleAddAccount}>
                        Add New Account
                    </Button>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="button" onClick={handleSaveChanges}>Save Changes</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
    );
}
