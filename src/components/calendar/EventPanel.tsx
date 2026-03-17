import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock, Tag, Trash2, CheckSquare, Square, Plus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import InlineEdit from '@/components/calendar/InlineEdit';
import { cn } from '@/lib/utils';
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

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface CalendarEvent {
  id: string;
  title?: string;
  description?: string;
  start_date: string;
  end_date?: string | null;
  all_day?: boolean;
  tag?: string;
  checklist?: ChecklistItem[];
  calendar_id?: string;
  color?: string;
  reminderMinutesBefore?: number | null;
  recurrence?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    weekDays: number[];
    endDate: Date | null;
  };
}

interface EventPanelProps {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  calendars: Array<{ id: string; name: string }>;
  allTags: string[];
}

export default function EventPanel({
  event,
  onClose,
  onUpdate,
  onDelete,
  calendars,
  allTags,
}: EventPanelProps) {
  const [localEvent, setLocalEvent] = useState<CalendarEvent>(event);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagSearchValue, setTagSearchValue] = useState('');

  useEffect(() => {
    setLocalEvent(event);
  }, [event]);

  const handleUpdate = (field: keyof CalendarEvent, value: any) => {
    const updated = { ...localEvent, [field]: value };
    setLocalEvent(updated);
    onUpdate(updated);
  };

  const toggleChecklistItem = (itemId: string) => {
    const updatedChecklist = (localEvent.checklist || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    );
    handleUpdate('checklist', updatedChecklist);
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newChecklistItem,
      completed: false,
    };
    handleUpdate('checklist', [...(localEvent.checklist || []), newItem]);
    setNewChecklistItem('');
  };

  const removeChecklistItem = (itemId: string) => {
    handleUpdate(
      'checklist',
      (localEvent.checklist || []).filter((item) => item.id !== itemId),
    );
  };

  if (!event) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-96 bg-card border-l border-border shadow-xl z-50 flex flex-col text-foreground"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Event Details
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(event.id)}
              className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <InlineEdit
              value={localEvent.title}
              onSave={(value) => handleUpdate('title', value)}
              placeholder="Untitled"
              className="text-xl font-semibold text-foreground bg-transparent"
              inputClassName="text-xl font-semibold bg-transparent text-foreground"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={localEvent.start_date ? format(new Date(localEvent.start_date), 'yyyy-MM-dd') : ''}
                onChange={(e) =>
                  handleUpdate('start_date', new Date(e.target.value).toISOString())
                }
                className="h-8 border-0 bg-muted/50 rounded-lg text-sm"
              />
            </div>

            {!localEvent.all_day && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={
                      localEvent.start_date
                        ? format(new Date(localEvent.start_date), 'HH:mm')
                        : ''
                    }
                    onChange={(e) => {
                      const date = new Date(localEvent.start_date);
                      const [hours, minutes] = e.target.value.split(':');
                      date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                      handleUpdate('start_date', date.toISOString());
                    }}
                    className="h-8 w-28 border-0 bg-muted/50 rounded-lg text-sm"
                  />
                  <span className="text-muted-foreground">→</span>
                  <Input
                    type="time"
                    value={
                      localEvent.end_date
                        ? format(new Date(localEvent.end_date), 'HH:mm')
                        : ''
                    }
                    onChange={(e) => {
                      const base = localEvent.end_date || localEvent.start_date;
                      const date = new Date(base || new Date());
                      const [hours, minutes] = e.target.value.split(':');
                      date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                      handleUpdate('end_date', date.toISOString());
                    }}
                    className="h-8 w-28 border-0 bg-muted/50 rounded-lg text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Repeat</Label>
                <Switch
                  checked={localEvent.recurrence?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    handleUpdate('recurrence', {
                      ...(localEvent.recurrence || {
                        frequency: 'weekly',
                        interval: 1,
                        weekDays: [],
                        endDate: null,
                      }),
                      enabled: checked,
                    })
                  }
                />
              </div>

              {localEvent.recurrence?.enabled && (
                <div className="space-y-3 pl-2 border-l-2 border-muted">
                  <div className="flex items-center gap-2">
                    <select
                      value={localEvent.recurrence?.frequency ?? 'weekly'}
                      onChange={(e) =>
                        handleUpdate('recurrence', {
                          ...localEvent.recurrence,
                          frequency: e.target.value as any,
                        })
                      }
                      className="h-8 flex-1 px-2 rounded-lg border border-border bg-muted/50 text-sm text-foreground"
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
                      value={localEvent.recurrence?.interval ?? 1}
                      onChange={(e) =>
                        handleUpdate('recurrence', {
                          ...localEvent.recurrence,
                          interval: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="h-8 w-16 rounded-lg border border-border bg-muted/50 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">
                      {(localEvent.recurrence?.frequency ?? 'weekly') === 'daily'
                        ? 'days'
                        : (localEvent.recurrence?.frequency ?? 'weekly') === 'weekly'
                        ? 'weeks'
                        : (localEvent.recurrence?.frequency ?? 'weekly') === 'monthly'
                        ? 'months'
                        : 'years'}
                    </span>
                  </div>

                  {(localEvent.recurrence?.frequency ?? 'weekly') === 'weekly' && (
                    <div className="flex flex-wrap gap-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                        const isSelected = localEvent.recurrence?.weekDays?.includes(idx) ?? false;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              const currentDays = localEvent.recurrence?.weekDays ?? [];
                              const newDays = isSelected
                                ? currentDays.filter((d) => d !== idx)
                                : [...currentDays, idx];
                              handleUpdate('recurrence', {
                                ...localEvent.recurrence,
                                weekDays: newDays,
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
                        value={localEvent.recurrence?.endDate ? format(new Date(localEvent.recurrence.endDate), 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                           handleUpdate('recurrence', {
                              ...localEvent.recurrence,
                              endDate: e.target.value ? new Date(e.target.value).toISOString() : null
                           });
                        }}
                        className="h-8 flex-1 rounded-lg border border-border bg-muted/50 text-sm"
                     />
                  </div>
                </div>
              )}
            </div>

          <div className="flex items-center gap-3 text-sm">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <select
              value={
                localEvent.reminderMinutesBefore != null
                  ? String(localEvent.reminderMinutesBefore)
                  : ''
              }
              onChange={(e) => {
                const value = e.target.value === '' ? null : Number(e.target.value);
                handleUpdate('reminderMinutesBefore', value);
              }}
              className="h-8 px-2 rounded-lg border border-border bg-muted/50 text-sm text-foreground"
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
                  className="h-8 border-0 bg-muted/50 rounded-lg text-sm w-40 justify-start"
                >
                  {localEvent.tag || 'Add tag'}
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
                            handleUpdate('tag', tagSearchValue.trim());
                            setTagSearchValue('');
                            setTagPopoverOpen(false);
                          }
                        }}
                        className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded text-foreground"
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
                            handleUpdate('tag', tag);
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
            {localEvent.tag && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleUpdate('tag', '')}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Notes
            </span>
            <InlineEdit
              value={localEvent.description}
              onSave={(value) => handleUpdate('description', value)}
              placeholder="Add notes..."
              multiline
              className="text-sm text-foreground min-h-[80px] p-3 bg-muted/50 rounded-lg"
              inputClassName="text-sm p-3 bg-muted/50 rounded-lg text-foreground"
            />
          </div>

          <div className="space-y-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Checklist
            </span>

            <div className="space-y-1">
              {(localEvent.checklist || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 group py-1"
                >
                  <button
                    onClick={() => toggleChecklistItem(item.id)}
                    className="shrink-0"
                  >
                    {item.completed ? (
                      <CheckSquare className="w-4 h-4 text-foreground" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    )}
                  </button>
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      item.completed && 'line-through text-muted-foreground',
                      !item.completed && 'text-foreground'
                    )}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-muted-foreground" />
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addChecklistItem();
                }}
                placeholder="Add item"
                className="h-8 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
