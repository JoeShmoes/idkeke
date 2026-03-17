import React from 'react';
import { motion } from 'framer-motion';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  setHours,
  getHours,
  differenceInMinutes,
} from 'date-fns';
import { Edit2, Trash2, Copy, Plus } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';
import { useApp } from '@/components/layout/app-provider';

const hours = Array.from({ length: 24 }, (_, i) => i);

interface WeekViewProps {
  currentDate: Date;
  events: Array<{
    id: string;
    start_date: string;
    end_date?: string | null;
    all_day?: boolean;
    title?: string;
    tag?: string;
    color?: string;
  }>;
  onEventClick: (event: any) => void;
  onTimeSlotClick: (dateTime: Date) => void;
  onTimeSlotDoubleClick?: (dateTime: Date) => void;
  onEventDrop?: (id: string, date: Date) => void;
  onEventDelete?: (id: string) => void;
  onEventUpdate?: (event: any) => void;
  onEventDuplicate?: (event: any) => void;
  selectedEventId?: string | null;
}

  const calculateEventLayout = (events: any[]) => {
    const timedEvents = events.filter((e) => !e.all_day);
    if (timedEvents.length === 0) return [];

    const items = timedEvents.map((event) => {
      const start = new Date(event.start_date);
      const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 60 * 60 * 1000);
      return { event, start, end };
    });
    
    // Sort by start time for consistent layout
    items.sort((a, b) => a.start.getTime() - b.start.getTime());

    const layoutMap = new Map<string, { column: number; columns: number }>();

    for (let i = 0; i < items.length; i++) {
      const current = items[i];

      const overlaps = items.filter(
        (other, index) =>
          index !== i && current.start < other.end && other.start < current.end,
      );

      const cluster = [current, ...overlaps];
      const usedColumns = new Set<number>();

      cluster.forEach((item) => {
        const layout = layoutMap.get(item.event.id);
        if (layout) {
          usedColumns.add(layout.column);
        }
      });

      let column = 0;
      while (usedColumns.has(column)) {
        column += 1;
      }

      const columns = cluster.length || 1;
      
      layoutMap.set(current.event.id, {
        column,
        columns: Math.max(columns, layoutMap.get(current.event.id)?.columns || 1),
      });

      cluster.forEach((item) => {
        const existing = layoutMap.get(item.event.id);
        if (existing) {
          layoutMap.set(item.event.id, {
            ...existing,
            columns: Math.max(existing.columns, columns),
          });
        }
      });
    }

    return timedEvents.map((event) => {
      const layout = layoutMap.get(event.id) || { column: 0, columns: 1 };
      return { event, layout };
    });
  };

export default function WeekView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
  onEventDrop,
  onEventDelete,
  onEventUpdate,
  onEventDuplicate,
  selectedEventId,
}: WeekViewProps) {
  const { appSettings } = useApp();
  const is24Hour = appSettings.timeFormat === '24-hour';

  const formatAxisTime = (date: Date) => (is24Hour ? format(date, 'HH:00') : format(date, 'h a'));
  const formatExactTime = (date: Date) => (is24Hour ? format(date, 'HH:mm') : format(date, 'h:mm a'));

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  const [hoverTimeMinutes, setHoverTimeMinutes] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      const scrollTo = Math.max(0, (currentHour - 2) * 100);
      scrollContainerRef.current.scrollTop = scrollTo;
    }
  }, []);

  // Update current time every minute
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start_date), day));
  };

  const getEventStyle = (event: { start_date: string; end_date?: string | null }) => {
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 60 * 60 * 1000);

    const startHour = getHours(startDate) + startDate.getMinutes() / 60;
    const duration = differenceInMinutes(endDate, startDate) / 60;
    const hourHeight = 100;

    return {
      top: `${startHour * hourHeight}px`,
      height: `${Math.max(duration * hourHeight, 40)}px`,
    };
  };

  const handleDragStart = (e: any, event: { id: string }) => {
    const dragEvent = e as React.DragEvent<HTMLDivElement>;
    if (dragEvent.dataTransfer) {
      dragEvent.dataTransfer.setData('eventId', event.id);
    }
  };

  const handleDrop = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    if (eventId && onEventDrop) {
      const newDate = setHours(day, hour);
      onEventDrop(eventId, newDate);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      <div className="flex border-b border-border bg-background z-10 shrink-0">
        <div className="w-16 shrink-0" />
        {days.map((day) => (
          <div key={day.toISOString()} className="flex-1 py-3 text-center border-l border-border/20">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {format(day, 'EEE')}
            </div>
            <div
              className={cn(
                'w-8 h-8 mx-auto mt-1 flex items-center justify-center rounded-full text-lg',
                isToday(day) && 'bg-primary text-primary-foreground font-medium',
                !isToday(day) && 'text-foreground',
              )}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="flex relative min-h-full">
          <div className="w-16 shrink-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[100px] flex items-center justify-end pr-3"
              >
                <span className="text-xs text-muted-foreground">
                  {formatAxisTime(setHours(new Date(), hour))}
                </span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = getEventsForDay(day);

            // "Also when you hover over time frame it will show the red line move"
            // So we allow hover to override the position.
            const indicatorMinutes =
              hoverTimeMinutes != null
                ? hoverTimeMinutes
                : now.getHours() * 60 + now.getMinutes();

            const displayMinutes = indicatorMinutes;

            const indicatorTime = setHours(setHours(new Date(), 0), 0);
            indicatorTime.setMinutes(displayMinutes);

            return (
              <div key={day.toISOString()} className="flex-1 relative border-l border-border/20">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => onTimeSlotClick(setHours(day, hour))}
                    onDoubleClick={() => onTimeSlotDoubleClick && onTimeSlotDoubleClick(setHours(day, hour))}
                    onDrop={(e) => handleDrop(e, day, hour)}
                    onDragOver={handleDragOver}
                    className={cn(
                      'h-[100px] border-b border-border/20 cursor-pointer transition-colors',
                      'hover:bg-muted/40',
                    )}
                  />
                ))}

                <div className="absolute inset-0 pointer-events-none px-1">
                  {calculateEventLayout(dayEvents).map(({ event, layout }) => {
                      const isSelected = selectedEventId && selectedEventId === event.id;
                      return (
                      <ContextMenu key={event.id}>
                        <ContextMenuTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, event)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                            className={cn(
                              'absolute pointer-events-auto cursor-pointer',
                              'rounded-md p-2 border-l-4 border-y border-r border-border/50',
                              'hover:shadow-lg transition-all overflow-hidden',
                              isSelected 
                                ? 'opacity-100 ring-2 ring-primary ring-offset-2 ring-offset-background z-30' 
                                : 'opacity-95 z-10 hover:z-50 shadow-[0_0_0_1px_hsl(var(--background))] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)]',
                            )}
                            style={{
                              ...getEventStyle(event),
                              backgroundColor: event.color ? `${event.color}15` : 'hsl(var(--primary) / 0.1)',
                              borderColor: event.color || 'hsl(var(--primary))',
                              borderLeftColor: event.color || 'hsl(var(--primary))',
                              left: `${layout.column * (100 / layout.columns)}%`,
                              width: `${100 / layout.columns}%`,
                              paddingRight: layout.columns > 1 ? '4px' : '0',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div className="flex flex-row items-center gap-1.5 h-full">
                              <p className="text-xs font-medium text-foreground truncate shrink-0">
                                {event.title || 'Untitled'}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate shrink-0">
                                {formatExactTime(new Date(event.start_date))}
                              </p>
                            </div>
                          </motion.div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                          <ContextMenuItem onClick={() => onEventClick(event)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Event
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => {
                              if (onTimeSlotClick) {
                                onTimeSlotClick(new Date(event.start_date));
                              }
                          }}>
                            <Plus className="mr-2 h-4 w-4" /> Add event here
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
                    );})}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
