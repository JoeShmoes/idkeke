
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Trash2, Edit, CheckCircle, Trophy, Target as GoalIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Goal } from '@/lib/types';
import AddGoalDialog from '@/components/goals/add-goal-dialog';
import KpiCard from '@/components/dashboard/kpi-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { useApp } from '@/components/layout/app-provider';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusConfig: Record<Goal['status'], { label: string; color: string }> = {
    'on-track': { label: 'On Track', color: 'bg-blue-500' },
    'at-risk': { label: 'At Risk', color: 'bg-yellow-500' },
    'off-track': { label: 'Off Track', color: 'bg-red-500' },
    'achieved': { label: 'Achieved', color: 'bg-green-500' },
    'on-hold': { label: 'On Hold', color: 'bg-gray-500' },
};

export default function GoalsPage() {
  const { goals, setGoals } = useApp();
  const [isClient, setIsClient] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | undefined>(undefined);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isSelecting: boolean;
  } | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleSaveGoal = (goalData: Omit<Goal, 'id'>) => {
    if (goalToEdit) {
      setGoals(prev => prev.map(g => g.id === goalToEdit.id ? { ...goalToEdit, ...goalData } : g));
    } else {
      const newGoal: Goal = { ...goalData, id: `goal-${Date.now()}` };
      setGoals(prev => [newGoal, ...prev]);
    }
  };

  const handleOpenEditDialog = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsAddGoalOpen(true);
  }
  
  const handleOpenAddDialog = () => {
    setGoalToEdit(undefined);
    setIsAddGoalOpen(true);
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
  }

  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(prevGoals => prevGoals.map(goal => {
      if (goal.id === goalId) {
        return {
          ...goal,
          milestones: goal.milestones.map(m => 
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          ),
        };
      }
      return goal;
    }));
  };

  const handleToggleSelection = (goalId: string, e: React.MouseEvent) => {
    if (e.shiftKey && selectedIds.length > 0) {
      e.stopPropagation();
      const lastSelectedId = selectedIds[selectedIds.length - 1];
      const allIds = goals.map(g => g.id);
      const startIdx = allIds.indexOf(lastSelectedId);
      const endIdx = allIds.indexOf(goalId);
      
      if (startIdx !== -1 && endIdx !== -1) {
        const start = Math.min(startIdx, endIdx);
        const end = Math.max(startIdx, endIdx);
        const rangeIds = allIds.slice(start, end + 1);
        
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          rangeIds.forEach(id => newSet.add(id));
          return Array.from(newSet);
        });
      }
    } else if (e.ctrlKey) {
      e.stopPropagation();
      setSelectedIds(prev => 
        prev.includes(goalId) 
          ? prev.filter(id => id !== goalId)
          : [...prev, goalId]
      );
    } else {
      if (selectedIds.length > 0) {
          setSelectedIds([]);
      }
      setSelectedIds([goalId]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, [role="menuitem"], [role="checkbox"]')) return;
    if (!e.shiftKey && !e.ctrlKey) {
      setSelectedIds([]);
    }
    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isSelecting: true,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectionBox?.isSelecting) return;
    setSelectionBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
    
    const selectionRect = {
        left: Math.min(selectionBox.startX, e.clientX),
        top: Math.min(selectionBox.startY, e.clientY),
        right: Math.max(selectionBox.startX, e.clientX),
        bottom: Math.max(selectionBox.startY, e.clientY),
    };

    const selectableElements = document.querySelectorAll('[data-selectable="true"]');
    const newSelectedIds = new Set(e.shiftKey || e.ctrlKey ? selectedIds : []);

    selectableElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const id = el.getAttribute('data-id');
        if (id && 
            rect.left < selectionRect.right &&
            rect.right > selectionRect.left &&
            rect.top < selectionRect.bottom &&
            rect.bottom > selectionRect.top) {
            newSelectedIds.add(id);
        }
    });
    setSelectedIds(Array.from(newSelectedIds));
  };

  const handleMouseUp = () => {
    if (selectionBox?.isSelecting) {
        setSelectionBox(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input/textarea
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      // Delete: Ctrl + Shift + Backspace OR Delete key
      if ((e.ctrlKey && e.shiftKey && e.key === 'Backspace') || e.key === 'Delete') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          setIsBulkDeleteConfirmOpen(true);
        }
      }
      
      // Select All: Ctrl + A
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(goals.map(g => g.id));
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, goals]);

  const achievedGoals = goals.filter(g => g.status === 'achieved').length;
  const overallProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const totalMilestones = goals.reduce((sum, goal) => sum + goal.milestones.length, 0);
    if (totalMilestones === 0) return 0;
    const completedMilestones = goals.reduce((sum, goal) => sum + goal.milestones.filter(m => m.completed).length, 0);
    return (completedMilestones / totalMilestones) * 100;
  }, [goals]);

  if (!isClient) {
      return (
        <div className="space-y-6">
            <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-48" />
        </div>
      )
  }

  return (
    <>
      <div 
        className="space-y-6 select-none min-h-screen pb-10"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
          {selectionBox && selectionBox.isSelecting && (
            <div
                className="fixed z-50 bg-primary/20 border border-primary/30 rounded-md pointer-events-none"
                style={{
                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                    width: Math.abs(selectionBox.currentX - selectionBox.startX),
                    height: Math.abs(selectionBox.currentY - selectionBox.startY)
                }}
            />
          )}
          <div className="grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
              <KpiCard title="Total Goals" icon={CheckCircle} value={String(goals.length)} />
              <KpiCard title="Achieved Goals" icon={Trophy} value={String(achievedGoals)} />
              <KpiCard title="Overall Progress" icon={CheckCircle} value={`${Math.round(overallProgress)}%`} />
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Your Goals</h2>
            <Button onClick={handleOpenAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Goal
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {goals.length > 0 ? goals.map(goal => {
                const completedMilestones = goal.milestones.filter(m => m.completed).length;
                const progress = goal.milestones.length > 0 ? (completedMilestones / goal.milestones.length) * 100 : 0;

                return (
                    <ContextMenu key={goal.id}>
                        <ContextMenuTrigger>
                            <Card 
                                data-selectable="true"
                                data-id={goal.id}
                                className={cn(
                                    "bg-card/50 hover:shadow-lg transition-all flex flex-col cursor-pointer",
                                    selectedIds.includes(goal.id) && "ring-2 ring-primary bg-primary/10"
                                )}
                                onClick={(e) => handleToggleSelection(goal.id, e)}
                            >
                        <CardHeader>
                            <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-lg">{goal.title}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mt-2 -mr-2">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenEditDialog(goal)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteGoal(goal.id)}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                             <div className="flex items-center gap-2 pt-1">
                                <Badge variant="outline" className="h-6">
                                    <div className={cn("h-2 w-2 rounded-full mr-2", statusConfig[goal.status].color)}></div>
                                    {statusConfig[goal.status].label}
                                </Badge>
                                 <Badge variant="secondary" className="capitalize">{goal.category}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col">
                            <p className="text-sm text-muted-foreground flex-grow">{goal.description}</p>
                            <p className="text-xs text-muted-foreground mt-4">Target: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}</p>
                            
                            {goal.milestones.length > 0 && (
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-muted-foreground">Milestones</span>
                                        <span className="text-xs font-medium text-muted-foreground">{completedMilestones}/{goal.milestones.length}</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                    <div className="mt-3 space-y-2 max-h-24 overflow-y-auto pr-2">
                                        {goal.milestones.map(milestone => (
                                            <div key={milestone.id} className="flex items-center gap-2 text-sm cursor-pointer" onClick={() => handleToggleMilestone(goal.id, milestone.id)}>
                                                <Checkbox checked={milestone.completed} id={`ms-${milestone.id}`} />
                                                <label htmlFor={`ms-${milestone.id}`} className={cn("flex-1", milestone.completed && "line-through text-muted-foreground")}>{milestone.text}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </CardContent>
                            </Card>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem onClick={() => handleOpenEditDialog(goal)}>
                                <Edit className="mr-2 h-4 w-4"/> Edit
                            </ContextMenuItem>
                            <ContextMenuItem className="text-destructive" onClick={() => handleDeleteGoal(goal.id)}>
                                <Trash2 className="mr-2 h-4 w-4"/> Delete
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                )
            }) : (
                <div className="text-center py-12 col-span-full">
                    <GoalIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-foreground">No goals set yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Click "Add Goal" to get started!</p>
                </div>
            )}
          </div>
      </div>
      <AddGoalDialog 
        isOpen={isAddGoalOpen}
        onOpenChange={setIsAddGoalOpen}
        onSave={handleSaveGoal}
        goalToEdit={goalToEdit}
      />
      
      {selectedIds.length > 1 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-foreground/5 backdrop-blur-md border border-foreground/10 shadow-2xl rounded-full px-6 py-3 flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 text-sm font-medium pr-4 border-r border-border/50">
                <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {selectedIds.length}
                </span>
                <span>Selected</span>
            </div>
            <Button 
                variant="destructive" 
                size="sm" 
                className="rounded-full shadow-sm hover:shadow-md transition-all"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsBulkDeleteConfirmOpen(true);
                }}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-background/50"
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIds([]);
                }}
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
      )}

      <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete the {selectedIds.length} selected goals. This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                selectedIds.forEach(id => handleDeleteGoal(id));
                setSelectedIds([]);
                setIsBulkDeleteConfirmOpen(false);
            }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
