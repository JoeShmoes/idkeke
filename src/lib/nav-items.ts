
import type { NavGroup } from './types';
import { 
    Home, MessageSquareWarning, CheckSquare, Award, Briefcase, TrendingUp, KanbanSquare, 
    Users, Search, Notebook, Newspaper, Truck, Palette, File, Cpu, DollarSign, Building, 
    User, HeartPulse, BookOpen, Network, Bot, GitBranch, PenSquare, Presentation, FileText
} from 'lucide-react';

export const iconMap: { [key: string]: React.ElementType } = {
    Home,
    MessageSquareWarning,
    CheckSquare,
    Award,
    Briefcase,
    TrendingUp,
    KanbanSquare,
    Users,
    Search,
    Notebook,
    Newspaper,
    Truck,
    Palette,
    File,
    Cpu,
    DollarSign,
    Building,
    User,
    HeartPulse,
    BookOpen,
    Network,
    Bot,
    GitBranch,
    PenSquare,
    Presentation,
    FileText,
};

export const allNavItems: NavGroup[] = [
  {
    label: 'Alfred',
    items: [
      { href: '/ai-room', label: 'AI Room', icon: 'Bot' },
    ],
  },
  {
    label: 'Core Control',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'Home' },
      { href: '/tasks', label: 'Tasks', icon: 'CheckSquare' },
    ],
  },
  {
    label: 'Growth & Strategy',
    items: [
             { href: '/growth-hub', label: 'Growth Hub', icon: 'Award' },
             { href: '/business', label: 'Business', icon: 'Briefcase' },
             { href: '/project-board', label: 'Projects', icon: 'KanbanSquare' },
             { href: '/clients', label: 'Clients', icon: 'Users' },
    ]
  },
  {
    label: 'Research & Development',
    items: [
      { href: '/research', label: 'Research', icon: 'Search' },
      { href: '/notes', label: 'Notes', icon: 'Notebook' },
      { href: '/news', label: 'News', icon: 'Newspaper' },
      { href: '/workshop-fabrication-garage', label: 'Workshop', icon: 'Truck' },
    ],
  },
     {
        label: 'Operations & Systems',
        items: [
            { href: '/brand-room', label: 'Brand Room', icon: 'Palette' },
          ],
    },
    {
        label: "Finance & Assets",
        items: [
            { href: '/finance', label: 'Finance', icon: 'DollarSign' },
            { href: '/asset-tracker', label: 'Assets', icon: 'Building' },
            { href: '/file-vault', label: 'File Vault', icon: 'File' },
        ]
    },
    {
        label: "Personal Development",
        items: [
          { href: '/health', label: 'Health', icon: 'HeartPulse' },
          { href: '/learning', label: 'Learning', icon: 'BookOpen' },
          { href: '/networking', label: 'Networking', icon: 'Network' },
        ]
    }
];
