
'use client';

import { Droppable, Draggable } from 'react-beautiful-dnd';
import type { Project } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHover } from '../layout/hover-context';

type ProjectStatus = 'not-started' | 'in-progress' | 'completed';

const statusConfig: Record<ProjectStatus, { label: string; color: string }> = {
    'not-started': { label: 'Not Started', color: 'bg-gray-500' },
    'in-progress': { label: 'In Progress', color: 'bg-blue-500' },
    'completed': { label: 'Completed', color: 'bg-green-500' },
};

const statusColumns: ProjectStatus[] = ['not-started', 'in-progress', 'completed'];

const ProjectCard = ({ project, index, onEdit, onDelete }: { project: Project, index: number, onEdit: (project: Project) => void, onDelete: (projectId: string) => void }) => {
  const { setHoveredItem } = useHover();
  
  return (
    <Draggable draggableId={project.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onDoubleClick={() => onEdit(project)}
          onMouseEnter={() => setHoveredItem({ type: 'project', data: { ...project, onEdit, onDelete } })}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardHeader className="p-4 flex flex-row items-start justify-between">
              <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(project)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(project.id)}><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">{project.description}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

interface ProjectKanbanBoardProps {
    projects: Project[];
    onEditProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
}

export default function ProjectKanbanBoard({ projects, onEditProject, onDeleteProject }: ProjectKanbanBoardProps) {

    return (
        <div className="flex gap-6 h-full overflow-x-auto pb-4 px-4 sm:px-6 lg:px-8 force-scrollbar">
            {statusColumns.map(status => {
                const columnProjects = projects.filter(p => p.status === status);
                return (
                    <div key={status} className="w-80 flex-shrink-0 bg-secondary/50 rounded-lg h-full flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2.5 w-2.5 rounded-full", statusConfig[status].color)}></div>
                                <h3 className="text-base font-semibold">{statusConfig[status].label}</h3>
                            </div>
                            <span className="text-sm font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{columnProjects.length}</span>
                        </div>
                        <Droppable droppableId={status} type="PROJECT" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                            {(provided, snapshot) => (
                                <ScrollArea 
                                    className="flex-1"
                                >
                                    <div 
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn("p-3 space-y-3 transition-colors min-h-[100px]", snapshot.isDraggingOver && 'bg-primary/10')}
                                    >
                                        {columnProjects.length > 0 ? (
                                            columnProjects.map((project, index) => (
                                                <ProjectCard 
                                                    key={project.id}
                                                    project={project}
                                                    index={index}
                                                    onEdit={onEditProject}
                                                    onDelete={onDeleteProject}
                                                />
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                {snapshot.isDraggingOver ? 'Drop project here' : 'No projects'}
                                            </div>
                                        )}
                                        {provided.placeholder}
                                    </div>
                                </ScrollArea>
                            )}
                        </Droppable>
                    </div>
                )
            })}
        </div>
    );
}
