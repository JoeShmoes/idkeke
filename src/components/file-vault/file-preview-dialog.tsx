
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { VaultFile } from '@/lib/types';
import { Base64 } from 'js-base64';
import * as XLSX from 'xlsx';
import { load } from 'cheerio';


interface FilePreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  file: VaultFile | null;
}

const ExcelPreview = ({ content }: { content: string }) => {
    try {
        const workbook = XLSX.read(content, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const html = XLSX.utils.sheet_to_html(worksheet);

        const $ = load(html);
        $('table').addClass('w-full table-auto border-collapse');
        $('th, td').addClass('border p-2 text-left');
        $('th').addClass('bg-muted');

        return <div dangerouslySetInnerHTML={{ __html: $.html() }} />;
    } catch (e) {
        console.error("Failed to parse excel file", e);
        return <p className="text-destructive">Could not render Excel file.</p>
    }
}


export default function FilePreviewDialog({ isOpen, onOpenChange, file }: FilePreviewDialogProps) {

  const renderPreview = () => {
    if (!file || !file.content) {
      return <p className="text-muted-foreground">No content to preview.</p>;
    }

    const mimeType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    if (mimeType.startsWith('image/')) {
      return <img src={file.content} alt={file.name} className="max-w-full max-h-full object-contain" />;
    }
    
    if (mimeType === 'application/pdf') {
        return <iframe src={file.content} className="w-full h-full" title={file.name} />;
    }

    if (['csv', 'txt', 'md'].includes(fileExtension) || mimeType.startsWith('text/')) {
        try {
            const textContent = Base64.decode(file.content.split(',')[1]);
            return <pre className="whitespace-pre-wrap text-sm">{textContent}</pre>;
        } catch (e) {
            return <p className="text-destructive">Could not decode text file.</p>
        }
    }
    
    if (mimeType.startsWith('audio/')) {
        return <audio controls src={file.content} className="w-full" />
    }

    if (mimeType.startsWith('video/')) {
        return <video controls src={file.content} className="max-w-full" />
    }
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls' || mimeType.includes('spreadsheet')) {
        const binaryString = atob(file.content.split(',')[1]);
        return <ExcelPreview content={binaryString} />;
    }
    
    if (['doc', 'docx', 'ppt', 'pptx'].includes(fileExtension) || mimeType.includes('presentation') || mimeType.includes('msword')) {
        // Use an online viewer for these complex types.
        // This relies on the file being accessible via a public URL, which our base64 data URI is not.
        // A common approach is to use a service like Google Docs Viewer or Office Web Viewer.
        // We'll use a simplified version with Google Docs Viewer for this example.
        // This will not work with data URIs, it's a placeholder for a real implementation
        // that would need to upload the file to a temporary public location or use a server-side rendering solution.
        const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(file.content)}&embedded=true`;
        // Since data URIs are too long and not supported by gview, we show a message.
        return (
            <div className="text-center p-4">
                 <p className="font-semibold">Live Preview Not Available</p>
                 <p className="text-sm text-muted-foreground">This file type ({fileExtension}) cannot be previewed directly from your local vault.</p>
                 <p className="text-xs text-muted-foreground mt-2">A future update could enable this by using a secure cloud service.</p>
            </div>
        );
    }


    return (
      <div className="text-center">
        <p className="font-semibold">Preview not available</p>
        <p className="text-sm text-muted-foreground">Cannot preview file of type: {mimeType || fileExtension}</p>
        <p className="text-xs text-muted-foreground mt-2">You can still download the file to view it.</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="truncate">Preview: {file?.name}</DialogTitle>
          <DialogDescription className="truncate">{file?.type} - {(file?.size || 0) / 1000} KB</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow p-4 bg-muted/20">
            <div className="min-h-full flex items-center justify-center">
                {renderPreview()}
            </div>
        </ScrollArea>
        <DialogFooter className="p-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
