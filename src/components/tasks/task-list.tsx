
'use client';

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Task, TaskGroup } from '@/lib/types';
import TaskItem from './task-item';
import { Button } from '../ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Pencil, GripVertical, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MoreVertical, Plus, Check, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import AddGroupDialog from './add-group-dialog';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { isBefore, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';
import { useEffect, useRef } from 'react';

interface TaskListProps {
    groupedTasks: { id: string; name: string; tasks: Task[] }[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onUpdateGroup: (group: TaskGroup) => void;
    onDeleteGroup: (groupId: string) => void;
    isDragDisabled?: boolean;
    groupPagination: Record<string, number>;
    onPageChange: (groupId: string, page: number) => void;
    selectedTasks?: string[];
    onToggleSelection?: (taskId: string, e?: React.MouseEvent) => void;
    onMoveTask?: (taskId: string, direction: 'up' | 'down') => void;
    onMoveGroup?: (groupId: string, direction: 'up' | 'down') => void;
}

export default function TaskList({ 
    groupedTasks, 
    onUpdateTask, 
    onDeleteTask, 
    onUpdateGroup, 
    onDeleteGroup,
    isDragDisabled, 
    onMoveTask,
    onMoveGroup,
    groupPagination, 
    onPageChange,
    selectedTasks,
    onToggleSelection
}: TaskListProps) {
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
    const [groupToEdit, setGroupToEdit] = useState<TaskGroup | null>(null);
    const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
    const [reorderingGroupIds, setReorderingGroupIds] = useState<Set<string>>(new Set());
    const { playSound } = useSound();
    const overdueSoundPlayedRef = useRef(false);

    // Toggle reordering for a specific group
    const toggleGroupReordering = (e: React.MouseEvent, groupId: string) => {
        e.stopPropagation();
        const newSet = new Set(reorderingGroupIds);
        if (newSet.has(groupId)) {
            newSet.delete(groupId);
        } else {
            newSet.add(groupId);
        }
        setReorderingGroupIds(newSet);
    };
    
    // Check for overdue tasks and play sound
    useEffect(() => {
        // Flatten tasks from all groups to check for overdue items
        const allTasks = groupedTasks.flatMap(g => g.tasks);
        const hasOverdueTasks = allTasks.some(t => t.dueDate && !t.completed && isBefore(new Date(t.dueDate), startOfToday()));
        
        if (hasOverdueTasks && !overdueSoundPlayedRef.current) {
            playSound('overdue');
            overdueSoundPlayedRef.current = true;
        } else if (!hasOverdueTasks) {
            overdueSoundPlayedRef.current = false; // Reset when no longer overdue
        }
    }, [groupedTasks, playSound]);

    // Keyboard shortcut for reordering (Alt+R)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Alt+R
            if (e.altKey && (e.key === 'r' || e.key === 'R')) {
                e.preventDefault();
                
                // If any group is reordering, turn all off. Otherwise turn all on.
                if (reorderingGroupIds.size > 0) {
                    setReorderingGroupIds(new Set());
                } else {
                    // Turn on for all groups
                    const allGroupIds = new Set(groupedTasks.map(g => g.id));
                    setReorderingGroupIds(allGroupIds);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [reorderingGroupIds, groupedTasks]);
    
    const handleEditClick = (e: React.MouseEvent, group: TaskGroup) => {
        e.stopPropagation();
        setGroupToEdit(group);
        setIsEditGroupOpen(true);
    };
    
    const confirmDeleteGroup = () => {
        if (groupToDelete) {
            onDeleteGroup(groupToDelete);
            setGroupToDelete(null);
        }
    };
    
    return (
        <>
            <div className="w-full lg:w-[80%] mx-auto">
                <Droppable droppableId="task-groups" type="GROUP" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                             <Accordion type="multiple" defaultValue={groupedTasks.map(g => g.id)} className="w-full space-y-4">
                                {groupedTasks.map((group, index) => {
                                    // Tasks are already sorted by order in the parent component
                                    const groupTasks = group.tasks;
                                    
                                    const currentPage = groupPagination[group.id] || 0;
                                    const ITEMS_PER_PAGE = 10;
                                    const paginatedTasks = groupTasks.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);
                                    const totalPages = Math.ceil(groupTasks.length / ITEMS_PER_PAGE);

                                    // Check if any overdue tasks exist in this group
                                    const hasOverdueTask = groupTasks.some(t => t.dueDate && !t.completed && isBefore(new Date(t.dueDate), startOfToday()));
                                    const isReordering = reorderingGroupIds.has(group.id);

                                    return (
                                        <Draggable draggableId={group.id} index={index} key={group.id} isDragDisabled={group.id === 'default'}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps}>
                                                    <AccordionItem 
                                                        value={group.id} 
                                                        className={cn(
                                                            "bg-card rounded-lg border relative transition-all",
                                                            hasOverdueTask && "shadow-lg shadow-destructive/20 border-destructive/30"
                                                        )}
                                                    >
                                                        {hasOverdueTask && (
                                                            <div className="absolute inset-[-2px] rounded-[calc(var(--radius)+2px)] bg-gradient-to-r from-destructive/40 to-destructive/10 animate-pulse -z-10" />
                                                        )}
                                                        <div className="flex items-center px-4 py-3 group">
                                                            {/* Drag handle removed as per request */}
                                                            
                                                            <AccordionTrigger className="flex-1 p-0 hover:no-underline">
                                                                <div className="flex items-center gap-2 flex-1 mr-4">
                                                                    <span className="text-base font-semibold text-left">{group.name}</span>
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {group.tasks.length}
                                                                    </Badge>
                                                                </div>
                                                            </AccordionTrigger>
                                                            <div className="flex items-center gap-1 pl-4 opacity-100 transition-opacity">
                                                                {/* Group Reordering Controls */}
                                                                {onMoveGroup && (
                                                                    <div className="flex items-center gap-0.5 mr-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onMoveGroup(group.id, 'up');
                                                                            }}
                                                                            title="Move Group Up"
                                                                        >
                                                                            <ArrowUp className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-7 w-7"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onMoveGroup(group.id, 'down');
                                                                            }}
                                                                            title="Move Group Down"
                                                                        >
                                                                            <ArrowDown className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                )}

                                                                {/* Task Reordering Toggle */}
                                                                <Button
                                                                    variant={isReordering ? "secondary" : "ghost"}
                                                                    size="sm"
                                                                    className={cn("h-7 gap-1.5 mr-2", isReordering && "bg-secondary text-secondary-foreground")}
                                                                    onClick={(e) => toggleGroupReordering(e, group.id)}
                                                                    title="Toggle Reorder (Alt+R)"
                                                                >
                                                                    {isReordering ? <Check className="h-3.5 w-3.5" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
                                                                    <span className="text-xs">{isReordering ? "Done" : "Reorder"}</span>
                                                                </Button>

                                                                {group.id !== 'default' && (
                                                                    <>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon" 
                                                                            className="h-7 w-7 rounded-full"
                                                                            onClick={(e) => handleEditClick(e, group)}
                                                                        >
                                                                            <Pencil className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon" 
                                                                            className="h-7 w-7 rounded-full hover:bg-destructive/20"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setGroupToDelete(group.id);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <AccordionContent>
                                                            <Droppable droppableId={group.id} type="TASK" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.droppableProps}
                                                                        className="space-y-2 p-3 pt-0"
                                                                    >
                                                                        {paginatedTasks.length > 0 ? (
                                                                            paginatedTasks.map((task, index) => (
                                                                                <TaskItem 
                                                                                    key={task.id}
                                                                                    task={task}
                                                                                    index={index}
                                                                                    onUpdate={onUpdateTask}
                                                                                    onDelete={onDeleteTask}
                                                                                    isSelected={selectedTasks?.includes(task.id)}
                                                    onToggleSelection={onToggleSelection}
                                                    isDragDisabled={isDragDisabled}
                                                    isReordering={isReordering}
                                                    onMoveTask={onMoveTask}
                                                />
                                            ))
                                                                        ) : (
                                                                            <p className="text-muted-foreground text-sm p-4 text-center">No tasks in this group yet.</p>
                                                                        )}
                                                                        {provided.placeholder}
                                                                    </div>
                                                                )}
                                                            </Droppable>
                                                            {totalPages > 1 && (
                                                                <div className="flex items-center justify-between px-3 py-2 border-t mt-2">
                                                                    <span className="text-xs text-muted-foreground">
                                                                        Page {currentPage + 1} of {totalPages}
                                                                    </span>
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            disabled={currentPage === 0}
                                                                            onClick={() => onPageChange?.(group.id, currentPage - 1)}
                                                                        >
                                                                            <ChevronLeft className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            disabled={currentPage >= totalPages - 1}
                                                                            onClick={() => onPageChange?.(group.id, currentPage + 1)}
                                                                        >
                                                                            <ChevronRight className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </div>
                                            )}
                                        </Draggable>
                                    )
                                })}
                                 {provided.placeholder}
                            </Accordion>
                        </div>
                    )}
                </Droppable>
            </div>
            <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the group. All tasks within this group will be moved to the Default group. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setGroupToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteGroup}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AddGroupDialog 
                isOpen={isEditGroupOpen}
                onOpenChange={setIsEditGroupOpen}
                onAddGroup={()=>{}}
                onUpdateGroup={(updated) => {
                    onUpdateGroup(updated);
                    setIsEditGroupOpen(false);
                }}
                groupToEdit={groupToEdit || undefined}
            />
        </>
    );
}
