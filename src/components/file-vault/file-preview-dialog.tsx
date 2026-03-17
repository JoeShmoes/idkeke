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
import { 
    Eye, 
    FileText, 
    FileImage, 
    FileSpreadsheet, 
    File, 
    Download, 
    X, 
    FileMusic, 
    FileVideo, 
    ExternalLink,
    Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
        $('table').addClass('w-full table-auto border-collapse text-sm');
        $('th, td').addClass('border border-border p-2 text-left');
        $('th').addClass('bg-muted/50 font-medium text-muted-foreground');
        $('tr:nth-child(even)').addClass('bg-muted/20');

        return (
            <div className="rounded-md border border-border overflow-hidden bg-background shadow-sm">
                <div dangerouslySetInnerHTML={{ __html: $.html() }} />
            </div>
        );
    } catch (e) {
        console.error("Failed to parse excel file", e);
        return (
            <div className="flex flex-col items-center justify-center p-8 text-destructive gap-2">
                <FileSpreadsheet className="h-10 w-10 opacity-50" />
                <p>Could not render Excel file.</p>
            </div>
        );
    }
}


export default function FilePreviewDialog({ isOpen, onOpenChange, file }: FilePreviewDialogProps) {

  const getFileIconProps = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return { icon: FileText, color: 'text-red-500', fill: 'bg-red-500/10' };
      case 'doc':
      case 'docx':
        return { icon: FileText, color: 'text-blue-500', fill: 'bg-blue-500/10' };
      case 'xls':
      case 'xlsx':
      case 'csv':
        return { icon: FileSpreadsheet, color: 'text-green-500', fill: 'bg-green-500/10' };
      case 'ppt':
      case 'pptx':
        return { icon: FileSpreadsheet, color: 'text-orange-500', fill: 'bg-orange-500/10' };
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return { icon: FileImage, color: 'text-purple-500', fill: 'bg-purple-500/10' };
      case 'mp3':
      case 'wav':
      case 'ogg':
        return { icon: FileMusic, color: 'text-pink-500', fill: 'bg-pink-500/10' };
      case 'mp4':
      case 'webm':
      case 'mov':
        return { icon: FileVideo, color: 'text-rose-500', fill: 'bg-rose-500/10' };
      default:
        return { icon: File, color: 'text-gray-500', fill: 'bg-gray-500/10' };
    }
  };

  const handleDownload = () => {
    if (!file) return;
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderPreview = () => {
    if (!file || !file.content) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <div className="p-4 rounded-full bg-muted/30">
                <File className="h-8 w-8 opacity-50" />
            </div>
            <p>No content to preview.</p>
        </div>
      );
    }

    const mimeType = file.type;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    if (mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
            <img 
                src={file.content} 
                alt={file.name} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-md border border-border/50" 
            />
        </div>
      );
    }
    
    if (mimeType === 'application/pdf' || fileExtension === 'pdf') {
        return (
            <div className="w-full h-[calc(90vh-140px)] bg-secondary/20 rounded-lg flex flex-col overflow-hidden">
                <iframe 
                    src={file.content} 
                    className="w-full h-full rounded-lg shadow-sm border border-border"
                    title="PDF Preview"
                />
            </div>
        );
    }

    if (['csv', 'txt', 'md', 'json', 'xml', 'js', 'ts', 'jsx', 'tsx', 'css', 'html'].includes(fileExtension) || mimeType.startsWith('text/')) {
        try {
            // Handle both base64 and plain text if needed, though file.content is usually base64 data URI
            let textContent = '';
            if (file.content.includes('base64,')) {
                textContent = Base64.decode(file.content.split(',')[1]);
            } else {
                textContent = file.content;
            }
            return (
                <div className="bg-muted/30 p-4 rounded-lg border border-border/50 shadow-inner">
                    <pre className="whitespace-pre-wrap text-sm font-mono text-foreground/80">{textContent}</pre>
                </div>
            );
        } catch (e) {
            return (
                 <div className="flex flex-col items-center justify-center p-8 text-destructive gap-2">
                    <FileText className="h-10 w-10 opacity-50" />
                    <p>Could not decode text file.</p>
                </div>
            );
        }
    }
    
    if (mimeType.startsWith('audio/')) {
        return (
             <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
                <div className="p-8 rounded-full bg-pink-500/10 animate-pulse">
                    <FileMusic className="h-16 w-16 text-pink-500" />
                </div>
                <audio controls src={file.content} className="w-full max-w-md" />
            </div>
        )
    }

    if (mimeType.startsWith('video/')) {
        return (
            <div className="flex items-center justify-center bg-black/5 rounded-lg overflow-hidden">
                 <video controls src={file.content} className="max-w-full max-h-full rounded-lg shadow-lg" />
            </div>
        )
    }
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls' || mimeType.includes('spreadsheet')) {
        const binaryString = atob(file.content.split(',')[1]);
        return <ExcelPreview content={binaryString} />;
    }
    
    if (['doc', 'docx', 'ppt', 'pptx'].includes(fileExtension) || mimeType.includes('presentation') || mimeType.includes('msword')) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                 <div className="p-6 rounded-full bg-primary/5 ring-1 ring-primary/20">
                    <ExternalLink className="h-10 w-10 text-primary" />
                 </div>
                 <div className="space-y-1">
                    <p className="font-semibold text-lg">Live Preview Not Available</p>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        This file type ({fileExtension}) cannot be previewed directly from your local vault.
                    </p>
                 </div>
                 <Button onClick={handleDownload} variant="outline" className="mt-4 gap-2">
                    <Download className="h-4 w-4" />
                    Download to View
                 </Button>
            </div>
        );
    }


    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="p-6 rounded-full bg-muted/50">
            <File className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-1">
            <p className="font-semibold text-lg">Preview not available</p>
            <p className="text-sm text-muted-foreground">Cannot preview file of type: {mimeType || fileExtension}</p>
        </div>
        <Button onClick={handleDownload} variant="outline" className="mt-4 gap-2">
            <Download className="h-4 w-4" />
            Download File
        </Button>
      </div>
    );
  };

  const { icon: Icon, color, fill } = file ? getFileIconProps(file.name) : { icon: File, color: 'text-gray-500', fill: 'bg-gray-500/10' };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border/40 bg-muted/20 sticky top-0 z-10 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className={cn("p-2 rounded-lg flex-shrink-0", fill)}>
                <Icon className={cn("h-5 w-5", color)} />
             </div>
             <div className="flex flex-col min-w-0">
                <DialogTitle className="truncate text-base font-semibold pr-4">{file?.name}</DialogTitle>
                <DialogDescription className="truncate text-xs">
                    {file?.type} • {file?.size ? (file.size / 1024).toFixed(1) : 0} KB
                </DialogDescription>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
                <X className="h-4 w-4" />
             </Button>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-grow p-0 bg-secondary/5">
            <div className="min-h-full flex flex-col p-6">
                {renderPreview()}
            </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t border-border/50 bg-secondary/20 backdrop-blur-md flex justify-between items-center sm:justify-between">
            <div className="text-xs text-muted-foreground hidden sm:block">
                {file?.lastModified ? `Last modified: ${new Date(file.lastModified).toLocaleString()}` : ''}
            </div>
            <div className="flex gap-2">
                <Button onClick={handleDownload} className="gap-2 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20">
                    <Download className="h-4 w-4" />
                    Download
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
