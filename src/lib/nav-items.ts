
import type { NavGroup } from './types';
import { 
    Home, MessageSquareWarning, ListTodo, TrendingUp, Briefcase, KanbanSquare, 
    Users, Microscope, Notebook, Truck, Palette, File, Cpu, Wallet, Building, 
    User, Activity, GraduationCap, Network, Bot, GitBranch, PenSquare, Presentation, FileText, FileSpreadsheet, PieChart,
    Archive, Wrench, Lock, Rocket, CalendarDays, Mail
} from 'lucide-react';

export const iconMap: { [key: string]: React.ElementType } = {
    Home,
    Mail,
    MessageSquareWarning,
    ListTodo,
    CheckSquare: ListTodo, // Map old to new
    Award: TrendingUp, // Map old to new
    Briefcase,
    TrendingUp,
    KanbanSquare,
    Users,
    Search: Microscope, // Map old to new
    Microscope,
    Notebook,
    Truck,
    Palette,
    File,
    Cpu,
    DollarSign: Wallet, // Map old to new
    Wallet,
    Building,
    User,
    HeartPulse: Activity, // Map old to new
    Activity,
    BookOpen: GraduationCap, // Map old to new
    GraduationCap,
    Network,
    Bot,
    GitBranch,
    PenSquare,
    Presentation,
    FileText,
    FileSpreadsheet,
    PieChart,
    Archive,
    Wrench,
    Lock,
    Rocket,
    CalendarDays
};

export type IconName = keyof typeof iconMap;

export const allNavItems: NavGroup[] = [
  {
    label: 'Alfred AI',
    items: [
      { href: '/ai-room', label: 'Alfred', icon: 'Bot' },
    ],
  },
  {
    label: 'Core Control',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'Home' },
      { href: '/tasks', label: 'Tasks', icon: 'ListTodo' },
      { href: '/collaboration', label: 'Collaboration', icon: 'Presentation' },
      { href: '/calendar', label: 'Calendar', icon: 'CalendarDays' },
      { href: '/sheets', label: 'Spreadsheets', icon: 'FileSpreadsheet' },
    ],
  },
  {
    label: 'Growth & Strategy',
    items: [
      { href: '/growth-hub', label: 'Growth Hub', icon: 'TrendingUp' },
      { href: '/business', label: 'Business', icon: 'Briefcase' },
      { href: '/project-board', label: 'Projects', icon: 'KanbanSquare' },
      { href: '/clients', label: 'Clients', icon: 'Users' },
    ],
  },
  {
    label: 'Research & Knowledge',
    items: [
      { href: '/research', label: 'Research', icon: 'Microscope' },
      { href: '/notes', label: 'Notes', icon: 'Notebook' },
    ],
  },
  {
    label: 'Brand',
    items: [
        { href: '/brand-room', label: 'Brand Room', icon: 'Palette' },
    ]
  },
  {
    label: 'Finance & Assets',
    items: [
        { href: '/budgeting', label: 'Budgeting', icon: 'Wallet' },
        { href: '/asset-tracker', label: 'Assets', icon: 'Building' },
        { href: '/file-vault', label: 'File Vault', icon: 'Lock' },
    ]
  },
  {
    label: 'Connections & Learning',
    items: [
        { href: '/networking', label: 'Networking', icon: 'Network' },
        { href: '/learning', label: 'Learning', icon: 'GraduationCap' },
    ]
  },
];
