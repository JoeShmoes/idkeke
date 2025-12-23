
'use client';

import { useState, useEffect } from 'react';
import type { BrandProfile } from '@/lib/types';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '../ui/button';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ColorPaletteManagerProps {
  profile: BrandProfile;
  onUpdate: (updatedProfile: BrandProfile) => void;
}

export default function ColorPaletteManager({ profile, onUpdate }: ColorPaletteManagerProps) {
  const [colors, setColors] = useState(profile.colors);
  const debouncedColors = useDebounce(colors, 500);
  const { toast } = useToast();
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  useEffect(() => {
    if (JSON.stringify(debouncedColors) !== JSON.stringify(profile.colors)) {
      onUpdate({ ...profile, colors: debouncedColors });
    }
  }, [debouncedColors, profile, onUpdate]);

  const handleColorChange = (colorName: keyof typeof colors, value: string) => {
    setColors(prev => ({ ...prev, [colorName]: value }));
  };
  
  const handleCopy = (e: React.MouseEvent, colorValue: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(colorValue);
    setCopiedColor(colorValue);
    toast({
        title: "Copied!",
        description: `${colorValue} copied to your clipboard.`,
    });
    setTimeout(() => setCopiedColor(null), 2000);
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {Object.entries(colors).map(([name, value]) => (
        <div key={name} className="space-y-2">
            <div className="relative group w-full aspect-square rounded-lg border-2 overflow-hidden cursor-pointer">
                <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: value }} />
                <Input 
                    type="color" 
                    value={value} 
                    onChange={(e) => handleColorChange(name as keyof typeof colors, e.target.value)}
                    className="absolute inset-0 w-full h-full p-0 border-0 opacity-0 cursor-pointer"
                />
                <Button 
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleCopy(e, value)}
                >
                    {copiedColor === value ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
            <Label htmlFor={name} className="capitalize font-semibold">{name}</Label>
            <Input
              id={name}
              value={value}
              onChange={(e) => handleColorChange(name as keyof typeof colors, e.target.value)}
              className="font-mono text-sm"
            />
        </div>
      ))}
    </div>
  );
}
