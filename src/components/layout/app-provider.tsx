
'use client';

import { useState, useEffect, createContext, useContext, useRef, useCallback } from 'react';
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
  JournalEntry,
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

import { getScopedKey, WORKSPACE_KEY_HOLDER, KEYS } from '@/lib/storage';

const CURRENT_NAV_VERSION = '7.0';

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
  isAddTaskOpen: boolean;
  setIsAddTaskOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAddNoteOpen: boolean;
  setIsAddNoteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  journals: JournalEntry[];
  setJournals: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  isNavHidden: boolean;
  setIsNavHidden: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => Promise<void>;
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
export const defaultUserProfile: UserProfile = { name: 'User', email: '', firstName: '', lastName: '', phoneNumber: '', hasSeenTour: false, hasCompletedSetup: false };

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
  goToBudgeting: { name: 'Go to Budgeting', keys: ['mod', 'shift', 'f'] },
  goToAssets: { name: 'Go to Assets', keys: ['mod', 'shift', 's'] },
  goToFileVault: { name: 'Go to File Vault', keys: ['mod', 'shift', 'v'] },
  goToNetworking: { name: 'Go to Networking', keys: ['mod', 'shift', 'w'] },
  goToLearning: { name: 'Go to Learning', keys: ['mod', 'shift', 'o'] },
  goToBriefingRoom: { name: 'Go to Briefing Room', keys: ['mod', 'shift', 'i'] },
  goToSpreadsheets: { name: 'Go to Spreadsheets', keys: ['mod', 'shift', 'e'] },
  goToJournal: { name: 'Go to Journal', keys: ['mod', 'shift', 'j'] },
};

export const defaultAppSettings: AppSettings = {

  theme: 'system',
  themeCycle: ['light', 'dark'],
  autosave: true,
  timeFormat: '12-hour',
  notificationsEnabled: true,
  showToasts: false,
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
  rightSidebar: { isOpen: true, order: ['notifications', 'contacts', 'activities', 'sponsored'] },
  tasks: { defaultGroupId: 'default', defaultView: 'default', kanbanColumns: [], hideCompletedTasks: false },
  finance: { defaultCurrency: 'USD', lowBalanceThreshold: 500, privacyMode: false },
  shortcuts: defaultShortcuts as any,
};

const ALL_KEYS = Object.values(KEYS);

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
  const [sheets, setSheets] = useSafeLocalStorage<SheetFile[]>(getScopedKey(KEYS.SHEETS) || KEYS.SHEETS, []);
  const [budgets, setBudgets] = useSafeLocalStorage<Budget[]>(getScopedKey(KEYS.BUDGETS) || KEYS.BUDGETS, []);
  const [debts, setDebts] = useSafeLocalStorage<Debt[]>(getScopedKey(KEYS.DEBTS) || KEYS.DEBTS, []);
  const [recurringTransactions, setRecurringTransactions] = useSafeLocalStorage<RecurringTransaction[]>(getScopedKey(KEYS.RECURRING) || KEYS.RECURRING, []);
  const [savingsGoals, setSavingsGoals] = useSafeLocalStorage<SavingsGoal[]>(getScopedKey(KEYS.SAVINGS) || KEYS.SAVINGS, []);
  // Pinned chat feature removed
  const [lastCheckedDate, setLastCheckedDate] = useSafeLocalStorage<string>(getScopedKey(KEYS.LAST_CHECKED_DATE) || KEYS.LAST_CHECKED_DATE, new Date(0).toISOString());
  const [welcomePlayed, setWelcomePlayed] = useSafeLocalStorage<boolean>(getScopedKey(KEYS.WELCOME) || KEYS.WELCOME, false);
  const [growthTasks, setGrowthTasks] = useSafeLocalStorage<GrowthTask[]>(getScopedKey(KEYS.GROWTH_TASKS) || KEYS.GROWTH_TASKS, []);
  const [growthHistory, setGrowthHistory] = useSafeLocalStorage<GrowthHistory[]>(getScopedKey(KEYS.GROWTH_HISTORY) || KEYS.GROWTH_HISTORY, []);
  const [events, setEvents] = useSafeLocalStorage<CalendarEvent[]>(getScopedKey(KEYS.CALENDAR_EVENTS) || KEYS.CALENDAR_EVENTS, []);
  const [calendars, setCalendars] = useSafeLocalStorage<CalendarDefinition[]>(getScopedKey(KEYS.CALENDAR_DEFINITIONS) || KEYS.CALENDAR_DEFINITIONS, []);
  const [rooms, setRooms] = useSafeLocalStorage<ExcalidrawRoom[]>(getScopedKey(KEYS.ROOMS) || KEYS.ROOMS, []);
  const [journals, setJournals] = useSafeLocalStorage<JournalEntry[]>(getScopedKey(KEYS.JOURNALS) || KEYS.JOURNALS, []);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState<boolean>(false);
  const [isNavHidden, setIsNavHidden] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      let updated = false;

      const newTasks = growthTasks.map(task => {
        if (task.status === 'completed' || !task.criteria) return task;

        let completed = false;
        const { type, target = 1 } = task.criteria;

        try {
          switch (type) {
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

    let savedNavVersion: string | null = null;
    try {
      savedNavVersion = localStorage.getItem('global_nav_version');
    } catch (e) {
      // iOS Safari private mode throws SecurityError on localStorage access
    }

    if (savedNavVersion !== CURRENT_NAV_VERSION) {
      console.log('Migrating navigation structure to version:', CURRENT_NAV_VERSION);

      // Explicitly filter out any remnants of the Brand Room feature
      const sanitizeNav = (structure: NavGroup[]): NavGroup[] => {
        return structure
          .filter(g => g.label !== 'Brand')
          .map(g => ({
            ...g,
            items: g.items.filter(i => i.href !== '/brand-room' && i.label !== 'Brand Room' && i.href !== '/calendar' && i.label !== 'Calendar')
          }))
          .filter(g => g.items.length > 0 || !['Core Control', 'Alfred AI', 'Growth & Strategy', 'Research & Knowledge', 'Finance & Assets', 'Connections & Learning'].includes(g.label));
      };

      const validGroupLabels = new Set(allNavItems.map(g => g.label));
      const existingVisible = appSettings.sidebar?.visibleGroups || [];

      const updatedVisible = [
        ...existingVisible.filter((label: string) => validGroupLabels.has(label) && label !== 'Brand'),
        ...allNavItems.filter(g => !existingVisible.includes(g.label)).map(g => g.label)
      ];

      // Clean up shortcuts
      const updatedShortcuts = { ...appSettings.shortcuts };
      if ((updatedShortcuts as any).goToBrandRoom) {
        delete (updatedShortcuts as any).goToBrandRoom;
      }
      if ((updatedShortcuts as any).goToCalendar) {
        delete (updatedShortcuts as any).goToCalendar;
      }

      const newSettings = {
        ...appSettings,
        navStructure: sanitizeNav(allNavItems),
        shortcuts: updatedShortcuts,
        sidebar: {
          ...appSettings.sidebar,
          visibleGroups: updatedVisible,
        },
      };
      setAppSettings(newSettings);
      try {
        localStorage.setItem('global_nav_version', CURRENT_NAV_VERSION);
      } catch (e) {
        // iOS Safari private mode: silently fail
      }
    }

    // --- PERMANENT BRAND ROOM GUARDIAN ---
    // This runs on every app load, regardless of version, to permanently
    // remove Brand Room from all settings sources.
    setAppSettings(prev => {
      const hasBrandNav = prev.navStructure?.some(g =>
        g.label === 'Brand' || g.items?.some(i => i.href === '/brand-room' || i.href === '/calendar')
      );
      const hasBrandGroup = prev.sidebar?.visibleGroups?.includes('Brand');
      const hasBrandShortcut = !!(prev.shortcuts as any)?.goToBrandRoom || !!(prev.shortcuts as any)?.goToCalendar;

      if (!hasBrandNav && !hasBrandGroup && !hasBrandShortcut) {
        return prev; // Nothing to clean, avoids re-render
      }

      const cleanShortcuts = { ...prev.shortcuts };
      delete (cleanShortcuts as any).goToBrandRoom;
      delete (cleanShortcuts as any).goToCalendar;

      return {
        ...prev,
        navStructure: (prev.navStructure || allNavItems)
          .filter(g => g.label !== 'Brand')
          .map(g => ({
            ...g,
            items: (g.items || []).filter(i => i.href !== '/brand-room' && i.label !== 'Brand Room' && i.href !== '/calendar' && i.label !== 'Calendar'),
          })),
        sidebar: {
          ...prev.sidebar,
          visibleGroups: (prev.sidebar?.visibleGroups || []).filter(g => g !== 'Brand'),
        },
        shortcuts: cleanShortcuts,
      };
    });

    // --- JOURNAL GUARDIAN ---
    setAppSettings(prev => {
      const hasJournal = prev.navStructure?.some(g => 
        g.items?.some(i => i.href === '/journal')
      );
      if (hasJournal) return prev;

      console.log('Adding Journal to navigation structure...');
      return {
        ...prev,
        navStructure: (prev.navStructure || []).map(g => {
          if (g.label === 'Research & Knowledge') {
            const notesIndex = g.items.findIndex(i => i.href === '/notes');
            const newItems = [...g.items];
            if (notesIndex !== -1) {
              newItems.splice(notesIndex, 0, { href: '/journal', label: 'Journal', icon: 'PenLine' });
            } else {
              newItems.push({ href: '/journal', label: 'Journal', icon: 'PenLine' });
            }
            return { ...g, items: newItems };
          }
          return g;
        }),
        sidebar: {
          ...prev.sidebar,
          visibleGroups: prev.sidebar?.visibleGroups?.includes('Research & Knowledge') 
            ? prev.sidebar.visibleGroups 
            : [...(prev.sidebar?.visibleGroups || []), 'Research & Knowledge']
        }
      };
    });

    // --- ALFRED AI SIDEBAR GUARDIAN ---
    setAppSettings(prev => {
      const hasAlfredGroup = prev.sidebar?.visibleGroups?.includes('Alfred AI');
      if (hasAlfredGroup) return prev;
      return {
        ...prev,
        sidebar: {
          ...prev.sidebar,
          visibleGroups: ['Alfred AI', ...(prev.sidebar?.visibleGroups || [])]
        }
      };
    });

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

  // Request Notification Permissions — only after the user is logged in
  useEffect(() => {
    const NotificationApi = typeof window !== 'undefined' ? (window as any).Notification : undefined;
    if (!NotificationApi || NotificationApi.permission !== 'default') return;

    // Only prompt if there is an active session (user is logged in)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        NotificationApi.requestPermission().catch(console.error);
      }
    }).catch(() => { /* ignore — no session */ });
  }, []);

  // Auto-reopen right sidebar after 10 minutes if closed
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (appSettings?.rightSidebar && !appSettings.rightSidebar.isOpen) {
      timeout = setTimeout(() => {
        setAppSettings(prev => ({
          ...prev,
          rightSidebar: { ...prev.rightSidebar, isOpen: true }
        }));
      }, 10 * 60 * 1000); // 10 minutes
    }
    return () => clearTimeout(timeout);
  }, [appSettings?.rightSidebar?.isOpen, setAppSettings]);


  const clearAllUserData = useCallback(() => {
    try {
      const workspaceKey = localStorage.getItem(WORKSPACE_KEY_HOLDER);

      if (workspaceKey) {
        ALL_KEYS.forEach(key => {
          try { localStorage.removeItem(`${workspaceKey}_${key}`); } catch (e) { /* iOS private */ }
        });
      }

      try { localStorage.removeItem(WORKSPACE_KEY_HOLDER); } catch (e) { /* iOS private */ }
    } catch (e) {
      // iOS Safari private mode: localStorage not accessible
    }

    setNotes([]);
    setTasks([]);
    setTaskGroups(defaultGroups);
    setAccounts([]);
    setTransactions([]);
    setClients([]);
    setAssets([]);
    setProjects([]);
    setResearchSessions([]);
    setActivities([]);
    setLearningResources([]);
    setNetworkContacts([]);
    setJournals([]);
    setAiMemories([]);
    setGrowthTasks([]);
    setGrowthHistory([]);
    setUserProfile(defaultUserProfile);
  }, [setNotes, setTasks, setTaskGroups, setAccounts, setTransactions, setClients, setAssets, setProjects, setResearchSessions, setActivities, setLearningResources, setNetworkContacts, setJournals, setAiMemories, setGrowthTasks, setGrowthHistory, setUserProfile]);

  // Auth Listener to handle User Isolation
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      console.log('Auth event:', event);

      if (session?.user) {
        const userId = session.user.id;
        let currentKey: string | null = null;
        try {
          currentKey = localStorage.getItem(WORKSPACE_KEY_HOLDER);
        } catch (e) { /* iOS private mode */ }

        if (currentKey !== userId) {
          console.log('User changed or logged in. Updating workspace key.');
          try {
            localStorage.setItem(WORKSPACE_KEY_HOLDER, userId);
          } catch (e) { /* iOS private mode */ }
          // Hard refresh to ensure all hooks re-load with the new scoped keys
          window.location.reload();
        }

        // Update profile if names are missing or out of sync
        const meta = session.user.user_metadata;
        setUserProfile(prev => {
          if (!prev.email || prev.email !== session.user.email || (!!meta?.has_seen_tour && !prev.hasSeenTour)) {
            const name = meta?.full_name || session.user.email?.split('@')[0] || 'User';
            return {
              ...prev,
              name,
              firstName: meta?.first_name || '',
              lastName: meta?.last_name || '',
              email: session.user.email || '',
              hasSeenTour: prev.hasSeenTour || !!meta?.has_seen_tour,
              hasCompletedSetup: true,
            };
          }
          return prev;
        });
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out. Clearing sensitive data.');
        clearAllUserData();
        window.location.href = '/login';
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [clearAllUserData, setUserProfile]);



  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      clearAllUserData();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      clearAllUserData();
      router.push('/login');
    }
  }, [clearAllUserData, router]);

  const toggleRightSidebar = () => {
    setAppSettings((prev) => ({ ...prev, rightSidebar: { ...prev.rightSidebar, isOpen: !prev.rightSidebar.isOpen } }));
  };

  // Pin chat feature removed

  const handleThemeCycle = () => {
    const themes = appSettings.themeCycle || ['light', 'dark'];
    const next = themes[(themes.indexOf(appSettings.theme) + 1) % themes.length] || 'light';
    setAppSettings((prev) => ({ ...prev, theme: next as Theme }));
  };

  useHotkeys(appSettings.shortcuts.toggleTheme.keys.join('+'), (e) => { e.preventDefault(); handleThemeCycle(); }, { enableOnFormTags: true });
  useHotkeys(appSettings.shortcuts.toggleRightSidebar.keys.join('+'), (e) => { e.preventDefault(); toggleRightSidebar(); }, { enableOnFormTags: true });
  useHotkeys(appSettings.shortcuts.newTask.keys.join('+'), (e) => { e.preventDefault(); setIsAddTaskOpen(true); }, { enableOnFormTags: true });
  useHotkeys(appSettings.shortcuts.newNote.keys.join('+'), (e) => { e.preventDefault(); setIsAddNoteOpen(true); }, { enableOnFormTags: true });

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
      goToJournal: '/journal',
    };

    const listeners: ((e: KeyboardEvent) => void)[] = [];

    Object.entries(navMapping).forEach(([key, path]) => {
      const shortcut = shortcuts[key as keyof typeof shortcuts];
      if (shortcut && shortcut.keys && shortcut.keys.length > 0) {
        const handleGlobalNav = (e: KeyboardEvent) => {
          const keys = shortcut.keys;

          // Check for mod, alt, shift
          const needsMod = keys.includes('mod');
          const needsAlt = keys.includes('alt');
          const needsShift = keys.includes('shift');

          const hasMod = isMac ? e.metaKey : e.ctrlKey;
          const hasAlt = e.altKey;
          const hasShift = e.shiftKey;

          if (hasMod !== needsMod) return;
          if (hasAlt !== needsAlt) return;
          if (hasShift !== needsShift) return;

          const targetKey = keys.find(k => !['mod', 'alt', 'shift'].includes(k));

          if (e.key.toLowerCase() === targetKey?.toLowerCase()) {
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
    journals,
    setJournals,
    isSettingsOpen,
    setIsSettingsOpen,
    isAddTaskOpen,
    setIsAddTaskOpen,
    isAddNoteOpen,
    setIsAddNoteOpen,
    isNavHidden,
    setIsNavHidden,
    logout,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
