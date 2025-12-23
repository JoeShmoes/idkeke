'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, Plus, Trash2 } from 'lucide-react';
import { useApp } from '@/components/layout/app-provider';

interface SheetFile {
  id: string;
  name: string;
  content: any[][]; // For simplicity, using a 2D array for sheet data
  createdAt: string;
}

export default function SheetsPage() {
  const { sheets, setSheets } = useApp();
  const [selectedSheet, setSelectedSheet] = useState<SheetFile | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[firstSheetName];
      const content = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      const newSheet: SheetFile = {
        id: Date.now().toString(),
        name: file.name,
        content: content.length ? content : Array.from({ length: 20 }, () => Array(10).fill('')),
        createdAt: new Date().toISOString(),
      };
      setSheets(prev => [...prev, newSheet]);
      setSelectedSheet(newSheet);
    };
    reader.readAsArrayBuffer(file);
  };

  const createNewSheet = () => {
    const newSheet: SheetFile = {
      id: Date.now().toString(),
      name: 'Untitled Sheet',
      content: Array.from({ length: 20 }, () => Array(10).fill('')),
      createdAt: new Date().toISOString(),
    };
    setSheets(prev => [...prev, newSheet]);
    setSelectedSheet(newSheet);
  };

  const deleteSheet = (sheetId: string) => {
    setSheets(prev => prev.filter(s => s.id !== sheetId));
    if (selectedSheet?.id === sheetId) {
      setSelectedSheet(null);
    }
  };

  const downloadSelectedSheet = () => {
    if (!selectedSheet) return;
    const ws = XLSX.utils.aoa_to_sheet(selectedSheet.content);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${selectedSheet.name.endsWith('.xlsx') ? selectedSheet.name : selectedSheet.name + '.xlsx'}`);
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    if (!selectedSheet) return;

    const updatedContent = selectedSheet.content.map((row, rIdx) =>
      rIdx === rowIndex
        ? row.map((cell, cIdx) => (cIdx === colIndex ? value : cell))
        : row
    );

    const updatedSheet = { ...selectedSheet, content: updatedContent };
    setSelectedSheet(updatedSheet);
    setSheets(prev => prev.map(s => s.id === selectedSheet.id ? updatedSheet : s));
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border/50 bg-background/95 backdrop-blur-md flex flex-col">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Sheets</h2>
              <p className="text-sm text-muted-foreground">Spreadsheet editor</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button onClick={createNewSheet} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              New Sheet
            </Button>
            <Button onClick={() => document.getElementById('file-upload')?.click()} variant="outline" className="w-full gap-2">
              <Upload className="h-4 w-4" />
              Upload Sheet
            </Button>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {sheets.map(sheet => (
              <Card
                key={sheet.id}
                className={`cursor-pointer hover:bg-accent/50 ${selectedSheet?.id === sheet.id ? 'bg-accent' : ''}`}
                onClick={() => setSelectedSheet(sheet)}
              >
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">{sheet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Created on {new Date(sheet.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedSheet ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">{selectedSheet.name}</h1>
                <Button variant="destructive" size="sm" onClick={() => deleteSheet(selectedSheet.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button size="sm" onClick={downloadSelectedSheet} className="ml-2">
                  Export XLSX
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <table className="w-full border-collapse">
                  <tbody>
                    {selectedSheet.content.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td key={colIndex} className="border border-border p-0">
                            <Input
                              type="text"
                              value={cell}
                              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                              className="w-full h-full border-0 rounded-none focus-visible:ring-1 focus-visible:ring-primary"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Select a sheet or create a new one</h3>
              <p className="text-muted-foreground">
                Upload an existing spreadsheet or start from scratch.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
