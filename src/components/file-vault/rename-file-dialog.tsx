
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

import { Pencil } from 'lucide-react';

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
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Pencil className="h-5 w-5 text-primary" />
                </div>
                <DialogTitle>Rename {itemType}</DialogTitle>
            </div>
            <DialogDescription>
              Enter a new name for "{file?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="name">New Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="bg-secondary/50 border-border/50 focus:bg-background transition-all"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="shadow-lg shadow-primary/20">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
