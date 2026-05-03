'use client';

import type { Task, TaskGroup } from '@/lib/types';
import TaskItem from './task-item';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { useApp } from '../layout/app-provider';
import { KanbanSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface TaskKanbanBoardProps {
    tasks: Task[];
    groups: TaskGroup[];
    allGroups?: TaskGroup[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    selectedTasks?: string[];
    onToggleSelection?: (taskId: string, e?: React.MouseEvent) => void;
    isDragDisabled?: boolean;
}

export default function TaskKanbanBoard({ 
    tasks, 
    groups, 
    allGroups, 
    onUpdateTask, 
    onDeleteTask, 
    selectedTasks, 
    onToggleSelection, 
    isDragDisabled = false 
}: TaskKanbanBoardProps) {
    const { appSettings, setIsSettingsOpen } = useApp();
    const availableGroups = allGroups || groups;

    const kanbanGroups = useMemo(() => {
        const columnsToShow = appSettings.tasks.kanbanColumns || [];
        const taskGroupIds = new Set(tasks.map(t => t.groupId));
        
        return availableGroups.filter(g => 
            columnsToShow.includes(g.id) && taskGroupIds.has(g.id)
        );
    }, [appSettings.tasks.kanbanColumns, availableGroups, tasks]);


    if (kanbanGroups.length === 0) {
        const hasSelectedColumns = (appSettings.tasks.kanbanColumns || []).length > 0;
        return (
            <div className="text-center text-muted-foreground p-8 flex flex-col items-center">
                <KanbanSquare className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">
                    {hasSelectedColumns ? "No tasks in selected columns" : "No Kanban Columns Selected"}
                </h3>
                <p>
                    {hasSelectedColumns
                        ? "Add some tasks to the groups you've selected for your Kanban board."
                        : "To use the Kanban board, please select which task groups to display as columns in your settings."}
                </p>
                 <Button onClick={() => setIsSettingsOpen(true)} variant="outline" className="mt-4">
                    Go to Settings
                </Button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-start">
            {kanbanGroups.map(group => {
                const groupTasks = tasks
                    .filter(t => t.groupId === group.id)
                    .sort((a,b) => (a.order || 0) - (b.order || 0));

                return (
                    <div key={group.id} className="w-full flex-shrink-0 bg-secondary/50 rounded-lg max-h-full flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-base font-semibold">{group.name}</h3>
                            <span className="text-sm font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{groupTasks.length}</span>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-3 space-y-3 min-h-[100px]">
                            {groupTasks.length > 0 ? (
                                groupTasks.map((task, index) => (
                                    <TaskItem 
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        onUpdate={onUpdateTask}
                                        onDelete={onDeleteTask}
                                        isSelected={selectedTasks?.includes(task.id)}
                                        onToggleSelection={onToggleSelection}
                                        isDragDisabled={isDragDisabled}
                                    />
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No tasks in this group
                                </div>
                            )}
                            </div>
                        </ScrollArea>
                    </div>
                )
            })}
        </div>
    );
}
