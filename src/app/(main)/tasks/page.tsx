
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, CheckSquare, Trash2, LayoutGrid, View, KanbanSquare } from 'lucide-react';
import { useApp } from '@/components/layout/app-provider';
import TaskList from '@/components/tasks/task-list';
import AddTaskDialog from '@/components/tasks/add-task-dialog';
import AddGroupDialog from '@/components/tasks/add-group-dialog';
import type { Task, TaskGroup, TaskView } from '@/lib/types';
import { DragDropContext, type DropResult } from 'react-beautiful-dnd';
import { allAchievements } from '@/lib/achievements';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { isAfter, isBefore, isToday, isTomorrow, startOfToday } from 'date-fns';
import TaskListGroupByDate from '@/components/tasks/task-list-group-by-date';
import TaskKanbanBoard from '@/components/tasks/task-kanban-board';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type TaskFilter = 'all' | 'completed' | 'incomplete';
type TaskSort = 'default' | 'dueDate' | 'createdAt-asc' | 'createdAt-desc';

export default function TasksPage() {
  const { tasks, setTasks, taskGroups, setTaskGroups, appSettings, ...appData } = useApp();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  
  const [taskView, setTaskView] = useState<TaskView>('default');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sort, setSort] = useState<TaskSort>('default');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setTaskView(appSettings.tasks.defaultView || 'default');
  }, [appSettings.tasks.defaultView]);

  const handleAddTask = (newTask: Omit<Task, 'id' | 'completed' | 'createdAt' | 'order'>) => {
    const taskToAdd: Task = {
      ...newTask,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date().toISOString(),
      order: tasks.filter(t => t.groupId === newTask.groupId).length,
    };
    setTasks(prev => [taskToAdd, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }

  const handleAddGroup = (groupName: string) => {
    const newGroup: TaskGroup = {
      id: Date.now().toString(),
      name: groupName,
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
  
  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return;
    }
    
    let newTasks = Array.from(tasks);

    const taskToMove = newTasks.find(t => t.id === draggableId);
    if (!taskToMove) return;
    
    // Find the actual task object in the main array to modify it
    const taskInMainList = newTasks.find(t => t.id === draggableId)!;

    if (type === 'GROUP') {
        const [reorderedGroup] = taskGroups.splice(source.index, 1);
        taskGroups.splice(destination.index, 0, reorderedGroup);
        setTaskGroups([...taskGroups]);
        return;
    }

    if (source.droppableId === destination.droppableId) {
        // Re-ordering in the same group
        const sourceTasks = newTasks.filter(t => t.groupId === source.droppableId).sort((a,b) => (a.order || 0) - (b.order || 0));
        const [moved] = sourceTasks.splice(source.index, 1);
        sourceTasks.splice(destination.index, 0, moved);
        
        // Update order for this group
        sourceTasks.forEach((t, index) => {
            const taskToUpdate = newTasks.find(nt => nt.id === t.id);
            if (taskToUpdate) taskToUpdate.order = index;
        });
    } else {
        // Moving to a different group
        taskInMainList.groupId = destination.droppableId;
        
        const sourceTasks = newTasks.filter(t => t.groupId === source.droppableId).sort((a,b) => (a.order || 0) - (b.order || 0));
        const destTasks = newTasks.filter(t => t.groupId === destination.droppableId).sort((a,b) => (a.order || 0) - (b.order || 0));

        // Find and remove the moved task from the source tasks array
        const movedTaskIndex = sourceTasks.findIndex(t => t.id === draggableId);
        if (movedTaskIndex > -1) {
            const [moved] = sourceTasks.splice(movedTaskIndex, 1);
            destTasks.splice(destination.index, 0, moved);
        }
        
        // Update order for both source and destination groups
        sourceTasks.forEach((t, index) => {
            const taskToUpdate = newTasks.find(nt => nt.id === t.id);
            if (taskToUpdate) taskToUpdate.order = index;
        });
        destTasks.forEach((t, index) => {
            const taskToUpdate = newTasks.find(nt => nt.id === t.id);
            if (taskToUpdate) taskToUpdate.order = index;
        });
    }
    
    setTasks(newTasks);
  };


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

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
        prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleBulkDelete = () => {
    setTasks(prev => prev.filter(task => !selectedTasks.includes(task.id)));
    setSelectedTasks([]);
    setIsBulkDeleteConfirmOpen(false);
  };

  const isBulkActionsUnlocked = currentLevel >= 15;

  const filteredAndSortedTasks = useMemo(() => {
    let newTasks = [...tasks];

    if (filter === 'completed') {
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
        { title: 'Upcoming', tasks: upcoming, color: 'text-muted-foreground' },
        { title: 'No Due Date', tasks: noDueDate, color: 'text-muted-foreground' },
    ].filter(group => group.tasks.length > 0);

  }, [filteredAndSortedTasks]);

  const renderContent = () => {
    if (!isClient) {
        return null;
    }

    if (taskView === 'kanban') {
      return (
        <DragDropContext onDragEnd={onDragEnd}>
          <TaskKanbanBoard 
            tasks={filteredAndSortedTasks} 
            groups={taskGroups}
            allGroups={taskGroups} 
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        </DragDropContext>
      )
    }

    if (taskView === 'groupByDate') {
        return <TaskListGroupByDate 
                    groupedTasks={groupedByDateTasks} 
                    onUpdateTask={handleUpdateTask} 
                    onDeleteTask={handleDeleteTask}
                />
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <TaskList 
                tasks={filteredAndSortedTasks} 
                groups={taskGroups} 
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onUpdateGroup={handleUpdateGroup}
                onDeleteGroup={handleDeleteGroup}
                selectedTasks={isBulkActionsUnlocked ? selectedTasks : []}
                onToggleSelection={isBulkActionsUnlocked ? handleToggleTaskSelection : undefined}
            />
        </DragDropContext>
    );
  }

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
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
      
      {isBulkActionsUnlocked && selectedTasks.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-8">
            <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border">
                    <span className="text-sm font-medium">{selectedTasks.length} tasks selected</span>
                      <Button variant="destructive" size="sm" onClick={() => setIsBulkDeleteConfirmOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                    </Button>
                </div>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the {selectedTasks.length} selected tasks. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      )}

      <div className="overflow-y-auto">
        {renderContent()}
      </div>

      <AddTaskDialog 
        isOpen={isAddTaskOpen}
        onOpenChange={setIsAddTaskOpen}
        onAddTask={handleAddTask}
        groups={taskGroups}
      />
      <AddGroupDialog
        isOpen={isAddGroupOpen}
        onOpenChange={setIsAddGroupOpen}
        onAddGroup={handleAddGroup}
      />
    </div>
  );
}
