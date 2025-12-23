
'use client';

import { useMemo } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
    'not-started': 'hsl(var(--chart-3))',
    'in-progress': 'hsl(var(--chart-2))',
    'completed': 'hsl(var(--chart-1))',
};

const statusLabels: Record<string, string> = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'completed': 'Completed',
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
            <p className="font-medium">{statusLabels[data.name]}: {data.value}</p>
        </div>
      );
    }
    return null;
  };

export default function ProjectsPieChart() {
    const { projects } = useApp();

    const data = useMemo(() => {
        const counts = projects.reduce((acc, project) => {
            acc[project.status] = (acc[project.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [projects]);

    return (
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(value) => statusLabels[value]} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
