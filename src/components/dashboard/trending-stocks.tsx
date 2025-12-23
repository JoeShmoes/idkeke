
'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Stock {
    ticker: string;
    price: string;
    change_percentage: string;
}

const sampleStocks: Stock[] = [
    { ticker: 'AAPL', price: '169.30', change_percentage: '+1.47%' },
    { ticker: 'MSFT', price: '420.72', change_percentage: '+2.44%' },
    { ticker: 'GOOGL', price: '165.71', change_percentage: '+0.55%' },
    { ticker: 'QQQ', price: '433.86', change_percentage: '+1.04%' },
    { ticker: 'SPY', price: '508.12', change_percentage: '+0.81%' },
];

export default function TrendingStocks() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setStocks(sampleStocks);
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {stocks.map(stock => {
                    const isPositive = stock.change_percentage.startsWith('+');
                    return (
                        <TableRow key={stock.ticker}>
                            <TableCell className="font-medium">{stock.ticker}</TableCell>
                            <TableCell>{stock.price}</TableCell>
                            <TableCell className={cn("text-right font-medium flex items-center justify-end gap-1", isPositive ? 'text-green-500' : 'text-red-500')}>
                                {isPositive ? <ArrowUp className="h-4 w-4"/> : <ArrowDown className="h-4 w-4"/>}
                                {stock.change_percentage.replace('+', '')}
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    )
}
