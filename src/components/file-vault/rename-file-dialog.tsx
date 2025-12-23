
'use client';

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
import type { VaultFile, VaultFolder } from '@/lib/types';

interface RenameFileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (itemId: string, newName: string) => void;
  file: VaultFile | VaultFolder | null;
}

export default function RenameFileDialog({ isOpen, onOpenChange, onSave, file }: RenameFileDialogProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (file) {
      setName(file.name);
    }
  }, [file]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return;
    onSave(file.id, name);
    onOpenChange(false);
  };

  const itemType = file && 'size' in file ? 'File' : 'Folder';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename {itemType}</DialogTitle>
            <DialogDescription>
              Enter a new name for "{file?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">New Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
