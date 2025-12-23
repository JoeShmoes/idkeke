'use client';

import { useState, useEffect } from 'react';
import type { BrandProfile } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';
import FontSelector from './font-selector';
import { Label } from '../ui/label';

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

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <Label className="capitalize mb-2 block">Headline Font</Label>
        <FontSelector
            selectedFont={fonts.headline}
            onSelect={(font) => handleFontChange('headline', font)}
        />
        <p className="mt-2 p-4 bg-muted rounded-md text-2xl font-bold" style={{fontFamily: fonts.headline}}>The quick brown fox jumps over the lazy dog.</p>
      </div>
       <div>
        <Label className="capitalize mb-2 block">Body Font</Label>
        <FontSelector
            selectedFont={fonts.body}
            onSelect={(font) => handleFontChange('body', font)}
        />
        <p className="mt-2 p-4 bg-muted rounded-md text-base" style={{fontFamily: fonts.body}}>The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog.</p>
      </div>
    </div>
  );
}
