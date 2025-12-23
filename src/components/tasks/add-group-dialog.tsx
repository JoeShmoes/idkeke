
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
import type { TaskGroup } from '@/lib/types';

interface AddGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddGroup: (groupName: string) => void;
  onUpdateGroup?: (group: TaskGroup) => void;
  groupToEdit?: TaskGroup;
}

export default function AddGroupDialog({ isOpen, onOpenChange, onAddGroup, onUpdateGroup, groupToEdit }: AddGroupDialogProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (groupToEdit && isOpen) {
        setName(groupToEdit.name);
    } else {
        setName('');
    }
  }, [groupToEdit, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (groupToEdit && onUpdateGroup) {
        onUpdateGroup({ ...groupToEdit, name });
    } else {
        onAddGroup(name);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{groupToEdit ? 'Edit Group' : 'Create New Group'}</DialogTitle>
            <DialogDescription>
              Enter a name for your task group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g., Marketing Projects" 
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{groupToEdit ? 'Save Changes' : 'Create Group'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
