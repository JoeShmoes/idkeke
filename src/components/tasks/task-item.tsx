
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Trash2, Pencil, Repeat, GripVertical, ArrowUp, ArrowDown, ExternalLink, Copy } from 'lucide-react';
import type { Task } from '@/lib/types';
import { cn, copyToClipboard } from '@/lib/utils';
import AddTaskDialog from './add-task-dialog';
import { useApp } from '../layout/app-provider';
import { Draggable } from 'react-beautiful-dnd';
import { format, isBefore, startOfToday } from 'date-fns';
import { useHover } from '../layout/hover-context';
import { useSound } from '@/hooks/use-sound';

interface TaskItemProps {
  task: Task;
  index: number;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (taskId: string, e?: React.MouseEvent) => void;
  isGroupedByDate?: boolean;
  isDragDisabled?: boolean;
  isReordering?: boolean;
  onMoveTask?: (taskId: string, direction: 'up' | 'down') => void;
}

export default function TaskItem({ 
    task, 
    index, 
    onUpdate, 
    onDelete, 
    isSelected, 
    onToggleSelection, 
    isGroupedByDate = false, 
    isDragDisabled = false,
    isReordering = false,
    onMoveTask
}: TaskItemProps) {
  const { taskGroups } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const { setHoveredItem } = useHover();
  const { playSound } = useSound();
  
  const handleToggleCompleted = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if(e) e.stopPropagation();
    const wasCompleted = task.completed;
    const newCompleted = !task.completed;
    onUpdate({ ...task, completed: newCompleted });
    
    // Play sound when completing a task
    if (!wasCompleted && newCompleted) {
      playSound('good');
    }
  };
  
  const handleEditTask = (updatedTask: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    onUpdate({
        ...task,
        ...updatedTask,
    });
    setIsEditing(false);
  }

  const hasRepeat = task.repeat && (
    task.repeat.everyday ||
    task.repeat.Monday ||
    task.repeat.Tuesday ||
    task.repeat.Wednesday ||
    task.repeat.Thursday ||
    task.repeat.Friday ||
    task.repeat.Saturday ||
    task.repeat.Sunday
  );
  
  const isOverdue = task.dueDate && !task.completed && isBefore(new Date(task.dueDate), startOfToday());
  const taskGroup = taskGroups.find(g => g.id === task.groupId);


  const renderContent = (provided?: any, snapshot?: any) => (
      <div 
        ref={provided?.innerRef} 
        {...provided?.draggableProps}
        {...provided?.dragHandleProps}
        data-selectable="true"
        data-id={task.id}
        className={cn(
            !isGroupedByDate && "w-full",
            snapshot?.isDragging && "z-50"
        )}
        onMouseEnter={() => setHoveredItem({ 
            type: 'task', 
            data: { 
                ...task, 
                onDelete: () => onDelete(task.id),
                onEdit: () => setIsEditing(true)
            } 
        })}
        onMouseLeave={() => setHoveredItem(null)}
        onClick={(e) => {
            // Prevent selection if clicking on controls/inputs
            if ((e.target as HTMLElement).closest('button, input, [role="checkbox"]')) return;
            onToggleSelection?.(task.id, e);
        }}
       >
         <ContextMenu>
            <ContextMenuTrigger>
                <Card className={cn(
                    "transition-all duration-200 group bg-background border relative", 
                    "hover:shadow-md hover:border-primary/20",
                    task.completed && "bg-card/50 opacity-80", 
                    snapshot?.isDragging && "shadow-2xl ring-2 ring-primary/20 scale-[1.02] rotate-1 opacity-100 bg-background",
                    isSelected && "bg-primary/5 border-primary/30 ring-1 ring-primary/20",
                    isReordering && "border-dashed"
                )}>
                    <CardContent className="p-3 flex items-center gap-3">
                         {/* Drag Handle REMOVED as per request */}
                         
                         {/* Manual Move Buttons - Only visible in Reorder Mode */}
                         {isReordering && onMoveTask && (
                            <div className="flex flex-col gap-0.5">
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-4 w-4 text-muted-foreground hover:text-foreground" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMoveTask(task.id, 'up');
                                    }}
                                >
                                    <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-4 w-4 text-muted-foreground hover:text-foreground"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMoveTask(task.id, 'down');
                                    }}
                                >
                                    <ArrowDown className="h-3 w-3" />
                                </Button>
                            </div>
                         )}

                         <Checkbox  
                            id={`task-${task.id}`}
                            checked={task.completed}
                            onClick={handleToggleCompleted}
                            className="h-5 w-5 mt-0.5"
                        />
                        <div className="flex-grow cursor-pointer" onClick={() => onToggleSelection && onToggleSelection(task.id)}>
                        <label 
                            htmlFor={`task-${task.id}`}
                            className={cn(
                                "flex-grow text-sm font-medium cursor-pointer text-foreground", 
                                task.completed && "line-through text-muted-foreground",
                            )}
                        >
                            {task.name}
                        </label>
                        {task.description && (
                            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            {task.dueDate && <span className={cn("font-medium", isOverdue && "text-destructive")}>{format(new Date(task.dueDate), 'MMM dd')}</span>}
                            {hasRepeat && (
                                <Repeat className="h-3 w-3" />
                            )}
                             {taskGroup && isGroupedByDate && (
                                <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">{taskGroup.name}</span>
                            )}
                        </div>
                        </div>

                        <div className="flex items-center gap-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditing(true)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(task.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                <ContextMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                </ContextMenuItem>
                <ContextMenuItem className="text-destructive" onClick={() => onDelete(task.id)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </ContextMenuItem>
            </ContextMenuContent>
         </ContextMenu>
      </div>
  );

  return (
    <>
      {isGroupedByDate ? renderContent() : (
        <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
            {(provided, snapshot) => renderContent(provided, snapshot)}
        </Draggable>
      )}
      <AddTaskDialog
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        onAddTask={handleEditTask}
        groups={taskGroups}
        task={task}
      />
    </>
  );
}
