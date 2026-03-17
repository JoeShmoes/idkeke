import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const getTagBorderColor = (tag?: string) => {
  if (!tag) return 'border-l-border';
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colors = ['border-l-sky-500', 'border-l-emerald-500', 'border-l-amber-500', 'border-l-fuchsia-500'];
  return colors[hash % colors.length];
};

const getTagLabelColor = (tag?: string) => {
  if (!tag) return 'bg-muted text-muted-foreground';
  const hash = tag.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colors = [
    'bg-muted text-muted-foreground',
    'bg-sky-500/10 text-sky-500',
    'bg-emerald-500/10 text-emerald-400',
    'bg-amber-500/10 text-amber-500',
  ];
  return colors[hash % colors.length];
};

interface EventBlockProps {
  event: {
    id: string;
    title?: string;
    description?: string;
    start_date: string;
    end_date?: string | null;
    all_day?: boolean;
    tag?: string;
    color?: string;
  };
  onClick?: () => void;
  style?: React.CSSProperties;
  compact?: boolean;
  isDragging?: boolean;
}

export default function EventBlock({
  event,
  onClick,
  style,
  compact = false,
  isDragging = false,
}: EventBlockProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isDragging ? 0.8 : 1,
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging ? '0 8px 25px -5px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      style={{
        ...style,
        backgroundColor: event.color || style?.backgroundColor,
      }}
      className={cn(
        'group cursor-pointer bg-card rounded-lg border border-border hover:border-border/80',
        'border-l-2 transition-all hover:shadow-md',
        getTagBorderColor(event.tag),
        compact ? 'px-2 py-1' : 'px-3 py-2',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'font-medium text-foreground truncate',
              compact ? 'text-xs' : 'text-sm',
            )}
          >
            {event.title || 'Untitled'}
          </p>

          {!compact && !event.all_day && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(event.start_date), 'h:mm a')}
              {event.end_date && ` - ${format(new Date(event.end_date), 'h:mm a')}`}
            </p>
          )}
        </div>

        {event.tag && (
          <span
            className={cn(
              'shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide',
              getTagLabelColor(event.tag),
            )}
          >
            {event.tag}
          </span>
        )}
      </div>

      {!compact && event.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
      )}
    </motion.div>
  );
}
