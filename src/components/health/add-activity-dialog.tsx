
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
import type { Activity, ActivityCategory } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AddActivityDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (activity: Omit<Activity, 'id'>) => void;
  activityToEdit?: Activity;
}

export default function AddActivityDialog({ isOpen, onOpenChange, onSave, activityToEdit }: AddActivityDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('combat');

  useEffect(() => {
    if (isOpen) {
        if (activityToEdit) {
            setTitle(activityToEdit.title);
            setDescription(activityToEdit.description);
            setCategory(activityToEdit.category);
        } else {
            setTitle('');
            setDescription('');
            setCategory('combat');
        }
    }
  }, [activityToEdit, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSave({ title, description, category });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{activityToEdit ? 'Edit Activity' : 'Create New Activity'}</DialogTitle>
            <DialogDescription>
              Enter the details for your activity below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Activity Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g., Boxing" 
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe this activity."
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: ActivityCategory) => setCategory(value)}>
                    <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="combat">Combat</SelectItem>
                        <SelectItem value="endurance">Endurance</SelectItem>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="flexibility">Flexibility</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{activityToEdit ? 'Save Changes' : 'Create Activity'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
