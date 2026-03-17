import React from 'react';
import { motion } from 'framer-motion';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { Edit2, Trash2, Copy, ExternalLink } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import EventBlock from '@/components/calendar/EventBlock';
import { cn } from '@/lib/utils';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MonthViewProps {
  currentDate: Date;
  events: Array<{
    id: string;
    start_date: string;
    end_date?: string | null;
    title?: string;
    description?: string;
    all_day?: boolean;
    tag?: string;
    color?: string;
  }>;
  onEventClick: (event: any) => void;
  onDayClick: (day: Date) => void;
  onDayDoubleClick?: (day: Date) => void;
  onEventDrop?: (id: string, date: Date) => void;
  onEventDelete?: (id: string) => void;
  onEventUpdate?: (event: any) => void;
  onEventDuplicate?: (event: any) => void;
}

export default function MonthView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
  onDayDoubleClick,
  onEventDrop,
  onEventDelete,
  onEventUpdate,
  onEventDuplicate,
}: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start_date), day));
  };

  const handleDragStart = (e: React.DragEvent, event: { id: string }) => {
    e.dataTransfer.setData('eventId', event.id);
  };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    if (eventId && onEventDrop) {
      onEventDrop(eventId, day);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 flex flex-col bg-background overflow-y-auto">
      <div className="grid grid-cols-7 border-b border-border/50 bg-muted/40 shrink-0">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <motion.div
              key={day.toISOString()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.01 }}
              onClick={() => onDayClick(day)}
              onDoubleClick={() => onDayDoubleClick && onDayDoubleClick(day)}
              onDrop={(e) => handleDrop(e, day)}
              onDragOver={handleDragOver}
              className={cn(
                'min-h-[120px] border-b border-r border-border/40 p-2 cursor-pointer transition-colors',
                'hover:bg-muted/40',
                !isCurrentMonth && 'bg-muted/20',
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 transition-colors',
                  isToday(day) && 'bg-primary text-primary-foreground font-medium',
                  !isToday(day) && isCurrentMonth && 'text-foreground',
                  !isToday(day) && !isCurrentMonth && 'text-muted-foreground/60',
                )}
              >
                {format(day, 'd')}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <ContextMenu key={event.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, event)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        <EventBlock event={event} compact />
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                      <ContextMenuItem onClick={() => onEventClick(event)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Edit Event
                      </ContextMenuItem>
                      {onEventDuplicate && (
                        <ContextMenuItem onClick={() => onEventDuplicate(event)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </ContextMenuItem>
                      )}
                      {onEventDelete && (
                        <ContextMenuItem className="text-destructive" onClick={() => onEventDelete(event.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
                {dayEvents.length > 3 && (
                  <button className="text-xs text-muted-foreground hover:text-foreground pl-2">
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
