'use client';

import { useState, useEffect } from 'react';
import type { BrandProfile } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';
import FontSelector from './font-selector';
import { Label } from '../ui/label';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Copy, RotateCcw, ExternalLink } from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

interface FontManagerProps {
  profile: BrandProfile;
  onUpdate: (updatedProfile: BrandProfile) => void;
}

export default function FontManager({ profile, onUpdate }: FontManagerProps) {
  const [fonts, setFonts] = useState(profile.fonts || { headline: 'Inter', body: 'Inter' });
  const debouncedFonts = useDebounce(fonts, 500);

  useEffect(() => {
    if (JSON.stringify(debouncedFonts) !== JSON.stringify(profile.fonts)) {
      onUpdate({ ...profile, fonts: debouncedFonts });
    }
  }, [debouncedFonts, profile, onUpdate]);

  const handleFontChange = (fontName: keyof typeof fonts, value: string) => {
    setFonts(prev => ({ ...prev, [fontName]: value }));
  };

  const handleCopy = (text: string) => {
    copyToClipboard(text);
  };

  const handleReset = (fontName: keyof typeof fonts) => {
     setFonts(prev => ({ ...prev, [fontName]: 'Inter' }));
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <Label className="capitalize mb-2 block">Headline Font</Label>
        <ContextMenu>
            <ContextMenuTrigger>
                <FontSelector
                    selectedFont={fonts.headline}
                    onSelect={(font) => handleFontChange('headline', font)}
                />
                <p className="mt-2 p-4 bg-muted rounded-md text-2xl font-bold" style={{fontFamily: fonts.headline}}>The quick brown fox jumps over the lazy dog.</p>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                <ContextMenuItem onClick={() => window.open(`https://fonts.google.com/specimen/${fonts.headline}`, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on Google Fonts
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleCopy(fonts.headline)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Font Name
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleReset('headline')}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Default
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
      </div>
       <div>
        <Label className="capitalize mb-2 block">Body Font</Label>
        <ContextMenu>
            <ContextMenuTrigger>
                <FontSelector
                    selectedFont={fonts.body}
                    onSelect={(font) => handleFontChange('body', font)}
                />
                <p className="mt-2 p-4 bg-muted rounded-md text-base" style={{fontFamily: fonts.body}}>The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onClick={() => handleCopy(fonts.body)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Font Name
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleReset('body')}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Default
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  );
}
