
'use client'

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Project } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Link as LinkIcon, X, Copy } from 'lucide-react';
import { Badge } from '../ui/badge';

type ProjectStatus = 'not-started' | 'in-progress' | 'completed';

interface AddProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddProject: (project: Omit<Project, 'id'>) => void;
  projectToEdit?: Project;
  currentLevel?: number;
}

const PROJECT_TEMPLATES = [
    {
        id: 'dev',
        name: 'Software Development',
        description: 'Standard agile software development project.',
        links: [{ title: 'Repo', url: 'https://github.com' }, { title: 'Board', url: 'https://jira.com' }]
    },
    {
        id: 'marketing',
        name: 'Marketing Campaign',
        description: 'Quarterly marketing initiative.',
        links: [{ title: 'Analytics', url: 'https://analytics.google.com' }, { title: 'Assets', url: 'https://drive.google.com' }]
    },
    {
        id: 'event',
        name: 'Event Planning',
        description: 'Logistics for upcoming event.',
        links: [{ title: 'Venue', url: 'https://maps.google.com' }, { title: 'Schedule', url: 'https://calendar.google.com' }]
    }
];

export default function AddProjectDialog({ isOpen, onOpenChange, onAddProject, projectToEdit, currentLevel = 0 }: AddProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('not-started');
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);
  const [currentLinkTitle, setCurrentLinkTitle] = useState('');
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');

  const applyTemplate = (templateId: string) => {
    const template = PROJECT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
        setName(template.name);
        setDescription(template.description);
        setLinks(template.links);
    }
  };

  useEffect(() => {
    if (isOpen) {
        if (projectToEdit) {
            setName(projectToEdit.name);
            setDescription(projectToEdit.description);
            setStatus(projectToEdit.status);
            setLinks(projectToEdit.links || []);
        } else {
            setName('');
            setDescription('');
            setStatus('not-started');
            setLinks([]);
        }
        setCurrentLinkTitle('');
        setCurrentLinkUrl('');
    }
  }, [projectToEdit, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddProject({ name, description, status, links });
    onOpenChange(false);
  };

  const handleAddLink = () => {
    if (currentLinkTitle.trim() && currentLinkUrl.trim()) {
        setLinks([...links, { title: currentLinkTitle, url: currentLinkUrl }]);
        setCurrentLinkTitle('');
        setCurrentLinkUrl('');
    }
  }

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{projectToEdit ? 'Edit Project' : 'Create New Project'}</DialogTitle>
            <DialogDescription>
              Enter the details for your project below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!projectToEdit && currentLevel >= 30 && (
                <div className="space-y-2">
                    <Label>Project Template <Badge variant="secondary" className="ml-2 text-[10px]">Level 30 Unlocked</Badge></Label>
                    <Select onValueChange={applyTemplate}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a template (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            {PROJECT_TEMPLATES.map(t => (
                                <SelectItem key={t.id} value={t.id}>
                                    <div className="flex items-center gap-2">
                                        <Copy className="h-4 w-4 text-muted-foreground" />
                                        <span>{t.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g., Q1 Product Launch" 
                autoFocus
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe this project."
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: ProjectStatus) => setStatus(value)}>
                    <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Separator />
            <div className="space-y-3">
                <Label>Project Links</Label>
                <div className="flex flex-wrap gap-2">
                    {links.map((link, index) => (
                        <Badge key={index} variant="secondary" className="group">
                            {link.title}
                            <button onClick={() => handleRemoveLink(index)} type="button" className="ml-1.5 opacity-50 group-hover:opacity-100 rounded-full hover:bg-muted-foreground/20">
                                <X className="h-3 w-3"/>
                            </button>
                        </Badge>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Input 
                        placeholder="Link Title" 
                        value={currentLinkTitle} 
                        onChange={(e) => setCurrentLinkTitle(e.target.value)}
                    />
                    <Input 
                        placeholder="URL" 
                        value={currentLinkUrl} 
                        onChange={(e) => setCurrentLinkUrl(e.target.value)}
                    />
                     <Button type="button" size="icon" onClick={handleAddLink} disabled={!currentLinkTitle.trim() || !currentLinkUrl.trim()}>
                        <LinkIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{projectToEdit ? 'Save Changes' : 'Create Project'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
