
'use client';

import { useApp } from '@/components/layout/app-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckSquare, AlertTriangle, CalendarClock } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { isBefore, startOfToday } from 'date-fns';

export default function TasksSummary() {
    const { tasks } = useApp();

    const today = startOfToday();
    const upcomingTasks = tasks.filter(t => !t.completed && (!t.dueDate || !isBefore(new Date(t.dueDate), today))).length;
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && isBefore(new Date(t.dueDate), today)).length;
    
    return (
        <Card className="bg-card/50 backdrop-blur-lg shadow-lg border-t-white/20 border-l-white/20 dark:border-white/10">
            <CardHeader>
                <CardTitle>Tasks Summary</CardTitle>
                <CardDescription>Your current task load.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarClock className="h-5 w-5" />
                            <span>Upcoming</span>
                        </div>
                        <span className="font-bold">{upcomingTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <AlertTriangle className="h-5 w-5" />
                            <span>Overdue</span>
                        </div>
                        <span className="font-bold">{overdueTasks}</span>
                    </div>
                </div>
                <Button asChild variant="outline" className="w-full mt-6">
                    <Link href="/tasks">
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Go to Tasks Room
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
