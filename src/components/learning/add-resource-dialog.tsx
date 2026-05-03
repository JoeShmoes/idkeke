
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
import { cn } from '@/lib/utils';

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
  const [icon, setIcon] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (resourceToEdit) {
            setTitle(resourceToEdit.title);
            setUrl(resourceToEdit.url);
            setType(resourceToEdit.type);
            setStatus(resourceToEdit.status);
            setNotes(resourceToEdit.notes || '');
            setIcon(resourceToEdit.icon || '');
        } else {
            setTitle('');
            setUrl('');
            setType('article');
            setStatus('todo');
            setNotes('');
            setIcon('');
        }
    }
  }, [resourceToEdit, isOpen])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        // Even if multiple are dropped, we take the last one as the intended icon
        const file = files[files.length - 1];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setIcon(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    onSave({ 
        title, 
        url, 
        type, 
        status, 
        notes,
        icon 
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
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
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="e.g., https://example.com/article" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Optional)</Label>
              <div className="flex flex-col gap-2">
                <div 
                    className={cn(
                        "border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer transition-colors",
                        isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('icon-upload')?.click()}
                >
                    {icon ? (
                        <div className="flex items-center gap-2">
                            {(icon.startsWith('data:image') || icon.startsWith('http')) ? (
                                <img src={icon} alt="Preview" className="h-10 w-10 object-cover rounded-md" />
                            ) : (
                                <span className="text-2xl">{icon}</span>
                            )}
                            <span className="text-sm text-muted-foreground">Click or Drop to change</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center text-sm text-muted-foreground">
                            <span className="text-2xl mb-2">📥</span>
                            <span>Drag & Drop image or Click to Upload</span>
                            <span className="text-xs opacity-70">or type an emoji below</span>
                        </div>
                    )}
                    <input 
                        id="icon-upload" 
                        type="file" 
                        multiple
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                                // Take the last selected file as the icon
                                const file = files[files.length - 1];
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    setIcon(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                            }
                            // Reset input
                            e.target.value = '';
                        }} 
                    />
                </div>
                <div className="flex gap-2">
                    <Input 
                        id="icon" 
                        value={icon} 
                        onChange={(e) => setIcon(e.target.value)} 
                        placeholder="e.g., 📚 or Custom Icon" 
                        className="flex-1"
                    />
                    <div className="flex gap-1">
                        {['📚', '🎥', '🎓', '📖', '🎙️', '💻'].map(emoji => (
                            <Button 
                                key={emoji} 
                                type="button" 
                                variant="outline" 
                                size="icon"
                                onClick={() => setIcon(emoji)}
                                className="h-10 w-10"
                            >
                                {emoji}
                            </Button>
                        ))}
                    </div>
                </div>
              </div>
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
