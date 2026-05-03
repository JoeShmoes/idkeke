
'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, CheckSquare, Trash2, LayoutGrid, View, KanbanSquare, Sliders, X, AlertCircle } from 'lucide-react';
import { useApp } from '@/components/layout/app-provider';
import TaskList from '@/components/tasks/task-list';
import AddTaskDialog from '@/components/tasks/add-task-dialog';
import AddGroupDialog from '@/components/tasks/add-group-dialog';
import BulkEditDialog, { BulkUpdates } from '@/components/tasks/bulk-edit-dialog';
import type { Task, TaskGroup, TaskView } from '@/lib/types';
import { allAchievements } from '@/lib/achievements';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { isAfter, isBefore, isToday, isTomorrow, startOfToday } from 'date-fns';
import TaskListGroupByDate from '@/components/tasks/task-list-group-by-date';
import TaskKanbanBoard from '@/components/tasks/task-kanban-board';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileTasks from '@/components/tasks/mobile-tasks';

type TaskFilter = 'all' | 'completed' | 'incomplete';
type TaskSort = 'default' | 'dueDate' | 'createdAt-asc' | 'createdAt-desc';

export default function TasksPage() {
  const { tasks, setTasks, taskGroups, setTaskGroups, appSettings, isAddTaskOpen, setIsAddTaskOpen, ...appData } = useApp();
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  
  const [taskView, setTaskView] = useState<TaskView>('default');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sort, setSort] = useState<TaskSort>('default');
  const [isClient, setIsClient] = useState(false);
  const [groupPagination, setGroupPagination] = useState<Record<string, number>>({});
  // Reorder Mode State
  // We moved reordering state to the group level in TaskList

  // Selection State
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number; isSelecting: boolean } | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    setTaskView(appSettings.tasks.defaultView || 'default');
  }, [appSettings.tasks.defaultView]);

  const handlePageChange = (groupId: string, newPage: number) => {
    setGroupPagination(prev => ({ ...prev, [groupId]: newPage }));
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'completed' | 'createdAt' | 'order'>) => {
    const groupTasks = tasks.filter(t => t.groupId === newTask.groupId);
    const maxOrder = groupTasks.length > 0 ? Math.max(...groupTasks.map(t => t.order || 0)) : -1;

    const now = new Date().toISOString();
    const taskToAdd: Task = {
      ...newTask,
      id: Date.now().toString(),
      completed: false,
      createdAt: now,
      updatedAt: now,
      priority: newTask.priority || 'medium',
      order: maxOrder + 1,
    };
    setTasks(prev => [taskToAdd, ...prev]);
  };

  // Move Group
  const handleMoveGroup = (groupId: string, direction: 'up' | 'down') => {
    const groupIndex = taskGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) return;

    const swapIndex = direction === 'up' ? groupIndex - 1 : groupIndex + 1;
    if (swapIndex < 0 || swapIndex >= taskGroups.length) return;

    const newGroups = [...taskGroups];
    const [movedGroup] = newGroups.splice(groupIndex, 1);
    newGroups.splice(swapIndex, 0, movedGroup);

    // Re-assign orders to ALL groups to ensure consistency
    const finalizedGroups = newGroups.map((g, index) => ({
      ...g,
      order: index
    }));

    setTaskGroups(finalizedGroups);
  };

  // Move Task
  const handleMoveTask = (taskId: string, direction: 'up' | 'down') => {
    setTasks(prev => {
        const task = prev.find(t => t.id === taskId);
        if (!task) return prev;
        
        // Get all tasks in this group and sort them by current order
        const groupTasks = prev
            .filter(t => t.groupId === task.groupId)
            .sort((a, b) => {
                if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
            
        const currentIndex = groupTasks.findIndex(t => t.id === taskId);
        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        if (swapIndex < 0 || swapIndex >= groupTasks.length) return prev;
        
        const swapTask = groupTasks[swapIndex];
        
        // Ensure both have valid orders for the swap
        const taskOrder = currentIndex;
        const swapTaskOrder = swapIndex;

        const now = new Date().toISOString();
        return prev.map(t => {
            // First, normalize ALL tasks in this group to have their current index-based order
            // so that the swap is clean and persistent
            if (t.groupId === task.groupId) {
                const idx = groupTasks.findIndex(gt => gt.id === t.id);
                if (t.id === taskId) return { ...t, order: swapTaskOrder, updatedAt: now };
                if (t.id === swapTask.id) return { ...t, order: taskOrder, updatedAt: now };
                return { ...t, order: idx };
            }
            return t;
        });
    });
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const now = new Date().toISOString();
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...updatedTask, updatedAt: now } : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setItemToDelete(taskId);
    setIsBulkDeleteConfirmOpen(true);
  }

  const confirmDelete = () => {
    if (itemToDelete) {
        setTasks(prev => prev.filter(t => t.id !== itemToDelete));
        setItemToDelete(null);
        // Also remove from selection if present
        setSelectedTasks(prev => prev.filter(id => id !== itemToDelete));
    } else {
        setTasks(prev => prev.filter(task => !selectedTasks.includes(task.id)));
        setSelectedTasks([]);
    }
    setIsBulkDeleteConfirmOpen(false);
  };

  const handleAddGroup = (groupName: string) => {
    const maxOrder = taskGroups.length > 0 ? Math.max(...taskGroups.map(g => g.order || 0)) : -1;
    const newGroup: TaskGroup = {
      id: Date.now().toString(),
      name: groupName,
      order: maxOrder + 1,
    };
    setTaskGroups(prev => [...prev, newGroup]);
  };

  const handleUpdateGroup = (updatedGroup: TaskGroup) => {
    setTaskGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  }

  const handleDeleteGroup = (groupId: string) => {
    setTasks(prev => prev.map(task => 
      task.groupId === groupId ? { ...task, groupId: 'default' } : task
    ));
    setTaskGroups(prev => prev.filter(g => g.id !== groupId));
  };
  
  // Check if any filters are active (which invalidates manual reordering)
  // We allow reordering even if hideCompletedTasks is on, but NOT if a specific sort is applied
  const areFiltersActive = useMemo(() => {
    return filter !== 'all' || sort !== 'default';
  }, [filter, sort]);





  const currentLevel = useMemo(() => {
    const { clients, projects, accounts, notes, assets, learningResources, networkContacts } = appData;
    let points = 0;
    allAchievements.forEach(ach => {
        let isUnlocked = false;
        switch (ach.category) {
            case 'tasks': isUnlocked = (tasks || []).filter(t => t.completed).length >= ach.threshold; break;
            case 'clients': isUnlocked = (clients || []).length >= ach.threshold; break;
            case 'projects': isUnlocked = (projects || []).filter(p => p.status === 'completed').length >= ach.threshold; break;
            case 'finance': isUnlocked = (accounts || []).reduce((sum, acc) => acc.type === 'credit' ? sum - acc.balance : sum + acc.balance, 0) >= ach.threshold; break;
            case 'notes': isUnlocked = (notes || []).length >= ach.threshold; break;
            case 'assets': isUnlocked = (assets || []).reduce((sum, asset) => sum + asset.value, 0) >= ach.threshold; break;
            case 'learning': isUnlocked = (learningResources || []).filter(r => r.status === 'completed').length >= ach.threshold; break;
            case 'networking': isUnlocked = (networkContacts || []).length >= ach.threshold; break;
        }
        if (isUnlocked) {
            points += ach.points;
        }
    });
    
    let level = 1;
    const levelThresholds = [
      0, 50, 125, 250, 500, 1000, 2000, 4000, 8000, 15000, 25000, 50000, 
      75000, 100000, 130000, 165000, 205000, 250000, 300000, 355000, 415000,
      480000, 550000, 625000, 705000, 800000, 900000, 1000000, 1150000, 1300000,
      1500000, 1750000, 2000000, 2300000, 2600000, 2950000, 3300000, 3700000, 4100000, 4500000,
      5000000, 5500000, 6000000, 6500000, 7000000, 7500000, 8000000, 8500000, 9000000, 9500000,
      10000000
    ];

    while (level < levelThresholds.length && points >= levelThresholds[level]) {
        level++;
    }
    return level;
  }, [appData, tasks]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if ((e.target as HTMLElement).closest('[data-selectable]')) return; // Let item click handle it
    
    // Prevent selection if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, input, [role="checkbox"], [role="button"]')) return;

    setSelectionBox({
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        isSelecting: true
    });
    
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        setSelectedTasks([]);
        setLastSelectedId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectionBox?.isSelecting) return;

    setSelectionBox(prev => prev ? ({ ...prev, currentX: e.clientX, currentY: e.clientY }) : null);

    const selectionRect = {
        left: Math.min(selectionBox.startX, e.clientX),
        top: Math.min(selectionBox.startY, e.clientY),
        right: Math.max(selectionBox.startX, e.clientX),
        bottom: Math.max(selectionBox.startY, e.clientY)
    };

    const newSelectedIds = new Set(e.ctrlKey || e.metaKey ? selectedTasks : []);
    
    // Find all selectable items
    const items = document.querySelectorAll('[data-selectable]');
    items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        
        if (
            selectionRect.left < itemRect.right &&
            selectionRect.right > itemRect.left &&
            selectionRect.top < itemRect.bottom &&
            selectionRect.bottom > itemRect.top
        ) {
            const id = item.getAttribute('data-id');
            if (id) newSelectedIds.add(id);
        }
    });
    
    setSelectedTasks(Array.from(newSelectedIds));
  };

  const handleMouseUp = () => {
    if (selectionBox?.isSelecting) {
        setSelectionBox(null);
    }
  };

  const handleToggleTaskSelection = (taskId: string, e?: React.MouseEvent) => {
    if (e && e.shiftKey && lastSelectedId) {
        const allTaskIds = filteredAndSortedTasks.map(t => t.id);
        const startIndex = allTaskIds.indexOf(lastSelectedId);
        const endIndex = allTaskIds.indexOf(taskId);
        
        if (startIndex !== -1 && endIndex !== -1) {
            const start = Math.min(startIndex, endIndex);
            const end = Math.max(startIndex, endIndex);
            const rangeIds = allTaskIds.slice(start, end + 1);
            
            setSelectedTasks(prev => {
                const newSet = new Set(prev);
                rangeIds.forEach(id => newSet.add(id));
                return Array.from(newSet);
            });
            return;
        }
    }

    if (e && (e.ctrlKey || e.metaKey)) {
        setSelectedTasks(prev => 
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
        setLastSelectedId(taskId);
    } else {
        setSelectedTasks([taskId]);
        setLastSelectedId(taskId);
    }
  };

  const handleBulkDelete = () => {
    // Deprecated in favor of confirmDelete but keeping for reference if needed, 
    // actually we should just remove this function or alias it if it was used elsewhere.
    // But since it was only used in the dialog, we can remove it.
  };

  const handleBulkUpdate = (updates: BulkUpdates) => {
    const now = new Date().toISOString();
    setTasks(prev => prev.map(task => {
        if (!selectedTasks.includes(task.id)) return task;
        
        return {
            ...task,
            ...(updates.completed !== undefined && { completed: updates.completed }),
            ...(updates.groupId && { groupId: updates.groupId }),
            ...(updates.dueDate !== undefined && { dueDate: updates.dueDate }),
            updatedAt: now
        };
    }));
    setSelectedTasks([]);
    setIsBulkEditOpen(false);
  };

  const isBulkActionsUnlocked = currentLevel >= 15;

  const filteredAndSortedTasks = useMemo(() => {
    let newTasks = [...tasks];

    if (appSettings.tasks.hideCompletedTasks && filter !== 'completed') {
      newTasks = newTasks.filter(t => !t.completed);
    } else if (filter === 'completed') {
      newTasks = newTasks.filter(t => t.completed);
    } else if (filter === 'incomplete') {
      newTasks = newTasks.filter(t => !t.completed);
    }

    if (sort === 'dueDate' && taskView === 'default') {
      newTasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sort === 'createdAt-asc') {
      newTasks.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sort === 'createdAt-desc') {
       newTasks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
       // Default sort by order, then by createdAt for stability
       newTasks.sort((a,b) => {
           if ((a.order || 0) !== (b.order || 0)) {
               return (a.order || 0) - (b.order || 0);
           }
           return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
       });
    }

    return newTasks;
  }, [tasks, filter, sort, taskView]);
  
  const groupedByDateTasks = useMemo(() => {
    const today = startOfToday();
    const overdue: Task[] = [];
    const dueToday: Task[] = [];
    const dueTomorrow: Task[] = [];
    const upcoming: Task[] = [];
    const noDueDate: Task[] = [];

    filteredAndSortedTasks.forEach(task => {
        if (task.completed) return; // Don't show completed in this view

        if (!task.dueDate) {
            noDueDate.push(task);
            return;
        }

        const dueDate = new Date(task.dueDate);
        if (isBefore(dueDate, today)) {
            overdue.push(task);
        } else if (isToday(dueDate)) {
            dueToday.push(task);
        } else if (isTomorrow(dueDate)) {
            dueTomorrow.push(task);
        } else if (isAfter(dueDate, today)) {
            upcoming.push(task);
        }
    });
    
    return [
        { title: 'Overdue', tasks: overdue, color: 'text-destructive' },
        { title: 'Due Today', tasks: dueToday, color: 'text-blue-500' },
        { title: 'Due Tomorrow', tasks: dueTomorrow, color: 'text-purple-500' },
        { title: 'Upcoming', tasks: upcoming, color: 'text-foreground' },
        { title: 'No Due Date', tasks: noDueDate, color: 'text-foreground' },
    ].filter(group => group.tasks.length > 0);

  }, [filteredAndSortedTasks]);

  const groupedTasks = useMemo(() => {
    return taskGroups
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(group => ({
        id: group.id,
        name: group.name,
        tasks: filteredAndSortedTasks.filter(t => t.groupId === group.id)
      }));
  }, [taskGroups, filteredAndSortedTasks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input/textarea
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      // Delete: Ctrl + Shift + Backspace OR Delete key
      if ((e.ctrlKey && e.shiftKey && e.key === 'Backspace') || e.key === 'Delete') {
        if (selectedTasks.length > 0) {
          e.preventDefault();
          setItemToDelete(null); // Ensure we are doing bulk delete
          setIsBulkDeleteConfirmOpen(true);
        }
      }
      // Select All: Ctrl + A
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        const allTaskIds = filteredAndSortedTasks.map(t => t.id);
        setSelectedTasks(allTaskIds);
      }
      // Clear Selection: Escape
      if (e.key === 'Escape') {
        setSelectedTasks([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTasks, filteredAndSortedTasks]);

  const renderContent = () => {
    if (!isClient) {
        return null;
    }

    if (taskView === 'kanban') {
      return (
          <TaskKanbanBoard 
            tasks={filteredAndSortedTasks} 
            groups={taskGroups}
            allGroups={taskGroups} 
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            selectedTasks={selectedTasks}
            onToggleSelection={handleToggleTaskSelection}
            isDragDisabled={areFiltersActive}
          />
      )
    }

    if (taskView === 'groupByDate') {
        return <TaskListGroupByDate 
                    groupedTasks={groupedByDateTasks} 
                    onUpdateTask={handleUpdateTask} 
                    onDeleteTask={handleDeleteTask}
                    selectedTasks={selectedTasks}
                    onToggleSelection={handleToggleTaskSelection}
                />
    }

    return (
            <TaskList 
                groupedTasks={groupedTasks}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onUpdateGroup={handleUpdateGroup}
                onDeleteGroup={handleDeleteGroup}
                isDragDisabled={true}
                groupPagination={groupPagination}
                onPageChange={handlePageChange}
                selectedTasks={selectedTasks}
                onToggleSelection={handleToggleTaskSelection}
                onMoveTask={areFiltersActive ? undefined : handleMoveTask}
                onMoveGroup={areFiltersActive ? undefined : handleMoveGroup}
                expandedGroups={appSettings.tasks.expandedGroups || groupedTasks.map(g => g.id)}
                onExpandedGroupsChange={(ids) => {
                  setAppSettings(prev => ({
                    ...prev,
                    tasks: {
                      ...prev.tasks,
                      expandedGroups: ids
                    }
                  }));
                }}
            />
    );
  }

  const isMobile = useIsMobile();

  if (!isClient) {
    return null;
  }

  if (isMobile) return <MobileTasks />;

  return (
    <div 
        className="flex flex-col h-full relative select-none"
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
      <div className="flex-shrink-0 p-4 flex items-center justify-center">
            <Card className="p-2 flex items-center gap-2 shadow-sm w-fit">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline"><View className="mr-2 h-4 w-4" /> View Options</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>View Mode</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setTaskView('default')} disabled={taskView === 'default'}>
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      <span>Grouped by Section</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTaskView('groupByDate')} disabled={taskView === 'groupByDate'}>
                      <CheckSquare className="mr-2 h-4 w-4" />
                      <span>Grouped by Due Date</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTaskView('kanban')} disabled={taskView === 'kanban'}>
                      <KanbanSquare className="mr-2 h-4 w-4" />
                      <span>Kanban Board</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuGroup>
                      <DropdownMenuCheckboxItem 
                          checked={appSettings.tasks.hideCompletedTasks}
                          onCheckedChange={(checked) => {
                              setAppSettings(prev => ({
                                  ...prev,
                                  tasks: {
                                      ...prev.tasks,
                                      hideCompletedTasks: checked
                                  }
                              }));
                          }}
                      >
                          Hide Completed Tasks
                      </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setFilter('all')} disabled={filter === 'all'}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('incomplete')} disabled={filter === 'incomplete'}>Incomplete</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('completed')} disabled={filter === 'completed'}>Completed</DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Sort</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setSort('default')} disabled={sort === 'default' || taskView === 'groupByDate'}>Default Order</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort('dueDate')} disabled={sort === 'dueDate' || taskView === 'groupByDate'}>Due Date</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort('createdAt-desc')} disabled={sort === 'createdAt-desc'}>Newest First</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSort('createdAt-asc')} disabled={sort === 'createdAt-asc'}>Oldest First</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {taskView === 'default' && (
                <Button variant="outline" onClick={() => setIsAddGroupOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Group
                </Button>
              )}
              


              <Button onClick={() => setIsAddTaskOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </Card>
      </div>
      
      <div className="overflow-y-auto">
        {areFiltersActive && (
          <div className="bg-amber-500/10 text-amber-500 text-sm px-4 py-2 rounded-md border border-amber-500/20 m-4 mb-0 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Reordering is disabled while filters or custom sorting are active. Clear filters to reorder tasks.</span>
          </div>
        )}
        {renderContent()}
      </div>

      {selectedTasks.length > 1 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-foreground/5 backdrop-blur-md border border-border/50 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {selectedTasks.length} selected
            </span>
            <div className="h-4 w-px bg-border/50" />
            
            {isBulkActionsUnlocked && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-3 rounded-full text-xs"
                    onClick={() => setIsBulkEditOpen(true)}
                >
                    <Sliders className="h-3 w-3 mr-1.5" />
                    Edit
                </Button>
            )}

            <Button 
              variant="destructive" 
              size="sm" 
              className="h-7 px-3 rounded-full shadow-sm hover:shadow-md transition-all text-xs"
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full ml-1 hover:bg-background/50"
              onClick={() => setSelectedTasks([])}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
      )}

      <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={(open) => {
        setIsBulkDeleteConfirmOpen(open);
        if (!open) setItemToDelete(null);
      }}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    {itemToDelete 
                        ? "This will permanently delete this task. This action cannot be undone."
                        : `This will permanently delete the ${selectedTasks.length} selected ${selectedTasks.length === 1 ? 'task' : 'tasks'}. This action cannot be undone.`
                    }
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddGroupDialog
        isOpen={isAddGroupOpen}
        onOpenChange={setIsAddGroupOpen}
        onAddGroup={handleAddGroup}
      />
      <BulkEditDialog
        isOpen={isBulkEditOpen}
        onOpenChange={setIsBulkEditOpen}
        onBulkUpdate={handleBulkUpdate}
        selectedCount={selectedTasks.length}
        groups={taskGroups}
      />
    </div>
  );
}
