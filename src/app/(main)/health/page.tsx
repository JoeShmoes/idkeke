
'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import KpiCard from '@/components/dashboard/kpi-card';
import { Activity, Dumbbell, Shield, Swords, PlusCircle, MoreVertical } from 'lucide-react';
import type { Activity as ActivityType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import AddActivityDialog from '@/components/health/add-activity-dialog';

const categoryConfig: Record<ActivityType['category'], { label: string; icon: React.ElementType }> = {
    'combat': { label: 'Combat', icon: Swords },
    'endurance': { label: 'Endurance', icon: Activity },
    'strength': { label: 'Strength', icon: Dumbbell },
    'flexibility': { label: 'Flexibility', icon: Shield },
};

export default function HealthPage() {
  const { activities, setActivities } = useApp();
  const [isClient, setIsClient] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<ActivityType | undefined>(undefined);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSaveActivity = (activityData: Omit<ActivityType, 'id'>) => {
    if (activityToEdit) {
      setActivities(prev => prev.map(a => a.id === activityToEdit.id ? { ...activityToEdit, ...activityData } : a));
    } else {
      const newActivity: ActivityType = { ...activityData, id: `activity-${Date.now()}` };
      setActivities(prev => [newActivity, ...prev]);
    }
  };

  const handleOpenEditDialog = (activity: ActivityType) => {
    setActivityToEdit(activity);
    setIsAddActivityOpen(true);
  };

  const handleOpenAddDialog = () => {
    setActivityToEdit(undefined);
    setIsAddActivityOpen(true);
  };

  const handleDeleteActivity = (activityId: string) => {
    setActivities(prev => prev.filter(a => a.id !== activityId));
  };

  if (!isClient) {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-64" />
        </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total Activities" icon={Activity} value={String(activities.length)} />
          <KpiCard title="Strength" icon={Dumbbell} value={String(activities.filter(a => a.category === 'strength').length)} />
          <KpiCard title="Combat" icon={Swords} value={String(activities.filter(a => a.category === 'combat').length)} />
          <KpiCard title="Endurance" icon={Activity} value={String(activities.filter(a => a.category === 'endurance').length)} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Activities</h2>
            <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activities.length > 0 ? activities.map(activity => {
                const CategoryIcon = categoryConfig[activity.category].icon;
                return (
                    <Card key={activity.id} className="overflow-hidden bg-card/50 hover:shadow-lg transition-shadow group flex flex-col">
                        <div className="flex-grow flex items-center justify-center bg-muted/30 p-8">
                           <CategoryIcon className="h-20 w-20 text-muted-foreground" />
                        </div>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>{activity.title}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 opacity-0 group-hover:opacity-100">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenEditDialog(activity)}>
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteActivity(activity.id)}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Badge variant="outline" className="mb-2">
                                <CategoryIcon className="h-3 w-3 mr-1.5" />
                                {categoryConfig[activity.category].label}
                            </Badge>
                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </CardContent>
                    </Card>
                );
            }) : (
                <div className="text-center py-12 col-span-full">
                    <Swords className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No activities yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Click "Add Activity" to get started!</p>
                </div>
            )}
          </div>
        </div>
      </div>
      <AddActivityDialog
        isOpen={isAddActivityOpen}
        onOpenChange={setIsAddActivityOpen}
        onSave={handleSaveActivity}
        activityToEdit={activityToEdit}
      />
    </>
  );
}
