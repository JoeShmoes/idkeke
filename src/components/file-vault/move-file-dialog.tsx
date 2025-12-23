
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
import { Label } from '@/components/ui/label';
import type { VaultFile, VaultFolder } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface MoveFileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (fileId: string, newFolderId: string | undefined) => void;
  file: VaultFile | null;
  folders: VaultFolder[];
}

export default function MoveFileDialog({ isOpen, onOpenChange, onSave, file, folders }: MoveFileDialogProps) {
  const [folderId, setFolderId] = useState<string>('root');

  useEffect(() => {
    if (file) {
      setFolderId(file.folderId || 'root');
    }
  }, [file]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    onSave(file.id, folderId === 'root' ? undefined : folderId);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Move File</DialogTitle>
            <DialogDescription>
              Select a folder to move "{file?.name}" into.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder">Folder</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger id="folder">
                    <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="root">-- Root --</SelectItem>
                    {folders.map(folder => (
                        <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Move File</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
