import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, addWeeks, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const views = ['day', 'week', 'month'] as const;

type ViewType = (typeof views)[number];

interface CalendarHeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  view: ViewType;
  setView: (view: ViewType) => void;
}

export default function CalendarHeader({
  currentDate,
  setCurrentDate,
  view,
  setView,
}: CalendarHeaderProps) {
  const navigate = (direction: 'next' | 'prev') => {
    const modifier = direction === 'next' ? 1 : -1;
    switch (view) {
      case 'day':
        setCurrentDate(addDays(currentDate, modifier));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, modifier));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, modifier));
        break;
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const getDateLabel = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        return format(currentDate, 'MMMM yyyy');
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <header className="h-16 px-6 border-b border-border flex items-center justify-between bg-background">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground tracking-tight min-w-[200px]">
          {getDateLabel()}
        </h1>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('prev')}
            className="h-8 w-8 rounded-lg hover:bg-muted"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('next')}
            className="h-8 w-8 rounded-lg hover:bg-muted"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={goToToday}
          className="h-8 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Today
        </Button>
      </div>

      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="capitalize w-[100px] justify-between">
              {view}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {views.map((v) => (
              <DropdownMenuItem
                key={v}
                onClick={() => setView(v)}
                className="capitalize cursor-pointer"
              >
                {v}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
