
'use client';

import { useState } from 'react';
import type { BrandProfile, LogoAsset, VaultFile } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import Image from 'next/image';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { PlusCircle, Trash2, UploadCloud, FileArchive, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
  } from '@/components/ui/dialog';
import { useApp } from '../layout/app-provider';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface LogoManagerProps {
  profile: BrandProfile;
  onUpdate: (updatedProfile: BrandProfile) => void;
}

const AddLogoDialog = ({ open, onOpenChange, onAdd }: { open: boolean, onOpenChange: (open: boolean) => void, onAdd: (name: string, url: string) => void }) => {
    const { vaultFiles } = useApp();
    const [name, setName] = useState('');
    const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
    const [isVaultSelectorOpen, setIsVaultSelectorOpen] = useState(false);

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFileDataUrl(event.target?.result as string);
                if (!name) {
                    setName(file.name.split('.').slice(0, -1).join('.'));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.gif'] },
        multiple: false
    });
    
    const handleAdd = () => {
        if (name && fileDataUrl) {
            onAdd(name, fileDataUrl);
            resetState();
        }
    }
    
    const resetState = () => {
        setName('');
        setFileDataUrl(null);
        onOpenChange(false);
    }
    
    const handleSelectFromVault = (file: VaultFile) => {
        setName(file.name.split('.').slice(0, -1).join('.') || 'Vault Image');
        setFileDataUrl(file.content);
        setIsVaultSelectorOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add New Logo</DialogTitle>
                    <DialogDescription>
                        Upload a file from your device or choose an existing image from your File Vault.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div 
                        {...getRootProps()} 
                        className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                    >
                        <input {...getInputProps()} />
                        {fileDataUrl ? (
                            <div className="flex flex-col items-center gap-2">
                                <Image src={fileDataUrl} alt="Preview" width={80} height={80} className="object-contain max-h-20" />
                                <p className="text-sm font-medium">Image Selected</p>
                                <p className="text-xs text-muted-foreground">Drop a new file to replace.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <UploadCloud className="h-8 w-8" />
                                <p>Drag & drop an image here, or click to select</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="logo-name">Logo Name</Label>
                        <Input 
                            id="logo-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Primary Logo (Dark)"
                            autoFocus
                        />
                    </div>
                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>
                    <Dialog open={isVaultSelectorOpen} onOpenChange={setIsVaultSelectorOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <FileArchive className="h-4 w-4 mr-2" />
                                Choose from File Vault
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl h-[70vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Select from File Vault</DialogTitle>
                                <DialogDescription>Choose an image from your saved files.</DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="flex-1 -mx-6 px-2">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
                                {vaultFiles.filter(f => f.type.startsWith('image/')).map(file => (
                                    <button 
                                        key={file.id} 
                                        className="border rounded-lg p-2 flex flex-col items-center justify-center gap-2 text-center hover:bg-accent hover:border-primary"
                                        onClick={() => handleSelectFromVault(file)}
                                    >
                                        <Image src={file.content} alt={file.name} width={60} height={60} className="object-contain h-16" />
                                        <p className="text-xs font-medium truncate w-full">{file.name}</p>
                                    </button>
                                ))}
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={resetState}>Cancel</Button>
                    <Button type="button" onClick={handleAdd} disabled={!name || !fileDataUrl}>Add Logo</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function LogoManager({ profile, onUpdate }: LogoManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddLogo = (name: string, url: string) => {
    if (!name.trim() || !url.trim()) return;

    const newLogo: LogoAsset = {
      id: `logo-${Date.now()}`,
      name: name,
      url: url,
    };
    
    onUpdate({ ...profile, logos: [...profile.logos, newLogo] });
    setIsAddDialogOpen(false);
  };
  
  const handleRemoveLogo = (logoId: string) => {
      const updatedLogos = profile.logos.filter(logo => logo.id !== logoId);
      onUpdate({ ...profile, logos: updatedLogos });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {profile.logos.map(logo => (
            <Card key={logo.id} className="group relative overflow-hidden transition-shadow hover:shadow-lg">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-2 aspect-square bg-muted/30">
                    <Image 
                        src={logo.url}
                        alt={logo.name}
                        width={100}
                        height={100}
                        className="object-contain max-h-24"
                        data-ai-hint="logo"
                    />
                </CardContent>
                 <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <p className="text-sm font-medium text-white mb-2 truncate">{logo.name}</p>
                    <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveLogo(logo.id)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </Card>
        ))}
        <button 
            onClick={() => setIsAddDialogOpen(true)}
            className="flex flex-col items-center justify-center gap-2 aspect-square border-2 border-dashed rounded-lg text-muted-foreground hover:bg-accent hover:border-primary hover:text-primary transition-colors"
        >
            <PlusCircle className="h-8 w-8" />
            <p className="text-sm font-medium">Add Logo</p>
        </button>
        <AddLogoDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAdd={handleAddLogo} />
    </div>
  );
}
