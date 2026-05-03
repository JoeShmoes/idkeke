

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

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  title?: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  all_day?: boolean;
  tag?: string;
  calendar_id?: string;
  checklist?: ChecklistItem[];
  color?: string;
  reminderMinutesBefore?: number | null;
  recurrence?: {
    enabled?: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    weekDays?: number[]; // 0=Sun, 1=Mon, etc.
    endDate?: string;
  };
}

export interface CalendarDefinition {
  id: string;
  name: string;
  color?: string;
  visible?: boolean;
  category?: 'my' | 'other';
}

export interface Note {
  id: string;
  title: string;
  content: any; // Yoopta content
  createdAt?: number;
  updatedAt: number;
  cover?: string;
  icon?: string;
  tags?: string[];
  parentId?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: any; // Yoopta content
  createdAt: number;
  updatedAt: number;
  mood?: string;
  tags?: string[];
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
  updatedAt?: string;
  dueDate?: string; // ISO date string
  repeat?: RepeatDays;
  priority: 'low' | 'medium' | 'high';
  // for legacy search compatibility
  text: string;
  status: TaskStatus;
  order?: number;
}

export interface TaskGroup {
  id: string;
  name: string;
  order?: number;
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
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'investment' | 'credit' | 'loan' | 'cash';
  interestRate?: number; // For debts/savings
  limit?: number; // For credit cards
  dueDate?: number; // Day of month for payments
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'yearly';
  nextDueDate: string;
  accountId: string;
  active: boolean;
}

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: number; // Day of month
  strategy: 'snowball' | 'avalanche';
  accountId?: string; // Link to account if exists
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: 'emergency' | 'purchase' | 'investment' | 'travel' | 'other';
  monthlyContribution: number;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  category: string;
  period: 'monthly' | 'yearly';
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
  isIncomplete?: boolean;
  originalText?: string;
  mode?: string;
  sources?: string[];
  reasoning_details?: any;
  attachments?: Array<{ name: string; size: number; type: string; data?: any } | File>;
}

export interface Chat {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}

export type AIMemorySource = 'chat' | 'app';

export interface AIMemory {
  id: string;
  text: string;
  source: AIMemorySource;
  createdAt: string;
}

export interface GrowthTaskCriteria {
  type: 'project_count' | 'task_count' | 'note_count' | 'client_count' | 'net_worth' | 'manual';
  target?: number;
  category?: string;
}

export interface GrowthTask {
  id: string;
  title: string;
  description: string;
  xp: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  status: 'pending' | 'completed';
  category: 'learning' | 'health' | 'productivity' | 'finance';
  icon?: string;
  criteria?: GrowthTaskCriteria;
  path?: string; // Route to navigate to for completing the task
}

export interface GrowthHistory {
  date: string;
  xpGained: number;
  tasksCompleted: number;
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
  icon?: string;
}

export interface NetworkContact {
  id: string;
  name: string;
  role: string;
  company: string;
  lastContacted: string; // ISO date string
  notes?: string;
  icon?: string;
  meetingLink?: string;
}

export interface UserProfile {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  hasCompletedSetup?: boolean;
  hasSeenTour?: boolean;
  meetingLink?: string;
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

export type Theme = 'light' | 'dark' | 'system' | 'theme-matrix' | 'theme-rose-pine' | 'theme-solarized-light' | 'theme-tokyo-night' | 'theme-dracula' | 'theme-gruvbox' | 'theme-nord' | 'theme-batman' | 'theme-god-mode';
export type SidebarSide = 'left' | 'right';
export type SidebarVariant = 'sidebar' | 'floating' | 'inset';
export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none';

export interface AppSettings {
  theme: Theme;
  themeCycle: Theme[];
  autosave: boolean;
  timeFormat: '12-hour' | '24-hour';
  notificationsEnabled: boolean;
  showToasts: boolean;
  navStructure: NavGroup[];
  sidebar: {
    visibleGroups: string[];
    side: SidebarSide;
    variant: SidebarVariant;
    collapsible: SidebarCollapsible;
  };
  commandPalette: {
    includeTasks: boolean;
    includeNotes: boolean;
    includeContacts: boolean;
    includeProjects: boolean;
  };
  rightSidebar: {
    isOpen: boolean;
    order: ('notifications' | 'activities' | 'contacts')[];
  };
  tasks: {
    defaultGroupId: string;
    defaultView: TaskView;
    kanbanColumns: string[];
    hideCompletedTasks: boolean;
    expandedGroups?: string[];
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
    goToClients: Shortcut;
    goToProjects: Shortcut;
    goToBudgeting: Shortcut;
    goToAssets: Shortcut;
    goToBrandRoom: Shortcut;
    goToFileVault: Shortcut;
    goToHealth: Shortcut;
    goToLearning: Shortcut;
    goToNetworking: Shortcut;
    goToBriefingRoom: Shortcut;
    goToWorkshop: Shortcut;
    goToAutomation: Shortcut;
    goToJournal: Shortcut;
  }
}

export interface AppContextType {
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  taskGroups: TaskGroup[];
  setTaskGroups: React.Dispatch<React.SetStateAction<TaskGroup[]>>;
  networkContacts: NetworkContact[];
  setNetworkContacts: React.Dispatch<React.SetStateAction<NetworkContact[]>>;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  learningResources: LearningResource[];
  setLearningResources: React.Dispatch<React.SetStateAction<LearningResource[]>>;
  researchSessions: ResearchSession[];
  setResearchSessions: React.Dispatch<React.SetStateAction<ResearchSession[]>>;
  vaultFiles: VaultFile[];
  setVaultFiles: React.Dispatch<React.SetStateAction<VaultFile[]>>;
  vaultFolders: VaultFolder[];
  setVaultFolders: React.Dispatch<React.SetStateAction<VaultFolder[]>>;
  sheets: SheetFile[];
  setSheets: React.Dispatch<React.SetStateAction<SheetFile[]>>;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  loading: boolean;
  isDataLoaded: boolean;
  welcomePlayed: boolean;
  setWelcomePlayed: React.Dispatch<React.SetStateAction<boolean>>;
  aiMemories: AIMemory[];
  setAiMemories: React.Dispatch<React.SetStateAction<AIMemory[]>>;
  selectedRoom: string | null;
  setSelectedRoom: React.Dispatch<React.SetStateAction<string | null>>;
  aiMessageCount: number;
  setAiMessageCount: React.Dispatch<React.SetStateAction<number>>;
  journals: JournalEntry[];
  setJournals: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
}
