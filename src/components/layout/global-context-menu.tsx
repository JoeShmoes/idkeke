
'use client';

import { useRouter } from 'next/navigation';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  ArrowLeft, ArrowRight, Home, Settings, Moon, Sun, PanelLeft, Plus,
  Notebook, CheckSquare, Search, File, Edit, Trash2, CheckCircle,
} from 'lucide-react';
import { useApp } from './app-provider';
import type { Theme, Task, Note, Project, VaultFile, VaultFolder } from '@/lib/types';
import { useSidebar } from '../ui/sidebar';
import { useHover } from './hover-context';
import { useCommandPalette } from './search-palette';
import { useState } from 'react';

export default function GlobalContextMenu({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { appSettings, setAppSettings, isDataLoaded, setTasks, setNotes } = useApp();
  const { toggleSidebar } = useSidebar();
  const { hoveredItem } = useHover();
  const { setOpen } = useCommandPalette();
  const [contextItem, setContextItem] = useState(hoveredItem);

  const handleThemeCycle = () => {
    const themes = appSettings.themeCycle || ['light', 'dark'];
    const next = themes[(themes.indexOf(appSettings.theme) + 1) % themes.length] || 'light';
    setAppSettings((prev) => ({ ...prev, theme: next as Theme }));
  };

  const handleGoTo = (path: string) => {
    router.push(path);
  };
  
  const handleNewNote = () => {
      router.push('/notes');
  }

  const handleNewTask = () => {
       router.push('/tasks');
  }

  const handleToggleTask = () => {
    if (contextItem?.type === 'task') {
        const task = contextItem.data as Task;
        setTasks(prev => prev.map(t => t.id === task.id ? {...t, completed: !t.completed} : t));
    }
  }

  const handleDeleteNote = () => {
    if (contextItem?.type === 'note') {
        const note = contextItem.data as Note;
        setNotes(prev => prev.filter(n => n.id !== note.id));
    }
  }

  if (!isDataLoaded) {
    return <>{children}</>;
  }

  const ThemeIcon = appSettings.theme.includes('dark') || appSettings.theme.includes('matrix') ? Moon : Sun;
  
  const onOpenChange = (open: boolean) => {
    if (open) {
      setContextItem(hoveredItem);
    }
  };


  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger className="block w-full h-full">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {contextItem?.type === 'task' && (
            <>
                <ContextMenuItem onClick={handleToggleTask}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>Mark as {(contextItem.data as Task).completed ? 'Incomplete' : 'Complete'}</span>
                </ContextMenuItem>
                <ContextMenuSeparator />
            </>
        )}
        {contextItem?.type === 'note' && (
            <>
                <ContextMenuItem onClick={() => router.push(`/notes?noteId=${(contextItem.data as Note).id}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Note</span>
                </ContextMenuItem>
                <ContextMenuItem className="text-destructive" onClick={handleDeleteNote}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Note</span>
                </ContextMenuItem>
                <ContextMenuSeparator />
            </>
        )}
        
        {contextItem?.type === 'project' && (
             <>
                <ContextMenuItem onClick={() => contextItem.data.onEdit(contextItem.data)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Project</span>
                </ContextMenuItem>
                <ContextMenuItem className="text-destructive" onClick={() => contextItem.data.onDelete(contextItem.data.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Project</span>
                </ContextMenuItem>
                <ContextMenuSeparator />
            </>
        )}

        {contextItem?.type === 'fileOrFolder' && (
             <>
                <ContextMenuItem onClick={() => contextItem.data.onRename(contextItem.data)}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Rename</span>
                </ContextMenuItem>
                <ContextMenuItem className="text-destructive" onClick={() => contextItem.data.onDelete({id: contextItem.data.id, type: contextItem.data.type})}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                </ContextMenuItem>
                <ContextMenuSeparator />
            </>
        )}

        <ContextMenuItem onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>Go Back</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => router.forward()}>
          <ArrowRight className="mr-2 h-4 w-4" />
          <span>Go Forward</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleGoTo('/dashboard')}>
            <Home className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Plus className="mr-2 h-4 w-4" />
            <span>New...</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={handleNewNote}>
              <Notebook className="mr-2 h-4 w-4" />
              <span>New Note</span>
            </ContextMenuItem>
             <ContextMenuItem onClick={handleNewTask}>
              <CheckSquare className="mr-2 h-4 w-4" />
              <span>New Task</span>
            </ContextMenuItem>
             <ContextMenuItem onClick={() => handleGoTo('/file-vault')}>
              <File className="mr-2 h-4 w-4" />
              <span>Upload File</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuItem onClick={() => setOpen(true)}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search...</span>
        </ContextMenuItem>

        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={toggleSidebar}>
          <PanelLeft className="mr-2 h-4 w-4" />
          <span>Toggle Sidebar</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleThemeCycle}>
          <ThemeIcon className="mr-2 h-4 w-4" />
          <span>Cycle Theme</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleGoTo('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
