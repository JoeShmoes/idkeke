
'use client';

import { useState } from 'react';
import type { BrandProfile, BrandLink } from '@/lib/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PlusCircle, Trash2, Link, Globe, Twitter, Instagram, Facebook, ExternalLink, Copy } from 'lucide-react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
  } from '@/components/ui/dialog';

interface BrandLinksManagerProps {
  profile: BrandProfile;
  onUpdate: (updatedProfile: BrandProfile) => void;
}

const getIconForUrl = (url: string) => {
    if (url.includes('twitter.com') || url.includes('x.com')) return <Twitter className="h-5 w-5 text-muted-foreground" />;
    if (url.includes('instagram.com')) return <Instagram className="h-5 w-5 text-muted-foreground" />;
    if (url.includes('facebook.com')) return <Facebook className="h-5 w-5 text-muted-foreground" />;
    return <Globe className="h-5 w-5 text-muted-foreground" />;
};


export default function BrandLinksManager({ profile, onUpdate }: BrandLinksManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const links = profile.links || [];

  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;

    const newLink: BrandLink = {
      id: `link-${Date.now()}`,
      title: newLinkTitle,
      url: newLinkUrl,
    };
    
    onUpdate({ ...profile, links: [...links, newLink] });
    setNewLinkTitle('');
    setNewLinkUrl('');
    setIsAddDialogOpen(false);
  };
  
  const handleRemoveLink = (linkId: string) => {
      const updatedLinks = links.filter(link => link.id !== linkId);
      onUpdate({ ...profile, links: updatedLinks });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map(link => (
            <ContextMenu key={link.id}>
                <ContextMenuTrigger asChild>
                    <div className="group relative border rounded-lg p-4 flex items-center gap-4 transition-shadow hover:shadow-md cursor-pointer">
                        <div>
                            {getIconForUrl(link.url)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{link.title}</p>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline truncate block">{link.url}</a>
                        </div>
                        <Button 
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive absolute top-2 right-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveLink(link.id);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                    <ContextMenuItem onClick={() => window.open(link.url, '_blank')}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Link
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => copyToClipboard(link.url)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                    </ContextMenuItem>
                    <ContextMenuItem className="text-destructive" onClick={() => handleRemoveLink(link.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Link
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        ))}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                 <button className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg text-muted-foreground hover:bg-accent hover:border-primary hover:text-primary transition-colors">
                    <PlusCircle className="h-8 w-8" />
                    <p className="text-sm font-medium">Add New Link</p>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Link</DialogTitle>
                    <DialogDescription>
                        Enter the title and URL for the new link.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="link-title">Link Title</Label>
                        <Input 
                            id="link-title"
                            value={newLinkTitle}
                            onChange={(e) => setNewLinkTitle(e.target.value)}
                            placeholder="e.g., Official Website"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="link-url">URL</Label>
                        <Input 
                            id="link-url"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            placeholder="e.g., https://example.com"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button type="button" onClick={handleAddLink}>Add Link</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
