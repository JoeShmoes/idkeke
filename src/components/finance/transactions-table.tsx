

'use client';

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Transaction } from '@/lib/types';
import { useApp } from '../layout/app-provider';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TransactionsTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
}

export function TransactionsTable({ transactions, onEdit, onDelete }: TransactionsTableProps) {
  const { accounts, appSettings } = useApp();

  const accountMap = useMemo(() => new Map(accounts.map(acc => [acc.id, acc.name])), [accounts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: appSettings.finance.defaultCurrency }).format(amount);
  }

  const privacyClass = appSettings.finance.privacyMode ? 'blur' : '';

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length > 0 ? transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
            <TableCell className="font-medium">{transaction.description}</TableCell>
            <TableCell>{accountMap.get(transaction.accountId) || 'N/A'}</TableCell>
            <TableCell>
                <Badge variant="outline">{transaction.category}</Badge>
            </TableCell>
            <TableCell className={cn("text-right font-semibold", transaction.type === 'income' ? 'text-green-500' : 'text-destructive', privacyClass)}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
            </TableCell>
            <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(transaction)}>
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(transaction.id)}>
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                    No transactions yet.
                </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
