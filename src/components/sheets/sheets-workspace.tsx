'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { SheetFile } from '@/lib/types';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface CellStyle {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right';
}

interface CellData {
    value: string;
    style?: CellStyle;
}

interface SheetsWorkspaceProps {
  sheet: SheetFile;
  onUpdate: (sheet: SheetFile) => void;
}

const COLS = 26; // A-Z
const ROWS = 50;

const getColLabel = (index: number) => String.fromCharCode(65 + index);

export default function SheetsWorkspace({ sheet, onUpdate }: SheetsWorkspaceProps) {
  // Normalize initial data to CellData objects
  const initializeData = (content: any[][]): CellData[][] => {
      return Array.from({ length: ROWS }, (_, r) => 
          Array.from({ length: COLS }, (_, c) => {
              const cell = content[r]?.[c];
              if (typeof cell === 'string') return { value: cell, style: {} };
              if (typeof cell === 'object' && cell !== null) return { value: cell.value || '', style: cell.style || {} };
              return { value: '', style: {} };
          })
      );
  };

  const [data, setData] = useState<CellData[][]>(() => initializeData(sheet.content));
  const [selection, setSelection] = useState<{start: {r: number, c: number}, end: {r: number, c: number}} | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [editingCell, setEditingCell] = useState<{r: number, c: number} | null>(null);
  
  // Sync internal state when sheet changes (only if ID changes to avoid loop)
  useEffect(() => {
    setData(initializeData(sheet.content));
  }, [sheet.id]);

  const updateSheet = (newData: CellData[][]) => {
      setData(newData);
      onUpdate({
          ...sheet,
          content: newData // Note: Type definition might need update or cast
      });
  };

  const handleMouseDown = (r: number, c: number) => {
      if (editingCell) return; // Don't select while editing
      setIsSelecting(true);
      setSelection({ start: { r, c }, end: { r, c } });
  };

  const handleMouseEnter = (r: number, c: number) => {
      if (isSelecting && selection) {
          setSelection({ ...selection, end: { r, c } });
      }
  };

  const handleMouseUp = () => {
      setIsSelecting(false);
  };

  useEffect(() => {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const getSelectedRange = () => {
      if (!selection) return null;
      const minR = Math.min(selection.start.r, selection.end.r);
      const maxR = Math.max(selection.start.r, selection.end.r);
      const minC = Math.min(selection.start.c, selection.end.c);
      const maxC = Math.max(selection.start.c, selection.end.c);
      return { minR, maxR, minC, maxC };
  };

  const isSelected = (r: number, c: number) => {
      const range = getSelectedRange();
      if (!range) return false;
      return r >= range.minR && r <= range.maxR && c >= range.minC && c <= range.maxC;
  };

  const handleCellChange = (value: string) => {
      if (!editingCell) return;
      const { r, c } = editingCell;
      const newData = [...data];
      newData[r] = [...newData[r]];
      newData[r][c] = { ...newData[r][c], value };
      setData(newData);
  };

  const handleBlur = () => {
      if (editingCell) {
          updateSheet(data);
          setEditingCell(null);
      }
  };

  const toggleStyle = (key: keyof CellStyle, value?: any) => {
      const range = getSelectedRange();
      if (!range) return;

      const newData = [...data];
      for (let r = range.minR; r <= range.maxR; r++) {
          newData[r] = [...newData[r]];
          for (let c = range.minC; c <= range.maxC; c++) {
              const currentStyle = newData[r][c].style || {};
              const newValue = value !== undefined ? value : !currentStyle[key as keyof typeof currentStyle];
              newData[r][c] = {
                  ...newData[r][c],
                  style: { ...currentStyle, [key]: newValue }
              };
          }
      }
      updateSheet(newData);
  };

  // Paste Logic
  const handlePaste = useCallback((e: ClipboardEvent) => {
      // If the user is typing in an input (e.g. renaming sheet, or editing a cell), let native paste handle it
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
      }

      if (!selection) return;

      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain');
      if (!text) return;

      const rows = text.split(/\r\n|\n|\r/).filter(row => row.trim() !== ''); // Basic split
      if (rows.length === 0) return;

      const newData = [...data];
      const startR = Math.min(selection.start.r, selection.end.r);
      const startC = Math.min(selection.start.c, selection.end.c);

      rows.forEach((rowStr, i) => {
          const r = startR + i;
          if (r >= ROWS) return;
          
          const cells = rowStr.split('\t');
          newData[r] = [...newData[r]];
          
          cells.forEach((cellStr, j) => {
              const c = startC + j;
              if (c >= COLS) return;
              
              newData[r][c] = {
                  ...newData[r][c],
                  value: cellStr.trim()
              };
          });
      });
      updateSheet(newData);
  }, [data, selection, editingCell]);

  useEffect(() => {
      document.addEventListener('paste', handlePaste as any);
      return () => document.removeEventListener('paste', handlePaste as any);
  }, [handlePaste]);

  // Delete/Backspace Logic
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (editingCell) return;
          // If the user is typing in an input (e.g. renaming sheet), let native handle it
          const target = e.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
              return;
          }

          if (!selection) return;

          if (e.key === 'Delete' || e.key === 'Backspace') {
              e.preventDefault();
              const range = getSelectedRange();
              if (!range) return;

              const newData = [...data];
              for (let r = range.minR; r <= range.maxR; r++) {
                  newData[r] = [...newData[r]];
                  for (let c = range.minC; c <= range.maxC; c++) {
                      newData[r][c] = {
                          ...newData[r][c],
                          value: ''
                      };
                  }
              }
              updateSheet(newData);
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selection, editingCell, data]);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden select-none">
        {/* Toolbar */}
        <div className="h-10 border-b flex items-center px-4 gap-2 bg-card">
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStyle('bold')}>
                    <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStyle('italic')}>
                    <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStyle('underline')}>
                    <Underline className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStyle('align', 'left')}>
                    <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStyle('align', 'center')}>
                    <AlignCenter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStyle('align', 'right')}>
                    <AlignRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                <span className="font-bold text-green-600">Fx</span>
                <span className="truncate max-w-[200px]">
                    {selection ? 
                        (editingCell ? data[editingCell.r][editingCell.c].value : data[selection.start.r][selection.start.c].value) 
                        : 'Select a cell'}
                </span>
            </div>
        </div>

        <ScrollArea className="flex-1 w-full h-full">
            <div className="inline-block min-w-full">
                {/* Header Row */}
                <div className="flex sticky top-0 z-10">
                    <div className="w-10 h-8 bg-muted border-b border-r flex items-center justify-center text-xs font-medium text-muted-foreground select-none sticky left-0 z-20">
                        #
                    </div>
                    {Array.from({ length: COLS }).map((_, i) => (
                        <div key={i} className="w-24 h-8 bg-muted border-b border-r flex items-center justify-center text-xs font-medium text-muted-foreground select-none shrink-0">
                            {getColLabel(i)}
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {data.map((row, r) => (
                    <div key={r} className="flex">
                        {/* Row Number */}
                        <div className="w-10 h-8 bg-muted border-b border-r flex items-center justify-center text-xs font-medium text-muted-foreground select-none sticky left-0 z-10 shrink-0">
                            {r + 1}
                        </div>
                        {/* Cells */}
                        {row.map((cell, c) => {
                            const active = isSelected(r, c);
                            const isEditing = editingCell?.r === r && editingCell?.c === c;
                            const style = cell.style || {};
                            
                            return (
                                <div 
                                    key={`${r}-${c}`} 
                                    className={cn(
                                        "w-24 h-8 border-b border-r shrink-0 relative p-0 cursor-cell flex items-center overflow-hidden",
                                        active && "bg-blue-50/50 ring-1 ring-inset ring-blue-500 z-0",
                                        active && !isEditing && "bg-blue-100/30",
                                        isEditing && "ring-2 ring-green-500 z-10 bg-background"
                                    )}
                                    onMouseDown={() => handleMouseDown(r, c)}
                                    onMouseEnter={() => handleMouseEnter(r, c)}
                                    onDoubleClick={() => setEditingCell({r, c})}
                                >
                                    {isEditing ? (
                                        <input
                                            autoFocus
                                            className={cn(
                                                "w-full h-full px-1 text-sm bg-transparent outline-none",
                                                style.bold && "font-bold",
                                                style.italic && "italic",
                                                style.underline && "underline",
                                                style.align && `text-${style.align}`
                                            )}
                                            value={cell.value}
                                            onChange={(e) => handleCellChange(e.target.value)}
                                            onBlur={handleBlur}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleBlur();
                                            }}
                                        />
                                    ) : (
                                        <div className={cn(
                                            "w-full h-full px-1 text-sm whitespace-nowrap overflow-hidden text-ellipsis leading-8",
                                            style.bold && "font-bold",
                                            style.italic && "italic",
                                            style.underline && "underline",
                                            style.align && `text-${style.align}`
                                        )}>
                                            {cell.value}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    </div>
  );
}
