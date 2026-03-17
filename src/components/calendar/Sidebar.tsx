import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Eye, User, Database, Check, CalendarDays, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, copyToClipboard } from '@/lib/utils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { useApp } from '@/components/layout/app-provider';
import type { NetworkContact } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Copy, Link as LinkIcon, ExternalLink, Save } from 'lucide-react';

interface SidebarProps {
  calendars: Array<{ id: string; name: string; color?: string; category?: 'my' | 'other' }>;
  selectedCalendars: string[];
  onCalendarToggle: (id: string) => void;
  onDateSelect: (date: Date) => void;
  activeFilters: string[];
  onFilterChange: (tag: string) => void;
  onNewEvent: () => void;
  onNewCalendar: () => void;
  allTags: string[];
  onAddTag: (name: string) => void;
  onRenameTag: (oldTag: string, newTag: string) => void;
  onDeleteTag: (tag: string) => void;
  onAddAccount: () => void;
  onRenameCalendar: (id: string, newName: string) => void;
  onDeleteCalendar: (id: string) => void;
  onSync: () => void;
}

export default function Sidebar({
  calendars,
  selectedCalendars,
  onCalendarToggle,
  onDateSelect,
  onNewEvent,
  onNewCalendar,
  onAddAccount,
  onRenameCalendar,
  onDeleteCalendar,
  onSync,
}: SidebarProps) {
  const { networkContacts, userProfile, setUserProfile, setNetworkContacts } = useApp();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const [meetWith, setMeetWith] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedContact, setSelectedContact] = useState<NetworkContact | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; calendarId: string } | null>(null);
  const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const myCalendars = calendars.filter(c => c.category === 'my' || !c.category);
  const otherCalendars = calendars.filter(c => c.category === 'other');

  // Initialize meeting link from user profile
  React.useEffect(() => {
    if (userProfile.meetingLink && !meetingLink) {
        setMeetingLink(userProfile.meetingLink);
    }
  }, [userProfile.meetingLink]);

  const filteredContacts = React.useMemo(() => {
    if (!meetWith) return [];
    return networkContacts.filter(c => 
        c.name.toLowerCase().includes(meetWith.toLowerCase()) ||
        c.company?.toLowerCase().includes(meetWith.toLowerCase())
    ).slice(0, 5);
  }, [meetWith, networkContacts]);

  const handleSelectContact = (contact: NetworkContact) => {
    setMeetWith(contact.name);
    setSelectedContact(contact);
    setShowSuggestions(false);
    
    // If contact has a specific meeting link, use it? Or keep user's?
    // User requested "work around meetings use user's meetings links".
    // Usually, if I'm scheduling, I use MY link. 
    // But if I'm visiting them, I use THEIRS.
    // I'll stick to MY link as default, but show theirs as an option if available.
  };

  const handleSaveMyLink = () => {
    setUserProfile({ ...userProfile, meetingLink });
    toast({
        title: "Meeting Link Saved",
        description: "Your default meeting link has been updated.",
    });
  };

  const copyInvite = () => {
    if (!meetingLink) return;
    copyToClipboard(meetingLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const [isCollapsed, setIsCollapsed] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <motion.div
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 0 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative h-full bg-background border-r border-border flex flex-col text-foreground"
    >
      <div className="w-full h-full overflow-hidden flex flex-col">
        <div className="w-64 h-full flex flex-col">
          <div className="p-4 pb-0 mb-2">
            <Button onClick={onNewEvent} className="w-full justify-start gap-2 shadow-sm" size="default">
              <Plus className="w-4 h-4" />
              <span className="font-semibold">New Event</span>
            </Button>
          </div>
          {/* Mini Calendar */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-sm">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextMonth} className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {calendarDays.map((day, idx) => (
                <div
                  key={day.toISOString()}
                  onClick={() => onDateSelect(day)}
                  className={cn(
                    "text-center text-xs py-1 rounded-md cursor-pointer hover:bg-muted transition-colors",
                    !isSameMonth(day, monthStart) && "text-muted-foreground/30",
                    isSameMonth(day, monthStart) && "text-foreground",
                    isToday(day) && "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  )}
                >
                  {format(day, 'd')}
                </div>
              ))}
            </div>
          </div>

          {/* Scheduling Section */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <CalendarDays className="w-4 h-4" />
                        <span>Scheduling</span>
                    </div>
                </div>

                <div className="relative group z-20">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Meet with..." 
                        value={meetWith}
                        onChange={(e) => {
                            setMeetWith(e.target.value);
                            setShowSuggestions(true);
                            if (!e.target.value) setSelectedContact(null);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="pl-9 h-9 text-sm bg-muted/30 border-transparent focus:bg-background focus:border-primary/50 transition-all shadow-sm" 
                    />
                    
                    {/* Autocomplete Dropdown */}
                    {showSuggestions && (meetWith || filteredContacts.length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg py-1 z-30 max-h-48 overflow-y-auto">
                            {filteredContacts.map(contact => (
                                <button
                                    key={contact.id}
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2"
                                    onClick={() => handleSelectContact(contact)}
                                >
                                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{contact.name}</span>
                                        {contact.company && <span className="text-[10px] text-muted-foreground">{contact.company}</span>}
                                    </div>
                                </button>
                            ))}
                            {meetWith && !filteredContacts.find(c => c.name.toLowerCase() === meetWith.toLowerCase()) && (
                                <button
                                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted flex items-center gap-2 text-muted-foreground"
                                    onClick={() => {
                                        setShowSuggestions(false);
                                        // Optionally create temp contact?
                                    }}
                                >
                                    <Plus className="w-4 h-4" />
                                    Use "{meetWith}"
                                </button>
                            )}
                            {/* Fallback Suggestions if empty */}
                            {!meetWith && (
                                 <div className="px-2 py-1">
                                    <div className="text-[10px] text-muted-foreground font-medium px-1 uppercase tracking-wider mb-1">Recent</div>
                                    {['Alice Smith', 'Bob Johnson', 'Team Lead'].map((name) => (
                                        <button 
                                            key={name} 
                                            onClick={() => {
                                                setMeetWith(name);
                                                setShowSuggestions(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-medium">
                                                {name.charAt(0)}
                                            </div>
                                            {name}
                                        </button>
                                    ))}
                                 </div>
                            )}
                        </div>
                    )}
                    {showSuggestions && (
                        <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(false)} />
                    )}
                </div>

                {/* Meeting Link Section */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 group">
                            <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Meeting Link..." 
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                className="pl-9 h-9 text-xs bg-muted/30 border-transparent focus:bg-background focus:border-primary/50 transition-all shadow-sm pr-8" 
                            />
                             {meetingLink && (
                                <button 
                                    onClick={() => window.open(meetingLink.startsWith('http') ? meetingLink : `https://${meetingLink}`, '_blank')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                                    title="Open Link"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="w-full h-7 text-[10px] px-0"
                            onClick={copyInvite}
                            disabled={!meetingLink}
                        >
                            {isCopied ? <Check className="w-3 h-3 mr-1.5" /> : <Copy className="w-3 h-3 mr-1.5" />}
                            {isCopied ? 'Copied' : 'Copy Link'}
                        </Button>
                    </div>
                    
                    {selectedContact?.meetingLink && selectedContact.meetingLink !== meetingLink && (
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full h-6 text-[10px] text-muted-foreground hover:text-primary"
                            onClick={() => setMeetingLink(selectedContact.meetingLink!)}
                        >
                            Use {selectedContact.name.split(' ')[0]}'s Link
                        </Button>
                    )}
                </div>
                
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 mb-2">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">My Calendars</div>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={onSync} 
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded"
                            title="Sync Now"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={onAddAccount} 
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded"
                            title="Sync Account"
                        >
                            <LinkIcon className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={onNewCalendar} 
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded"
                            title="New Calendar"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                
                {/* Account Header */}
                <div className="flex items-center gap-2 px-2 py-1.5 mb-2 bg-muted/30 rounded-md border border-border/50">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-foreground truncate flex-1">alishaazad.rath@gmail.com</span>
                </div>
                
                {myCalendars.map((calendar) => (
                  <div key={calendar.id} className="relative group">
                    {editingCalendarId === calendar.id ? (
                        <div className="px-2 py-1.5 flex items-center gap-2">
                             <Input 
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onRenameCalendar(calendar.id, editingName);
                                        setEditingCalendarId(null);
                                    } else if (e.key === 'Escape') {
                                        setEditingCalendarId(null);
                                    }
                                }}
                                autoFocus
                                className="h-7 text-sm"
                                onBlur={() => {
                                    if (editingName.trim()) {
                                         onRenameCalendar(calendar.id, editingName);
                                    }
                                    setEditingCalendarId(null);
                                }}
                             />
                        </div>
                    ) : (
                      <button
                        onClick={() => onCalendarToggle(calendar.id)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, calendarId: calendar.id });
                        }}
                        className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
                      >
                        <div className="relative flex items-center justify-center">
                            <div 
                                className={cn(
                                    "w-3 h-3 rounded-md transition-colors",
                                )}
                                style={{ 
                                    backgroundColor: selectedCalendars.includes(calendar.id) ? (calendar.color || '#737373') : 'transparent', 
                                    border: `1.5px solid ${calendar.color || '#737373'}` 
                                }}
                            />
                            {selectedCalendars.includes(calendar.id) && <Check className="w-2 h-2 text-white absolute" />}
                        </div>
                        <span className={cn("text-sm transition-colors flex-1 text-left truncate", selectedCalendars.includes(calendar.id) ? "text-foreground" : "text-muted-foreground")}>
                            {calendar.name}
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 w-6 h-6 rounded-full border border-border bg-background shadow-sm hover:bg-muted p-0 z-50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </Button>

      {contextMenu && (
        <div
            className="fixed z-50 w-32 bg-popover border border-border rounded-lg shadow-lg py-1"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
        >
             <button
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted/70 flex items-center gap-2"
                onClick={() => {
                    const cal = calendars.find(c => c.id === contextMenu.calendarId);
                    if (cal) {
                        setEditingCalendarId(cal.id);
                        setEditingName(cal.name);
                    }
                    setContextMenu(null);
                }}
            >
                Rename
              </button>
               <button
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted/70 flex items-center gap-2 text-red-500 hover:text-red-600"
                  onClick={() => {
                     // Delete action
                     if (onDeleteCalendar) {
                         onDeleteCalendar(contextMenu.calendarId);
                     }
                     setContextMenu(null);
                   }}
              >
                  Delete
              </button>
               <button
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted/70 flex items-center gap-2 text-muted-foreground"
                  onClick={() => setContextMenu(null)} // Close
              >
                  Cancel
              </button>
        </div>
      )}
      
      {/* Click outside to close context menu */}
      {contextMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
      )}
    </motion.div>
  );
}
