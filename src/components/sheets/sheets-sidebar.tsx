'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SheetFile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SheetsSidebarProps {
  sheets: SheetFile[];
  activeSheetId: string | null;
  onSelectSheet: (id: string) => void;
  onDeleteSheet: (id: string) => void;
  onCreateSheet: () => void;
}

export default function SheetsSidebar({
  sheets,
  activeSheetId,
  onSelectSheet,
  onDeleteSheet,
  onCreateSheet
}: SheetsSidebarProps) {
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (sheetToDelete) {
      onDeleteSheet(sheetToDelete);
      setSheetToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-secondary/30 border-r">
      <div className="p-4 border-b flex items-center justify-between">
         <h2 className="font-semibold">Sheets</h2>
         <Button onClick={onCreateSheet} size="sm" variant="outline" className="h-8 w-8 p-0">
            <Plus className="h-4 w-4" />
         </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sheets.map(sheet => (
            <div
              key={sheet.id}
              onClick={() => onSelectSheet(sheet.id)}
              className={cn(
                'w-full text-left p-3 rounded-md group transition-all cursor-pointer flex items-center gap-3 relative',
                activeSheetId === sheet.id
                  ? 'bg-background shadow-sm border border-border'
                  : 'hover:bg-background/50 border border-transparent'
              )}
            >
              <div className="p-2 text-primary">
                 <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-medium text-sm truncate">{sheet.name}</h3>
                <p className="text-[10px] text-muted-foreground truncate">
                   {formatDistanceToNow(new Date(sheet.createdAt), { addSuffix: true })}
                </p>
              </div>
               <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 hover:text-destructive"
                  onClick={(e) => {
                      e.stopPropagation();
                      setSheetToDelete(sheet.id);
                  }}
              >
                  <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {sheets.length === 0 && (
              <div className="text-center p-4 text-sm text-muted-foreground">
                  No sheets yet. Create one to get started.
              </div>
          )}
        </div>
      </ScrollArea>
      <AlertDialog open={!!sheetToDelete} onOpenChange={(open) => !open && setSheetToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Delete Sheet?</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to delete this sheet? This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSheetToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
