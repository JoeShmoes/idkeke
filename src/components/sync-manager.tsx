'use client';

import { useEffect, useRef } from 'react';
import { useApp } from './layout/app-provider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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
    isDataLoaded
  } = useApp();
  
  const mounted = useRef(false);

  // Map of state keys to their setters and current values
  const syncItems = [
    { key: 'chats', val: chats, set: setChats },
    { key: 'sheets', val: sheets, set: setSheets },
    { key: 'notes', val: notes, set: setNotes },
    { key: 'tasks', val: tasks, set: setTasks },
    { key: 'task_groups', val: taskGroups, set: setTaskGroups },
    { key: 'projects', val: projects, set: setProjects },
    { key: 'clients', val: clients, set: setClients },
    { key: 'transactions', val: transactions, set: setTransactions },
    { key: 'accounts', val: accounts, set: setAccounts },
    { key: 'goals', val: goals, set: setGoals },
    { key: 'research_sessions', val: researchSessions, set: setResearchSessions },
    { key: 'activities', val: activities, set: setActivities },
    { key: 'learning_resources', val: learningResources, set: setLearningResources },
    { key: 'network_contacts', val: networkContacts, set: setNetworkContacts },
    { key: 'vault_files', val: vaultFiles, set: setVaultFiles },
    { key: 'vault_folders', val: vaultFolders, set: setVaultFolders },
    { key: 'user_profile', val: userProfile, set: setUserProfile },
    { key: 'app_settings', val: appSettings, set: setAppSettings },
  ];

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Initial Sync (Download from Cloud)
  useEffect(() => {
    if (!isDataLoaded) return;

    const syncData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all user data in one go if possible, or iterate
      const { data: allData } = await supabase
        .from('user_data')
        .select('key, value')
        .eq('user_id', user.id);

      if (allData) {
        allData.forEach(item => {
          const syncItem = syncItems.find(i => i.key === item.key);
          if (syncItem && item.value) {
            // Apply cloud data to local state
            // Note: This overwrites local changes made offline if they haven't synced yet.
            // For a simple sync, this is acceptable.
            syncItem.set(item.value);
          }
        });
      }

      // Realtime subscription
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
            if (payload.new && 'key' in payload.new && 'value' in payload.new) {
               const newData = payload.new as { key: string; value: any };
               const syncItem = syncItems.find(i => i.key === newData.key);
               if (syncItem) {
                 syncItem.set(newData.value);
               }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    syncData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataLoaded]); // Run once when data is loaded

  // Save changes to Cloud (Debounced)
  useEffect(() => {
    if (!isDataLoaded) return;

    const saveTimers: NodeJS.Timeout[] = [];

    syncItems.forEach(item => {
      const save = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        await supabase.from('user_data').upsert({
          user_id: user.id,
          key: item.key,
          value: item.val,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,key' });
      };

      // Debounce save for 2 seconds
      const timer = setTimeout(save, 2000);
      saveTimers.push(timer);
    });

    return () => {
      saveTimers.forEach(t => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Depend on all values to trigger saves
    chats, sheets, notes, tasks, taskGroups, projects, clients, 
    transactions, accounts, goals, researchSessions, activities, 
    learningResources, networkContacts, vaultFiles, vaultFolders,
    userProfile, appSettings, isDataLoaded
  ]);

  return null;
}
