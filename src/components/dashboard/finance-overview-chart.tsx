
'use client';

import { useApp } from '@/components/layout/app-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { eachDayOfInterval, subDays, format, isSameDay, startOfDay } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const CustomTooltip = ({ active, payload, label, privacyMode }: any) => {
    if (active && payload && payload.length) {
      const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
      const privacyClass = privacyMode ? 'blur-md select-none' : '';
      return (
        <div className="rounded-lg border bg-card p-3 shadow-lg animate-in fade-in-0 zoom-in-95">
          <p className="mb-2 text-sm font-medium">{label}</p>
          <div className="grid gap-1">
            {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground capitalize">{entry.name}:</span>
                    <span className={cn("font-mono font-medium", privacyClass)}>{formatCurrency(entry.value)}</span>
                </div>
            ))}
          </div>
        </div>
      );
    }
  
    return null;
  };

export default function FinanceOverviewChart() {
    const { transactions, appSettings } = useApp();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const privacyClass = appSettings.finance.privacyMode ? 'blur-md select-none' : '';

    const { data, totalIncome, totalExpense, netSavings } = useMemo(() => {
        const today = startOfDay(new Date());
        // Show last 6 months for "Full App Overview"
        const startPeriod = subDays(today, 180); 
        
        const dateInterval = eachDayOfInterval({ start: startPeriod, end: today });
        
        let incomeSum = 0;
        let expenseSum = 0;

        const chartData = dateInterval.map(date => {
            const dayTransactions = transactions.filter(t => isSameDay(new Date(t.date), date));
            
            const dayIncome = dayTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            
            const dayExpense = dayTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            incomeSum += dayIncome;
            expenseSum += dayExpense;
            
            return {
                name: format(date, 'MMM d'),
                fullDate: format(date, 'MMM dd, yyyy'),
                income: dayIncome,
                expense: dayExpense
            };
        });

        return { 
            data: chartData, 
            totalIncome: incomeSum, 
            totalExpense: expenseSum,
            netSavings: incomeSum - expenseSum
        };

    }, [transactions]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    }

    if (!isClient) return null;

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex-none flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div>
                        <h3 className="text-base font-medium">Financial Activity</h3>
                        <p className="text-xs text-muted-foreground">Income vs Expense Trend (Last 6 Months)</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-5 text-[9px] px-2" asChild>
                        <Link href="/budgeting">
                            View Budgeting
                            <ArrowRight className="w-2.5 h-2.5 ml-1.5" />
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-[10px]">Total Income</span>
                        <span className={cn("font-bold text-emerald-500", privacyClass)}>{formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="hidden sm:block h-8 w-px bg-border" />
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-[10px]">Total Expenses</span>
                        <span className={cn("font-bold text-red-500", privacyClass)}>{formatCurrency(totalExpense)}</span>
                    </div>
                    <div className="hidden sm:block h-8 w-px bg-border" />
                    <div className="flex flex-col items-end">
                        <span className="text-muted-foreground text-[10px]">Net Savings</span>
                        <span className={cn("font-bold", netSavings >= 0 ? "text-blue-500" : "text-orange-500", privacyClass)}>
                            {netSavings > 0 ? '+' : ''}{formatCurrency(netSavings)}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                        <XAxis 
                            dataKey="name" 
                            stroke="hsl(var(--muted-foreground))" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            minTickGap={30}
                        />
                        <YAxis 
                            stroke="hsl(var(--muted-foreground))" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                            tickFormatter={(value) => `$${new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)}`} 
                        />
                        <Tooltip content={<CustomTooltip privacyMode={appSettings.finance.privacyMode} />} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area 
                            type="monotone" 
                            dataKey="income" 
                            name="Income" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill="url(#colorIncome)" 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="expense" 
                            name="Expenses" 
                            stroke="#ef4444" 
                            strokeWidth={2} 
                            fillOpacity={1} 
                            fill="url(#colorExpense)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
