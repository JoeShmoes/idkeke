
'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

export type HoveredItemType = 'task' | 'note' | 'default' | 'project' | 'fileOrFolder' | 'goal' | 'client' | 'asset' | 'learning' | 'contact';

interface HoveredItem {
    type: HoveredItemType;
    data?: any;
}

interface HoverContextType {
    hoveredItem: HoveredItem | null;
    setHoveredItem: (item: HoveredItem | null) => void;
}

const HoverContext = createContext<HoverContextType | undefined>(undefined);

export const HoverProvider = ({ children }: { children: ReactNode }) => {
    const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);

    return (
        <HoverContext.Provider value={{ hoveredItem, setHoveredItem }}>
            {children}
        </HoverContext.Provider>
    );
};

export const useHover = () => {
    const context = useContext(HoverContext);
    if (!context) {
        throw new Error('useHover must be used within a HoverProvider');
    }
    return context;
};
