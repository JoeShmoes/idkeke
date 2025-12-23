
'use client';

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Task, TaskGroup } from '@/lib/types';
import TaskItem from './task-item';
import { Button } from '../ui/button';
import { Trash2, Pencil, GripVertical } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import AddGroupDialog from './add-group-dialog';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { isBefore, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';
import { useEffect, useRef } from 'react';

interface TaskListProps {
    tasks: Task[];
    groups: TaskGroup[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onUpdateGroup: (group: TaskGroup) => void;
    onDeleteGroup: (groupId: string) => void;
    selectedTasks?: string[];
    onToggleSelection?: (taskId: string) => void;
}

export default function TaskList({ tasks, groups, onUpdateTask, onDeleteTask, onUpdateGroup, onDeleteGroup, selectedTasks, onToggleSelection }: TaskListProps) {
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
    const [groupToEdit, setGroupToEdit] = useState<TaskGroup | null>(null);
    const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
    const { playSound } = useSound();
    const overdueSoundPlayedRef = useRef(false);
    
    // Check for overdue tasks and play sound
    useEffect(() => {
        const hasOverdueTasks = tasks.some(t => t.dueDate && !t.completed && isBefore(new Date(t.dueDate), startOfToday()));
        if (hasOverdueTasks && !overdueSoundPlayedRef.current) {
            playSound('overdue');
            overdueSoundPlayedRef.current = true;
        } else if (!hasOverdueTasks) {
            overdueSoundPlayedRef.current = false; // Reset when no longer overdue
        }
    }, [tasks, playSound]);
    
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
                             <Accordion type="multiple" defaultValue={groups.map(g => g.id)} className="w-full space-y-4">
                                {groups.map((group, index) => {
                                    const groupTasks = tasks
                                        .filter(t => t.groupId === group.id)
                                        .sort((a,b) => (a.order || 0) - (b.order || 0));
                                    
                                    const hasOverdueTask = groupTasks.some(t => t.dueDate && !t.completed && isBefore(new Date(t.dueDate), startOfToday()));

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
                                                            <AccordionTrigger className="flex-1 p-0 hover:no-underline">
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <div {...provided.dragHandleProps} className="cursor-grab">
                                                                        <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                                                                    </div>
                                                                    <span className="text-base font-semibold text-left">{group.name}</span>
                                                                </div>
                                                            </AccordionTrigger>
                                                            {group.id !== 'default' && (
                                                                <div className="flex items-center gap-1 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                                                </div>
                                                            )}
                                                        </div>
                                                        <AccordionContent>
                                                            <Droppable droppableId={group.id} type="TASK" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.droppableProps}
                                                                        className="space-y-2 p-3 pt-0"
                                                                    >
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
                                                                                />
                                                                            ))
                                                                        ) : (
                                                                            <p className="text-muted-foreground text-sm p-4 text-center">No tasks in this group yet.</p>
                                                                        )}
                                                                        {provided.placeholder}
                                                                    </div>
                                                                )}
                                                            </Droppable>
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
