
'use client'

import { useState, useEffect } from 'react';
import { useApp } from '../layout/app-provider';
import type { NavGroup, NavItem } from '@/lib/types';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { Card } from './settings-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { GripVertical, Trash2, Pencil, PlusCircle, Save, RotateCcw, Package } from 'lucide-react';
import { Badge } from '../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
  } from '@/components/ui/dialog';
import { allNavItems } from '@/lib/nav-items';
import { useToast } from '@/hooks/use-toast';
import { iconMap, type IconName } from '@/lib/icons';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const IconComponent = ({ name }: { name: string }) => {
    const Icon = iconMap[name as keyof typeof iconMap];
    return Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : <Package className="h-4 w-4 text-muted-foreground" />;
};


export default function SidebarNavSettings() {
    const { appSettings, setAppSettings } = useApp();
    const { toast } = useToast();
    const [navStructure, setNavStructure] = useState<NavGroup[]>(appSettings.navStructure);
    const [newSectionName, setNewSectionName] = useState('');
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [editingSectionName, setEditingSectionName] = useState('');
    const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);

    // New state for the add room dialog
    const [newRoomLabel, setNewRoomLabel] = useState('');
    const [newRoomHref, setNewRoomHref] = useState('');
    const [newRoomIcon, setNewRoomIcon] = useState<IconName>('Cpu');
    const [newRoomSection, setNewRoomSection] = useState('Main');
    
    useEffect(() => {
        setNavStructure(appSettings.navStructure);
    }, [appSettings.navStructure]);


    const handleOnDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, type } = result;

        const newStructure = Array.from(navStructure);

        if (source.droppableId === destination.droppableId) {
            // Reordering within the same section
            const sectionIndex = newStructure.findIndex(s => s.label === source.droppableId);
            if (sectionIndex === -1) return;
            const section = newStructure[sectionIndex];
            const [reorderedItem] = section.items.splice(source.index, 1);
            section.items.splice(destination.index, 0, reorderedItem);
        } else {
            // Moving between sections
            const sourceSectionIndex = newStructure.findIndex(s => s.label === source.droppableId);
            const destSectionIndex = newStructure.findIndex(s => s.label === destination.droppableId);
            if (sourceSectionIndex === -1 || destSectionIndex === -1) return;

            const sourceSection = newStructure[sourceSectionIndex];
            const destSection = newStructure[destSectionIndex];

            const [movedItem] = sourceSection.items.splice(source.index, 1);
            destSection.items.splice(destination.index, 0, movedItem);
        }
        setNavStructure(newStructure);
    };

    const handleAddSection = () => {
        if (!newSectionName.trim() || navStructure.some(s => s.label === newSectionName)) return;
        const newSection: NavGroup = {
            label: newSectionName,
            items: [],
        };
        const newStructure = [...navStructure, newSection];
        setNavStructure(newStructure);
        
        // Also make the new section visible by default
        setAppSettings(prev => {
            const newVisibleGroups = [...prev.sidebar.visibleGroups, newSectionName];
            return {
                ...prev,
                sidebar: {
                    ...prev.sidebar,
                    visibleGroups: newVisibleGroups
                }
            };
        });
        setNewSectionName('');
    };

    const handleSaveSectionName = (sectionId: string) => {
        const newStructure = navStructure.map(s => {
            if (s.label === sectionId) {
                return { ...s, label: editingSectionName };
            }
            return s;
        });
        setNavStructure(newStructure);

        // Update the name in visibleGroups as well
        setAppSettings(prev => ({
            ...prev,
            sidebar: {
                ...prev.sidebar,
                visibleGroups: prev.sidebar.visibleGroups.map(g => g === sectionId ? editingSectionName : g)
            }
        }));

        setEditingSectionId(null);
        setEditingSectionName('');
    }
    
    const handleDeleteSection = () => {
        if (!sectionToDelete) return;
        
        const sectionIndex = navStructure.findIndex(s => s.label === sectionToDelete);
        if (sectionIndex === -1) return;
        
        const itemsToMove = navStructure[sectionIndex].items;
        
        const newStructure = navStructure.filter(s => s.label !== sectionToDelete);
        const mainSectionIndex = newStructure.findIndex(s => s.label === 'Main');
        
        if (mainSectionIndex !== -1) {
            newStructure[mainSectionIndex].items.push(...itemsToMove);
        } else {
             newStructure.unshift({ label: 'Main', items: itemsToMove });
        }
        
        setNavStructure(newStructure);

         setAppSettings(prev => ({
            ...prev,
            sidebar: {
                ...prev.sidebar,
                visibleGroups: prev.sidebar.visibleGroups.filter(g => g !== sectionToDelete)
            }
        }));

        setSectionToDelete(null);
    };

    const handleAddRoom = () => {
        if (!newRoomLabel.trim() || !newRoomHref.trim()) return;

        const newRoom: NavItem = {
            href: newRoomHref,
            label: newRoomLabel,
            icon: newRoomIcon,
            external: !newRoomHref.startsWith('/'),
        };

        const newStructure = navStructure.map(section => {
            if (section.label === newRoomSection) {
                return { ...section, items: [...section.items, newRoom] };
            }
            return section;
        });

        // Auto-generate shortcut
        const shortcutKey = `goTo${newRoomLabel.replace(/\s+/g, '')}`;
        const shortcutLetter = newRoomLabel.charAt(0).toLowerCase();
        const newShortcut = { name: `Go to ${newRoomLabel}`, keys: ['g', shortcutLetter] };

        setNavStructure(newStructure);
        setAppSettings(prev => ({
            ...prev,
            navStructure: newStructure,
            shortcuts: {
                ...prev.shortcuts,
                [shortcutKey]: newShortcut,
            }
        }))
        
        toast({ title: "Room Created!", description: `"${newRoomLabel}" has been added to your sidebar.` });
        setIsAddRoomOpen(false);
        setNewRoomLabel('');
        setNewRoomHref('');
        setNewRoomIcon('Cpu');
    }
    
    const handleDeleteRoom = (sectionLabel: string, roomHref: string) => {
        const newStructure = navStructure.map(section => {
            if (section.label === sectionLabel) {
                return { ...section, items: section.items.filter(item => item.href !== roomHref) };
            }
            return section;
        });

        // Also remove the shortcut
        const roomToDelete = navStructure.flatMap(s => s.items).find(i => i.href === roomHref);
        if (roomToDelete) {
             const shortcutKey = `goTo${roomToDelete.label.replace(/\s+/g, '')}`;
             setAppSettings(prev => {
                const newShortcuts = { ...prev.shortcuts };
                delete (newShortcuts as any)[shortcutKey];
                return { ...prev, shortcuts: newShortcuts };
             });
        }

        setNavStructure(newStructure);
    };

    const handleSaveChanges = () => {
        setAppSettings(prev => ({
            ...prev,
            navStructure: navStructure,
        }));
        toast({
            title: "Navigation Saved",
            description: "Your sidebar layout has been updated."
        })
    }

    const handleResetNavigation = () => {
        setAppSettings(prev => ({
            ...prev,
            navStructure: allNavItems,
            sidebar: {
                ...prev.sidebar,
                visibleGroups: allNavItems.map(g => g.label)
            }
        }));
        setNavStructure(allNavItems);
        toast({
            title: "Navigation Reset",
            description: "Your sidebar has been reset to the default layout."
        })
    }
    
    const isRoomCustom = (room: NavItem) => {
        return !allNavItems.flatMap(g => g.items).some(defaultItem => defaultItem.href === room.href);
    };


    return (
        <Card title="Customize Navigation">
            <p className="text-sm text-muted-foreground mb-4">
                Drag and drop rooms to reorder them or move them between sections. Changes are saved when you click the "Save Changes" button.
            </p>
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <div className="space-y-6">
                    {navStructure.map((section, sectionIndex) => (
                        <div key={section.label} className="p-4 border rounded-lg bg-secondary/30">
                            <div className="flex items-center justify-between mb-4">
                                {editingSectionId === section.label ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={editingSectionName}
                                            onChange={(e) => setEditingSectionName(e.target.value)}
                                            className="h-8"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveSectionName(section.label)}
                                        />
                                        <Button size="sm" onClick={() => handleSaveSectionName(section.label)}>Save</Button>
                                    </div>
                                ) : (
                                    <h3 className="text-lg font-semibold">{section.label}</h3>
                                )}
                                {section.label !== "Main" && editingSectionId !== section.label && (
                                     <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingSectionId(section.label); setEditingSectionName(section.label); }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setSectionToDelete(section.label)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <Droppable droppableId={section.label} type="ITEM" isDropDisabled={false}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-2 min-h-[50px] bg-background/50 rounded-md p-2"
                                    >
                                        {section.items.map((item, itemIndex) => (
                                            <Draggable key={item.href} draggableId={item.href} index={itemIndex}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="p-2 border rounded-md bg-background flex items-center gap-2 group"
                                                    >
                                                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                        <IconComponent name={item.icon as string} />
                                                        <span className="text-sm flex-1">{item.label}</span>
                                                        {isRoomCustom(item) && (
                                                            <>
                                                                <Badge variant="outline">Custom</Badge>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDeleteRoom(section.label, item.href)}>
                                                                    <Trash2 className="h-4 w-4"/>
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                    <div className="p-4 border rounded-lg border-dashed">
                         <div className="flex items-center gap-2">
                             <Input 
                                placeholder="New section name..." 
                                value={newSectionName}
                                onChange={(e) => setNewSectionName(e.target.value)}
                                className="h-9"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                             />
                            <Button size="sm" onClick={handleAddSection}><PlusCircle className="mr-2 h-4 w-4" /> Add Section</Button>
                        </div>
                    </div>
                </div>
            </DragDropContext>

             <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="w-full mt-4">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Room
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Custom Room</DialogTitle>
                        <DialogDescription>Add a new link to your sidebar.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="room-label">Room Name</Label>
                            <Input id="room-label" value={newRoomLabel} onChange={e => setNewRoomLabel(e.target.value)} placeholder="e.g., Company Blog" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room-href">URL</Label>
                            <Input id="room-href" value={newRoomHref} onChange={e => setNewRoomHref(e.target.value)} placeholder="e.g., /blog or https://company.com/blog" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="room-icon">Icon</Label>
                            <Select value={newRoomIcon} onValueChange={v => setNewRoomIcon(v as IconName)}>
                                <SelectTrigger id="room-icon"><SelectValue placeholder="Select an icon" /></SelectTrigger>
                                <SelectContent>
                                    {Object.keys(iconMap).map(iconName => (
                                        <SelectItem key={iconName} value={iconName}>
                                            <div className="flex items-center gap-2">
                                                <IconComponent name={iconName} /> {iconName}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="room-section">Section</Label>
                            <Select value={newRoomSection} onValueChange={v => setNewRoomSection(v)}>
                                <SelectTrigger id="room-section"><SelectValue placeholder="Select a section" /></SelectTrigger>
                                <SelectContent>
                                    {navStructure.map(section => (
                                        <SelectItem key={section.label} value={section.label}>{section.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsAddRoomOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddRoom}>Create Room</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="mt-6 flex justify-between items-center">
                <Button variant="outline" onClick={handleResetNavigation}>
                    <RotateCcw className="mr-2 h-4 w-4"/>
                    Reset to Default
                </Button>
                <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
            </div>
             <AlertDialog open={!!sectionToDelete} onOpenChange={(open) => !open && setSectionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will delete the "{sectionToDelete}" section. All rooms inside it will be moved to the "Main" section.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSectionToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSection}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
