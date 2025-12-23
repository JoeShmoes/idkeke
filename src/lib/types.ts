

import type { IconName } from './icons';

export interface NavItem {
    href: string;
    label: string;
    icon: IconName;
    external?: boolean;
}
  
export interface NavGroup {
    label: string;
    items: NavItem[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskView = 'default' | 'groupByDate' | 'kanban';

export interface RepeatDays {
  everyday: boolean;
  Monday: boolean;
  Tuesday: boolean;
  Wednesday: boolean;
  Thursday: boolean;
  Friday: boolean;
  Saturday: boolean;
  Sunday: boolean;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  completed: boolean;
  notifications: boolean;
  groupId: string;
  createdAt: string;
  dueDate?: string; // ISO date string
  repeat?: RepeatDays;
  order?: number;
  // for legacy search compatibility
  text: string;
  status: TaskStatus;
}

export interface TaskGroup {
  id: string;
  name: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'not-started' | 'in-progress' | 'completed';
    links?: { title: string; url: string }[];
}

export type ClientStatus = 'lead' | 'active' | 'inactive';

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: ClientStatus;
  notes?: string;
  lastInteraction?: string; // ISO date string
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO date string
  accountId: string;
  category: string;
}

export interface Account {
  id:string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'investment' | 'credit';
}

export type AssetCategory = 'physical' | 'digital' | 'creative';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  value: number;
  purchaseDate: string; // ISO date string
  notes?: string;
}

export interface LogoAsset {
  id: string;
  name: string;
  url: string;
}

export interface BrandLink {
    id: string;
    title: string;
    url: string;
}

export interface BrandProfile {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
  };
  logos: LogoAsset[];
  fonts: {
    headline: string;
    body: string;
  };
  links: BrandLink[];
}

export type ActivityCategory = 'combat' | 'endurance' | 'strength' | 'flexibility';

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  date?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isEditing?: boolean;
  originalText?: string;
  mode?: string;
  sources?: string[];
  attachments?: Array<{ name: string; size: number; type: string } | File>;
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}

export interface AnswerFromDocumentOutput {
  answer: string;
  quote: string;
}

export interface ResearchSession {
  id: string;
  topic: string;
  summary: string;
  keyPoints: string[];
  userNotes: string;
  articleUrl: string;
  articleTitle: string;
  createdAt: string;
}


export type LearningResourceType = 'article' | 'video' | 'course' | 'book' | 'podcast';
export type LearningResourceStatus = 'todo' | 'in-progress' | 'completed';

export interface LearningResource {
    id: string;
    title: string;
    url: string;
    type: LearningResourceType;
    status: LearningResourceStatus;
    notes?: string;
    createdAt: string;
}

export interface NetworkContact {
    id: string;
    name: string;
    role: string;
    company: string;
    lastContacted: string; // ISO date string
    notes?: string;
}

export interface UserProfile {
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
    hasCompletedSetup?: boolean;
    hasSeenTour?: boolean;
}

export interface VaultFile {
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: string; // ISO date string
    content: string; // Base64 encoded content
    folderId?: string;
    starred: boolean;
}

export interface VaultFolder {
    id: string;
    name: string;
    parentId?: string;
    starred: boolean;
}

export interface SheetFile {
  id: string;
  name: string;
  content: any[][];
  createdAt: string;
}

export interface Milestone {
    id: string;
    text: string;
    completed: boolean;
}
  
export type GoalStatus = 'on-track' | 'at-risk' | 'off-track' | 'achieved' | 'on-hold';
export type GoalCategory = 'personal' | 'professional' | 'financial' | 'health' | 'learning';
  
export interface Goal {
    id: string;
    title: string;
    description: string;
    status: GoalStatus;
    category: GoalCategory;
    targetDate: string; // ISO date string
    milestones: Milestone[];
}

export interface Shortcut {
    name: string;
    keys: string[];
}

export interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    sourceName?: string;
    publishedAt?: string;
  }

export type Theme = 'light' | 'dark' | 'theme-matrix' | 'theme-rose-pine' | 'theme-solarized-light' | 'theme-tokyo-night' | 'theme-dracula' | 'theme-gruvbox' | 'theme-nord' | 'theme-batman' | 'theme-god-mode';
export type SidebarSide = 'left' | 'right';
export type SidebarVariant = 'sidebar' | 'floating' | 'inset';
export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none';

export interface AppSettings {
    theme: Theme;
    themeCycle: Theme[];
    autosave: boolean;
    timeFormat: '12-hour' | '24-hour';
    notificationsEnabled: boolean;
    navStructure: NavGroup[];
    sidebar: {
        visibleGroups: string[];
        side: SidebarSide;
        variant: SidebarVariant;
        collapsible: SidebarCollapsible;
    };
    rightSidebar: {
        isOpen: boolean;
        order: ('notifications' | 'activities' | 'contacts')[];
    };
    tasks: {
        defaultGroupId: string;
        defaultView: TaskView;
        kanbanColumns: string[];
    };
    finance: {
        defaultCurrency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD';
        lowBalanceThreshold: number;
        privacyMode: boolean;
    };
    shortcuts: {
        toggleSearch: Shortcut;
        toggleTheme: Shortcut;
        toggleSidebar: Shortcut;
        toggleRightSidebar: Shortcut;
        newTask: Shortcut;
        newNote: Shortcut;
        goToDashboard: Shortcut;
        goToAlfred: Shortcut;
        goToGrowthHub: Shortcut;
        goToTasks: Shortcut;
        goToResearch: Shortcut;
        goToNotes: Shortcut;
        goToNews: Shortcut;
        goToClients: Shortcut;
        goToProjects: Shortcut;
        goToFinance: Shortcut;
        goToAssets: Shortcut;
        goToBrandRoom: Shortcut;
        goToFileVault: Shortcut;
        goToHealth: Shortcut;
        goToLearning: Shortcut;
        goToNetworking: Shortcut;
        goToBriefingRoom: Shortcut;
        goToWorkshop: Shortcut;
        goToAutomation: Shortcut;
    }
}
