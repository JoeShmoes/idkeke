import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format, setHours, setMinutes } from 'date-fns';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type NewEventState = {
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  all_day: boolean;
  tag: string;
  calendar_id: string;
  reminderMinutesBefore: number | null;
  recurrence: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    weekDays: number[];
    endDate: Date | null;
  };
};

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: any) => void;
  initialDate: Date | null;
  initialEndDate?: Date | null;
  calendars: Array<{ id: string; name: string }>;
  allTags: string[];
  defaultCalendarId?: string;
}

export default function NewEventModal({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialEndDate,
  calendars,
  allTags,
  defaultCalendarId,
}: NewEventModalProps) {
  const baseDate = initialDate || new Date();
  const baseEndDate =
    initialEndDate ||
    setHours(baseDate, baseDate.getHours() + 1);

  const [event, setEvent] = useState<NewEventState>({
    title: '',
    description: '',
    start_date: baseDate,
    end_date: baseEndDate,
    all_day: false,
    tag: '',
    calendar_id: defaultCalendarId || calendars?.[0]?.id || '',
    reminderMinutesBefore: 5,
    recurrence: {
      enabled: false,
      frequency: 'weekly',
      interval: 1,
      weekDays: [],
      endDate: null,
    },
  });
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagSearchValue, setTagSearchValue] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const freshBase = initialDate || new Date();
    const freshEnd =
      initialEndDate ||
      setHours(freshBase, freshBase.getHours() + 1);
    setEvent({
      title: '',
      description: '',
      start_date: freshBase,
      end_date: freshEnd,
      all_day: false,
      tag: '',
      calendar_id: defaultCalendarId || calendars?.[0]?.id || '',
      reminderMinutesBefore: 5,
    });
    setTagPopoverOpen(false);
    setTagSearchValue('');
  }, [isOpen, initialDate, initialEndDate, calendars, defaultCalendarId]);

  const handleSave = () => {
    let titleToSave = event.title.trim();

    if (!titleToSave) {
      const startTime = format(event.start_date, 'h:mm a');
      titleToSave = `${startTime}`;
      if (!event.all_day && event.end_date) {
        // Optional: Add end time if you want "7:00 AM - 8:00 AM"
        // The user request was "state the updated time for it"
        // keeping it simple as just the start time or range
        // Let's do range for clarity
        const endTime = format(event.end_date, 'h:mm a');
        titleToSave = `${startTime} - ${endTime}`;
      }
    }

    onSave({
      ...event,
      title: titleToSave,
      start_date: event.start_date.toISOString(),
      end_date: event.end_date?.toISOString(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
        >
          <div className="flex items-center justify-between p-5 border-b border-border bg-card">
            <h2 className="text-lg font-semibold text-foreground">New Event</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-5 space-y-5">
            <Input
              value={event.title}
              onChange={(e) => setEvent({ ...event, title: e.target.value })}
              placeholder="Event title"
              className="h-12 text-lg rounded-xl border border-border bg-muted placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
              autoFocus
            />

            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">All day</Label>
              <Switch
                checked={event.all_day}
                onCheckedChange={(checked) => setEvent({ ...event, all_day: checked })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={format(event.start_date, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    newDate.setHours(
                      event.start_date.getHours(),
                      event.start_date.getMinutes(),
                    );
                    setEvent({ ...event, start_date: newDate });
                  }}
                  className="h-9 flex-1 rounded-lg border border-border bg-muted text-sm"
                />
              </div>

              {!event.all_day && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={format(event.start_date, 'HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = setMinutes(
                          setHours(event.start_date, parseInt(hours, 10)),
                          parseInt(minutes, 10),
                        );
                        setEvent({ ...event, start_date: newDate });
                      }}
                      className="h-9 flex-1 rounded-lg border border-border bg-muted text-sm"
                    />
                    <span className="text-muted-foreground">→</span>
                    <Input
                      type="time"
                      value={format(event.end_date, 'HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = setMinutes(
                          setHours(event.end_date, parseInt(hours, 10)),
                          parseInt(minutes, 10),
                        );
                        setEvent({ ...event, end_date: newDate });
                      }}
                      className="h-9 flex-1 rounded-lg border border-border bg-muted text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Repeat</Label>
                <Switch
                  checked={event.recurrence?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    setEvent({
                      ...event,
                      recurrence: {
                        ...(event.recurrence || {
                          frequency: 'weekly',
                          interval: 1,
                          weekDays: [],
                          endDate: null,
                        }),
                        enabled: checked,
                      },
                    })
                  }
                />
              </div>

              {event.recurrence?.enabled && (
                <div className="space-y-3 pl-2 border-l-2 border-muted">
                  <div className="flex items-center gap-2">
                    <select
                      value={event.recurrence?.frequency ?? 'weekly'}
                      onChange={(e) =>
                        setEvent({
                          ...event,
                          recurrence: {
                            ...event.recurrence,
                            frequency: e.target.value as any,
                          },
                        })
                      }
                      className="h-9 flex-1 px-2 rounded-lg border border-border bg-muted text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                    <span className="text-sm text-muted-foreground">every</span>
                    <Input
                      type="number"
                      min="1"
                      value={event.recurrence?.interval ?? 1}
                      onChange={(e) =>
                        setEvent({
                          ...event,
                          recurrence: {
                            ...event.recurrence,
                            interval: Math.max(1, parseInt(e.target.value) || 1),
                          },
                        })
                      }
                      className="h-9 w-16 rounded-lg border border-border bg-muted text-sm"
                    />
                    <span className="text-sm text-muted-foreground">
                      {(event.recurrence?.frequency ?? 'weekly') === 'daily'
                        ? 'days'
                        : (event.recurrence?.frequency ?? 'weekly') === 'weekly'
                        ? 'weeks'
                        : (event.recurrence?.frequency ?? 'weekly') === 'monthly'
                        ? 'months'
                        : 'years'}
                    </span>
                  </div>

                  {(event.recurrence?.frequency ?? 'weekly') === 'weekly' && (
                    <div className="flex flex-wrap gap-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                        const isSelected = event.recurrence?.weekDays?.includes(idx) ?? false;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              const currentDays = event.recurrence?.weekDays ?? [];
                              const newDays = isSelected
                                ? currentDays.filter((d) => d !== idx)
                                : [...currentDays, idx];
                              setEvent({
                                ...event,
                                recurrence: { ...event.recurrence, weekDays: newDays },
                              });
                            }}
                            className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                     <span className="text-sm text-muted-foreground w-16">Ends</span>
                     <Input
                        type="date"
                        value={event.recurrence?.endDate ? format(event.recurrence.endDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                           setEvent({
                              ...event,
                              recurrence: {
                                 ...event.recurrence,
                                 endDate: e.target.value ? new Date(e.target.value) : null
                              }
                           });
                        }}
                        className="h-9 flex-1 rounded-lg border border-border bg-muted text-sm"
                     />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Calendar</Label>
              <select
                value={event.calendar_id}
                onChange={(e) => setEvent({ ...event, calendar_id: e.target.value })}
                className="h-9 px-2 rounded-lg border border-border bg-muted text-sm text-foreground"
              >
                {calendars.map(cal => (
                    <option key={cal.id} value={cal.id}>{cal.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Reminder</Label>
              <select
                value={
                  event.reminderMinutesBefore != null
                    ? String(event.reminderMinutesBefore)
                    : ''
                }
                onChange={(e) => {
                  const value = e.target.value === '' ? null : Number(e.target.value);
                  setEvent({ ...event, reminderMinutesBefore: value });
                }}
                className="h-9 px-2 rounded-lg border border-border bg-muted text-sm text-foreground"
              >
                <option value="">No reminder</option>
                <option value="0">At start time</option>
                <option value="5">5 minutes before</option>
                <option value="10">10 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="h-9 flex-1 justify-start rounded-lg border border-border bg-muted text-sm"
                  >
                    {event.tag || 'Add tag'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search or create..."
                      value={tagSearchValue}
                      onValueChange={setTagSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <button
                          onClick={() => {
                            if (tagSearchValue.trim()) {
                              setEvent({ ...event, tag: tagSearchValue.trim() });
                              setTagSearchValue('');
                              setTagPopoverOpen(false);
                            }
                          }}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded"
                        >
                          Create "{tagSearchValue}"
                        </button>
                      </CommandEmpty>
                      <CommandGroup>
                        {allTags.map((tag) => (
                          <CommandItem
                            key={tag}
                            value={tag}
                            onSelect={() => {
                              setEvent({ ...event, tag });
                              setTagPopoverOpen(false);
                            }}
                          >
                            {tag}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {event.tag && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEvent({ ...event, tag: '' })}
                  className="h-7 w-7"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 p-5 border-t border-border bg-muted/40">
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-10 px-4 text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="h-10 px-6"
            >
              Create Event
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
