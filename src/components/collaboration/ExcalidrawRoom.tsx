'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import "@excalidraw/excalidraw/index.css";
import { 
  Excalidraw, 
  MainMenu, 
  WelcomeScreen, 
  exportToBlob,
  exportToSvg,
  serializeAsJSON
} from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI, ExcalidrawElement, AppState, BinaryFiles } from "@excalidraw/excalidraw/types/types";
import { RoomStorage, ExcalidrawRoom } from './storage';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/components/layout/app-provider';
import { Loader2, Users, Send, Grid as GridIcon, FolderOpen, LayoutGrid, Link as LinkIcon, Youtube, Download, Check, AlertCircle, Bot, MessageSquareWarning } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import throttle from 'lodash/throttle';

import { createPortal } from 'react-dom';

import { useSidebar } from '@/components/ui/sidebar';
import { copyToClipboard } from '@/lib/utils';
import CollabAIPanel from './CollabAIPanel';

interface ExcalidrawRoomProps {
  roomId: string;
  isGuest?: boolean;
}

export default function ExcalidrawRoom({ roomId, isGuest = false }: ExcalidrawRoomProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [roomData, setRoomData] = useState<ExcalidrawRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [gridMode, setGridMode] = useState(true);
  const [allRooms, setAllRooms] = useState<ExcalidrawRoom[]>([]);
  // Dialog state for YouTube
  const [isYoutubeDialogOpen, setIsYoutubeDialogOpen] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  
  // Dialog state for Share
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Sheet state for My Canvases (controlled for shortcut access)
  const [isMyCanvasesOpen, setIsMyCanvasesOpen] = useState(false);
  
  // Alfred AI Panel state
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  
  // Toolbar Portal Target
  const [toolbarContainer, setToolbarContainer] = useState<Element | null>(null);

  // Helper: Smart Merge Excalidraw Elements
  // Resolves conflicts by favoring higher versions (or remote if equal/newer)
  // Preserves local elements that don't exist in remote (preventing data loss)
  const mergeExcalidrawElements = (localElements: readonly any[], remoteElements: readonly any[]) => {
    const merged = new Map<string, any>();
    
    // 1. Add all local elements first
    localElements.forEach(el => merged.set(el.id, el));
    
    // 2. Merge remote elements
    remoteElements.forEach(remoteEl => {
        const localEl = merged.get(remoteEl.id);
        
        if (!localEl) {
            // New element from remote -> Add it
            merged.set(remoteEl.id, remoteEl);
        } else {
            // Conflict resolution:
            // If remote version is strictly greater, it wins.
            // If versions are equal but nonces differ, we need a tie breaker.
            // We'll trust remote for stability if versions are equal/greater, 
            // UNLESS we are locally editing it (which implies local version SHOULD be higher, but just in case).
            
            if (remoteEl.version > localEl.version || (remoteEl.version === localEl.version && remoteEl.versionNonce !== localEl.versionNonce)) {
                 merged.set(remoteEl.id, remoteEl);
            }
        }
    });
    
    return Array.from(merged.values());
  };

  const excalidrawRefCallback = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  }, []);


  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const channelRef = useRef<any>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { appSettings, userProfile, rooms, setRooms, setAppSettings } = useApp();

  const { state: leftSidebarState } = useSidebar();
  const isLeftSidebarOpen = leftSidebarState === 'expanded';
  const isRightSidebarOpen = appSettings.rightSidebar.isOpen;
  const shouldCenterUI = isLeftSidebarOpen && isRightSidebarOpen;

  const isDark = appSettings.theme === 'dark' || appSettings.theme === 'theme-matrix';
  const themeColor = isDark ? "#000000" : "#ffffff";
  const excalidrawTheme = isDark ? "dark" : "light";

  // Username & Color Logic
  const [myUsername, setMyUsername] = useState('');
  const [myColor, setMyColor] = useState('#000000');
  
  useEffect(() => {
    // Generate a consistent color for this user session
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF5', '#F5FF33', '#FF8C33', '#8C33FF'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setMyColor(randomColor);

    if (isGuest) {
        let guestName = sessionStorage.getItem('nexaris_guest_name');
        if (!guestName) {
            guestName = `Guest #${Math.floor(Math.random() * 9000) + 1000}`;
            sessionStorage.setItem('nexaris_guest_name', guestName);
        }
        setMyUsername(guestName);
    } else if (userProfile?.name) {
        setMyUsername(userProfile.name);
    } else {
        setMyUsername('Anonymous');
    }
  }, [isGuest, userProfile]);

  // Collaborators Map
  const collaboratorsRef = useRef<Map<string, any>>(new Map());

  // Load Grid Preference
  useEffect(() => {
    const savedGrid = localStorage.getItem('nexaris-grid-mode');
    if (savedGrid !== null) {
        setGridMode(savedGrid === 'true');
    }
  }, []);

  // Sync Grid Mode with Excalidraw
  useEffect(() => {
    if (excalidrawAPI) {
        excalidrawAPI.updateScene({ appState: { gridModeEnabled: gridMode } });
    }
  }, [gridMode, excalidrawAPI]);

  // Save Grid Preference
  const toggleGrid = () => {
      const newMode = !gridMode;
      setGridMode(newMode);
      localStorage.setItem('nexaris-grid-mode', String(newMode));
  };

  const extractYoutubeId = (url: string): string | null => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) {
        return parsed.pathname.replace('/', '') || null;
      }
      if (parsed.hostname.includes('youtube.com')) {
        const v = parsed.searchParams.get('v');
        if (v) return v;
        if (parsed.pathname.startsWith('/embed/')) {
          return parsed.pathname.split('/embed/')[1] || null;
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  // Load available rooms for the dashboard sheet
  useEffect(() => {
    setAllRooms(rooms.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  }, [rooms]);

  // 1. Load Data (Local or Supabase)
  useEffect(() => {
    if (roomId === 'local') {
        const localRoom = rooms.find(r => r.id === 'local');
        if (localRoom) {
            setRoomData(localRoom);
        } else {
            setRoomData({
                id: 'local',
                name: 'Untitled',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                elements: [],
                appState: { viewBackgroundColor: themeColor, theme: excalidrawTheme },
                files: {}
            });
        }
        setIsLoading(false);
        return;
    }

    // Load from Supabase
    const loadBoard = async () => {
      try {
        if (!roomData) setIsLoading(true);
        
        const { data, error } = await supabase.from("boards").select("*").eq("id", roomId).single();
        
        if (error) {
          // Ignore "Row not found" errors (PGRST116) as we have a fallback
              console.error("Error loading board from Supabase:", error.message || error);
          // If RLS denies access, we might get a specific error code (e.g. 42501)
        }

        if (data) {
            let resolvedName = data.name as string | null;

            if (!resolvedName) {
                const ctxRoom = rooms.find(r => r.id === data.id);
                if (ctxRoom) {
                    resolvedName = ctxRoom.name;
                } else {
                    const storedRoom = RoomStorage.getRoom(data.id);
                    if (storedRoom) resolvedName = storedRoom.name;
                }
            }

            if (!resolvedName) {
                resolvedName = 'Untitled';
            }

            // Extract files from app_state if present (hack to support files without schema change)
            const rawAppState = data.app_state || { viewBackgroundColor: themeColor, theme: excalidrawTheme };
            const storedFiles = rawAppState.files || {};
            // Clean files from appState to avoid pollution
            if (rawAppState.files) {
                delete rawAppState.files;
            }

            let finalElements = data.elements || [];
            let finalFiles = storedFiles;

            // Merge with LocalStorage to prevent wiping unsynced offline work when reloading
            const localRoom = RoomStorage.getRoom(data.id);
            if (localRoom && localRoom.elements) {
                finalElements = mergeExcalidrawElements(localRoom.elements, finalElements);
                finalFiles = { ...finalFiles, ...(localRoom.files || {}) };
            }

            const loadedRoom: ExcalidrawRoom = {
                id: data.id,
                name: resolvedName,
                createdAt: data.created_at,
                updatedAt: new Date().toISOString(),
                elements: finalElements,
                appState: rawAppState,
                files: finalFiles
            };
            setRoomData(loadedRoom);
            
            if (!data.name && resolvedName) {
                await supabase.from("boards").update({ name: resolvedName }).eq("id", data.id);
            }

            if (excalidrawAPI) {
               const sanitizedAppState = { ...loadedRoom.appState, theme: excalidrawTheme };
               if (sanitizedAppState.collaborators && !(sanitizedAppState.collaborators instanceof Map)) {
                   sanitizedAppState.collaborators = new Map();
               }

               // Load files if they exist
               if (loadedRoom.files && Object.keys(loadedRoom.files).length > 0) {
                   excalidrawAPI.addFiles(Object.values(loadedRoom.files));
               }

               excalidrawAPI.updateScene({
                   elements: loadedRoom.elements,
                   appState: sanitizedAppState
               });
            }
        } else {
            if (error) console.warn("Board not found in Supabase, checking local storage fallbacks...");
            
            // Check LocalStorage Fallback
            const localRoom = RoomStorage.getRoom(roomId);
            
            if (localRoom) {
                console.log("Found in LocalStorage, attempting background sync/migration...");
                 try {
                     // Attempt Migration to Supabase
                     // Use upsert to prevent unique constraint errors
                     // Include files in app_state for migration
                     const appStateWithFiles = { ...localRoom.appState, files: localRoom.files };

                     const { error: insertError } = await supabase.from('boards').upsert([
                         { 
                             id: localRoom.id,
                             name: localRoom.name,
                             elements: localRoom.elements,
                             app_state: appStateWithFiles,
                             created_at: localRoom.createdAt
                         }
                     ]).select();
                     
                     if (!insertError) {
                         console.log("Migration successful!");
                         setRoomData(localRoom);
                     } else {
                         throw insertError;
                     }
                 } catch (migrateError: any) {
                      // Fallback for Schema Mismatch (PGRST204)
                      // If 'name' column is missing/stale in schema cache, try saving without it
                      if (migrateError?.code === 'PGRST204' && migrateError?.message?.includes("'name' column")) {
                          console.warn("Schema mismatch detected (missing 'name' column). Retrying without 'name' field...");
                          const appStateWithFiles = { ...localRoom.appState, files: localRoom.files };
                          const { error: retryError } = await supabase.from('boards').upsert([
                              { 
                                  id: localRoom.id,
                                  // name: localRoom.name, // Omitted
                                  elements: localRoom.elements,
                                  app_state: appStateWithFiles,
                                  created_at: localRoom.createdAt
                              }
                          ]).select();

                          if (!retryError) {
                              console.log("Migration successful (without name field)!");
                              setRoomData(localRoom);
                          }
                      } else {
                          // Generic Migration Error
                          console.error("Board sync failed, staying in local/offline mode:", migrateError.message || migrateError);
                          setRoomData(localRoom);
                          setIsOfflineMode(true);
                      }
                  }
                
                if (excalidrawAPI) {
                   // Ensure collaborators is a valid Map
                   const sanitizedAppState = { ...localRoom.appState, theme: excalidrawTheme };
                   if (sanitizedAppState.collaborators && !(sanitizedAppState.collaborators instanceof Map)) {
                       sanitizedAppState.collaborators = new Map();
                   }

                   if (localRoom.files && Object.keys(localRoom.files).length > 0) {
                       excalidrawAPI.addFiles(Object.values(localRoom.files));
                   }

                   excalidrawAPI.updateScene({
                       elements: localRoom.elements,
                       appState: sanitizedAppState
                   });
                }
            } else {
                console.error("Fatal Error: Board not found in any storage.");
                setRoomData(null);
            }
        }
      } catch (fatalError: any) {
          console.error("Critical Room Loading Error:", fatalError.message || fatalError);
          setRoomData(null);
      } finally {
          setIsLoading(false);
      }
    };

    if (!roomId) return;
    loadBoard();
  }, [roomId]); // Removed toast dependency

  // Handle Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+O: Open My Canvases
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        setIsMyCanvasesOpen(true);
      }
      
      // Shift+Alt+D: Toggle Theme (Dark/Light)
      if (e.shiftKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        // Assuming we toggle between 'light' and 'dark' (or preserve current theme family if possible)
        // Simple toggle logic based on current state
        const newTheme = isDark ? 'light' : 'dark';
        setAppSettings(prev => ({ ...prev, theme: newTheme }));
        toast({ title: `Switched to ${newTheme} mode` });
      }

      // Ctrl+Shift+E: Export Image (Native usually works, but we can reinforce)
      // Note: Excalidraw handles this natively if focused, but if not:
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'e') {
         // e.preventDefault(); // Let Excalidraw handle it if possible
         // If we needed to force it: excalidrawAPI.setAppState({ openDialog: 'export' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isDark, setAppSettings]);

   // Find Excalidraw Toolbar for Portal
   useEffect(() => {
     if (isLoading) return;
     
     const findToolbar = () => {
        // Try multiple selectors to be safe
        // .App-toolbar .Stack is the standard structure
        const stack = document.querySelector('.excalidraw .App-toolbar .Stack') || 
                      document.querySelector('.excalidraw .App-toolbar > div > .Stack');
        
        if (stack) {
            setToolbarContainer(stack);
        }
     };

     // Poll for the toolbar since it renders asynchronously
     const interval = setInterval(findToolbar, 500);
     
     // Also try immediately
     findToolbar();

     return () => clearInterval(interval);
   }, [isLoading]);
 
    // Unique session ID for this client to prevent self-echo
  const sessionIdRef = useRef(crypto.randomUUID());
  
  // Guard against circular updates (echoes)
  const isRemoteUpdate = useRef(false);
  const lastSentVersion = useRef(0);

  // 2. Setup Supabase Realtime
  useEffect(() => {
    if (roomId === 'local' || !excalidrawAPI) return;

    console.log(`[Realtime] Joining channel board_${roomId} with Session ID: ${sessionIdRef.current}`);

    // 1. Join a Realtime Channel for this specific board
    const channel = supabase.channel(`board_${roomId}`, {
        config: { broadcast: { ack: false, self: false } } 
    });
    channelRef.current = channel;

    // 2. Listen for changes from other users
    channel
    .on("broadcast", { event: "update" }, ({ payload }: any) => {
        // Prevent updates if the payload is empty or invalid
        if (!payload || !payload.elements) return;

        // CRITICAL: Filter out our own messages using session ID
        if (payload.senderId === sessionIdRef.current) {
            return;
        }

        // console.log("[Realtime] Received external update from:", payload.senderId);
        
        // Mark as remote update so we don't echo it back
        isRemoteUpdate.current = true;

        // Sync Files if present (Important for images)
        if (payload.files && excalidrawAPI) {
             excalidrawAPI.addFiles(Object.values(payload.files));
        }

        // Smart Merge Logic: Combine remote elements with local elements
        // This prevents overwriting local changes (like active drawing) and prevents "cutting out" 
        // by ensuring we don't replace the whole scene with a stale state that misses new local items.
        const currentElements = excalidrawAPI.getSceneElements();
        const mergedElements = mergeExcalidrawElements(currentElements, payload.elements);

        // Use updateScene with collaborators to prevent full redraw flickering
        excalidrawAPI.updateScene({ 
            elements: mergedElements,
            commitToHistory: false // Important: don't mess up undo/redo stack with remote changes
        });
        
        // Reset the guard after a short delay
        setTimeout(() => { isRemoteUpdate.current = false; }, 50);
    })
    .on("broadcast", { event: "cursor" }, ({ payload }: any) => {
        if (!payload || payload.senderId === sessionIdRef.current) return;

        const collaborators = collaboratorsRef.current;
        collaborators.set(payload.senderId, {
            pointer: payload.pointer,
            button: payload.button,
            username: payload.username,
            color: payload.color,
            avatarUrl: payload.avatarUrl,
        });

        excalidrawAPI.updateScene({
            collaborators: new Map(collaborators)
        });
    })
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            window.dispatchEvent(new CustomEvent('excalidraw-live-status', { detail: true }));
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            window.dispatchEvent(new CustomEvent('excalidraw-live-status', { detail: false }));
        }
    });

    return () => {
        supabase.removeChannel(channel);
        channelRef.current = null;
        setIsConnected(false);
        window.dispatchEvent(new CustomEvent('excalidraw-live-status', { detail: false }));
    };
  }, [roomId, excalidrawAPI]);

  // 3. Imperative API: Set Initial State and Handle Theme/Grid Changes
  useEffect(() => {
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({
        appState: {
          theme: excalidrawTheme,
          gridSize: 20,
          currentItemFontFamily: 1, // Hand-drawn
          gridModeEnabled: gridMode,
        }
      });
    }
  }, [excalidrawAPI, excalidrawTheme, gridMode]);

  // 4. Save Logic (Throttled Broadcast + DB Update)
  // We use a ref to throttle the broadcast
  const broadcastChange = useCallback(throttle((elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      if (roomId === 'local' || isOfflineMode || !channelRef.current) return;
      
      channelRef.current.send({ 
        type: "broadcast", 
        event: "update", 
        payload: { 
            elements, 
            files, // Send files so guests receive images
            senderId: sessionIdRef.current // Send our ID so others can filter it (and we can ignore our own echo)
        } 
      });
  }, 100), [roomId, isOfflineMode]); // 100ms throttle

  // Throttled Pointer Broadcast
  const broadcastPointer = useCallback(throttle((payload: any) => {
      if (roomId === 'local' || isOfflineMode || !channelRef.current) return;
      
      channelRef.current.send({ 
        type: "broadcast", 
        event: "cursor", 
        payload: { 
            ...payload,
            senderId: sessionIdRef.current,
            username: myUsername,
            color: { background: myColor, stroke: myColor }
        } 
      });
  }, 30), [roomId, isOfflineMode, myUsername, myColor]); // 30ms throttle for smooth cursors

  // Helper to validate UUID
  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Debounced DB save to avoid hitting API limits
  const saveToDb = useCallback(throttle(async (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      // Generate Thumbnail
      let thumbnail = null;
      try {
          const blob = await exportToBlob({
              elements,
              appState,
              files,
              mimeType: "image/jpeg",
              quality: 0.5,
          });
          if (blob) {
              thumbnail = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
              });
          }
      } catch (e) { console.error("Thumb error", e); }

      // Update Local Storage (Always update cache for Dashboard)
      if (roomData) {
           const updatedRoom = {
               ...roomData,
               elements: elements as any[],
               appState: appState,
               files: files,
               thumbnail: thumbnail || roomData.thumbnail,
               updatedAt: new Date().toISOString()
           };

           setRooms(prev => {
                const index = prev.findIndex(r => r.id === roomId);
                if (index !== -1) {
                    const newRooms = [...prev];
                    newRooms[index] = updatedRoom;
                    return newRooms;
                }
                return [...prev, updatedRoom];
           });
      }

      if (roomId === 'local' || isOfflineMode) return;
      
      // Validate UUID to prevent DB errors
      if (!isValidUUID(roomId)) {
          console.warn(`Skipping DB save: Invalid UUID '${roomId}'`);
          // Optionally set offline mode if we know we can't save?
          // setIsOfflineMode(true); 
          return;
      }

      setSaveStatus('saving');
      window.dispatchEvent(new CustomEvent('excalidraw-save-status', { detail: 'saving' }));
      const appStateToSave = { ...appState };
      if ('collaborators' in appStateToSave) {
          delete (appStateToSave as any).collaborators;
      }
      
      // Store files inside app_state to avoid schema migration issues
      // This is a robust workaround since 'app_state' is JSONB
      const appStateWithFiles = { ...appStateToSave, files };

      // Use upsert to handle both existing and new boards (created locally)
      let { error } = await supabase.from("boards").upsert({
          id: roomId,
          name: roomData?.name || 'Untitled',
          elements: elements as any,
          app_state: appStateWithFiles as any
      }).select();

      // Retry on Schema Cache Error (PGRST204) - specifically for 'name' column
      // This happens if the DB schema changed but the API cache hasn't refreshed
      if (error && error.code === 'PGRST204' && error.message?.includes("'name' column")) {
          console.warn("Schema mismatch (PGRST204): Retrying save without 'name' column...");
           const retry = await supabase.from("boards").upsert({
              id: roomId,
              // name: omitted to bypass schema cache error
              elements: elements as any,
              app_state: appStateWithFiles as any
          }).select();
          error = retry.error;
      }

      if (error) {
          console.error("Save to DB failed:", JSON.stringify(error, null, 2));
          
          // Handle specific errors
          if (error.code === '42501') { // RLS Policy Violation
             toast({ 
                 title: "Permission Denied", 
                 description: "You don't have permission to save this board. Changes are saved locally.",
                 variant: "destructive" 
             });
             // Switch to offline mode to stop repeated errors
             setIsOfflineMode(true);
          } else if (error.code === '22P02') { // Invalid Text Representation (UUID)
             console.error("Invalid UUID format for board ID");
             setIsOfflineMode(true);
          }

          setSaveStatus('error');
          window.dispatchEvent(new CustomEvent('excalidraw-save-status', { detail: 'error' }));
      } else {
          setSaveStatus('saved');
          window.dispatchEvent(new CustomEvent('excalidraw-save-status', { detail: 'saved' }));
          setTimeout(() => {
             setSaveStatus('idle');
             window.dispatchEvent(new CustomEvent('excalidraw-save-status', { detail: 'idle' }));
          }, 2000);
      }
  }, 800), [roomId, isOfflineMode, roomData]); // Reduced to 800ms for better responsiveness

  // Warn user before leaving if there are unsaved changes (approximate)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'saving' || saveStatus === 'error') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  const handleChange = useCallback((elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
    // 1. Guard against circular loops
    if (isRemoteUpdate.current) return;

    // 2. Only sync if the user is NOT actively dragging or resizing
    // This prevents the "flickering dot" because we wait for the shape to finish
    if (appState.draggingElement || appState.resizingElement || appState.editingElement) {
        return;
    }

    // 3. Check for Content Equality (reduce redundant broadcasts)
    const currentVersion = elements.reduce((acc, el) => acc + el.version, 0);
    // Note: We also should check if files changed, but version check is usually enough as files are linked to elements
    if (currentVersion === lastSentVersion.current) return;
    lastSentVersion.current = currentVersion;

    // 4. Broadcast immediately (throttled)
    broadcastChange(elements, appState, files);
    
    // 5. Save to DB (debounced/throttled)
    saveToDb(elements, appState, files);
  }, [broadcastChange, saveToDb, roomData]);

  const handleAddYoutubeElement = () => {
    if (!excalidrawAPI) return;
    
    const id = extractYoutubeId(youtubeUrlInput);
    if (!id) {
        toast({ title: "Invalid YouTube URL", variant: "destructive" });
        return;
    }

    // Construct embed URL with preferences (modest branding, etc)
    // We try to use the embed link directly so Excalidraw uses it
    const embedUrl = `https://www.youtube.com/embed/${id}?modestbranding=1&rel=0&controls=1`;

    const appState = excalidrawAPI.getAppState();
    const { width, height, scrollX, scrollY, zoom } = appState;
    
    // Calculate center of viewport in scene coordinates
    // Scene X = (ClientX / zoom) - scrollX
    const zoomValue = zoom.value;
    const centerX = (width / 2) / zoomValue - scrollX;
    const centerY = (height / 2) / zoomValue - scrollY;
    
    const elementWidth = 560;
    const elementHeight = 315;

    const newElement: any = {
        id: crypto.randomUUID(),
        type: "embeddable",
        x: centerX - elementWidth / 2,
        y: centerY - elementHeight / 2,
        width: elementWidth,
        height: elementHeight,
        angle: 0,
        strokeColor: "#000000",
        backgroundColor: "transparent",
        fillStyle: "hachure",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        groupIds: [],
        roundness: null,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 100000),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: embedUrl, // Excalidraw uses 'link' for the source of embeddables often, or we might need to check standard
        locked: false,
    };

    // Note: Excalidraw might require validation or specific props for embeddables
    // If "embeddable" type isn't fully supported via direct injection in this version,
    // we might need to rely on pasting behavior or ensure the props are exact.
    // However, recent versions support this.
    
    const currentElements = excalidrawAPI.getSceneElements();
    excalidrawAPI.updateScene({
        elements: [...currentElements, newElement],
        commitToHistory: true
    });

    setIsYoutubeDialogOpen(false);
    setYoutubeUrlInput('');
    toast({ title: "Video added to canvas" });
  };

  const handleExportImage = async () => {
    if (!excalidrawAPI) return;
    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      const blob = await exportToBlob({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: appState.theme === 'dark',
        },
        files,
        mimeType: "image/png",
      });

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `nexaris-canvas-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Canvas downloaded as PNG" });
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleExportJSON = () => {
    if (!excalidrawAPI) return;
    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();
      
      const json = serializeAsJSON(elements, appState, files, "local");
      const blob = new Blob([json], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nexaris-canvas-${new Date().toISOString().slice(0, 10)}.excalidraw`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Canvas saved as JSON" });
    } catch (error) {
      console.error("JSON Export failed:", error);
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleExportSVG = async () => {
    if (!excalidrawAPI) return;
    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      const svg = await exportToSvg({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: appState.theme === 'dark',
        },
        files,
      });

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `nexaris-canvas-${new Date().toISOString().slice(0, 10)}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Canvas downloaded as SVG" });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ title: "Export failed", variant: "destructive" });
    }
  };


  const handleStartSession = async () => {
      try {
          let initialElements: any[] = [];
          let initialAppState: any = { viewBackgroundColor: themeColor, theme: excalidrawTheme };
          let initialFiles: any = {};
          let initialName = roomData?.name || 'Untitled';

          if (excalidrawAPI) {
              initialElements = excalidrawAPI.getSceneElements();
              initialAppState = excalidrawAPI.getAppState();
              initialFiles = excalidrawAPI.getFiles();
          } else if (roomData) {
              initialElements = roomData.elements;
              initialAppState = roomData.appState;
              initialFiles = roomData.files || {};
          }
          
          // Sanitize AppState
          const appStateToSave = { ...initialAppState };
          if ('collaborators' in appStateToSave) delete (appStateToSave as any).collaborators;

          // Store files inside app_state
          const appStateWithFiles = { ...appStateToSave, files: initialFiles };

          // Create new board in Supabase
          const { data, error } = await supabase.from('boards').insert([
              { 
                  name: initialName,
                  elements: initialElements,
                  app_state: appStateWithFiles
              }
          ]).select().single();

          if (error) throw error;
          if (data) {
              router.push(`/collaboration/${data.id}`);
              toast({ title: "New collaboration session started!" });
          }
      } catch (e) {
          console.error("Failed to create session", e);
          toast({ title: "Failed to create session", variant: "destructive" });
      }
  };


  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-background/50 backdrop-blur-sm">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Opening canvas...</p>
      </div>
    );
  }

  if (!roomData && roomId !== 'local') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
            <div className="bg-destructive/10 p-4 rounded-full">
                <MessageSquareWarning className="h-10 w-10 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold">Room not found or access denied</h3>
            <p className="text-muted-foreground max-w-md">
                We couldn't load the board "{roomId}". It might not exist, or you might not have permission to view it.
            </p>
            {isGuest ? (
                <div className="flex flex-col gap-4 items-center">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-md max-w-sm">
                        <strong>Guest Access:</strong> If you're trying to view a shared board, please ensure the owner has enabled "Public Access" for this link.
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Retry Connection
                        </Button>
                        <Button onClick={() => router.push('/login')}>
                            Log In to Access
                        </Button>
                    </div>
                </div>
            ) : (
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            )}
        </div>
      );
  }

  return (
    <div className="relative h-full w-full">
      <style>{`
        /* Hide unwanted Help menu items */
        .excalidraw .help-dialog a[href*="docs.excalidraw.com"],
        .excalidraw .help-dialog a[href*="blog.excalidraw.com"],
        .excalidraw .help-dialog a[href*="github.com"],
        .excalidraw .help-dialog a[href*="youtube.com"] {
          display: none !important;
        }
        
        .excalidraw button[aria-label*="Help"] {
          display: none !important;
        }
        
        /* Hide Library Button - Aggressive Selectors */
        .excalidraw .layer-ui__library,
        .excalidraw .library-button,
        .excalidraw button[aria-label*="Library"],
        .excalidraw .App-toolbar__library,
        .excalidraw .sidebar-trigger[aria-label*="Library"],
        .excalidraw [data-testid="library-button"],
        .excalidraw .ToolIcon__icon[aria-label*="Library"],
        .excalidraw .Stack__item button[aria-label*="Library"],
        .excalidraw .sidebar-trigger {
            display: none !important;
        }

        /* Fix Dark Mode Foggy Look */
        .excalidraw.theme--dark {
          --island-bg-color: #09090b !important;
          --popup-bg-color: #09090b !important;
          --popup-secondary-bg-color: #18181b !important;
          --icon-fill-color: #e4e4e7 !important;
          --text-primary-color: #e4e4e7 !important;
          --button-hover-bg-color: #27272a !important;
          --overlay-bg-color: rgba(0, 0, 0, 0.8) !important;
        }
        
        .excalidraw.theme--dark .excalidraw-container {
           background-color: #000000 !important;
        }

        /* Prevent Excalidraw from breaking flex container heights */
        .excalidraw-container {
           height: 100% !important;
           width: 100% !important;
        }

        /* Customize scrollbars */
        .excalidraw ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .excalidraw ::-webkit-scrollbar-thumb {
          background: #52525b;
          border-radius: 4px;
        }
      `}</style>

      <Excalidraw
        excalidrawAPI={excalidrawRefCallback}
        initialData={{
          elements: (() => {
            const elements = roomData?.elements || [];
            // Deduplicate elements by ID to prevent "unique key" errors
            const uniqueElements = new Map();
            elements.forEach((el: any) => uniqueElements.set(el.id, el));
            return Array.from(uniqueElements.values());
          })(),
          appState: {
            ...(roomData?.appState || {}),
            collaborators: new Map(),
            theme: excalidrawTheme,
            viewBackgroundColor: roomData?.appState.viewBackgroundColor || themeColor,
            gridSize: 20,
            gridModeEnabled: true
          },
          files: roomData?.files || {},
          scrollToContent: true
        }}
        onChange={handleChange}
        UIOptions={{
          canvasActions: {
            export: { saveFileToDisk: true },
            saveAsImage: true,
            loadScene: true,
            toggleTheme: true,
          }
        }}
        onPointerUpdate={(payload) => broadcastPointer(payload)}
        handleKeyboardEvents={true}
      >
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
      </Excalidraw>

      {/* Top Right Custom UI Island */}
      <div 
          className={`absolute z-[50] flex items-center gap-1.5 p-1 pr-2 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 transition-all duration-300 ease-in-out max-w-[calc(100vw-32px)] overflow-x-auto ${
              shouldCenterUI 
                  ? 'top-20 left-1/2 -translate-x-1/2' 
                  : 'top-16 sm:top-4 right-4 sm:right-4 left-4 sm:left-auto'
          }`}
          style={{
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
      >
          {/* Dashboard / Canvases Sheet */}
          {!isGuest && (
              <Sheet open={isMyCanvasesOpen} onOpenChange={setIsMyCanvasesOpen}>
                  <SheetTrigger asChild>
                      <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-[var(--button-hover-bg-color)] rounded-md text-[var(--text-primary-color)]"
                          title="My Canvases (Ctrl+O)"
                      >
                          <FolderOpen className="w-4 h-4" />
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                      <SheetHeader>
                          <SheetTitle>My Canvases</SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                          <div className="flex flex-col gap-2">
                              <Button 
                                  variant="outline" 
                                  className="justify-start gap-2 w-full mb-4"
                                  onClick={() => router.push('/collaboration')}
                              >
                                  <LayoutGrid className="w-4 h-4" />
                                  Full Dashboard
                              </Button>
                              {allRooms.map(room => (
                                  <Button
                                      key={room.id}
                                      variant={room.id === roomId ? "secondary" : "ghost"}
                                      className="justify-start gap-2 w-full"
                                      onClick={() => router.push(`/collaboration/${room.id}`)}
                                  >
                                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                      <span className="truncate">{room.name}</span>
                                  </Button>
                              ))}
                          </div>
                      </ScrollArea>
                  </SheetContent>
              </Sheet>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-[var(--button-hover-bg-color)] rounded-md text-[var(--text-primary-color)]"
                  title="Export Options"
              >
                  <Download className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportImage}>
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportSVG}>
                Export as SVG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
              variant="ghost"
              size="icon"
              onClick={toggleGrid}
              className={`h-8 w-8 hover:bg-[var(--button-hover-bg-color)] rounded-md text-[var(--text-primary-color)] ${gridMode ? 'bg-[var(--button-hover-bg-color)]' : ''}`}
              title="Toggle Grid"
          >
              <GridIcon className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          {!isGuest && roomId !== 'local' ? (
              <Button 
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 gap-1.5 text-[var(--text-primary-color)] hover:bg-[var(--button-hover-bg-color)] rounded-md" 
                  onClick={() => {
                       const url = `${window.location.origin}/share/${roomId}`;
                       setShareUrl(url);
                       setIsShareDialogOpen(true);
                  }}
              >
                  <Send className="w-3.5 h-3.5" />
                  Share
              </Button>
          ) : !isGuest && (
              <Button 
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 gap-1.5 text-[var(--text-primary-color)] hover:bg-[var(--button-hover-bg-color)] rounded-md" 
                  onClick={handleStartSession}
              >
                  <Users className="w-3.5 h-3.5" />
                  Start Session
              </Button>
          )}

          {isGuest && (
              <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 text-xs text-[var(--text-primary-color)] hover:bg-[var(--button-hover-bg-color)]"
                  onClick={() => router.push('/login?redirect=/collaboration/' + roomId)}
              >
                  Log in to save
              </Button>
          )}
      </div>

      {/* Portal YouTube Button into the Toolbar */}
      {!isGuest && toolbarContainer && createPortal(
        <div className="Stack__item">
           <button
             className="ToolIcon_type_button ToolIcon_size_medium"
             title="Add YouTube Video"
             onClick={() => setIsYoutubeDialogOpen(true)}
             style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               width: '2.5rem', // Match standard icon size
               height: '2.5rem',
               border: 'none',
               background: 'transparent',
               cursor: 'pointer',
               borderRadius: 'var(--border-radius-lg)',
             }}
           >
             <div className="ToolIcon__icon">
                <Youtube className="w-5 h-5 text-red-500" />
             </div>
           </button>
        </div>,
        toolbarContainer
      )}

      {/* YouTube Dialog */}
      <Dialog open={isYoutubeDialogOpen} onOpenChange={setIsYoutubeDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add YouTube Video</DialogTitle>
                <DialogDescription>
                    Paste a YouTube link below to add it to the canvas.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Input 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    value={youtubeUrlInput}
                    onChange={(e) => setYoutubeUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddYoutubeElement()}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsYoutubeDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddYoutubeElement}>Add to Canvas</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Share Session</DialogTitle>
                <DialogDescription>
                    Share this link with others to collaborate in real-time. Guests will have read-only access by default unless you invite them to the team.
                </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 py-4">
                <div className="grid flex-1 gap-2">
                    <Input 
                        id="link" 
                        defaultValue={shareUrl}
                        readOnly
                    />
                </div>
                <Button 
                    type="submit" 
                    size="sm" 
                    className="px-3"
                    onClick={() => {
                        copyToClipboard(shareUrl);
                        toast({ title: "Link copied!", description: "Share link copied to clipboard." });
                    }}
                >
                    <span className="sr-only">Copy</span>
                    <LinkIcon className="h-4 w-4" />
                </Button>
            </div>
            <DialogFooter className="sm:justify-start">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsShareDialogOpen(false)}
                >
                    Close
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <CollabAIPanel 
        isOpen={isAIPanelOpen} 
        onClose={() => setIsAIPanelOpen(false)}
        getCanvasContext={() => {
            if (!excalidrawAPI) return { elements: [], files: [] };
            return {
                elements: excalidrawAPI.getSceneElements(),
                files: Object.values(excalidrawAPI.getFiles())
            };
        }}
      />
    </div>
  );
}
