
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
import type { LearningResource, LearningResourceType, LearningResourceStatus } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AddResourceDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (resource: Omit<LearningResource, 'id' | 'createdAt'>) => void;
  resourceToEdit?: LearningResource;
}

export default function AddResourceDialog({ isOpen, onOpenChange, onSave, resourceToEdit }: AddResourceDialogProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<LearningResourceType>('article');
  const [status, setStatus] = useState<LearningResourceStatus>('todo');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (resourceToEdit) {
            setTitle(resourceToEdit.title);
            setUrl(resourceToEdit.url);
            setType(resourceToEdit.type);
            setStatus(resourceToEdit.status);
            setNotes(resourceToEdit.notes || '');
        } else {
            setTitle('');
            setUrl('');
            setType('article');
            setStatus('todo');
            setNotes('');
        }
    }
  }, [resourceToEdit, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    onSave({ title, url, type, status, notes });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{resourceToEdit ? 'Edit Resource' : 'Add New Learning Resource'}</DialogTitle>
            <DialogDescription>
              Enter the details for your learning resource below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g., How to Build a Startup" 
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input 
                id="url"
                type="url"
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="https://example.com/article" 
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={(value: LearningResourceType) => setType(value)}>
                        <SelectTrigger id="type">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="course">Course</SelectItem>
                            <SelectItem value="book">Book</SelectItem>
                            <SelectItem value="podcast">Podcast</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={(value: LearningResourceStatus) => setStatus(value)}>
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any relevant notes about this resource."
                />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{resourceToEdit ? 'Save Changes' : 'Add Resource'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
