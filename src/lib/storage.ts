
export const WORKSPACE_KEY_HOLDER = 'contextflow-workspace-key';

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
  JOURNALS: 'journals-data',
};

export const getScopedKey = (baseKey: string, roomId?: string) => {
  if (typeof window === 'undefined') return baseKey;
  // iOS Safari in Private Browsing mode throws SecurityError on localStorage access
  let workspaceKey: string | null = null;
  try {
    workspaceKey = localStorage.getItem(WORKSPACE_KEY_HOLDER);
  } catch (e) {
    // Silently fall back to non-scoped key on iOS private mode
  }

  // If a specific roomId is provided, it's explicitly room-scoped
  if (roomId) {
    return workspaceKey ? `${workspaceKey}_room_${roomId}_${baseKey}` : `room_${roomId}_${baseKey}`;
  }

  // All other data is global to the workspace
  return workspaceKey ? `${workspaceKey}_${baseKey}` : baseKey;
};
