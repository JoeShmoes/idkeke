
'use client';

import { useMemo, useState, useCallback } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(221, 83%, 63%)',
    'hsl(197, 37%, 34%)',
];

const CustomTooltip = ({ active, payload, privacyMode }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
      const privacyClass = privacyMode ? 'blur-md select-none' : '';
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
            <p className={cn("font-medium", privacyClass)}>{data.name}: {formatCurrency(data.value)}</p>
        </div>
      );
    }
    return null;
};


export default function SpendingCategoryChart({className}: {className?: string}) {
    const { transactions, appSettings } = useApp();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const onPieEnter = useCallback((_: any, index: number) => {
        setActiveIndex(index);
    }, [setActiveIndex]);
    
    const onPieLeave = useCallback(() => {
        setActiveIndex(null);
    }, [setActiveIndex]);

    const data = useMemo(() => {
        const categorySpending = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, transaction) => {
                const category = transaction.category || 'Uncategorized';
                acc[category] = (acc[category] || 0) + transaction.amount;
                return acc;
            }, {} as Record<string, number>);

        return Object.entries(categorySpending)
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value);

    }, [transactions]);

    if (data.length === 0) {
        return (
            <div className={cn("flex items-center justify-center h-80 text-muted-foreground", className)}>
                No expense data to display.
            </div>
        )
    }

    return (
        <div className={cn("h-80", className)}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                     <Tooltip content={<CustomTooltip privacyMode={appSettings.finance.privacyMode} />} />
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        innerRadius={60}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                        nameKey="name"
                        onMouseEnter={onPieEnter}
                        onMouseLeave={onPieLeave}
                        paddingAngle={5}
                    >
                         {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[index % COLORS.length]} 
                                stroke={activeIndex === index ? 'hsl(var(--foreground))' : 'hsl(var(--card))'}
                                style={{
                                    transform: activeIndex === index ? 'scale(1.1)' : 'scale(1)',
                                    transformOrigin: 'center center',
                                    transition: 'transform 0.4s ease-in-out',
                                }}
                            />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
