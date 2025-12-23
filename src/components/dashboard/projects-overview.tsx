
'use client';

import { useApp } from '@/components/layout/app-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '../ui/button';
import { ClipboardCheck, Rocket, CheckCircle, Target } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsOverview() {
    const { projects } = useApp();

    const notStarted = projects.filter(p => p.status === 'not-started').length;
    const inProgress = projects.filter(p => p.status === 'in-progress').length;
    const completed = projects.filter(p => p.status === 'completed').length;

    return (
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle>Projects Overview</CardTitle>
                <CardDescription>A summary of your current projects.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Rocket className="h-5 w-5" />
                            <span>Not Started</span>
                        </div>
                        <span className="font-bold">{notStarted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Target className="h-5 w-5" />
                            <span>In Progress</span>
                        </div>
                        <span className="font-bold">{inProgress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle className="h-5 w-5" />
                            <span>Completed</span>
                        </div>
                        <span className="font-bold">{completed}</span>
                    </div>
                </div>
                 <Button asChild variant="outline" className="w-full mt-6">
                    <Link href="/project-board">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Go to Project Board
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
