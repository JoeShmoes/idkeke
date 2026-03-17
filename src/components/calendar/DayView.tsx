import React from 'react';
import { motion } from 'framer-motion';
import {
  format,
  isSameDay,
  isToday,
  setHours,
  getHours,
  differenceInMinutes,
  setMinutes,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useApp } from '@/components/layout/app-provider';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Edit2, Trash2, Copy, Plus } from 'lucide-react';

const hours = Array.from({ length: 24 }, (_, i) => i);

interface DayViewProps {
  currentDate: Date;
  events: Array<{
    id: string;
    start_date: string;
    end_date?: string | null;
    all_day?: boolean;
    title?: string;
    tag?: string;
    description?: string;
    color?: string;
  }>;
  onEventClick: (event: any) => void;
  onTimeSlotClick: (dateTime: Date) => void;
  onTimeRangeSelect?: (start: Date, end: Date) => void;
  onEventDrop?: (id: string, date: Date) => void;
  onEventDelete?: (id: string) => void;
  onEventUpdate?: (event: any) => void;
  onEventDuplicate?: (event: any) => void;
  selectedEventId?: string | null;
}

export default function DayView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
  onTimeRangeSelect,
  onEventDrop,
  onEventDelete,
  onEventUpdate,
  onEventDuplicate,
  selectedEventId,
}: DayViewProps) {
  const { appSettings } = useApp();
  const is24Hour = appSettings.timeFormat === '24-hour';

  // Height of one hour in pixels
  const HOUR_HEIGHT = 180; 
  const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
  const SLOT_MINUTES = 15;
  const SLOT_HEIGHT = HOUR_HEIGHT / (60 / SLOT_MINUTES);

  const formatAxisTime = (date: Date) => (is24Hour ? format(date, 'HH:mm') : format(date, 'h:mm a'));
  const formatHourLabel = (date: Date) => (is24Hour ? format(date, 'HH') : format(date, 'h a'));
  const formatExactTime = (date: Date) => (is24Hour ? format(date, 'HH:mm') : format(date, 'h:mm a'));

  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  const [hoverTimeMinutes, setHoverTimeMinutes] = React.useState<number | null>(null);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [selectionAnchorMinutes, setSelectionAnchorMinutes] = React.useState<number | null>(null);
  const [selectionCurrentMinutes, setSelectionCurrentMinutes] = React.useState<number | null>(null);
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; event: any } | null>(null);

  const dayEvents = events.filter((event) => isSameDay(new Date(event.start_date), currentDate));

  const selectionStartMinutes =
    selectionAnchorMinutes != null && selectionCurrentMinutes != null
      ? Math.min(selectionAnchorMinutes, selectionCurrentMinutes)
      : null;
  const selectionEndMinutesExclusive =
    selectionAnchorMinutes != null && selectionCurrentMinutes != null
      ? Math.max(selectionAnchorMinutes, selectionCurrentMinutes) + SLOT_MINUTES
      : null;

  const allDayEvents = dayEvents.filter((e) => e.all_day);
  const timedEvents = dayEvents.filter((e) => !e.all_day);

  const timedEventsWithLayout = React.useMemo(() => {
    if (timedEvents.length === 0) return [];

    const items = timedEvents.map((event) => {
      const start = new Date(event.start_date);
      const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 60 * 60 * 1000);
      return { event, start, end };
    });

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
  }, [timedEvents]);

  React.useEffect(() => {
    if (scrollContainerRef.current && isToday(currentDate)) {
      const currentHour = new Date().getHours();
      const scrollTo = Math.max(0, (currentHour - 2) * HOUR_HEIGHT);
      scrollContainerRef.current.scrollTop = scrollTo;
    }
  }, [currentDate]);

  const getEventStyle = (event: { start_date: string; end_date?: string | null }) => {
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 60 * 60 * 1000);

    const startHour = getHours(startDate) + startDate.getMinutes() / 60;
    const duration = differenceInMinutes(endDate, startDate) / 60;

    return {
      top: `${startHour * HOUR_HEIGHT}px`,
      height: `${Math.max(duration * HOUR_HEIGHT, SLOT_HEIGHT)}px`,
    };
  };

  const handleDragStart = (e: any, event: { id: string }) => {
    const dragEvent = e as React.DragEvent<HTMLDivElement>;
    if (dragEvent.dataTransfer) {
      dragEvent.dataTransfer.setData('eventId', event.id);
    }
  };

  const handleDrop = (e: React.DragEvent, hour: number, minute: number) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('eventId');
    if (eventId && onEventDrop) {
      const newDate = setMinutes(setHours(currentDate, hour), minute);
      onEventDrop(eventId, newDate);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {allDayEvents.length > 0 && (
        <div className="p-4 border-b border-border bg-muted/50 shrink-0">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            All Day
          </div>
          <div className="flex flex-wrap gap-2">
            {allDayEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => onEventClick(event)}
                className="px-3 py-1.5 bg-card border border-border rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
              >
                <span className="text-sm font-medium text-foreground">
                  {event.title || 'Untitled'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="flex relative">
          <div className="w-20 shrink-0 border-r border-border bg-background/50 backdrop-blur-sm z-20">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-border/5"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className={cn(
                  "absolute right-2 text-xs font-medium text-muted-foreground bg-background px-1",
                  hour === 0 ? "top-1" : "top-[-7px]"
                )}>
                  {formatHourLabel(setHours(new Date(), hour))}
                </span>
                {[15, 30, 45].map((m) => (
                   <span 
                     key={m} 
                     className="absolute right-2 text-[10px] text-muted-foreground/40 font-medium"
                     style={{ top: `${(m/60)*100}%`, transform: 'translateY(-50%)' }}
                   >
                     {m}
                   </span>
                ))}
              </div>
            ))}
          </div>

          <div
            className="flex-1 relative min-h-0"
            onMouseLeave={() => setHoverTimeMinutes(null)}
            onMouseUp={() => {
              if (
                isSelecting &&
                selectionStartMinutes != null &&
                selectionEndMinutesExclusive != null &&
                onTimeRangeSelect
              ) {
                const startDate = setMinutes(setHours(currentDate, 0), selectionStartMinutes);
                const endDate = setMinutes(setHours(currentDate, 0), selectionEndMinutesExclusive);
                onTimeRangeSelect(startDate, endDate);
              }
              setIsSelecting(false);
              setSelectionAnchorMinutes(null);
              setSelectionCurrentMinutes(null);
            }}
          >
            {hours.map((hour) => (
              <div key={hour}>
                {[0, 15, 30, 45].map((minute) => (
                  <div
                    key={minute}
                    onMouseDown={() => {
                      const startMinutes = hour * 60 + minute;
                      setIsSelecting(true);
                      setSelectionAnchorMinutes(startMinutes);
                      setSelectionCurrentMinutes(startMinutes);
                    }}
                    onClick={() => {
                      if (!onTimeRangeSelect) {
                        onTimeSlotClick(setMinutes(setHours(currentDate, hour), minute));
                      }
                    }}
                    onDrop={(e) => handleDrop(e, hour, minute)}
                    onDragOver={handleDragOver}
                    onMouseEnter={() => {
                      const slotMinutes = hour * 60 + minute;
                      setHoverTimeMinutes(slotMinutes);
                      if (isSelecting) {
                        setSelectionCurrentMinutes(slotMinutes);
                      }
                    }}
                    className={cn(
                      'border-b border-border/10 cursor-pointer transition-colors hover:bg-muted/40',
                      minute === 0 ? 'border-border/30' : ''
                    )}
                    style={{ height: `${SLOT_HEIGHT}px` }}
                  />
                ))}
              </div>
            ))}

            {(() => {
              const indicatorMinutes =
                hoverTimeMinutes != null
                  ? hoverTimeMinutes
                  : isToday(currentDate)
                  ? new Date().getHours() * 60 + new Date().getMinutes()
                  : null;

              if (indicatorMinutes == null) return null;

              const indicatorTime = setMinutes(setHours(new Date(), 0), indicatorMinutes);

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute left-[-80px] right-0 flex items-center pointer-events-none z-20"
                  style={{
                    top: `${(indicatorMinutes / 60) * HOUR_HEIGHT}px`,
                  }}
                >
                  <div className="w-20 shrink-0 flex items-center justify-end pr-2">
                    <div className="px-1.5 py-0.5 rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                      {formatExactTime(indicatorTime)}
                    </div>
                  </div>
                  <div className="flex-1 h-px bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.4)] relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-red-500" />
                  </div>
                </motion.div>
              );
            })()}

            {selectionStartMinutes != null && selectionEndMinutesExclusive != null && (
              <div
                className="absolute inset-x-0 px-4 pointer-events-none z-10"
                style={{
                  top: `${(selectionStartMinutes / 60) * HOUR_HEIGHT}px`,
                  height: `${((selectionEndMinutesExclusive - selectionStartMinutes) / 60) * HOUR_HEIGHT}px`,
                }}
              >
                <div className="w-full h-full rounded-lg bg-primary/10 border border-primary/40" />
              </div>
            )}

            <div className="absolute inset-0 pointer-events-none px-4">
              {timedEventsWithLayout.map(({ event, layout }, idx) => {
                const width = 100 / Math.max(layout.columns, 1);
                const left = width * layout.column;

                const isSelected = selectedEventId && selectedEventId === event.id;
                return (
                <ContextMenu key={event.id}>
                  <ContextMenuTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, event)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={cn(
                        "absolute rounded-md border-l-4 p-2 cursor-pointer shadow-sm hover:shadow-md transition-shadow pointer-events-auto overflow-hidden",
                        isSelected ? "ring-2 ring-primary ring-offset-1 z-20" : "z-10 hover:z-20"
                      )}
                      style={{
                        ...getEventStyle(event),
                        backgroundColor: event.color ? `${event.color}25` : 'hsl(var(--primary) / 0.15)',
                        borderColor: event.color || 'hsl(var(--primary))',
                        left: `${layout.column * (100 / layout.columns)}%`,
                        width: `${100 / layout.columns}%`,
                        boxSizing: 'border-box'
                      }}
                    >
                      <div className="flex flex-row items-center gap-2 h-full">
                        <span className="font-semibold text-xs text-foreground truncate shrink-0">
                          {event.title || 'Untitled'}
                        </span>
                        <span className="text-xs text-muted-foreground truncate shrink-0">
                          {formatExactTime(new Date(event.start_date))}
                        </span>
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
        </div>
      </div>
    </div>
  );
}
