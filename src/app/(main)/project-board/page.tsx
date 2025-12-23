
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { Project } from '@/lib/types';
import AddProjectDialog from '@/components/projects/add-project-dialog';
import { useApp } from '@/components/layout/app-provider';
import { DragDropContext, type DropResult } from 'react-beautiful-dnd';
import ProjectKanbanBoard from '@/components/projects/project-kanban-board';
import { Skeleton } from '@/components/ui/skeleton';

type ProjectStatus = 'not-started' | 'in-progress' | 'completed';

export default function ProjectBoardPage() {
  const { projects, setProjects } = useApp();
  const [isClient, setIsClient] = useState(false);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | undefined>(undefined);

  useEffect(() => {
    setIsClient(true);
  }, []);

  
  const handleAddProject = (newProject: Omit<Project, 'id'>) => {
    const projectToAdd: Project = {
      ...newProject,
      id: `proj-${Date.now()}`,
    };
    setProjects(prev => [projectToAdd, ...prev]);
  };
  
  const handleEditProject = (updatedProject: Omit<Project, 'id'>) => {
    if(!projectToEdit) return;
    setProjects(prev => prev.map(p => p.id === projectToEdit.id ? {...projectToEdit, ...updatedProject} : p))
  }

  const handleOpenEditDialog = (project: Project) => {
    setProjectToEdit(project);
    setIsAddProjectOpen(true);
  }
  
  const handleOpenAddDialog = () => {
    setProjectToEdit(undefined);
    setIsAddProjectOpen(true);
  }

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  }

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return;
    }
    
    const updatedProjects = projects.map(p => {
        if (p.id === draggableId) {
            return { ...p, status: destination.droppableId as ProjectStatus };
        }
        return p;
    });

    setProjects(updatedProjects);
  };


  if (!isClient) {
      return (
        <div className="flex-1 flex gap-6 p-4 sm:p-6 lg:p-8">
            <Skeleton className="h-[60vh] w-80 flex-shrink-0" />
            <Skeleton className="h-[60vh] w-80 flex-shrink-0" />
            <Skeleton className="h-[60vh] w-80 flex-shrink-0" />
        </div>
      )
  }

  return (
    <>
      <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 pb-4 flex justify-between items-center">
          <div>
              <h1 className="text-2xl font-bold">Project Board</h1>
              <p className="text-muted-foreground">Drag and drop projects to change their status.</p>
          </div>
          <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Project
          </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto">
          <DragDropContext onDragEnd={onDragEnd}>
              <ProjectKanbanBoard
                  projects={projects}
                  onEditProject={handleOpenEditDialog}
                  onDeleteProject={handleDeleteProject}
              />
          </DragDropContext>
      </div>

      <AddProjectDialog 
        isOpen={isAddProjectOpen}
        onOpenChange={setIsAddProjectOpen}
        onAddProject={projectToEdit ? handleEditProject : handleAddProject}
        projectToEdit={projectToEdit}
      />
    </>
  );
}
