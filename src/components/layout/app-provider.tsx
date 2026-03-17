
'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import type {
  Note,
  Task,
  TaskGroup,
  Transaction,
  Account,
  Client,
  Asset,
  BrandProfile,
  Project,
  Activity,
  LearningResource,
  NetworkContact,
  UserProfile,
  AppSettings,
  ResearchSession,
  Theme,
  VaultFile,
  VaultFolder,
  Goal,
  Shortcut,
  Chat,
  Message,
  SheetFile,
  Budget,
  RecurringTransaction,
  Debt,
  SavingsGoal,
  AIMemory,
  GrowthTask,
  GrowthHistory,
  CalendarEvent,
  CalendarDefinition,
} from '@/lib/types';
import { ExcalidrawRoom } from '@/components/collaboration/storage';
import { useHotkeys } from '@/hooks/use-hotkeys-safe';
import { useRouter } from 'next/navigation';
import { allNavItems } from '@/lib/nav-items';
import { supabase } from '@/lib/supabase';
import { useSafeLocalStorage } from '@/hooks/use-safe-local-storage';
import { startOfToday, isBefore, isToday, addDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { RepeatDays } from '@/lib/types';

export const WORKSPACE_KEY_HOLDER = 'contextflow-workspace-key';

export const getScopedKey = (baseKey: string, roomId?: string) => {
  if (typeof window === 'undefined') return null;
  const workspaceKey = localStorage.getItem(WORKSPACE_KEY_HOLDER);
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  
  // Extract room ID from pathname for room-specific isolation
  let currentRoomId = roomId;
  if (!currentRoomId && pathname) {
    const roomMatch = pathname.match(/\/([^\/]+)(?:\/|$)/);
    if (roomMatch && roomMatch[1] && roomMatch[1] !== 'dashboard') {
      currentRoomId = roomMatch[1];
    }
  }
  
  // For collaboration rooms, use room-specific keys
  if (pathname.includes('/collaboration/') && currentRoomId) {
    return workspaceKey ? `${workspaceKey}_room_${currentRoomId}_${baseKey}` : `room_${currentRoomId}_${baseKey}`;
  }
  
  // For other rooms, use room-specific keys if available
  if (currentRoomId && currentRoomId !== 'dashboard') {
    return workspaceKey ? `${workspaceKey}_room_${currentRoomId}_${baseKey}` : `room_${currentRoomId}_${baseKey}`;
  }
  
  // Fallback to global scope
  return workspaceKey ? `${workspaceKey}_${baseKey}` : baseKey;
};

export const KEYS = {
  NOTES: 'notes-app-data',
  TASKS: 'tasks-app-data',
  TASK_GROUPS: 'task-groups-app-data',
  ACCOUNTS: 'finance-accounts-data',
  TRANSACTIONS: 'finance-transactions-data',
  CLIENTS: 'clients-data',
  ASSETS: 'assets-data',
  BRAND: 'brand-profile-data',
  PROJECTS: 'project-board-data',
  RESEARCH: 'research-sessions-data',
  ACTIVITIES: 'health-activities-data',
  LEARNING: 'learning-resources-data',
  NETWORK: 'network-contacts-data',
  USER: 'user-profile-data',
  APP: 'app-settings-data',
  FILES: 'file-vault-data',
  FOLDERS: 'file-vault-folders-data',
  GOALS: 'goals-data',
  CHATS: 'ai-chats-data',
  SHEETS: 'sheets-data',
  BUDGETS: 'finance-budgets-data',
  DEBTS: 'finance-debts-data',
  RECURRING: 'finance-recurring-data',
  SAVINGS: 'finance-savings-data',
  NAV_VERSION: 'nav-structure-version',
  LAST_CHECKED_DATE: 'last-task-check-date',
  WELCOME: 'welcome-sound-played',
  AI_MEMORY: 'ai-memory-data',
  GROWTH_TASKS: 'growth-hub-tasks',
  GROWTH_HISTORY: 'growth-hub-history',
  CALENDAR_EVENTS: 'calendar-events-data',
  CALENDAR_DEFINITIONS: 'calendar-calendars-data',
  ROOMS: 'nexaris-excalidraw-rooms',
};

const CURRENT_NAV_VERSION = '4.8';

// Helper function to calculate the next occurrence date for a repeating task
const getNextOccurrenceDate = (repeat: RepeatDays, currentDate: Date = new Date()): Date => {
  if (repeat.everyday) {
    return addDays(currentDate, 1);
  }

  const dayNames: Array<keyof Omit<RepeatDays, 'everyday'>> = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayIndex = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentDayName = dayNames[(dayIndex + 6) % 7] as keyof Omit<RepeatDays, 'everyday'>; // Convert to Monday=0 format

  // Find the next day that should repeat
  for (let i = 1; i <= 7; i++) {
    const checkIndex = (dayIndex + i) % 7;
    const checkDayName = dayNames[(checkIndex + 6) % 7] as keyof Omit<RepeatDays, 'everyday'>;
    if (repeat[checkDayName]) {
      return addDays(currentDate, i);
    }
  }

  // Fallback: if no day matches, return next week's same day
  return addDays(currentDate, 7);
};

interface AppContextType {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  taskGroups: TaskGroup[];
  setTaskGroups: React.Dispatch<React.SetStateAction<TaskGroup[]>>;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  brandProfile: BrandProfile | null;
  setBrandProfile: React.Dispatch<React.SetStateAction<BrandProfile | null>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  researchSessions: ResearchSession[];
  setResearchSessions: React.Dispatch<React.SetStateAction<ResearchSession[]>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  learningResources: LearningResource[];
  setLearningResources: React.Dispatch<React.SetStateAction<LearningResource[]>>;
  networkContacts: NetworkContact[];
  setNetworkContacts: React.Dispatch<React.SetStateAction<NetworkContact[]>>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  vaultFiles: VaultFile[];
  setVaultFiles: React.Dispatch<React.SetStateAction<VaultFile[]>>;
  vaultFolders: VaultFolder[];
  setVaultFolders: React.Dispatch<React.SetStateAction<VaultFolder[]>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  aiMemories: AIMemory[];
  setAiMemories: React.Dispatch<React.SetStateAction<AIMemory[]>>;
  sheets: SheetFile[];
  setSheets: React.Dispatch<React.SetStateAction<SheetFile[]>>;
  budgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  debts: Debt[];
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
  recurringTransactions: RecurringTransaction[];
  setRecurringTransactions: React.Dispatch<React.SetStateAction<RecurringTransaction[]>>;
  savingsGoals: SavingsGoal[];
  setSavingsGoals: React.Dispatch<React.SetStateAction<SavingsGoal[]>>;
  exportAllDataAsPdf: () => void;
  isMac: boolean;
  loading: boolean;
  isDataLoaded: boolean;
  toggleRightSidebar: () => void;
  welcomePlayed: boolean;
  setWelcomePlayed: React.Dispatch<React.SetStateAction<boolean>>;
  selectedRoom: string | null;
  setSelectedRoom: React.Dispatch<React.SetStateAction<string | null>>;
  aiMessageCount: number;
  setAiMessageCount: React.Dispatch<React.SetStateAction<number>>;
  rooms: ExcalidrawRoom[];
  setRooms: React.Dispatch<React.SetStateAction<ExcalidrawRoom[]>>;
  growthTasks: GrowthTask[];
  setGrowthTasks: React.Dispatch<React.SetStateAction<GrowthTask[]>>;
  growthHistory: GrowthHistory[];
  setGrowthHistory: React.Dispatch<React.SetStateAction<GrowthHistory[]>>;
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  calendars: CalendarDefinition[];
  setCalendars: React.Dispatch<React.SetStateAction<CalendarDefinition[]>>;
  isSettingsOpen: boolean;
  setIsSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

const defaultGroups: TaskGroup[] = [{ id: 'default', name: 'Default' }];
const defaultBrandProfile: BrandProfile = {
  id: 'default-brand',
  name: 'My Brand',
  colors: { primary: '#FFFFFF', secondary: '#1A1A1A', accent: '#9b9b9b', neutral: '#737373' },
  logos: [],
  fonts: { headline: 'Inter', body: 'Inter' },
  links: [],
};
const defaultUserProfile: UserProfile = { name: 'User', email: '', firstName: '', lastName: '', phoneNumber: '', hasSeenTour: false };

const defaultShortcuts: { [key: string]: Shortcut } = {
    toggleSearch: { name: 'Toggle Search', keys: ['mod', 'k'] },
    toggleTheme: { name: 'Toggle Theme', keys: ['mod', 'j'] },
    toggleSidebar: { name: 'Toggle Sidebar', keys: ['mod', 'b'] },
    toggleRightSidebar: { name: 'Toggle Right Sidebar', keys: ['mod', 'i'] },
    newTask: { name: 'New Task', keys: ['mod', 'n'] },
    newNote: { name: 'New Note', keys: ['mod', 'm'] },
    goToAlfred: { name: 'Go to Alfred', keys: ['mod', 'shift', 'a'] },
    goToDashboard: { name: 'Go to Dashboard', keys: ['mod', 'shift', 'd'] },
    goToTasks: { name: 'Go to Tasks', keys: ['mod', 'shift', 't'] },
    goToGrowthHub: { name: 'Go to Growth Hub', keys: ['mod', 'shift', 'h'] },
    goToProjects: { name: 'Go to Projects', keys: ['mod', 'shift', 'p'] },
    goToClients: { name: 'Go to Clients', keys: ['mod', 'shift', 'c'] },
    goToResearch: { name: 'Go to Research', keys: ['mod', 'shift', 'r'] },
    goToNotes: { name: 'Go to Notes', keys: ['mod', 'shift', 'n'] },
    goToBrandRoom: { name: 'Go to Brand Room', keys: ['mod', 'shift', 'b'] },
    goToBudgeting: { name: 'Go to Budgeting', keys: ['mod', 'shift', 'f'] },
    goToAssets: { name: 'Go to Assets', keys: ['mod', 'shift', 's'] },
    goToFileVault: { name: 'Go to File Vault', keys: ['mod', 'shift', 'v'] },
    goToNetworking: { name: 'Go to Networking', keys: ['mod', 'shift', 'w'] },
    goToLearning: { name: 'Go to Learning', keys: ['mod', 'shift', 'o'] },
    goToBriefingRoom: { name: 'Go to Briefing Room', keys: ['mod', 'shift', 'i'] },
    goToSpreadsheets: { name: 'Go to Spreadsheets', keys: ['mod', 'shift', 'e'] },
};

const defaultAppSettings: AppSettings = {

  theme: 'dark',
  themeCycle: ['light', 'dark'],
  autosave: true,
  timeFormat: '12-hour',
  notificationsEnabled: true,
  navStructure: allNavItems,
  sidebar: {
    visibleGroups: allNavItems.map((g) => g.label),
    side: 'left',
    variant: 'sidebar',
    collapsible: 'icon',
  },
  commandPalette: {
    includeTasks: true,
    includeNotes: true,
    includeContacts: true,
    includeProjects: true,
  },
  rightSidebar: { isOpen: true, order: ['notifications', 'contacts', 'activities'] },
  tasks: { defaultGroupId: 'default', defaultView: 'default', kanbanColumns: [], hideCompletedTasks: false },
  finance: { defaultCurrency: 'USD', lowBalanceThreshold: 500, privacyMode: false },
  shortcuts: defaultShortcuts as any,
};

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const [notes, setNotes] = useSafeLocalStorage<Note[]>(getScopedKey(KEYS.NOTES) || KEYS.NOTES, []);
  const [tasks, setTasks] = useSafeLocalStorage<Task[]>(getScopedKey(KEYS.TASKS) || KEYS.TASKS, []);
  const [taskGroups, setTaskGroups] = useSafeLocalStorage<TaskGroup[]>(getScopedKey(KEYS.TASK_GROUPS) || KEYS.TASK_GROUPS, defaultGroups);
  const [accounts, setAccounts] = useSafeLocalStorage<Account[]>(getScopedKey(KEYS.ACCOUNTS) || KEYS.ACCOUNTS, []);
  const [transactions, setTransactions] = useSafeLocalStorage<Transaction[]>(getScopedKey(KEYS.TRANSACTIONS) || KEYS.TRANSACTIONS, []);
  const [clients, setClients] = useSafeLocalStorage<Client[]>(getScopedKey(KEYS.CLIENTS) || KEYS.CLIENTS, []);
  const [assets, setAssets] = useSafeLocalStorage<Asset[]>(getScopedKey(KEYS.ASSETS) || KEYS.ASSETS, []);
  const [brandProfile, setBrandProfile] = useSafeLocalStorage<BrandProfile | null>(getScopedKey(KEYS.BRAND) || KEYS.BRAND, defaultBrandProfile);
  const [projects, setProjects] = useSafeLocalStorage<Project[]>(getScopedKey(KEYS.PROJECTS) || KEYS.PROJECTS, []);
  const [researchSessions, setResearchSessions] = useSafeLocalStorage<ResearchSession[]>(getScopedKey(KEYS.RESEARCH) || KEYS.RESEARCH, []);
  const [activities, setActivities] = useSafeLocalStorage<Activity[]>(getScopedKey(KEYS.ACTIVITIES) || KEYS.ACTIVITIES, []);
  const [learningResources, setLearningResources] = useSafeLocalStorage<LearningResource[]>(getScopedKey(KEYS.LEARNING) || KEYS.LEARNING, []);
  const [networkContacts, setNetworkContacts] = useSafeLocalStorage<NetworkContact[]>(getScopedKey(KEYS.NETWORK) || KEYS.NETWORK, []);
  const [userProfile, setUserProfile] = useSafeLocalStorage<UserProfile>(KEYS.USER, defaultUserProfile);
  const [appSettings, setAppSettings] = useSafeLocalStorage<AppSettings>(getScopedKey(KEYS.APP) || KEYS.APP, defaultAppSettings);
  const [vaultFiles, setVaultFiles] = useSafeLocalStorage<VaultFile[]>(getScopedKey(KEYS.FILES) || KEYS.FILES, []);
  const [vaultFolders, setVaultFolders] = useSafeLocalStorage<VaultFolder[]>(getScopedKey(KEYS.FOLDERS) || KEYS.FOLDERS, []);
  const [goals, setGoals] = useSafeLocalStorage<Goal[]>(getScopedKey(KEYS.GOALS) || KEYS.GOALS, []);
  const [chats, setChats] = useSafeLocalStorage<Chat[]>(getScopedKey(KEYS.CHATS) || KEYS.CHATS, []);
  const [aiMemories, setAiMemories] = useSafeLocalStorage<AIMemory[]>(getScopedKey(KEYS.AI_MEMORY) || KEYS.AI_MEMORY, []);
  
  // AI Room specific global state
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [aiMessageCount, setAiMessageCount] = useState<number>(0);
  const [sheets, setSheets] = useSafeLocalStorage<SheetFile[]>(KEYS.SHEETS, []);
  const [budgets, setBudgets] = useSafeLocalStorage<Budget[]>(KEYS.BUDGETS, []);
  const [debts, setDebts] = useSafeLocalStorage<Debt[]>(KEYS.DEBTS, []);
  const [recurringTransactions, setRecurringTransactions] = useSafeLocalStorage<RecurringTransaction[]>(KEYS.RECURRING, []);
  const [savingsGoals, setSavingsGoals] = useSafeLocalStorage<SavingsGoal[]>(KEYS.SAVINGS, []);
  // Pinned chat feature removed
  const [lastCheckedDate, setLastCheckedDate] = useSafeLocalStorage<string>(KEYS.LAST_CHECKED_DATE, new Date(0).toISOString());
  const [welcomePlayed, setWelcomePlayed] = useSafeLocalStorage<boolean>(KEYS.WELCOME, false);
  const [growthTasks, setGrowthTasks] = useSafeLocalStorage<GrowthTask[]>(KEYS.GROWTH_TASKS, []);
  const [growthHistory, setGrowthHistory] = useSafeLocalStorage<GrowthHistory[]>(KEYS.GROWTH_HISTORY, []);
  const [events, setEvents] = useSafeLocalStorage<CalendarEvent[]>(KEYS.CALENDAR_EVENTS, []);
  const [calendars, setCalendars] = useSafeLocalStorage<CalendarDefinition[]>(KEYS.CALENDAR_DEFINITIONS, []);
  const [rooms, setRooms] = useSafeLocalStorage<ExcalidrawRoom[]>(KEYS.ROOMS, []);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
        let updated = false;
        
        const newTasks = growthTasks.map(task => {
            if (task.status === 'completed' || !task.criteria) return task;
            
            let completed = false;
            const { type, target = 1 } = task.criteria;
            
            try {
                switch(type) {
                    case 'project_count':
                        if (projects.filter(p => p.status === 'completed').length >= target) completed = true;
                        break;
                    case 'task_count':
                        if (tasks.filter(t => t.completed).length >= target) completed = true;
                        break;
                    case 'note_count':
                        if (notes.length >= target) completed = true;
                        break;
                    case 'client_count':
                        if (clients.length >= target) completed = true;
                        break;
                    case 'net_worth':
                        const netWorth = accounts.reduce((sum, acc) => acc.type === 'credit' ? sum - acc.balance : sum + acc.balance, 0);
                        if (netWorth >= target) completed = true;
                        break;
                }
            } catch (e) { console.error(e); }

            if (completed) {
                updated = true;
                toast({
                    title: "Growth Task Completed!",
                    description: `You completed "${task.title}" (+${task.xp} XP)`,
                });
                
                // Update history safely
                const today = new Date().toISOString().split('T')[0];
                setGrowthHistory(prev => {
                    const existing = prev.find(p => p.date === today);
                    if (existing) {
                        return prev.map(p => p.date === today ? { ...p, xpGained: p.xpGained + task.xp, tasksCompleted: p.tasksCompleted + 1 } : p);
                    }
                    return [...prev, { date: today, xpGained: task.xp, tasksCompleted: 1 }];
                });
                
                return { ...task, status: 'completed' as const };
            }
            return task;
        });

        if (updated) {
            setGrowthTasks(newTasks);
        }
    }, 2000);

    return () => clearTimeout(timer);
  }, [growthTasks, projects, tasks, notes, clients, accounts]);


  useEffect(() => {
    setIsMac(navigator.userAgent.includes('Mac'));
    
    const savedNavVersion = localStorage.getItem('global_nav_version');
    
    if (savedNavVersion !== CURRENT_NAV_VERSION) {
      console.log('Migrating navigation structure to version:', CURRENT_NAV_VERSION);
      
      const mergedNav = [...allNavItems];
      
      const newSettings = {
        ...appSettings,
        navStructure: mergedNav,
        shortcuts: defaultShortcuts as any,
        sidebar: { 
          ...appSettings.sidebar,
          visibleGroups: allNavItems.map(g => g.label),
        },
      };
      setAppSettings(newSettings);
      localStorage.setItem('global_nav_version', CURRENT_NAV_VERSION);
    } else {
      // Persistent fix: if any navigation shortcuts still use old 'g + key' format, fix them
      const navShortcutKeys = Object.keys(defaultShortcuts).filter(k => k.startsWith('goTo'));
      const currentShortcuts = appSettings.shortcuts;
      let needsFix = false;
      
      for (const key of navShortcutKeys) {
        const shortcut = currentShortcuts[key as keyof typeof currentShortcuts];
        if (shortcut && shortcut.keys && shortcut.keys.length === 2 && shortcut.keys[0] === 'g') {
          needsFix = true;
          break;
        }
      }
      
      if (needsFix) {
        console.log('Fixing old g+key shortcuts to mod+shift+key format');
        setAppSettings(prev => ({
          ...prev,
          shortcuts: {
            ...prev.shortcuts,
            ...defaultShortcuts as any,
          },
        }));
      }
    }
    
    if (isDataLoaded) { // Only run task check after initial data load
        const today = startOfToday();
        if (isBefore(new Date(lastCheckedDate), today)) {
          console.log('Checking repeating tasks for a new day...');
          const todayDay = new Date().toLocaleString('en-US', { weekday: 'long' }) as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
          setTasks(prevTasks =>
            prevTasks.map(task => {
              if (task.repeat) {
                  // Handle completed repeating tasks (reset completion)
                  if (task.completed) {
                    if (task.repeat.everyday || task.repeat[todayDay]) {
                        // Calculate the next occurrence date
                        const nextDate = getNextOccurrenceDate(task.repeat, today);
                        return { 
                            ...task, 
                            completed: false,
                            dueDate: nextDate.toISOString()
                        };
                    }
                  } 
                  // Handle missed/overdue repeating tasks (move to today if applicable)
                  else if (task.dueDate && isBefore(new Date(task.dueDate), today)) {
                      // If the task repeats and is overdue, bring it to the current period
                      // If it's everyday, set to today
                      if (task.repeat.everyday) {
                          return {
                              ...task,
                              dueDate: today.toISOString()
                          };
                      }
                      // If it's specific days, find the next valid day starting from today
                      // If today is a valid day, set to today. Else next occurrence.
                      if (task.repeat[todayDay]) {
                          return {
                              ...task,
                              dueDate: today.toISOString()
                          };
                      } else {
                          // Find next occurrence from today
                          const nextDate = getNextOccurrenceDate(task.repeat, today);
                          return {
                              ...task,
                              dueDate: nextDate.toISOString()
                          };
                      }
                  }
              }
              return task;
            })
          );
          setLastCheckedDate(today.toISOString());
        }
    }


    setIsDataLoaded(true);
    setLoading(false);
  }, [router, appSettings, setAppSettings, isDataLoaded, lastCheckedDate, setLastCheckedDate, setTasks]);

  const toggleRightSidebar = () => {
    setAppSettings((prev) => ({ ...prev, rightSidebar: { ...prev.rightSidebar, isOpen: !prev.rightSidebar.isOpen } }));
  };

  // Pin chat feature removed

  const handleThemeCycle = () => {
    const themes = appSettings.themeCycle || ['light', 'dark'];
    const next = themes[(themes.indexOf(appSettings.theme) + 1) % themes.length] || 'light';
    setAppSettings((prev) => ({ ...prev, theme: next as Theme }));
  };

  useHotkeys(appSettings.shortcuts.toggleTheme.keys.join('+'), handleThemeCycle, { enableOnFormTags: true });
  useHotkeys(appSettings.shortcuts.toggleRightSidebar.keys.join('+'), toggleRightSidebar, { enableOnFormTags: true });

  // Register Navigation Shortcuts
  useEffect(() => {
    const shortcuts = appSettings.shortcuts;
    const navMapping: { [key: string]: string } = {
        goToAlfred: '/ai-room',
        goToDashboard: '/dashboard',
        goToTasks: '/tasks',
        goToGrowthHub: '/growth-hub',
        goToProjects: '/project-board',
        goToClients: '/clients',
        goToResearch: '/research',
        goToNotes: '/notes',
        goToBrandRoom: '/brand-room',
        goToBudgeting: '/budgeting',
        goToAssets: '/asset-tracker',
        goToFileVault: '/file-vault',
        goToNetworking: '/networking',
        goToLearning: '/learning',
        goToBriefingRoom: '/collaboration',
        goToSpreadsheets: '/sheets',
    };

    const listeners: ((e: KeyboardEvent) => void)[] = [];

    Object.entries(navMapping).forEach(([key, path]) => {
        const shortcut = shortcuts[key as keyof typeof shortcuts];
        if (shortcut && shortcut.keys && shortcut.keys.length > 0) {
            const handleGlobalNav = (e: KeyboardEvent) => {
                const keys = shortcut.keys;
                
                const matchMod = keys.includes('mod') ? (isMac ? e.metaKey : e.ctrlKey) : !e.metaKey && !e.ctrlKey;
                const matchAlt = keys.includes('alt') ? e.altKey : !e.altKey;
                const matchShift = keys.includes('shift') ? e.shiftKey : !e.shiftKey;
                const targetKey = keys.find(k => !['mod', 'alt', 'shift'].includes(k));
                
                if (matchMod && matchAlt && matchShift && e.key.toLowerCase() === targetKey?.toLowerCase()) {
                    e.preventDefault();
                    router.push(path);
                }
            };
            window.addEventListener('keydown', handleGlobalNav);
            listeners.push(handleGlobalNav);
        }
    });

    return () => {
        listeners.forEach(l => window.removeEventListener('keydown', l));
    };
  }, [appSettings.shortcuts, router, isMac]);

  const exportAllDataAsPdf = async () => {
    try {
      // Dynamic import to avoid blocking if package isn't installed
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.text('Nexaris Data Export', 20, 20);
      doc.text(`User: ${userProfile.name}`, 20, 30);
      doc.text(`Date: ${new Date().toLocaleString()}`, 20, 40);
      doc.save('Nexaris-Module-Export.pdf');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      // Fallback: create a simple text file download
      const content = `Nexaris Data Export\nUser: ${userProfile.name}\nDate: ${new Date().toLocaleString()}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Nexaris-Module-Export.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const contextValue: AppContextType = {
    notes,
    setNotes,
    tasks,
    setTasks,
    taskGroups,
    setTaskGroups,
    accounts,
    setAccounts,
    transactions,
    setTransactions,
    clients,
    setClients,
    assets,
    setAssets,
    brandProfile,
    setBrandProfile,
    projects,
    setProjects,
    researchSessions,
    setResearchSessions,
    activities,
    setActivities,
    learningResources,
    setLearningResources,
    networkContacts,
    setNetworkContacts,
    userProfile,
    setUserProfile,
    appSettings,
    setAppSettings,
    vaultFiles,
    setVaultFiles,
    vaultFolders,
    setVaultFolders,
    goals,
    setGoals,
    chats,
    setChats,
    aiMemories,
    setAiMemories,
    sheets,
    setSheets,
    budgets,
    setBudgets,
    debts,
    setDebts,
    recurringTransactions,
    setRecurringTransactions,
    savingsGoals,
    setSavingsGoals,
    exportAllDataAsPdf,
    isMac,
    loading,
    isDataLoaded,
    toggleRightSidebar,
    welcomePlayed,
    setWelcomePlayed,
    growthTasks,
    setGrowthTasks,
    growthHistory,
    setGrowthHistory,
    selectedRoom,
    setSelectedRoom,
    aiMessageCount,
    setAiMessageCount,
    events,
    setEvents,
    calendars,
    setCalendars,
    rooms,
    setRooms,
    isSettingsOpen,
    setIsSettingsOpen,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
