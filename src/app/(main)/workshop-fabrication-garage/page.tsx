
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, Drill, Printer, Lock, CheckCircle, Zap, Package, Hammer, Plus, CircleDotDashed } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/components/layout/app-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, string> = {
    'in-progress': 'bg-blue-500',
    'completed': 'bg-green-500',
    'not-started': 'bg-gray-500',
}


export default function WorkshopFabricationGaragePage() {
    const { projects, assets, appSettings } = useApp();
    
    const privacyClass = appSettings.finance.privacyMode ? 'blur-md select-none' : '';

    const inventory = assets.filter(asset => asset.category === 'physical');
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Current fabrication and R&D projects from your project board.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {projects.filter(p => p.status !== 'completed').slice(0, 3).map(project => (
                    <div key={project.id} className="border p-4 rounded-lg">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{project.name}</p>
                                <Badge variant="outline" className="mt-1 capitalize">
                                    <div className={`h-2 w-2 rounded-full mr-2 ${statusConfig[project.status]}`}></div>
                                    {project.status.replace('-', ' ')}
                                </Badge>
                            </div>
                         </div>
                         <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
                    </div>
                ))}
                 {projects.filter(p => p.status !== 'completed').length === 0 && (
                    <div className="text-center text-muted-foreground p-4">
                        No active projects.
                    </div>
                 )}
                 <Button asChild variant="outline" className="w-full mt-4">
                    <Link href="/project-board">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Go to Project Board
                    </Link>
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Component Inventory</CardTitle>
                <CardDescription>A live view of physical assets from your Asset Tracker.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Component</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory.length > 0 ? inventory.slice(0, 5).map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className={cn("text-right", privacyClass)}>${item.value.toFixed(2)}</TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={2} className="text-center h-24">No physical assets found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                 <Button asChild variant="outline" className="w-full mt-4">
                    <Link href="/asset-tracker">
                        <Building className="mr-2 h-4 w-4" />
                        Manage Inventory in Asset Tracker
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
