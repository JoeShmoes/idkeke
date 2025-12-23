
'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { Skeleton } from '@/components/ui/skeleton';
import ColorPaletteManager from '@/components/brand-room/color-palette-manager';
import LogoManager from '@/components/brand-room/logo-manager';
import FontManager from '@/components/brand-room/font-manager';
import BrandLinksManager from '@/components/brand-room/brand-links-manager';
import type { BrandProfile } from '@/lib/types';
import { Palette, Link, Type, Image as ImageIcon } from 'lucide-react';

export default function BrandRoomPage() {
  const { brandProfile, setBrandProfile } = useApp();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleUpdate = (updatedProfile: BrandProfile) => {
    setBrandProfile(updatedProfile);
  };

  if (!isClient || !brandProfile) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  const Section = ({ icon: Icon, title, description, children }: { icon: React.ElementType, title: string, description: string, children: React.ReactNode }) => (
    <div className="p-8 border rounded-xl bg-card/50 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
            <Icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-muted-foreground">{description}</p>
            </div>
        </div>
        {children}
    </div>
  )

  return (
    <div className="space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Brand Room</h1>
            <p className="text-lg text-muted-foreground mt-2">Your central hub for managing and viewing all brand assets.</p>
        </div>

        <Section icon={ImageIcon} title="Logos" description="Manage your brand's primary, secondary, and icon logos.">
            <LogoManager profile={brandProfile} onUpdate={handleUpdate} />
        </Section>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Section icon={Palette} title="Color Palette" description="Define and copy your brand's core colors.">
                <ColorPaletteManager profile={brandProfile} onUpdate={handleUpdate} />
            </Section>
            <Section icon={Type} title="Typography" description="Set and preview your brand's primary fonts.">
                 <FontManager profile={brandProfile} onUpdate={handleUpdate} />
            </Section>
        </div>
        
        <Section icon={Link} title="Brand Links" description="A collection of important links like your website and social media profiles.">
            <BrandLinksManager profile={brandProfile} onUpdate={handleUpdate} />
        </Section>
    </div>
  );
}
