'use client';

import { useState, useEffect, useRef } from 'react';
import { useHover } from '@/components/layout/hover-context';
import { useApp } from '@/components/layout/app-provider';
import { copyToClipboard } from '@/lib/utils';
import { 
    Copy, 
    ClipboardPaste, 
    Scissors, 
    RefreshCw, 
    ArrowLeft, 
    ArrowRight,
    Edit,
    Trash,
    CheckCircle,
    ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GlobalContextMenu() {
    const { hoveredItem } = useHover();
    const { setTasks, setNetworkContacts, setLearningResources } = useApp();
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [hasEdit, setHasEdit] = useState(false);
    const [editTarget, setEditTarget] = useState<HTMLElement | null>(null);
    const [hasSelection, setHasSelection] = useState(false);
    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            
            // Check for selection
            setHasSelection(!!window.getSelection()?.toString());

            // Check for edit capability
            // We look for elements with data-context-edit attribute
            // Or if we are inside a contentEditable element
            // Or if there is a nearby edit button
            
            const target = e.target as HTMLElement;
            const editElement = target.closest('[data-context-edit]');
            
            if (editElement) {
                setHasEdit(true);
                setEditTarget(editElement as HTMLElement);
            } else {
                setHasEdit(false);
                setEditTarget(null);
            }

            // Adjust position to not go off screen
            let x = e.clientX;
            let y = e.clientY;
            
            // Simple check (ref might not be populated yet for width, but we can guess)
            if (x > window.innerWidth - 200) x = window.innerWidth - 200;
            if (y > window.innerHeight - 300) y = window.innerHeight - 300;

            setPosition({ x, y });
            setVisible(true);
        };

        const handleClick = () => {
            setVisible(false);
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('click', handleClick);

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('click', handleClick);
        };
    }, []);

    const handleEdit = () => {
        if (editTarget) {
            // Trigger the click on the edit trigger defined in data attribute
            // Or simply simulate a click on the element itself if it's the trigger
            editTarget.click();
            // Or if there is a specific edit handler attached via custom event?
            // For now, let's assume the element itself handles the action or has a child to click
            
            // If the element has data-edit-trigger, try to find that
            const triggerSelector = editTarget.getAttribute('data-edit-trigger');
            if (triggerSelector) {
                const trigger = document.querySelector(triggerSelector) as HTMLElement;
                if (trigger) trigger.click();
            }
        }
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div 
            ref={menuRef}
            className="fixed z-[100] min-w-[160px] max-h-[300px] overflow-y-auto bg-popover text-popover-foreground border rounded-md shadow-md p-1 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: position.y, left: position.x }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex flex-col text-sm">
                <button 
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 w-full text-left"
                    onClick={() => { router.back(); setVisible(false); }}
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button 
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 w-full text-left"
                    onClick={() => { router.forward(); setVisible(false); }}
                >
                    <ArrowRight className="h-4 w-4" /> Forward
                </button>
                <button 
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground w-full text-left"
                    onClick={() => { window.location.reload(); setVisible(false); }}
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </button>
                
                <div className="h-px bg-border my-1" />

                {/* Context Specific Actions */}
                {hoveredItem?.type === 'task' && hoveredItem.data && (
                    <>
                        <button 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground w-full text-left"
                            onClick={() => {
                                const task = hoveredItem.data;
                                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
                                setVisible(false);
                            }}
                        >
                            <CheckCircle className="h-4 w-4" /> {hoveredItem.data.completed ? 'Mark Incomplete' : 'Mark Complete'}
                        </button>
                        <button 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground w-full text-left text-destructive"
                            onClick={() => {
                                const task = hoveredItem.data;
                                if (confirm('Delete this task?')) {
                                    setTasks(prev => prev.filter(t => t.id !== task.id));
                                }
                                setVisible(false);
                            }}
                        >
                            <Trash className="h-4 w-4" /> Delete Task
                        </button>
                        <div className="h-px bg-border my-1" />
                    </>
                )}

                {hoveredItem?.type === 'contact' && hoveredItem.data && (
                    <>
                         <button 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground w-full text-left"
                            onClick={() => {
                                // We can't easily trigger the specific edit dialog from here without more complex state management
                                // But we can at least support deletion
                                const contact = hoveredItem.data;
                                if (confirm(`Delete contact ${contact.name}?`)) {
                                    setNetworkContacts(prev => prev.filter(c => c.id !== contact.id));
                                }
                                setVisible(false);
                            }}
                        >
                            <Trash className="h-4 w-4" /> Delete Contact
                        </button>
                        <div className="h-px bg-border my-1" />
                    </>
                )}

                {hoveredItem?.type === 'learning' && hoveredItem.data && (
                     <>
                        <button 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground w-full text-left"
                            onClick={() => {
                                window.open(hoveredItem.data.url, '_blank');
                                setVisible(false);
                            }}
                        >
                            <ExternalLink className="h-4 w-4" /> Open Resource
                        </button>
                         <button 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground w-full text-left text-destructive"
                            onClick={() => {
                                const resource = hoveredItem.data;
                                if (confirm(`Delete resource ${resource.title}?`)) {
                                    setLearningResources(prev => prev.filter(r => r.id !== resource.id));
                                }
                                setVisible(false);
                            }}
                        >
                            <Trash className="h-4 w-4" /> Delete Resource
                        </button>
                        <div className="h-px bg-border my-1" />
                    </>
                )}

                {hasEdit && (
                    <>
                        <button 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground w-full text-left"
                            onClick={handleEdit}
                        >
                            <Edit className="h-4 w-4" /> Edit
                        </button>
                        <div className="h-px bg-border my-1" />
                    </>
                )}

                {hasSelection && (
                    <button 
                        className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground w-full text-left"
                        onClick={() => { 
                            copyToClipboard(window.getSelection()?.toString() || ''); 
                            setVisible(false); 
                        }}
                    >
                        <Copy className="h-4 w-4" /> Copy
                    </button>
                )}
                
                 {/* Standard items */}
                 <button 
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent hover:text-accent-foreground w-full text-left"
                    onClick={() => { 
                         navigator.clipboard.readText().then(text => {
                             // This is tricky because we can't easily paste into the target unless it's an input
                             // But we can try document.execCommand('insertText') if focused
                             // For now, simple implementation
                         });
                         setVisible(false); 
                    }}
                    disabled // Browser security restrictions often prevent programmatic paste without user gesture on specific input
                >
                    <ClipboardPaste className="h-4 w-4" /> Paste
                </button>

            </div>
        </div>
    );
}
