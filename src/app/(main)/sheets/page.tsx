'use client';

import { useState } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import SheetsSidebar from '@/components/sheets/sheets-sidebar';
import SheetsWorkspace from '@/components/sheets/sheets-workspace';
import type { SheetFile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileSpreadsheet, Maximize2, MoreHorizontal, Download, Trash2, ExternalLink, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { copyToClipboard } from '@/lib/utils';

export default function SheetsPage() {
    const { sheets, setSheets } = useApp();
    const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    // Hydration check
    useState(() => {
        setIsClient(true);
    });

    const activeSheet = sheets.find(s => s.id === activeSheetId);

    const handleCreateSheet = () => {
        const newSheet: SheetFile = {
            id: Date.now().toString(),
            name: `Untitled Spreadsheet ${sheets.length + 1}`,
            content: Array.from({ length: 50 }, () => Array(26).fill('')),
            createdAt: new Date().toISOString(),
        };
        setSheets(prev => [newSheet, ...prev]);
        setActiveSheetId(newSheet.id);
    };

    const handleDeleteSheet = (id: string) => {
        setSheets(prev => prev.filter(s => s.id !== id));
        if (activeSheetId === id) {
            setActiveSheetId(null);
        }
    };

    const handleUpdateSheet = (updatedSheet: SheetFile) => {
        setSheets(prev => prev.map(s => s.id === updatedSheet.id ? updatedSheet : s));
    };
    
    const handleRenameSheet = (name: string) => {
        if (activeSheet) {
            handleUpdateSheet({ ...activeSheet, name });
        }
    }

    if (!isClient) return null;

    return (
        <ContextMenu>
            <ContextMenuTrigger className="h-full w-full">
                <div className="h-full w-full flex flex-col bg-background">
                     {/* Top Header */}
                     <div className="h-14 border-b flex items-center px-4 justify-between bg-card">
                        <div className="flex items-center gap-3">
                            <div className="p-2 text-primary">
                                <FileSpreadsheet className="h-6 w-6" />
                            </div>
                            {activeSheet ? (
                                <>
                                    <Input 
                                        value={activeSheet.name} 
                                        onChange={(e) => handleRenameSheet(e.target.value)}
                                        className="h-8 w-64 font-semibold text-lg border-transparent hover:border-border focus:border-primary px-1 bg-transparent"
                                    />
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => setIsPopupOpen(true)}
                                            title="Open in Popup"
                                            className="h-8 w-8"
                                        >
                                            <Maximize2 className="h-4 w-4" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                            // Handle PDF download logic if available for sheets
                                            alert("PDF Download for Spreadsheets is coming soon!");
                                        }}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                            onClick={() => handleDeleteSheet(activeSheet.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Spreadsheet
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </>
                            ) : (
                                <h1 className="text-lg font-semibold">Spreadsheets</h1>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                        <ResizablePanelGroup direction="horizontal">
                            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="h-full">
                                <SheetsSidebar
                                    sheets={sheets}
                                    activeSheetId={activeSheetId}
                                    onSelectSheet={setActiveSheetId}
                                    onDeleteSheet={handleDeleteSheet}
                                    onRenameSheet={(id, name) => {
                                        const sheet = sheets.find(s => s.id === id);
                                        if (sheet) handleUpdateSheet({ ...sheet, name });
                                    }}
                                    onCreateSheet={handleCreateSheet}
                                />
                            </ResizablePanel>
                            <ResizableHandle />
                            <ResizablePanel defaultSize={80} className="h-full">
                                {activeSheet ? (
                                    <SheetsWorkspace
                                        sheet={activeSheet}
                                        onUpdate={handleUpdateSheet}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                        <FileSpreadsheet className="h-16 w-16 mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No sheet selected</p>
                                        <Button onClick={handleCreateSheet} variant="link" className="mt-2">Create a new spreadsheet</Button>
                                    </div>
                                )}
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>

                    {/* Popup Dialog */}
                    <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
                        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 gap-0">
                            <DialogHeader className="p-4 border-b">
                                <DialogTitle className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                                    {activeSheet?.name}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-hidden">
                                {activeSheet && (
                                    <SheetsWorkspace
                                        sheet={activeSheet}
                                        onUpdate={handleUpdateSheet}
                                    />
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64">
                <ContextMenuItem onClick={handleCreateSheet}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    New Spreadsheet
                </ContextMenuItem>
                <ContextMenuSeparator />
                {activeSheet && (
                    <>
                        <ContextMenuItem onClick={() => setIsPopupOpen(true)}>
                            <Maximize2 className="h-4 w-4 mr-2" />
                            Open in Popup
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => handleDeleteSheet(activeSheet.id)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Spreadsheet
                        </ContextMenuItem>
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
}
