
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemCount: number;
}

export default function DeleteConfirmationDialog({ 
  isOpen, 
  onOpenChange, 
  onConfirm, 
  title = "Delete Items",
  description,
  itemCount 
}: DeleteConfirmationDialogProps) {
  
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            {description || `Are you sure you want to delete ${itemCount} item${itemCount !== 1 ? 's' : ''}? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-start gap-3 p-3 mt-2 rounded-lg bg-red-500/5 border border-red-500/10 text-sm text-red-600/90 dark:text-red-400/90">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>Warning: Items will be permanently removed from your vault. Make sure you have backups if needed.</p>
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleConfirm}
            className="shadow-lg shadow-red-500/20"
          >
            Delete Forever
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
