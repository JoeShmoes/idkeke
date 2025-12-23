

'use client'

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sun, Moon, User, Sliders, CheckSquare, CircleDollarSign, FileDown, Keyboard, Palette, Bot, Lock, EyeOff, Loader2, Sidebar as SidebarIcon, Compass, KanbanSquare, Save, Search as SearchIcon, Download, Laptop, AppWindow } from 'lucide-react';
import { useApp } from '../layout/app-provider';
import ProfileSettings from './profile-settings';
import type { Shortcut, Theme, SidebarSide, SidebarVariant, SidebarCollapsible, TaskView, AppSettings } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { allAchievements } from '@/lib/achievements';
import { useMemo } from 'react';
import { allNavItems } from '@/lib/nav-items';
import { Input } from '../ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Checkbox } from '../ui/checkbox';
import SidebarNavSettings from './sidebar-nav-settings';


interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const settingsNav = {
    "Global": [
        { id: 'universal', label: 'Universal', icon: Sliders },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'theme', label: 'Theme', icon: Palette },
        { id: 'sidebar', label: 'Sidebar', icon: SidebarIcon },
        { id: 'navigation', label: 'Navigation', icon: Compass },
        { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
        { id: 'command-palette', label: 'Command Palette', icon: SearchIcon },
    ],
    "Room Specific": [
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'finance', label: 'Finance', icon: CircleDollarSign },
    ],
    "Advanced": [
         { id: 'data', label: 'Data & Export', icon: FileDown },
         { id: 'download', label: 'Installers', icon: Download },
    ]
}

const themeOptions: { value: Theme, label: string, icon: React.ElementType, requiredLevel: number }[] = [
    { value: 'light', label: 'Light', icon: Sun, requiredLevel: 1 },
    { value: 'dark', label: 'Dark', icon: Moon, requiredLevel: 1 },
    { value: 'theme-matrix', label: 'Matrix', icon: Bot, requiredLevel: 1 },
    { value: 'theme-batman', label: 'Batman', icon: Bot, requiredLevel: 6 },
    { value: 'theme-rose-pine', label: 'Rose Pine', icon: Palette, requiredLevel: 12 },
    { value: 'theme-solarized-light', label: 'Solarized', icon: Sun, requiredLevel: 12 },
    { value: 'theme-tokyo-night', label: 'Tokyo Night', icon: Moon, requiredLevel: 12 },
    { value: 'theme-dracula', label: 'Dracula', icon: Moon, requiredLevel: 12 },
    { value: 'theme-gruvbox', label: 'Gruvbox', icon: Bot, requiredLevel: 12 },
    { value: 'theme-nord', label: 'Nord', icon: Palette, requiredLevel: 12 },
]


export default function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const { appSettings, setAppSettings, tasks, taskGroups, exportAllDataAsPdf, isMac, ...appData } = useApp();
  const [activeTab, setActiveTab] = useState('universal');
  const router = useRouter();

  const currentLevel = useMemo(() => {
    if (!appData || !appSettings) return 1;
    const { clients, projects, accounts, notes, assets, learningResources, networkContacts } = appData;
    let points = 0;
    allAchievements.forEach(ach => {
        let isUnlocked = false;
        switch (ach.category) {
            case 'tasks': isUnlocked = (tasks || []).filter(t => t.completed).length >= ach.threshold; break;
            case 'clients': isUnlocked = (clients || []).length >= ach.threshold; break;
            case 'projects': isUnlocked = (projects || []).filter(p => p.status === 'completed').length >= ach.threshold; break;
            case 'finance': isUnlocked = (accounts || []).reduce((sum, acc) => acc.type === 'credit' ? sum - acc.balance : sum + acc.balance, 0) >= ach.threshold; break;
            case 'notes': isUnlocked = (notes || []).length >= ach.threshold; break;
            case 'assets': isUnlocked = (assets || []).reduce((sum, asset) => sum + asset.value, 0) >= ach.threshold; break;
            case 'learning': isUnlocked = (learningResources || []).filter(r => r.status === 'completed').length >= ach.threshold; break;
            case 'networking': isUnlocked = (networkContacts || []).length >= ach.threshold; break;
        }
        if (isUnlocked) {
            points += ach.points;
        }
    });
    
    let level = 1;
    const levelThresholds = [
      0, 50, 125, 250, 500, 1000, 2000, 4000, 8000, 15000, 25000, 50000, 
      75000, 100000, 130000, 165000, 205000, 250000, 300000, 355000, 415000,
      480000, 550000, 625000, 705000, 800000, 900000, 1000000, 1150000, 1300000,
      1500000, 1750000, 2000000, 2300000, 2600000, 2950000, 3300000, 3700000, 4100000, 4500000,
      5000000, 5500000, 6000000, 6500000, 7000000, 7500000, 8000000, 8500000, 9000000, 9500000,
      10000000
    ];

    while (level < levelThresholds.length && points >= levelThresholds[level]) {
        level++;
    }
    return level;
  }, [appData, tasks, appSettings]);
  
  const handleUpdateSetting = (category: keyof typeof appSettings, key: any, value: any) => {
    setAppSettings(prev => {
        const newSettings = {...prev};
        // @ts-ignore
        if (typeof newSettings[category] === 'object' && newSettings[category] !== null) {
            // @ts-ignore
            newSettings[category] = {
                // @ts-ignore
                ...newSettings[category],
                [key]: value,
            };
        } else {
            // @ts-ignore
            newSettings[category] = value;
        }
        return newSettings;
    })
  }

  const handleClearCompletedTasks = () => {
    appData.setTasks(prev => prev.filter(t => !t.completed));
  }
  
  const UniversalSettings = () => (
    <div className="space-y-8">
        <Card title="Appearance">
            <div className="space-y-4">
                <div>
                    <Label className="text-base">Theme</Label>
                    <p className="text-sm text-muted-foreground mb-2">Select how the application should look. New themes unlock as you level up.</p>
                     <Select value={appSettings.theme} onValueChange={(v) => setAppSettings(prev => ({...prev, theme: v as any}))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                             {themeOptions.map(theme => {
                                const isUnlocked = currentLevel >= theme.requiredLevel;
                                return (
                                    <SelectItem key={theme.value} value={theme.value} disabled={!isUnlocked}>
                                        <div className="flex items-center gap-2">
                                            {theme.label}
                                            {!isUnlocked && <span className="text-xs text-muted-foreground ml-2">(Lvl {theme.requiredLevel})</span>}
                                        </div>
                                    </SelectItem>
                                )
                             })}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
         <Card title="General">
            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div>
                        <Label htmlFor="autosave" className="text-base">Autosave</Label>
                        <p className="text-sm text-muted-foreground">Automatically save changes as you work.</p>
                    </div>
                    <Switch id="autosave" checked={appSettings.autosave} onCheckedChange={(v) => setAppSettings(prev => ({...prev, autosave: v}))}/>
                 </div>
                 <div>
                    <Label className="text-base">Time Format</Label>
                    <Select value={appSettings.timeFormat} onValueChange={(v) => setAppSettings(prev => ({...prev, timeFormat: v as '12-hour' | '24-hour'}))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="12-hour">12-hour</SelectItem>
                            <SelectItem value="24-hour">24-hour</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </div>
        </Card>
    </div>
  );
  
  const ThemeSettings = () => (
    <Card title="Theme Customization">
        <div>
            <Label className="text-base">Theme Cycle</Label>
            <p className="text-sm text-muted-foreground mb-4">Choose which themes to include when cycling with the header button.</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {themeOptions.map(theme => {
                    const isUnlocked = currentLevel >= theme.requiredLevel;
                    const isChecked = appSettings.themeCycle.includes(theme.value);

                    return (
                        <div key={theme.value} className={cn("flex items-center gap-2 border rounded-md p-2", !isUnlocked && "opacity-50")}>
                            <Checkbox 
                                id={`theme-cycle-${theme.value}`}
                                checked={isChecked}
                                disabled={!isUnlocked}
                                onCheckedChange={(checked) => {
                                    setAppSettings(prev => {
                                        const newCycle = checked
                                            ? [...prev.themeCycle, theme.value]
                                            : prev.themeCycle.filter(t => t !== theme.value);
                                        return {...prev, themeCycle: newCycle};
                                    })
                                }}
                            />
                            <Label htmlFor={`theme-cycle-${theme.value}`} className={cn("flex items-center gap-2 w-full", !isUnlocked && "cursor-not-allowed")}>
                                <theme.icon className="h-4 w-4" />
                                {theme.label}
                                {!isUnlocked && <Lock className="h-3 w-3 ml-auto" />}
                            </Label>
                        </div>
                    );
                })}
            </div>
        </div>
    </Card>
  );

  const SidebarSettings = () => (
    <div className="space-y-8">
        <Card title="Sidebar Appearance">
            <div className="space-y-4">
                 <div>
                    <Label className="text-base">Orientation</Label>
                    <Select value={appSettings.sidebar.side} onValueChange={(v: SidebarSide) => handleUpdateSetting('sidebar', 'side', v)}>
                        <SelectTrigger><SelectValue placeholder="Select orientation" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label className="text-base">Variant</Label>
                    <Select value={appSettings.sidebar.variant} onValueChange={(v: SidebarVariant) => handleUpdateSetting('sidebar', 'variant', v)}>
                        <SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sidebar">Default</SelectItem>
                            <SelectItem value="floating">Floating</SelectItem>
                            <SelectItem value="inset">Inset</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label className="text-base">Collapsible Behavior</Label>
                    <Select value={appSettings.sidebar.collapsible} onValueChange={(v: SidebarCollapsible) => handleUpdateSetting('sidebar', 'collapsible', v)}>
                        <SelectTrigger><SelectValue placeholder="Select behavior" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="icon">Icon</SelectItem>
                            <SelectItem value="offcanvas">Off-canvas</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
            </div>
        </Card>
    </div>
  );

  const TaskSettings = () => {
    const [kanbanCols, setKanbanCols] = useState(appSettings.tasks.kanbanColumns || []);

    const handleKanbanColChange = (groupId: string, checked: boolean | 'indeterminate') => {
        if (checked) {
            setKanbanCols(prev => [...prev, groupId]);
        } else {
            setKanbanCols(prev => prev.filter(id => id !== groupId));
        }
    }

    const saveKanbanSettings = () => {
        handleUpdateSetting('tasks', 'kanbanColumns', kanbanCols);
    }

    return (
        <div className="space-y-8">
          <Card title="General Task Settings">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-base">Default Task Group</Label>
                    <p className="text-sm text-muted-foreground">Choose the default group for newly created tasks.</p>
                    <Select value={appSettings.tasks.defaultGroupId} onValueChange={(v) => handleUpdateSetting('tasks', 'defaultGroupId', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select group" />
                        </SelectTrigger>
                        <SelectContent>
                            {taskGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label className="text-base">Default Task View</Label>
                    <Select value={appSettings.tasks.defaultView} onValueChange={(v: TaskView) => handleUpdateSetting('tasks', 'defaultView', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select default view" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Grouped by Section</SelectItem>
                            <SelectItem value="groupByDate">Grouped by Due Date</SelectItem>
                            <SelectItem value="kanban">Kanban Board</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </Card>
           <Card title="Kanban Board Settings">
                 <div className="space-y-2">
                    <Label className="text-base">Kanban Columns</Label>
                    <p className="text-sm text-muted-foreground">Choose which task groups appear as columns on your Kanban board.</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {taskGroups.map(group => (
                            <div key={group.id} className="flex items-center gap-2 p-2 border rounded-md">
                                <Checkbox 
                                    id={`kanban-col-${group.id}`}
                                    checked={kanbanCols.includes(group.id)}
                                    onCheckedChange={(c) => handleKanbanColChange(group.id, c)}
                                />
                                <Label htmlFor={`kanban-col-${group.id}`} className="font-normal">{group.name}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="flex justify-end mt-4">
                    <Button onClick={saveKanbanSettings}><Save className="mr-2 h-4 w-4"/>Save Kanban Settings</Button>
                </div>
           </Card>
           <Card title="Maintenance">
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-base">Clear Completed Tasks</Label>
                        <p className="text-sm text-muted-foreground">Permanently delete all tasks that are marked as complete.</p>
                    </div>
                    <Button variant="outline" onClick={handleClearCompletedTasks}>Clear Tasks</Button>
                </div>
           </Card>
        </div>
      )
  }
  
  const FinanceSettings = () => (
    <div className="space-y-8">
        <Card title="Finance Settings">
            <div className="space-y-4">
                <div>
                    <Label className="text-base">Default Currency</Label>
                    <Select value={appSettings.finance.defaultCurrency} onValueChange={(v) => handleUpdateSetting('finance', 'defaultCurrency', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="JPY">JPY (¥)</SelectItem>
                            <SelectItem value="CAD">CAD ($)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-start gap-4">
                        <EyeOff className="h-6 w-6 text-muted-foreground mt-1" />
                        <div>
                            <Label htmlFor="privacy-mode" className="text-base">Privacy Mode</Label>
                            <p className="text-sm text-muted-foreground">Blur sensitive financial numbers when in public.</p>
                        </div>
                    </div>
                    <Switch 
                        id="privacy-mode"
                        checked={appSettings.finance.privacyMode}
                        onCheckedChange={(v) => handleUpdateSetting('finance', 'privacyMode', v)}
                    />
                </div>
            </div>
        </Card>
    </div>
  )
    
  const DataSettings = () => (
    <Card title="Data & Export">
        <div className="flex items-center justify-between">
            <div>
                <Label className="text-base">Export All Data</Label>
                <p className="text-sm text-muted-foreground">Download a detailed PDF file containing all your data from every room.</p>
            </div>
            <Button variant="outline" onClick={exportAllDataAsPdf}>
                <FileDown className="mr-2 h-4 w-4" />
                Export to PDF
            </Button>
         </div>
    </Card>
);

 const DownloadSettings = () => (
   <div className="space-y-8">
     <Card title="Desktop Installers">
       <div className="space-y-4">
         <p className="text-sm text-muted-foreground">Installers will be available soon.</p>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
           <Button variant="outline" disabled className="w-full justify-start gap-2">
             <Laptop className="h-4 w-4" />
             macOS Installer
           </Button>
           <Button variant="outline" disabled className="w-full justify-start gap-2">
             <AppWindow className="h-4 w-4" />
             Windows Installer
           </Button>
         </div>
       </div>
     </Card>
   </div>
 );

const ShortcutSettings = () => {
    const { appSettings, setAppSettings, isMac } = useApp();
    const [editingShortcutKey, setEditingShortcutKey] = useState<keyof AppSettings['shortcuts'] | null>(null);

    const { shortcuts } = appSettings;

    const shortcutGroups = useMemo(() => {
        if (!shortcuts) return {};
        
        const navItems = appSettings.navStructure.flatMap(g => g.items);
        const navigationShortcuts: { key: keyof typeof shortcuts, name: string }[] = navItems
            .map(item => {
                const key = ('goTo' + item.label.replace(/\s+/g, '')) as keyof typeof shortcuts;
                const name = (shortcuts[key] as Shortcut)?.name || `Go to ${item.label}`;
                return { key, name };
            })
            .filter(item => shortcuts[item.key as keyof typeof shortcuts]);

        const generalShortcuts = [
            { key: 'toggleSearch', name: shortcuts.toggleSearch?.name || 'Toggle Search' },
            { key: 'toggleTheme', name: shortcuts.toggleTheme?.name || 'Cycle Theme' },
            { key: 'toggleSidebar', name: shortcuts.toggleSidebar?.name || 'Toggle Sidebar' },
            { key: 'toggleRightSidebar', name: shortcuts.toggleRightSidebar?.name || 'Toggle Right Sidebar' },
            { key: 'newTask', name: shortcuts.newTask?.name || 'New Task' },
            { key: 'newNote', name: shortcuts.newNote?.name || 'New Note' },
        ];

        return {
            'General': generalShortcuts,
            'Navigation': navigationShortcuts,
        }

    }, [shortcuts, appSettings.navStructure]);


    useEffect(() => {
        if (!editingShortcutKey) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            event.preventDefault();
            
            // Ignore lonely modifier key presses
            if (['Control', 'Meta', 'Shift', 'Alt'].includes(event.key)) return;

            const keys: string[] = [];
            if (event.metaKey || event.ctrlKey) keys.push('mod');
            if (event.shiftKey) keys.push('shift');
            if (event.altKey) keys.push('alt');
            
            const keyName = event.key.toLowerCase();
            keys.push(keyName);
            
            if (keys.length > 1) { // Ensure a key other than a modifier was pressed
                 setAppSettings(prev => ({
                    ...prev,
                    shortcuts: {
                        ...prev.shortcuts,
                        [editingShortcutKey]: {
                            ...(prev.shortcuts[editingShortcutKey] as Shortcut || {}),
                            keys: keys,
                        },
                    },
                }));
                setEditingShortcutKey(null);
            }
        };

        const handleKeyUp = () => {
             if (editingShortcutKey) {
                // If only a modifier was pressed and held, then released, cancel editing.
                setTimeout(() => setEditingShortcutKey(null), 100);
             }
        }

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        }
    }, [editingShortcutKey, setAppSettings]);


    if (!shortcuts) {
        return (
            <Card title="Keyboard Shortcuts">
                <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </Card>
        );
    }

    return (
        <Card title="Keyboard Shortcuts">
             <p className="text-sm text-muted-foreground mb-6">
                 Click on a shortcut to change it. Your new shortcut will always start with {isMac ? '⌘' : 'Ctrl'}.
             </p>
             <div className="space-y-6">
                {Object.entries(shortcutGroups).map(([groupName, groupShortcuts]: [string, {key: any, name: any}[]]) => (
                    <div key={groupName}>
                        <h4 className="text-base font-semibold mb-3">{groupName}</h4>
                        <div className="space-y-2">
                            {groupShortcuts.map(({ key, name }) => (
                                <div key={key} className="flex items-center justify-between p-3 rounded-md border gap-4">
                                    <span className="text-sm font-medium flex-1">{name}</span>
                                    <Button 
                                        variant="outline"
                                        className="w-48 font-mono text-xs justify-center"
                                        onClick={() => setEditingShortcutKey(key)}
                                    >
                                        {editingShortcutKey === key 
                                            ? "Press any key..." 
                                            : (shortcuts[key as keyof typeof shortcuts]?.keys || []).map((k: any) => k === 'mod' ? (isMac ? '⌘' : 'Ctrl') : k.toUpperCase()).join(' + ') || 'Not set'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
             </div>
        </Card>
    )
  }

  const CommandPaletteSettings = () => (
    <Card title="Command Palette">
        <p className="text-sm text-muted-foreground">
            The command palette allows you to quickly navigate and perform actions. You can customize which items appear in the search results here.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
            (Settings for the command palette are coming soon.)
        </p>
    </Card>
);

  const renderContent = () => {
    if (!appSettings) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }
    switch (activeTab) {
        case 'universal': return <UniversalSettings />;
        case 'profile': return <ProfileSettings />;
        case 'theme': return <ThemeSettings />;
        case 'sidebar': return <SidebarSettings />;
        case 'navigation': return <SidebarNavSettings />;
        case 'shortcuts': return <ShortcutSettings />;
        case 'command-palette': return <CommandPaletteSettings />;
        case 'tasks': return <TaskSettings />;
        case 'finance': return <FinanceSettings />;
        case 'data': return <DataSettings />;
        case 'download': return <DownloadSettings />;
        default:
            return <div className="text-center text-muted-foreground p-8">Settings for {settingsNav.Global.find(i=>i.id===activeTab)?.label || settingsNav["Room Specific"].find(i=>i.id===activeTab)?.label} are not yet available.</div>;
    }
  }

  const handleCloseDialog = () => {
      onOpenChange(false);
      // If we are on the settings page, navigating back is a good UX
      if (window.location.pathname === '/settings') {
          router.back();
      }
  }
  
  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl">Settings</DialogTitle>
            <DialogDescription>
              Manage your application and workspace settings.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow flex border-t overflow-hidden">
                <aside className="w-1/4 border-r p-4 overflow-y-auto">
                    {Object.entries(settingsNav).map(([group, items]) => (
                        <div key={group} className="mb-6">
                            <h3 className="text-sm font-semibold text-muted-foreground px-2 mb-2">{group}</h3>
                            <nav className="flex flex-col gap-1">
                                {items.map(item => (
                                    <Button
                                        key={item.id}
                                        variant={activeTab === item.id ? 'secondary' : 'ghost'}
                                        className="w-full justify-start gap-2"
                                        onClick={() => setActiveTab(item.id)}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </Button>
                                ))}
                            </nav>
                        </div>
                    ))}
                </aside>
                <main className="w-3/4 p-6 overflow-y-auto">
                    {renderContent()}
                </main>
          </div>
          <DialogFooter className="p-4 border-t">
            <Button variant="outline" onClick={handleCloseDialog}>Close</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}


export const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border rounded-lg">
        <h2 className="text-xl font-semibold p-6">{title}</h2>
        <div className="p-6 border-t">
            {children}
        </div>
    </div>
);
