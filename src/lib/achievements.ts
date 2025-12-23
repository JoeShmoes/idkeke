
import { CheckSquare, UserPlus, ClipboardCheck, DollarSign, Award, Star, Gem, Notebook, Building, BookOpen, Users } from 'lucide-react';

export type AchievementCategory = 'tasks' | 'clients' | 'projects' | 'finance' | 'notes' | 'assets' | 'learning' | 'networking';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  threshold: number;
  icon: React.ElementType;
  tier: AchievementTier;
  points: number;
}

export const allAchievements: Achievement[] = [
  // Tasks
  { id: 'task-1', title: 'Task Taker', description: 'Complete 1 task.', category: 'tasks', threshold: 1, icon: CheckSquare, tier: 'bronze', points: 5 },
  { id: 'task-2', title: 'Task Doer', description: 'Complete 10 tasks.', category: 'tasks', threshold: 10, icon: CheckSquare, tier: 'bronze', points: 15 },
  { id: 'task-3', title: 'Task Finisher', description: 'Complete 25 tasks.', category: 'tasks', threshold: 25, icon: CheckSquare, tier: 'silver', points: 25 },
  { id: 'task-4', title: 'Task Master', description: 'Complete 50 tasks.', category: 'tasks', threshold: 50, icon: CheckSquare, tier: 'silver', points: 40 },
  { id: 'task-5', title: 'Task Executioner', description: 'Complete 100 tasks.', category: 'tasks', threshold: 100, icon: CheckSquare, tier: 'gold', points: 75 },
  { id: 'task-6', title: 'Task Grandmaster', description: 'Complete 250 tasks.', category: 'tasks', threshold: 250, icon: CheckSquare, tier: 'platinum', points: 150 },
  { id: 'task-7', title: 'The Done-geon Master', description: 'Complete 500 tasks.', category: 'tasks', threshold: 500, icon: Award, tier: 'platinum', points: 300 },
  { id: 'task-8', title: 'Productivity Incarnate', description: 'Complete 1000 tasks.', category: 'tasks', threshold: 1000, icon: Award, tier: 'diamond', points: 600 },

  // Clients
  { id: 'client-1', title: 'Handshake', description: 'Add your first client.', category: 'clients', threshold: 1, icon: UserPlus, tier: 'bronze', points: 10 },
  { id: 'client-2', title: 'Dealmaker', description: 'Manage 5 clients.', category: 'clients', threshold: 5, icon: UserPlus, tier: 'silver', points: 25 },
  { id: 'client-3', title: 'Partner', description: 'Manage 10 clients.', category: 'clients', threshold: 10, icon: UserPlus, tier: 'gold', points: 50 },
  { id: 'client-4', title: 'Rainmaker', description: 'Manage 25 clients.', category: 'clients', threshold: 25, icon: UserPlus, tier: 'platinum', points: 100 },
  { id: 'client-5', title: 'Captain of Industry', description: 'Manage 50 clients.', category: 'clients', threshold: 50, icon: Award, tier: 'diamond', points: 200 },

  // Projects
  { id: 'project-1', title: 'Initiator', description: 'Complete your first project.', category: 'projects', threshold: 1, icon: ClipboardCheck, tier: 'bronze', points: 15 },
  { id: 'project-2', title: 'Manager', description: 'Complete 5 projects.', category: 'projects', threshold: 5, icon: ClipboardCheck, tier: 'silver', points: 40 },
  { id: 'project-3', title: 'Director', description: 'Complete 10 projects.', category: 'projects', threshold: 10, icon: ClipboardCheck, tier: 'gold', points: 80 },
  { id: 'project-4', title: 'Visionary', description: 'Complete 25 projects.', category: 'projects', threshold: 25, icon: Award, tier: 'platinum', points: 160 },
  { id: 'project-5', title: 'Master Architect', description: 'Complete 50 projects.', category: 'projects', threshold: 50, icon: Award, tier: 'diamond', points: 320 },

  // Finance (Net Worth)
  { id: 'finance-1', title: 'Getting Started', description: 'Reach a net worth of $1,000.', category: 'finance', threshold: 1000, icon: DollarSign, tier: 'bronze', points: 20 },
  { id: 'finance-2', title: 'Savvy Saver', description: 'Reach a net worth of $10,000.', category: 'finance', threshold: 10000, icon: DollarSign, tier: 'silver', points: 50 },
  { id: 'finance-3', title: 'Wealth Builder', description: 'Reach a net worth of $50,000.', category: 'finance', threshold: 50000, icon: Star, tier: 'gold', points: 100 },
  { id: 'finance-4', title: 'High Roller', description: 'Reach a net worth of $100,000.', category: 'finance', threshold: 100000, icon: Star, tier: 'platinum', points: 200 },
  { id: 'finance-5', title: 'Financier', description: 'Reach a net worth of $250,000.', category: 'finance', threshold: 250000, icon: Gem, tier: 'diamond', points: 400 },
  { id: 'finance-6', title: 'Millionaire', description: 'Reach a net worth of $1,000,000.', category: 'finance', threshold: 1000000, icon: Gem, tier: 'diamond', points: 1000 },


  // Notes
  { id: 'note-1', title: 'Scribe', description: 'Create 1 note.', category: 'notes', threshold: 1, icon: Notebook, tier: 'bronze', points: 5 },
  { id: 'note-2', title: 'Chronicler', description: 'Create 10 notes.', category: 'notes', threshold: 10, icon: Notebook, tier: 'silver', points: 20 },
  { id: 'note-3', title: 'Librarian', description: 'Create 50 notes.', category: 'notes', threshold: 50, icon: Notebook, tier: 'gold', points: 50 },
  { id: 'note-4', title: 'Archivist', description: 'Create 100 notes.', category: 'notes', threshold: 100, icon: Notebook, tier: 'platinum', points: 100 },
  { id: 'note-5', title: 'Loremaster', description: 'Create 250 notes.', category: 'notes', threshold: 250, icon: Award, tier: 'diamond', points: 200 },
  
  // Assets
  { id: 'asset-1', title: 'Collector', description: 'Track assets worth $1,000.', category: 'assets', threshold: 1000, icon: Building, tier: 'bronze', points: 10 },
  { id: 'asset-2', title: 'Curator', description: 'Track assets worth $10,000.', category: 'assets', threshold: 10000, icon: Building, tier: 'silver', points: 30 },
  { id: 'asset-3', title: 'Magnate', description: 'Track assets worth $50,000.', category: 'assets', threshold: 50000, icon: Building, tier: 'gold', points: 70 },
  { id: 'asset-4', title: 'Tycoon', description: 'Track assets worth $100,000.', category: 'assets', threshold: 100000, icon: Building, tier: 'platinum', points: 150 },
  { id: 'asset-5', title: 'Mogul', description: 'Track assets worth $250,000.', category: 'assets', threshold: 250000, icon: Award, tier: 'diamond', points: 300 },
  
  // Learning
  { id: 'learning-1', title: 'Page Turner', description: 'Complete 1 learning resource.', category: 'learning', threshold: 1, icon: BookOpen, tier: 'bronze', points: 10 },
  { id: 'learning-2', title: 'Bookworm', description: 'Complete 5 learning resources.', category: 'learning', threshold: 5, icon: BookOpen, tier: 'silver', points: 30 },
  { id: 'learning-3', title: 'Scholar', description: 'Complete 15 learning resources.', category: 'learning', threshold: 15, icon: BookOpen, tier: 'gold', points: 70 },
  { id: 'learning-4', title: 'Expert', description: 'Complete 30 learning resources.', category: 'learning', threshold: 30, icon: BookOpen, tier: 'platinum', points: 150 },
  { id: 'learning-5', title: 'Sage', description: 'Complete 50 learning resources.', category: 'learning', threshold: 50, icon: Award, tier: 'diamond', points: 300 },

  // Networking
  { id: 'networking-1', title: 'Meet & Greet', description: 'Add 1 contact.', category: 'networking', threshold: 1, icon: Users, tier: 'bronze', points: 5 },
  { id: 'networking-2', title: 'Connector', description: 'Add 10 contacts.', category: 'networking', threshold: 10, icon: Users, tier: 'silver', points: 25 },
  { id: 'networking-3', title: 'Influencer', description: 'Add 50 contacts.', category: 'networking', threshold: 50, icon: Users, tier: 'gold', points: 60 },
  { id: 'networking-4', title: 'Socialite', description: 'Add 100 contacts.', category: 'networking', threshold: 100, icon: Users, tier: 'platinum', points: 120 },
  { id: 'networking-5', title: 'Nexus', description: 'Add 250 contacts.', category: 'networking', threshold: 250, icon: Award, tier: 'diamond', points: 250 },

];
