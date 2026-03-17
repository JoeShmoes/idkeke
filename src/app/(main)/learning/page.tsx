
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, BookOpen, CheckCircle, Target, Link as LinkIcon, Edit, Trash2, ExternalLink, Copy } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import type { LearningResource, LearningResourceStatus } from '@/lib/types';
import AddResourceDialog from '@/components/learning/add-resource-dialog';
import KpiCard from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from '@/components/ui/context-menu';
import { useApp } from '@/components/layout/app-provider';
import { useHover } from '@/components/layout/hover-context';
import { format } from 'date-fns';

const statusConfig: Record<LearningResourceStatus, { label: string; icon: React.ElementType, color: string }> = {
    'todo': { label: 'To Do', icon: Target, color: 'bg-gray-500' },
    'in-progress': { label: 'In Progress', icon: BookOpen, color: 'bg-blue-500' },
    'completed': { label: 'Completed', icon: CheckCircle, color: 'bg-green-500' },
}

export default function LearningPage() {
  const { learningResources, setLearningResources } = useApp();
  const { setHoveredItem } = useHover();
  const [isClient, setIsClient] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<LearningResource | undefined>(undefined);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSaveResource = (resourceData: Omit<LearningResource, 'id' | 'createdAt'>) => {
    if (resourceToEdit) {
      setLearningResources(prev => prev.map(r => r.id === resourceToEdit.id ? { ...resourceToEdit, ...resourceData } : r));
    } else {
      const newResource: LearningResource = { 
          ...resourceData, 
          id: `lr-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
      setLearningResources(prev => [newResource, ...prev]);
    }
  };

  const handleOpenEditDialog = (resource: LearningResource) => {
    setResourceToEdit(resource);
    setIsAddResourceOpen(true);
  };

  const handleOpenAddDialog = () => {
    setResourceToEdit(undefined);
    setIsAddResourceOpen(true);
  };

  const handleDeleteResource = (resourceId: string) => {
    setLearningResources(prev => prev.filter(r => r.id !== resourceId));
  };
  
  const handleUpdateStatus = (resourceId: string, status: LearningResourceStatus) => {
    setLearningResources(prev => prev.map(r => r.id === resourceId ? { ...r, status } : r));
  };

  const completedResources = learningResources.filter(r => r.status === 'completed').length;
  const totalResources = learningResources.length;

  if (!isClient) {
      return (
        <div className="space-y-6">
            <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-48" />
        </div>
      )
  }

  return (
    <>
      <div className="space-y-6">
          <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
              <KpiCard title="Resources Saved" icon={BookOpen} value={String(totalResources)} />
              <KpiCard title="Completed Items" icon={CheckCircle} value={String(completedResources)} />
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Learning Resources</h2>
            <Button onClick={handleOpenAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Resource
            </Button>
          </div>
          
          <div className="space-y-4">
            {learningResources.length > 0 ? learningResources.map(resource => (
                <ContextMenu key={resource.id}>
                    <ContextMenuTrigger>
                        <Card 
                            className="bg-card/50 hover:shadow-lg transition-shadow"
                            onMouseEnter={() => setHoveredItem({ 
                                type: 'learning', 
                                data: { 
                                    ...resource, 
                                    onEdit: () => handleOpenEditDialog(resource),
                                    onDelete: () => handleDeleteResource(resource.id)
                                } 
                            })}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <CardContent className="p-4 flex items-start gap-4">
                                {resource.icon ? (
                                    <div className="text-3xl flex-shrink-0 flex items-center justify-center h-12 w-12 bg-muted/30 rounded-lg overflow-hidden">
                                        {(resource.icon.startsWith('data:image') || resource.icon.startsWith('http')) ? (
                                            <img src={resource.icon} alt="Icon" className="h-full w-full object-cover" />
                                        ) : (
                                            resource.icon
                                        )}
                                    </div>
                                ) : null}
                                <div className="flex-1">
                                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline flex items-center gap-2">
                                        {resource.title} <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                    </a>
                                    <p className="text-sm text-muted-foreground mt-1 capitalize">{resource.type}</p>
                                    {resource.notes && <p className="text-sm text-foreground mt-2 pt-2 border-t">{resource.notes}</p>}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Badge variant="outline" className="h-6">
                                        <div className={cn("h-2 w-2 rounded-full mr-2", statusConfig[resource.status].color)}></div>
                                        {statusConfig[resource.status].label}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleOpenEditDialog(resource)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(resource.id, 'todo')}>
                                                <Target className="mr-2 h-4 w-4" /> To Do
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(resource.id, 'in-progress')}>
                                                <BookOpen className="mr-2 h-4 w-4" /> In Progress
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleUpdateStatus(resource.id, 'completed')}>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Completed
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteResource(resource.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-56">
                        <ContextMenuItem onClick={() => handleOpenEditDialog(resource)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </ContextMenuItem>
                        <ContextMenuSub>
                            <ContextMenuSubTrigger>Status</ContextMenuSubTrigger>
                            <ContextMenuSubContent>
                                <ContextMenuItem onClick={() => handleUpdateStatus(resource.id, 'todo')}>
                                    <Target className="mr-2 h-4 w-4" /> To Do
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleUpdateStatus(resource.id, 'in-progress')}>
                                    <BookOpen className="mr-2 h-4 w-4" /> In Progress
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => handleUpdateStatus(resource.id, 'completed')}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Completed
                                </ContextMenuItem>
                            </ContextMenuSubContent>
                        </ContextMenuSub>
                        <ContextMenuSeparator />
                        <ContextMenuItem className="text-destructive" onClick={() => handleDeleteResource(resource.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            )) : (
                <div className="text-center py-12">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No resources saved yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Click "Add Resource" to get started!</p>
                </div>
            )}
          </div>
      </div>
      <AddResourceDialog 
        isOpen={isAddResourceOpen}
        onOpenChange={setIsAddResourceOpen}
        onSave={handleSaveResource}
        resourceToEdit={resourceToEdit}
      />
    </>
  );
}
