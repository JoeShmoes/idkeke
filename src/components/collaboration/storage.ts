
export interface ExcalidrawRoom {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  elements: any[];
  appState: any;
  files: any;
  thumbnail?: string;
}

const STORAGE_KEY = 'nexaris-excalidraw-rooms';

const getStorageKey = () => {
  if (typeof window === 'undefined') return STORAGE_KEY;
  const workspaceKey = localStorage.getItem('contextflow-workspace-key');
  return workspaceKey ? `${workspaceKey}_${STORAGE_KEY}` : STORAGE_KEY;
};

export const RoomStorage = {
  getRooms: (): ExcalidrawRoom[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(getStorageKey());
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load rooms", e);
      return [];
    }
  },

  getRoom: (id: string): ExcalidrawRoom | undefined => {
    const rooms = RoomStorage.getRooms();
    return rooms.find(r => r.id === id);
  },

  saveRoom: (room: ExcalidrawRoom) => {
    const rooms = RoomStorage.getRooms();
    const index = rooms.findIndex(r => r.id === room.id);
    if (index !== -1) {
      rooms[index] = { ...rooms[index], ...room, updatedAt: new Date().toISOString() };
    } else {
      rooms.push({ ...room, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(getStorageKey(), JSON.stringify(rooms));
  },

  deleteRoom: (id: string) => {
    const rooms = RoomStorage.getRooms().filter(r => r.id !== id);
    localStorage.setItem(getStorageKey(), JSON.stringify(rooms));
  },

  createRoom: (name: string): ExcalidrawRoom => {
    const newRoom: ExcalidrawRoom = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      elements: [],
      appState: { viewBackgroundColor: "#ffffff" },
      files: {}
    };
    RoomStorage.saveRoom(newRoom);
    return newRoom;
  }
};
