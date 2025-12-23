
'use client';

import type { Task } from '@/lib/types';
import TaskItem from './task-item';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TaskListGroupByDateProps {
    groupedTasks: { title: string; tasks: Task[]; color: string }[];
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
}

export default function TaskListGroupByDate({ groupedTasks, onUpdateTask, onDeleteTask }: TaskListGroupByDateProps) {
    return (
        <div className="w-full lg:w-[80%] mx-auto">
             <Accordion type="multiple" defaultValue={groupedTasks.map(g => g.title)} className="w-full space-y-4">
                {groupedTasks.map(group => (
                    <AccordionItem value={group.title} key={group.title} className="bg-card rounded-lg border">
                         <AccordionTrigger className="px-4 py-3 hover:no-underline group">
                            <span className={cn("text-base font-semibold flex-1 text-left", group.color)}>{group.title}</span>
                         </AccordionTrigger>
                         <AccordionContent>
                             <div className="space-y-2 p-3 pt-0">
                                {group.tasks.length > 0 ? (
                                    group.tasks.map((task, index) => (
                                        <TaskItem 
                                            key={task.id}
                                            task={task}
                                            index={index}
                                            onUpdate={onUpdateTask}
                                            onDelete={onDeleteTask}
                                            isGroupedByDate={true}
                                        />
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm p-4 text-center">No tasks in this group.</p>
                                )}
                            </div>
                         </AccordionContent>
                    </AccordionItem>
                ))}
             </Accordion>
        </div>
    );
}
