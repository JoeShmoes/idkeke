
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LayoutTemplate, Bot, ClipboardCheck, Briefcase } from "lucide-react";
import { perks } from '../perks';
import { useApp } from '@/components/layout/app-provider';
import { useMemo } from 'react';
import { allAchievements } from '@/lib/achievements';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TemplateBuilderPage() {
    const { tasks, clients, projects, accounts, notes, assets, learningResources, networkContacts } = useApp();
    const projectTemplatesUnlocked = useMemo(() => {
        const { level } = perks.find(p => p.title.includes('Project Templates')) || { level: 999 };
        let points = 0;
        allAchievements.forEach(ach => {
            let isUnlocked = false;
            switch (ach.category) {
                case 'tasks': isUnlocked = tasks.filter(t => t.completed).length >= ach.threshold; break;
                case 'clients': isUnlocked = clients.length >= ach.threshold; break;
                case 'projects': isUnlocked = projects.filter(p => p.status === 'completed').length >= ach.threshold; break;
                case 'finance': isUnlocked = accounts.reduce((sum, acc) => acc.type === 'credit' ? sum - acc.balance : sum + acc.balance, 0) >= ach.threshold; break;
                case 'notes': isUnlocked = notes.length >= ach.threshold; break;
                case 'assets': isUnlocked = assets.reduce((sum, asset) => sum + asset.value, 0) >= ach.threshold; break;
                case 'learning': isUnlocked = learningResources.filter(r => r.status === 'completed').length >= ach.threshold; break;
                case 'networking': isUnlocked = networkContacts.length >= ach.threshold; break;
            }
            if (isUnlocked) points += ach.points;
        });

        let currentLevel = 1;
        const levelThresholds = [ 0, 50, 125, 250, 500, 1000, 2000, 4000, 8000, 15000, 25000, 50000, 75000, 100000, 130000, 165000, 205000, 250000, 300000, 355000, 415000, 480000, 550000, 625000, 705000, 800000, 900000, 1000000, 1150000, 1300000, 1500000, 1750000, 2000000, 2300000, 2600000, 2950000, 3300000, 3700000, 4100000, 4500000, 5000000, 5500000, 6000000, 6500000, 7000000, 7500000, 8000000, 8500000, 9000000, 9500000, 10000000 ];
        while (currentLevel < levelThresholds.length && points >= levelThresholds[currentLevel]) currentLevel++;

        return currentLevel >= level;
    }, [tasks, clients, projects, accounts, notes, assets, learningResources, networkContacts]);

    if (!projectTemplatesUnlocked) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <LayoutTemplate className="h-16 w-16 text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold">Unlock Project Templates</h1>
                <p className="text-muted-foreground mt-2 max-w-md">This feature is unlocked at Level 30. Complete more tasks, projects, and goals to gain experience and level up!</p>
                <Button asChild className="mt-6">
                    <Link href="/growth-hub">View Progress</Link>
                </Button>
            </div>
        );
    }
  
  return (
    <div className="space-y-8">
        <div className="text-center">
            <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground" />
            <h1 className="text-3xl font-bold mt-2">Template Builder</h1>
            <p className="text-muted-foreground">Create reusable templates for your common workflows.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ClipboardCheck /> Project Templates</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription>Define a standard set of tasks, statuses, and links for different types of projects to onboard them instantly.</CardDescription>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Briefcase /> Client Onboarding</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription>Create a checklist of tasks and required documents for onboarding new clients smoothly and consistently.</CardDescription>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot /> AI-Powered Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription>Let Alfred analyze your existing projects and suggest new templates based on recurring patterns.</CardDescription>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
