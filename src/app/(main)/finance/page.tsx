
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useApp } from '@/components/layout/app-provider';
import KpiCard from '@/components/dashboard/kpi-card';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionsTable } from '@/components/finance/transactions-table';
import AddTransactionDialog from '@/components/finance/add-transaction-dialog';
import AccountsDialog from '@/components/finance/accounts-dialog';
import type { Transaction, Account } from '@/lib/types';
import InitialBalanceDialog from '@/components/finance/initial-balance-dialog';
import { cn } from '@/lib/utils';

export default function FinancePage() {
    const { accounts, transactions, setAccounts, setTransactions, appSettings, ...appData } = useApp();
    const [isClient, setIsClient] = useState(false);
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
    const [isAccountsOpen, setIsAccountsOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | undefined>(undefined);
    const [isInitialBalanceOpen, setIsInitialBalanceOpen] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if(isClient && accounts.length === 0){
            setIsInitialBalanceOpen(true);
        }
    }, [isClient, accounts]);

    const netWorth = useMemo(() => accounts.reduce((sum, acc) => {
        if (acc.type === 'credit') {
            return sum - acc.balance;
        }
        return sum + acc.balance;
    }, 0), [accounts]);

    const { monthlyIncome, monthlyExpenses } = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return transactions.reduce((acc, t) => {
            const transactionDate = new Date(t.date);
            if (transactionDate >= startOfMonth) {
                if(t.type === 'income') acc.monthlyIncome += t.amount;
                else acc.monthlyExpenses += t.amount;
            }
            return acc;
        }, { monthlyIncome: 0, monthlyExpenses: 0 });
    }, [transactions]);
    
    const handleAddOrUpdateTransaction = (transactionData: Omit<Transaction, 'id'>) => {
        if (transactionToEdit) {
            // Editing existing transaction
            const originalTransaction = transactions.find(t => t.id === transactionToEdit.id);
            if (!originalTransaction) return;
            
            // 1. Update transactions list
            const newTransactions = transactions.map(t => 
                t.id === transactionToEdit.id ? { ...transactionToEdit, ...transactionData } : t
            );
            setTransactions(newTransactions);

            // 2. Update account balances
            const amountDifference = transactionData.amount - originalTransaction.amount;
            const typeChanged = transactionData.type !== originalTransaction.type;
            const accountChanged = transactionData.accountId !== originalTransaction.accountId;

            setAccounts(prevAccounts => {
                let updatedAccounts = [...prevAccounts];

                if(accountChanged) {
                    // Revert old transaction on old account
                    const oldAccount = updatedAccounts.find(a => a.id === originalTransaction.accountId);
                    if(oldAccount) {
                         const oldAccountIndex = updatedAccounts.findIndex(a => a.id === oldAccount.id);
                         updatedAccounts[oldAccountIndex] = { ...oldAccount, balance: oldAccount.balance + (originalTransaction.type === 'income' ? -originalTransaction.amount : originalTransaction.amount) };
                    }
                     // Apply new transaction on new account
                    const newAccount = updatedAccounts.find(a => a.id === transactionData.accountId);
                    if(newAccount) {
                        const newAccountIndex = updatedAccounts.findIndex(a => a.id === newAccount.id);
                        updatedAccounts[newAccountIndex] = { ...newAccount, balance: newAccount.balance + (transactionData.type === 'income' ? transactionData.amount : -transactionData.amount) };
                    }

                } else {
                    const account = updatedAccounts.find(a => a.id === transactionData.accountId);
                    if (account) {
                        let newBalance = account.balance;
                        // Revert old
                        newBalance += (originalTransaction.type === 'income' ? -originalTransaction.amount : originalTransaction.amount);
                        // Apply new
                        newBalance += (transactionData.type === 'income' ? transactionData.amount : -transactionData.amount);
                        
                        const accountIndex = updatedAccounts.findIndex(a => a.id === account.id);
                        updatedAccounts[accountIndex] = {...account, balance: newBalance};
                    }
                }
                return updatedAccounts;
            });

        } else {
            // Adding new transaction
            const newTransaction: Transaction = { ...transactionData, id: `trans-${Date.now()}` };
            setTransactions(prev => [newTransaction, ...prev]);
            
            setAccounts(prevAccounts => prevAccounts.map(acc => {
                if (acc.id === newTransaction.accountId) {
                    const newBalance = newTransaction.type === 'income' 
                        ? acc.balance + newTransaction.amount 
                        : acc.balance - newTransaction.amount;
                    return { ...acc, balance: newBalance };
                }
                return acc;
            }));
        }
    }
    
    const handleEditTransaction = (transaction: Transaction) => {
        setTransactionToEdit(transaction);
        setIsAddTransactionOpen(true);
    }
    
    const handleOpenAddDialog = () => {
        setTransactionToEdit(undefined);
        setIsAddTransactionOpen(true);
    }
    
    const handleDeleteTransaction = (transactionId: string) => {
        const transactionToDelete = transactions.find(t => t.id === transactionId);
        if(!transactionToDelete) return;

        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        
        setAccounts(prevAccounts => prevAccounts.map(acc => {
            if (acc.id === transactionToDelete.accountId) {
                const newBalance = transactionToDelete.type === 'income' 
                    ? acc.balance - transactionToDelete.amount 
                    : acc.balance + transactionToDelete.amount;
                return { ...acc, balance: newBalance };
            }
            return acc;
        }));
    }

    const handleSetInitialAccount = (account: Omit<Account, 'id'>) => {
        const newAccount: Account = { ...account, id: `acc-${Date.now()}`};
        setAccounts([newAccount]);
        setIsInitialBalanceOpen(false);
    }
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    const privacyClass = appSettings.finance.privacyMode ? 'blur' : '';

    if (!isClient) {
        return (
          <div className="space-y-6">
              <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
              </div>
              <Skeleton className="h-96" />
          </div>
        )
    }

    return (
        <>
            <div className="space-y-6">
                <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <KpiCard title="Net Worth" icon={DollarSign} value={formatCurrency(netWorth)} className={cn('bg-card/50', privacyClass)} />
                    <KpiCard title="Monthly Income" icon={TrendingUp} value={formatCurrency(monthlyIncome)} className={cn('bg-card/50', privacyClass)} />
                    <KpiCard title="Monthly Expenses" icon={TrendingDown} value={formatCurrency(monthlyExpenses)} className={cn('bg-card/50', privacyClass)} />
                </div>
                
                <div className="flex justify-center">
                    <div className="w-full lg:w-4/5">
                        <Card className="bg-card/50">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Recent Transactions</CardTitle>
                                    <CardDescription>A log of your most recent income and expenses.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsAccountsOpen(true)}>
                                        <Wallet className="mr-2 h-4 w-4" />
                                        Manage Accounts
                                    </Button>
                                    <Button size="sm" onClick={handleOpenAddDialog}>
                                        Add Transaction
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <TransactionsTable 
                                    transactions={transactions}
                                    onEdit={handleEditTransaction}
                                    onDelete={handleDeleteTransaction}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            
            <AddTransactionDialog 
                isOpen={isAddTransactionOpen}
                onOpenChange={setIsAddTransactionOpen}
                onSave={handleAddOrUpdateTransaction}
                accounts={accounts}
                transactionToEdit={transactionToEdit}
            />
            <AccountsDialog
                isOpen={isAccountsOpen}
                onOpenChange={setIsAccountsOpen}
                accounts={accounts}
                onSave={setAccounts}
            />
            <InitialBalanceDialog
                isOpen={isInitialBalanceOpen}
                onSave={handleSetInitialAccount}
                onOpenChange={setIsInitialBalanceOpen}
            />
        </>
    )
}
