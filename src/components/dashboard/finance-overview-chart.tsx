
'use client';

import { useApp } from '@/components/layout/app-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { eachDayOfInterval, subDays, format, isSameDay, startOfDay } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
      return (
        <div className="rounded-lg border bg-card p-2.5 shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="grid grid-cols-1 gap-x-2 gap-y-1">
             <p className="text-sm font-bold">{formatCurrency(value)}</p>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        </div>
      );
    }
  
    return null;
  };

export default function FinanceOverviewChart() {
    const { transactions, accounts } = useApp();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const { data, netChangeOverall, percentageChange } = useMemo(() => {
        if (accounts.length === 0) {
            return { data: [], netChangeOverall: 0, percentageChange: 0 };
        }
        
        const today = startOfDay(new Date());
        const thirtyDaysAgo = subDays(today, 29);
        
        const initialNetWorth = accounts.reduce((sum, acc) => sum + (acc.type === 'credit' ? -acc.balance : acc.balance), 0);
        
        const transactionsInPeriod = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
        
        let netWorthAtStartOfPeriod = initialNetWorth;
        transactions.filter(t => new Date(t.date) >= thirtyDaysAgo).forEach(t => {
            netWorthAtStartOfPeriod -= (t.type === 'income' ? t.amount : -t.amount);
        });
        
        let runningTotal = netWorthAtStartOfPeriod;
        
        const dateInterval = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
        
        const chartData = dateInterval.map(date => {
            const dayTransactions = transactions.filter(t => isSameDay(new Date(t.date), date));
            const netChangeForDay = dayTransactions.reduce((sum, t) => {
                return sum + (t.type === 'income' ? t.amount : -t.amount);
            }, 0);

            runningTotal += netChangeForDay;
            
            return {
                name: format(date, 'MMM d'),
                netWorth: runningTotal
            };
        });

        const change = chartData.length > 1 ? chartData[chartData.length - 1].netWorth - chartData[0].netWorth : 0;
        const startValue = chartData.length > 1 ? chartData[0].netWorth : 0;
        const percent = startValue !== 0 ? (change / Math.abs(startValue)) * 100 : 0;

        return { data: chartData, netChangeOverall: change, percentageChange: percent };

    }, [transactions, accounts]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }


    return (
        <Card className="bg-background">
            <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
                <CardDescription>
                    <div className="flex items-center gap-2">
                        <span>Net worth over the last 30 days.</span>
                        {isClient && percentageChange !== 0 && (
                            <span className={cn("flex items-center text-sm font-medium", percentageChange >= 0 ? "text-green-500" : "text-red-500")}>
                                {percentageChange >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                                {percentageChange.toFixed(1)}% from last month
                            </span>
                        )}
                    </div>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-72 w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                             <defs>
                                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={netChangeOverall >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"} stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor={netChangeOverall >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"} stopOpacity={0.05}/>
                                </linearGradient>
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} interval="preserveStartEnd" ticks={[data[0]?.name, data[6]?.name, data[13]?.name, data[20]?.name, data[29]?.name].filter(Boolean)} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)}`} domain={['dataMin - (dataMax-dataMin)*0.1', 'dataMax + (dataMax-dataMin)*0.1']}/>
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--foreground))', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                            <Area 
                                type="monotone" 
                                dataKey="netWorth" 
                                name="Net Worth" 
                                stroke={netChangeOverall >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"} 
                                strokeWidth={2} 
                                fill="url(#netWorthGradient)"
                                activeDot={{ 
                                    r: 6,
                                    stroke: 'hsl(var(--background))',
                                    strokeWidth: 2,
                                    fill: netChangeOverall >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
