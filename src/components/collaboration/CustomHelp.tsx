'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface ShortcutGroup {
  title: string;
  items: { label: string; keys: string[] }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: "Tools",
    items: [
      { label: "Hand (Panning)", keys: ["H"] },
      { label: "Selection", keys: ["V", "1"] },
      { label: "Rectangle", keys: ["R", "2"] },
      { label: "Diamond", keys: ["D", "3"] },
      { label: "Ellipse", keys: ["O", "4"] },
      { label: "Arrow", keys: ["A", "5"] },
      { label: "Line", keys: ["L", "6"] },
      { label: "Draw", keys: ["P", "7"] },
      { label: "Text", keys: ["T", "8"] },
      { label: "Insert Image", keys: ["9"] },
      { label: "Eraser", keys: ["E", "0"] },
      { label: "Frame Tool", keys: ["F"] },
      { label: "Laser Pointer", keys: ["K"] },
    ],
  },
  {
    title: "Editor",
    items: [
      { label: "Copy", keys: ["Ctrl", "C"] },
      { label: "Paste", keys: ["Ctrl", "V"] },
      { label: "Cut", keys: ["Ctrl", "X"] },
      { label: "Undo", keys: ["Ctrl", "Z"] },
      { label: "Redo", keys: ["Ctrl", "Y"] },
      { label: "Delete", keys: ["Delete"] },
      { label: "Duplicate", keys: ["Ctrl", "D"] },
      { label: "Group", keys: ["Ctrl", "G"] },
      { label: "Ungroup", keys: ["Ctrl", "Shift", "G"] },
      { label: "Select All", keys: ["Ctrl", "A"] },
      { label: "Lock/Unlock", keys: ["Ctrl", "Shift", "L"] },
    ],
  },
  {
    title: "View",
    items: [
      { label: "Zoom In", keys: ["Ctrl", "+"] },
      { label: "Zoom Out", keys: ["Ctrl", "-"] },
      { label: "Reset Zoom", keys: ["Ctrl", "0"] },
      { label: "Fit to Screen", keys: ["Shift", "1"] },
      { label: "Zen Mode", keys: ["Alt", "Z"] },
      { label: "Toggle Grid", keys: ["Ctrl", "'"] },
      { label: "Toggle Theme", keys: ["Alt", "Shift", "D"] },
    ],
  },
  {
    title: "Shape Properties",
    items: [
      { label: "Pick Color", keys: ["I", "Shift+S"] },
      { label: "Stroke Color", keys: ["S"] },
      { label: "Background Color", keys: ["G"] },
      { label: "Font Picker", keys: ["Shift", "F"] },
      { label: "Decrease Font", keys: ["Ctrl", "Shift", "<"] },
      { label: "Increase Font", keys: ["Ctrl", "Shift", ">"] },
      { label: "Bring to Front", keys: ["Ctrl", "Shift", "]"] },
      { label: "Send to Back", keys: ["Ctrl", "Shift", "["] },
    ],
  },
];

export function CustomHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <HelpCircle className="w-5 h-5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          {SHORTCUTS.map((group) => (
            <div key={group.title}>
              <h3 className="font-semibold mb-3 text-primary">{group.title}</h3>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.label} className="flex flex-col text-sm">
                    <span className="text-muted-foreground mb-1">{item.label}</span>
                    <div className="flex flex-wrap gap-1">
                      {item.keys.map((key, k) => (
                        <kbd
                          key={k}
                          className="px-2 py-0.5 bg-muted rounded border border-border text-xs font-mono min-w-[1.5rem] text-center"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
