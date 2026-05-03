'use client';

import { useState, useEffect, useRef } from 'react';
import { useApp } from './layout/app-provider';
import { KEYS, getScopedKey } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

import { allNavItems } from '@/lib/nav-items';

export function SyncManager() {
  const { 
    chats, setChats,
    sheets, setSheets,
    notes, setNotes,
    tasks, setTasks,
    taskGroups, setTaskGroups,
    projects, setProjects,
    clients, setClients,
    transactions, setTransactions,
    accounts, setAccounts,
    goals, setGoals,
    researchSessions, setResearchSessions,
    activities, setActivities,
    learningResources, setLearningResources,
    networkContacts, setNetworkContacts,
    vaultFiles, setVaultFiles,
    vaultFolders, setVaultFolders,
    userProfile, setUserProfile,
    appSettings, setAppSettings,
    brandProfile, setBrandProfile,
    assets, setAssets,
    budgets, setBudgets,
    debts, setDebts,
    recurringTransactions, setRecurringTransactions,
    savingsGoals, setSavingsGoals,
    events, setEvents,
    calendars, setCalendars,
    aiMemories, setAiMemories,
    growthTasks, setGrowthTasks,
    growthHistory, setGrowthHistory,
    welcomePlayed, setWelcomePlayed,
    rooms, setRooms,
    journals, setJournals,
    isDataLoaded
  } = useApp();
  
  const { toast } = useToast();
  
  const mounted = useRef(false);
  
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  
  // Map of state keys to their setters and current values, using dynamic scoped keys
  const syncItems = [
    { key: getScopedKey(KEYS.CHATS) || KEYS.CHATS, val: chats, set: setChats },
    { key: getScopedKey(KEYS.SHEETS) || KEYS.SHEETS, val: sheets, set: setSheets },
    { key: getScopedKey(KEYS.NOTES) || KEYS.NOTES, val: notes, set: setNotes },
    { key: getScopedKey(KEYS.TASKS) || KEYS.TASKS, val: tasks, set: setTasks },
    { key: getScopedKey(KEYS.TASK_GROUPS) || KEYS.TASK_GROUPS, val: taskGroups, set: setTaskGroups },
    { key: getScopedKey(KEYS.PROJECTS) || KEYS.PROJECTS, val: projects, set: setProjects },
    { key: getScopedKey(KEYS.CLIENTS) || KEYS.CLIENTS, val: clients, set: setClients },
    { key: getScopedKey(KEYS.TRANSACTIONS) || KEYS.TRANSACTIONS, val: transactions, set: setTransactions },
    { key: getScopedKey(KEYS.ACCOUNTS) || KEYS.ACCOUNTS, val: accounts, set: setAccounts },
    { key: getScopedKey(KEYS.GOALS) || KEYS.GOALS, val: goals, set: setGoals },
    { key: getScopedKey(KEYS.RESEARCH) || KEYS.RESEARCH, val: researchSessions, set: setResearchSessions },
    { key: getScopedKey(KEYS.ACTIVITIES) || KEYS.ACTIVITIES, val: activities, set: setActivities },
    { key: getScopedKey(KEYS.LEARNING) || KEYS.LEARNING, val: learningResources, set: setLearningResources },
    { key: getScopedKey(KEYS.NETWORK) || KEYS.NETWORK, val: networkContacts, set: setNetworkContacts },
    { key: getScopedKey(KEYS.FILES) || KEYS.FILES, val: vaultFiles, set: setVaultFiles },
    { key: getScopedKey(KEYS.FOLDERS) || KEYS.FOLDERS, val: vaultFolders, set: setVaultFolders },
    { key: getScopedKey(KEYS.USER) || KEYS.USER, val: userProfile, set: setUserProfile },
    { key: getScopedKey(KEYS.APP) || KEYS.APP, val: appSettings, set: setAppSettings },
    { key: getScopedKey(KEYS.BRAND) || KEYS.BRAND, val: brandProfile, set: setBrandProfile },
    { key: getScopedKey(KEYS.ASSETS) || KEYS.ASSETS, val: assets, set: setAssets },
    { key: getScopedKey(KEYS.BUDGETS) || KEYS.BUDGETS, val: budgets, set: setBudgets },
    { key: getScopedKey(KEYS.DEBTS) || KEYS.DEBTS, val: debts, set: setDebts },
    { key: getScopedKey(KEYS.RECURRING) || KEYS.RECURRING, val: recurringTransactions, set: setRecurringTransactions },
    { key: getScopedKey(KEYS.SAVINGS) || KEYS.SAVINGS, val: savingsGoals, set: setSavingsGoals },
    { key: getScopedKey(KEYS.CALENDAR_EVENTS) || KEYS.CALENDAR_EVENTS, val: events, set: setEvents },
    { key: getScopedKey(KEYS.CALENDAR_DEFINITIONS) || KEYS.CALENDAR_DEFINITIONS, val: calendars, set: setCalendars },
    { key: getScopedKey(KEYS.AI_MEMORY) || KEYS.AI_MEMORY, val: aiMemories, set: setAiMemories },
    { key: getScopedKey(KEYS.GROWTH_TASKS) || KEYS.GROWTH_TASKS, val: growthTasks, set: setGrowthTasks },
    { key: getScopedKey(KEYS.GROWTH_HISTORY) || KEYS.GROWTH_HISTORY, val: growthHistory, set: setGrowthHistory },
    { key: getScopedKey(KEYS.WELCOME) || KEYS.WELCOME, val: welcomePlayed, set: setWelcomePlayed },
    { key: getScopedKey(KEYS.ROOMS) || KEYS.ROOMS, val: rooms, set: setRooms },
    { key: getScopedKey(KEYS.JOURNALS) || KEYS.JOURNALS, val: journals, set: setJournals },
  ];

  const syncItemsRef = useRef(syncItems);
  const lastSavedState = useRef<{ [key: string]: any }>({});

  // Update ref on every render so effects can access latest values
  syncItemsRef.current = syncItems;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Helper: Smart Merge
  const smartMerge = (key: string, local: any, cloud: any) => {
    if (!local) return cloud;
    if (!cloud) return local;

    // Arrays (Lists of items)
    if (Array.isArray(local) && Array.isArray(cloud)) {
        const itemMap = new Map();
        const getId = (item: any) => item.id || item._id || item.uuid;
        
        // 1. Load Local
        local.forEach(item => {
            const id = getId(item);
            if (id) itemMap.set(id, item);
        });

        // 2. Merge Cloud
        cloud.forEach(item => {
            const id = getId(item);
            if (id) {
                const existing = itemMap.get(id);
                if (existing) {
                    // Special handling for Chats: Merge messages recursively
                    if (key === 'chats' && Array.isArray(existing.messages) && Array.isArray(item.messages)) {
                         // Recursive merge for messages
                         const mergedMessages = smartMerge('messages', existing.messages, item.messages);
                         
                         // Determine which chat object is newer (metadata)
                         const localTime = existing.lastActivity || existing.updatedAt || existing.updated_at || 0;
                         const cloudTime = item.lastActivity || item.updatedAt || item.updated_at || 0;
                         
                         // Base object on the newer one, but use merged messages
                         const base = new Date(cloudTime).getTime() > new Date(localTime).getTime() ? item : existing;
                         
                         itemMap.set(id, {
                             ...base,
                             messages: mergedMessages
                         });
                    } 
                    // Special handling for Messages (recursion from chats)
                    else if (key === 'messages') {
                        // For messages, we assume ID uniqueness is key. 
                        // If edited, we prefer the cloud version (simpler for now).
                        itemMap.set(id, item);
                    }
                    else {
                        // Conflict Resolution: Newer updatedAt wins
                        // Also check lastActivity for chats/others
                        const localTime = existing.updatedAt || existing.updated_at || existing.lastActivity || 0;
                        const cloudTime = item.updatedAt || item.updated_at || item.lastActivity || 0;
                        
                        if (new Date(cloudTime).getTime() > new Date(localTime).getTime()) {
                             itemMap.set(id, item);
                        }
                    }
                } else {
                    itemMap.set(id, item);
                }
            }
        });

        // Post-merge sorting for Messages
        if (key === 'messages') {
             return Array.from(itemMap.values()).sort((a: any, b: any) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
             );
        }

        return Array.from(itemMap.values());
    }

    // Objects
    if (typeof local === 'object' && typeof cloud === 'object') {
        return { ...local, ...cloud };
    }

    // Primitives: Cloud wins
    return cloud;
  };

  // Initial Sync
  useEffect(() => {
    if (!isDataLoaded) return;

    // Wait for local storage to fully hydrate
    const initTimer = setTimeout(() => {
        const syncData = async () => {
        
        // Remove localhost check to allow local development testing
        // if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) { ... }

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                // Not logged in - rely on local storage only
                // console.log('SyncManager: User not logged in. Cloud sync disabled.');
                return;
            }

            // Fetch cloud data
            const { data: allData, error: dbError } = await supabase
            .from('user_data')
            .select('key, value')
            .eq('user_id', user.id);

            if (dbError) {
                // Check if table missing (postgrest error)
                if ((dbError as any).code === 'PGRST116' || (dbError as any).message?.includes('does not exist')) {
                    console.error('SyncManager: EMERGENCY - table "user_data" does not exist in Supabase!');
                    toast({
                        title: 'Backend Setup Required',
                        description: 'The "user_data" table is missing in your Supabase project. Please run the schema SQL.',
                        variant: 'destructive',
                    });
                } else {
                    console.error('SyncManager: Failed to fetch user_data.', dbError);
                    toast({
                        title: 'Sync Offline',
                        description: 'Using local data only. Cloud sync will resume when available.',
                    });
                }
                return;
            }

            // Map cloud data
            const cloudMap = new Map();
            if (allData) {
                allData.forEach(item => cloudMap.set(item.key, item.value));
            }

            const currentItems = syncItemsRef.current;
            let uploadCount = 0;
            let downloadCount = 0;

            // Sync Logic: Smart Merge
            for (const item of currentItems) {
                const localValue = item.val;
                const cloudValue = cloudMap.get(item.key);

                if (cloudValue) {
                    const mergedValue = smartMerge(item.key, localValue, cloudValue);

                            // Special handling for app_settings to enforce navigation structure
                            if (item.key === 'app_settings' && mergedValue && mergedValue.navStructure) {
                                // Always override navStructure with the latest from code to prevent ghost menus
                                // and explicitly filter out any remnants of the Brand Room feature
                                const sanitizeNav = (structure: NavGroup[]): NavGroup[] => {
                                    return structure
                                        .filter(g => g.label !== 'Brand')
                                        .map(g => ({
                                            ...g,
                                            items: g.items.filter(i => i.href !== '/brand-room' && i.label !== 'Brand Room')
                                        }))
                                        .filter(g => g.items.length > 0 || !['Core Control', 'Alfred AI', 'Growth & Strategy', 'Research & Knowledge', 'Finance & Assets', 'Connections & Learning'].includes(g.label));
                                };

                                mergedValue.navStructure = sanitizeNav(allNavItems);
                                
                                // Ensure visibleGroups are consistent (Only keep groups that exist in code)
                                const validGroupLabels = new Set(allNavItems.map(g => g.label));
                                const existingVisible = mergedValue.sidebar?.visibleGroups || [];
                                
                                // Filter out groups that no longer exist and ensure all new groups are included
                                const updatedVisible = [
                                    ...existingVisible.filter((label: string) => validGroupLabels.has(label) && label !== 'Brand'),
                                    ...allNavItems.filter(g => !existingVisible.includes(g.label)).map(g => g.label)
                                ];

                                mergedValue.sidebar = {
                                    ...mergedValue.sidebar,
                                    visibleGroups: updatedVisible
                                };

                                // Clean up shortcuts
                                if (mergedValue.shortcuts && mergedValue.shortcuts.goToBrandRoom) {
                                  delete mergedValue.shortcuts.goToBrandRoom;
                                }
                            }

                            // Update Local if different
                            if (JSON.stringify(localValue) !== JSON.stringify(mergedValue)) {
                                item.set(mergedValue);
                                downloadCount++;
                            }

                    // Update Cloud if different
                    if (JSON.stringify(cloudValue) !== JSON.stringify(mergedValue)) {
                        uploadCount++;
                        await supabase.from('user_data').upsert({
                            user_id: user.id,
                            key: item.key,
                            value: mergedValue,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_id,key' });
                    }
                } else if (localValue && (Array.isArray(localValue) ? localValue.length > 0 : Object.keys(localValue).length > 0)) {
                    // Cloud is empty, Local has data -> Upload
                    uploadCount++;
                    await supabase.from('user_data').upsert({
                        user_id: user.id,
                        key: item.key,
                        value: localValue,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id,key' });
                }
            }

            if (downloadCount > 0) {
                toast({
                    title: 'Sync Complete',
                    description: `Synced ${downloadCount} items across devices.`,
                });
            }

            if (mounted.current) {
                setIsCloudSynced(true);
            }

            if (uploadCount > 0) {
                // console.log(`SyncManager: Backed up ${uploadCount} items to cloud.`);
            }

            // Realtime: Listen for changes but DO NOT APPLY THEM AUTOMATICALLY.
            // This prevents "Echo" wipes.
            const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                {
                event: '*',
                schema: 'public',
                table: 'user_data',
                filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    // Realtime Update Handling
                    const { eventType, new: newRecord } = payload;
                    if ((eventType === 'INSERT' || eventType === 'UPDATE') && newRecord) {
                        const key = newRecord.key;
                        const cloudValue = newRecord.value;
                        
                        // Find the item in our ref
                        const currentItems = syncItemsRef.current;
                        const item = currentItems.find(i => i.key === key);
                        
                        if (item) {
                            // Merge
                            const localValue = item.val;
                            // Note: smartMerge is captured from closure, but we need to ensure it uses the latest logic if it depends on anything.
                            // smartMerge is pure-ish (depends on nothing external except logic), so it's fine.
                            const mergedValue = smartMerge(key, localValue, cloudValue);
                            
                            // Only update if different
                            if (JSON.stringify(localValue) !== JSON.stringify(mergedValue)) {
                                // console.log(`SyncManager: Realtime update for ${key}`);
                                
                                // Prevent Echo: Update lastSavedState BEFORE setting state
                                // This ensures the subsequent useEffect for saving sees the values as identical
                                lastSavedState.current[key] = mergedValue;
                                
                                // Update State
                                item.set(mergedValue);
                                
                                // Optional: Toast for visibility (maybe too noisy for frequent updates)
                                // toast({ title: 'Sync Update', description: `Updated ${key.replace('_', ' ')}.` });
                            }
                        }
                    }
                }
            )
            .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } catch (err) {
            console.error('SyncManager: Unexpected error during syncData', err);
        }
        };

        syncData();
    }, 3000); // Increased delay to 3s to be absolutely sure of hydration

    return () => clearTimeout(initTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataLoaded]);

  // Save changes to Cloud
  useEffect(() => {
    // const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    // if (isLocal) return;
    if (!isDataLoaded || !isCloudSynced) return;

    const saveTimers: { [key: string]: NodeJS.Timeout } = {};

    syncItems.forEach(item => {
      // Check if value has actually changed from what we last saved/loaded
      const lastSaved = lastSavedState.current[item.key];
      const currentVal = item.val;

      // Simple deep compare
      if (JSON.stringify(lastSaved) !== JSON.stringify(currentVal)) {
          // It changed! Queue a save.
          
          const save = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            const { error } = await supabase.from('user_data').upsert({
              user_id: user.id,
              key: item.key,
              value: item.val,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,key' });
    
            if (error) {
                console.error(`SyncManager: Error saving ${item.key}`, error);
                window.dispatchEvent(new CustomEvent('cloud-sync-error', { detail: { key: item.key, error } }));
                toast({
                    title: 'Sync Error',
                    description: `Failed to save ${item.key} to cloud.`,
                    variant: 'destructive',
                });
            } else {
                // console.log(`SyncManager: Saved ${item.key}`);
                lastSavedState.current[item.key] = item.val;
            }
          };

          // Debounce save for 2 seconds
          
          // One Edge Case: "Initial Empty Load"
          const isCurrentEmpty = !currentVal || (Array.isArray(currentVal) && currentVal.length === 0) || (typeof currentVal === 'object' && Object.keys(currentVal).length === 0);
          
          if (lastSaved === undefined && isCurrentEmpty) {
              // Don't save initial empty state to cloud.
              // Just mark it as "saved" so we track future changes.
              lastSavedState.current[item.key] = currentVal;
              return;
          }

          // Notify start of sync (debounce start)
          window.dispatchEvent(new CustomEvent('cloud-sync-start', { detail: { key: item.key } }));

          const timer = setTimeout(async () => {
             await save();
             // Notify completion
             window.dispatchEvent(new CustomEvent('cloud-sync-success', { detail: { key: item.key } }));
          }, 2000);
          
          saveTimers[item.key] = timer;
      }
    });

    return () => {
      Object.values(saveTimers).forEach(t => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Depend on all values to trigger saves
    chats, sheets, notes, tasks, taskGroups, projects, clients, 
    transactions, accounts, goals, researchSessions, activities, 
    learningResources, networkContacts, vaultFiles, vaultFolders,
    userProfile, appSettings, brandProfile, assets, budgets, debts,
    recurringTransactions, savingsGoals, events, calendars, rooms, journals, isDataLoaded, isCloudSynced
  ]);

  return null;
}
