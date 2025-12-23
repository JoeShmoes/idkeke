
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImagePreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  imageUrl: string | null;
}

export default function ImagePreviewDialog({ isOpen, onOpenChange, imageUrl }: ImagePreviewDialogProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-4">
        <DialogHeader>
          <DialogTitle>Image Preview</DialogTitle>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="Preview" className="max-w-full max-h-full object-contain" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
