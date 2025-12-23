'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { fontList } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface FontSelectorProps {
  selectedFont: string;
  onSelect: (font: string) => void;
}

export default function FontSelector({ selectedFont, onSelect }: FontSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{selectedFont}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search for a font..." />
          <CommandList>
            <CommandEmpty>No font found.</CommandEmpty>
            <ScrollArea className="h-72">
                <CommandGroup>
                {fontList.map((font) => (
                    <CommandItem
                    key={font}
                    value={font}
                    onSelect={(currentValue) => {
                        onSelect(currentValue === selectedFont ? '' : currentValue);
                        setOpen(false);
                    }}
                    >
                    <Check
                        className={cn(
                        'mr-2 h-4 w-4',
                        selectedFont === font ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                    {font}
                    </CommandItem>
                ))}
                </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
