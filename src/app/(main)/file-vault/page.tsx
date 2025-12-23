'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Download,
  File,
  Folder,
  Plus,
  Trash2,
  Search,
  Grid,
  List,
  MoreVertical,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Eye,
  Share,
  Cloud
} from 'lucide-react';
import { useApp } from '@/components/layout/app-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface VaultFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // Base64 encoded content
  folderId?: string;
  uploadedAt: string; // ISO date string
  starred: boolean;
}

interface VaultFolder {
  id: string;
  name: string;
  parentId?: string;
  starred: boolean;
}

export default function FileVaultPage() {
  const { vaultFiles, setVaultFiles, vaultFolders, setVaultFolders } = useApp();
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [cloudDialogOpen, setCloudDialogOpen] = useState(false);
  const [connectedClouds, setConnectedClouds] = useState<string[]>([]);
  const [tipOpen, setTipOpen] = useState(false);

  useEffect(() => {
    try {
      const shown = sessionStorage.getItem('filevault_zip_tip_shown') === 'true';
      if (!shown) {
        setTipOpen(true);
        sessionStorage.setItem('filevault_zip_tip_shown', 'true');
      }
    } catch {}
  }, []);

  const handleConnectCloud = (provider: string) => {
    // Simulate connection
    setConnectedClouds(prev => [...prev, provider]);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
        return FileText;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return FileImage;
      case 'mp4':
      case 'avi':
      case 'mov':
        return FileVideo;
      case 'mp3':
      case 'wav':
      case 'flac':
        return FileAudio;
      case 'zip':
      case 'rar':
      case '7z':
        return Archive;
      default:
        return File;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);

    Array.from(files).forEach((file, i) => {
      const fileId = `${Date.now()}-${i}`;
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
        }
      };

      reader.onload = () => {
        const base64Content = reader.result as string;
        const newFile: VaultFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          content: base64Content,
          folderId: currentFolder || undefined,
          uploadedAt: new Date().toISOString(),
          starred: false,
        };
        setVaultFiles(prev => [...prev, newFile]);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      };

      reader.onerror = () => {
        console.error('File reading failed');
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsUploading(false);
  };

  const deleteFile = (fileId: string) => {
    setVaultFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const downloadFile = (file: VaultFile) => {
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const createFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      const newFolder: VaultFolder = {
        id: Date.now().toString(),
        name: folderName,
        parentId: currentFolder || undefined,
        starred: false
      };
      setVaultFolders(prev => [...prev, newFolder]);
    }
  };

  const filteredFiles = vaultFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (file.folderId || '') === (currentFolder || '')
  );

  const currentFolders = vaultFolders.filter(folder =>
    (folder.parentId || null) === currentFolder
  );

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border/50 bg-background/95 backdrop-blur-md flex flex-col">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <File className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">File Vault</h2>
              <p className="text-sm text-muted-foreground">Secure file storage</p>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={() => fileInputRef.current?.click()} className="w-full gap-2" disabled={isUploading}>
              <Upload className="h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Button>
            <Button onClick={createFolder} variant="outline" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              New Folder
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <div className="space-y-1">
              <Button
                variant={currentFolder === null ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setCurrentFolder(null)}
              >
                <Folder className="h-4 w-4" />
                Root
              </Button>
              {vaultFolders.map((folder) => (
                <Button
                  key={folder.id}
                  variant={currentFolder === folder.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => setCurrentFolder(folder.id)}
                >
                  <Folder className="h-4 w-4" />
                  {folder.name}
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <File className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">File Vault</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredFiles.length} files • {formatFileSize(filteredFiles.reduce((acc, file) => acc + file.size, 0))} total
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <div className="flex border border-border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="p-4 border-b border-border/50">
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([fileId, progress]) => {
                const file = vaultFiles.find(f => f.id === fileId);
                return (
                  <div key={fileId} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file?.name || 'Uploading...'}</p>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Files */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {filteredFiles.length === 0 && currentFolders.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-8 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                  <File className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No files found</h3>
                <p className="text-muted-foreground mb-4">
                  Upload files or create folders to get started.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                  <Button variant="outline" onClick={createFolder}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Folders */}
                {currentFolders.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Folders</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {currentFolders.map((folder) => (
                        <Card
                          key={folder.id}
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => setCurrentFolder(folder.id)}
                        >
                          <CardContent className="p-4 text-center">
                            <Folder className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium truncate">{folder.name}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                {filteredFiles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Files</h3>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredFiles.map((file) => {
                          const IconComponent = getFileIcon(file.name);
                          return (
                            <Card key={file.id} className="group hover:bg-accent/50 transition-colors" onDoubleClick={() => setPreviewFile(file)}>
                              <CardContent className="p-4">
                                <div className="flex flex-col items-center text-center">
                                  <IconComponent className="h-8 w-8 mb-2 text-muted-foreground" />
                                  <p className="text-sm font-medium truncate w-full" title={file.name}>
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)}
                                  </p>
                                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="ghost" onClick={() => downloadFile(file)}>
                                      <Download className="h-3 w-3" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="ghost">
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Preview
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => downloadFile(file)}>
                                          <Download className="h-4 w-4 mr-2" />
                                          Download
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => deleteFile(file.id)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredFiles.map((file) => {
                          const IconComponent = getFileIcon(file.name);
                          return (
                            <Card key={file.id} className="hover:bg-accent/50 transition-colors" onDoubleClick={() => setPreviewFile(file)}>
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => downloadFile(file)}>
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="ghost">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                       <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setPreviewFile(file)}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Preview
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => downloadFile(file)}>
                                          <Download className="h-4 w-4 mr-2" />
                                          Download
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => deleteFile(file.id)}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
      <Dialog open={!!previewFile} onOpenChange={(o) => !o && setPreviewFile(null)}>
        <DialogContent className="max-w-3xl">
          {previewFile && (
            <div className="space-y-3">
              <DialogTitle>{previewFile.name}</DialogTitle>
              <DialogDescription>Preview</DialogDescription>
              {previewFile.type.startsWith('image/') && (
                <img src={previewFile.content} alt={previewFile.name} className="max-h-[60vh] object-contain" />
              )}
              {previewFile.type === 'application/pdf' && (
                <iframe src={previewFile.content} className="w-full h-[60vh]" />
              )}
              {previewFile.type.startsWith('text/') && (
                <pre className="w-full h-[60vh] overflow-auto bg-muted p-3 rounded">{previewFile.content}</pre>
              )}
              {!previewFile.type.startsWith('image/') && previewFile.type !== 'application/pdf' && !previewFile.type.startsWith('text/') && (
                <p className="text-sm text-muted-foreground">Preview not available for this file type.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cloudDialogOpen} onOpenChange={setCloudDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Connect Cloud Storage</DialogTitle>
                <DialogDescription>Link your cloud storage accounts to access files directly.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                {['Google Drive', 'Dropbox', 'OneDrive'].map(provider => (
                    <div key={provider} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-full">
                                <Cloud className="h-5 w-5" />
                            </div>
                            <span className="font-medium">{provider}</span>
                        </div>
                        <Button 
                            variant={connectedClouds.includes(provider) ? "outline" : "default"}
                            onClick={() => handleConnectCloud(provider)}
                            disabled={connectedClouds.includes(provider)}
                        >
                            {connectedClouds.includes(provider) ? "Connected" : "Connect"}
                        </Button>
                    </div>
                ))}
            </div>
        </DialogContent>
      </Dialog>
      <Dialog open={tipOpen} onOpenChange={setTipOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Tip</DialogTitle>
            <DialogDescription>
              We recommend uploading files as a single ZIP archive for faster uploads and fewer browser limits. You can still upload individual files if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setTipOpen(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
