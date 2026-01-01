
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
} from '@/lib/types';
import { useHotkeys } from '@/hooks/use-hotkeys-safe';
import { useRouter } from 'next/navigation';
import { allNavItems } from '@/lib/nav-items';
import { useSafeLocalStorage } from '@/hooks/use-safe-local-storage';
import { startOfToday, isBefore, isToday, addDays } from 'date-fns';
import type { RepeatDays } from '@/lib/types';

const WORKSPACE_KEY_HOLDER = 'contextflow-workspace-key';

const getScopedKey = (baseKey: string) => {
  if (typeof window === 'undefined') return null;
  const workspaceKey = localStorage.getItem(WORKSPACE_KEY_HOLDER);
  return workspaceKey ? `${workspaceKey}_${baseKey}` : baseKey;
};

const KEYS = {
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
  NAV_VERSION: 'nav-structure-version',
  LAST_CHECKED_DATE: 'last-task-check-date',
  WELCOME: 'welcome-sound-played'
};

const CURRENT_NAV_VERSION = '1.9';

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
  sheets: SheetFile[];
  setSheets: React.Dispatch<React.SetStateAction<SheetFile[]>>;
  exportAllDataAsPdf: () => void;
  isMac: boolean;
  loading: boolean;
  isDataLoaded: boolean;
  toggleRightSidebar: () => void;
  welcomePlayed: boolean;
  setWelcomePlayed: React.Dispatch<React.SetStateAction<boolean>>;
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
const defaultUserProfile: UserProfile = { name: 'User', email: '', firstName: '', lastName: '', hasSeenTour: false };

const defaultShortcuts: { [key: string]: Shortcut } = {
    toggleSearch: { name: 'Toggle Search', keys: ['mod', 'k'] },
    toggleTheme: { name: 'Toggle Theme', keys: ['mod', 'j'] },
    toggleSidebar: { name: 'Toggle Sidebar', keys: ['mod', 'b'] },
    toggleRightSidebar: { name: 'Toggle Right Sidebar', keys: ['mod', 'i'] },
    newTask: { name: 'New Task', keys: ['mod', 'n'] },
    newNote: { name: 'New Note', keys: ['mod', 'm'] },
    goToDashboard: { name: 'Go to Dashboard', keys: ['g', 'd'] },
    goToAlfred: { name: 'Go to Alfred', keys: ['g', 'a'] },
    goToGrowthHub: { name: 'Go to Growth Hub', keys: ['g', 'h'] },
    goToTasks: { name: 'Go to Tasks', keys: ['g', 't'] },
    goToResearch: { name: 'Go to Research', keys: ['g', 'r'] },
    goToNotes: { name: 'Go to Notes', keys: ['g', 'n'] },
    goToNews: { name: 'Go to News', keys: ['g', 'e'] },
    goToClients: { name: 'Go to Clients', keys: ['g', 'c'] },
    goToProjects: { name: 'Go to Projects', keys: ['g', 'p'] },
    goToFinance: { name: 'Go to Finance', keys: ['g', 'f'] },
    goToAssets: { name: 'Go to Assets', keys: ['g', 's'] },
    goToBrandRoom: { name: 'Go to Brand Room', keys: ['g', 'b'] },
    goToFileVault: { name: 'Go to File Vault', keys: ['g', 'v'] },
    goToHealth: { name: 'Go to Health', keys: ['g', 'l'] },
    goToLearning: { name: 'Go to Learning', keys: ['g', 'o'] },
    goToNetworking: { name: 'Go to Networking', keys: ['g', 'w'] },
    goToBriefingRoom: { name: 'Go to Briefing Room', keys: ['g', 'i'] },
    goToWorkshop: { name: 'Go to Workshop', keys: ['g', 'x'] },
    goToAutomation: { name: 'Go to Automation', keys: ['g', 'u'] },
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
  rightSidebar: { isOpen: true, order: ['notifications', 'contacts', 'activities'] },
  tasks: { defaultGroupId: 'default', defaultView: 'default', kanbanColumns: [] },
  finance: { defaultCurrency: 'USD', lowBalanceThreshold: 500, privacyMode: false },
  shortcuts: defaultShortcuts as any,
};

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isMac, setIsMac] = useState(false);

  const [notes, setNotes] = useSafeLocalStorage<Note[]>(KEYS.NOTES, []);
  const [tasks, setTasks] = useSafeLocalStorage<Task[]>(KEYS.TASKS, []);
  const [taskGroups, setTaskGroups] = useSafeLocalStorage<TaskGroup[]>(KEYS.TASK_GROUPS, defaultGroups);
  const [accounts, setAccounts] = useSafeLocalStorage<Account[]>(KEYS.ACCOUNTS, []);
  const [transactions, setTransactions] = useSafeLocalStorage<Transaction[]>(KEYS.TRANSACTIONS, []);
  const [clients, setClients] = useSafeLocalStorage<Client[]>(KEYS.CLIENTS, []);
  const [assets, setAssets] = useSafeLocalStorage<Asset[]>(KEYS.ASSETS, []);
  const [brandProfile, setBrandProfile] = useSafeLocalStorage<BrandProfile | null>(KEYS.BRAND, defaultBrandProfile);
  const [projects, setProjects] = useSafeLocalStorage<Project[]>(KEYS.PROJECTS, []);
  const [researchSessions, setResearchSessions] = useSafeLocalStorage<ResearchSession[]>(KEYS.RESEARCH, []);
  const [activities, setActivities] = useSafeLocalStorage<Activity[]>(KEYS.ACTIVITIES, []);
  const [learningResources, setLearningResources] = useSafeLocalStorage<LearningResource[]>(KEYS.LEARNING, []);
  const [networkContacts, setNetworkContacts] = useSafeLocalStorage<NetworkContact[]>(KEYS.NETWORK, []);
  const [userProfile, setUserProfile] = useSafeLocalStorage<UserProfile>(KEYS.USER, defaultUserProfile);
  const [appSettings, setAppSettings] = useSafeLocalStorage<AppSettings>(KEYS.APP, defaultAppSettings);
  const [vaultFiles, setVaultFiles] = useSafeLocalStorage<VaultFile[]>(KEYS.FILES, []);
  const [vaultFolders, setVaultFolders] = useSafeLocalStorage<VaultFolder[]>(KEYS.FOLDERS, []);
  const [goals, setGoals] = useSafeLocalStorage<Goal[]>(KEYS.GOALS, []);
  const [chats, setChats] = useSafeLocalStorage<Chat[]>(KEYS.CHATS, []);
  const [sheets, setSheets] = useSafeLocalStorage<SheetFile[]>(KEYS.SHEETS, []);
  // Pinned chat feature removed
  const [lastCheckedDate, setLastCheckedDate] = useSafeLocalStorage<string>(KEYS.LAST_CHECKED_DATE, new Date(0).toISOString());
  const [welcomePlayed, setWelcomePlayed] = useSafeLocalStorage<boolean>(KEYS.WELCOME, false);


  useEffect(() => {
    setIsMac(navigator.userAgent.includes('Mac'));
    
    const savedNavVersion = localStorage.getItem(getScopedKey(KEYS.NAV_VERSION) || '');
    if (savedNavVersion !== CURRENT_NAV_VERSION) {
      const newSettings = {
        ...appSettings,
        navStructure: allNavItems,
        sidebar: { 
          ...appSettings.sidebar,
          visibleGroups: allNavItems.map(g => g.label) 
        },
        rightSidebar: {
          ...appSettings.rightSidebar,
          order: ['notifications', 'contacts'] as ('notifications'|'contacts'|'activities')[]
        }
      };
      setAppSettings(newSettings);
      localStorage.setItem(getScopedKey(KEYS.NAV_VERSION) || '', CURRENT_NAV_VERSION);
    }
    
    if (isDataLoaded) { // Only run task check after initial data load
        const today = startOfToday();
        if (isBefore(new Date(lastCheckedDate), today)) {
          console.log('Checking repeating tasks for a new day...');
          const todayDay = new Date().toLocaleString('en-US', { weekday: 'long' }) as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
          setTasks(prevTasks =>
            prevTasks.map(task => {
              if (task.completed && task.repeat) {
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
    sheets,
    setSheets,
    exportAllDataAsPdf,
    isMac,
    loading,
    isDataLoaded,
    toggleRightSidebar,
    welcomePlayed,
    setWelcomePlayed,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}
