
'use client';

import { useApp } from '@/components/layout/app-provider';
import KpiCard from '@/components/dashboard/kpi-card';
import { Users, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const projectStatusConfig: Record<string, { label: string; color: string }> = {
    'not-started': { label: 'Not Started', color: 'bg-gray-500' },
    'in-progress': { label: 'In Progress', color: 'bg-blue-500' },
    'completed': { label: 'Completed', color: 'bg-green-500' },
};

const clientStatusConfig: Record<string, { label: string; color: string }> = {
    'lead': { label: 'Lead', color: 'bg-yellow-500' },
    'active': { label: 'Active', color: 'bg-green-500' },
    'inactive': { label: 'Inactive', color: 'bg-gray-500' },
};


export default function BusinessPage() {
  const { clients, projects } = useApp();

  const activeProjects = projects.filter(p => p.status === 'in-progress').length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:gap-8 md:grid-cols-2">
        <KpiCard title="Total Clients" icon={Users} value={String(clients.length)} />
        <KpiCard title="Active Projects" icon={ClipboardCheck} value={String(activeProjects)} />
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>A snapshot of your latest projects.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 5).map(project => (
                <div key={project.id} className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                  <Badge variant="outline" className="h-6 whitespace-nowrap">
                    <div className={cn("h-2 w-2 rounded-full mr-2", projectStatusConfig[project.status]?.color)}></div>
                    {projectStatusConfig[project.status]?.label}
                  </Badge>
                </div>
              ))}
              {projects.length === 0 && <p className="text-sm text-muted-foreground text-center">No projects yet.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Clients</CardTitle>
            <CardDescription>Your newest clients and leads.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients.slice(0, 5).map(client => (
                <div key={client.id} className="flex items-start justify-between">
                   <div className="flex-1 pr-2">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.company}</p>
                  </div>
                   <Badge variant="outline" className="h-6 whitespace-nowrap">
                    <div className={cn("h-2 w-2 rounded-full mr-2", clientStatusConfig[client.status]?.color)}></div>
                    {clientStatusConfig[client.status]?.label}
                  </Badge>
                </div>
              ))}
               {clients.length === 0 && <p className="text-sm text-muted-foreground text-center">No clients yet.</p>}
            </div>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
