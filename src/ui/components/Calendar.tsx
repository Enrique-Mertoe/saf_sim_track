import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
  isBefore,
  isAfter
} from 'date-fns';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface CalendarProps {
  mode?: "single" | "range";
  selected?: Date;
  onSelect?: (date: Date) => void;
  month?: Date;
  onMonthChange?: (date: Date) => void;
  className?: string;
  modifiers?: {
    range?: (date: Date) => boolean;
    rangeStart?: (date: Date) => boolean;
    rangeEnd?: (date: Date) => boolean;
    [key: string]: ((date: Date) => boolean) | undefined;
  };
  modifiersClassNames?: {
    range?: string;
    rangeStart?: string;
    rangeEnd?: string;
    [key: string]: string | undefined;
  };
  disabled?: {
    before?: Date;
    after?: Date;
    dates?: Date[];
    [key: string]: any;
  };
}

const Calendar: React.FC<CalendarProps> = ({
  mode = "single",
  selected,
  onSelect,
  month,
  onMonthChange,
  className = "",
  modifiers = {},
  modifiersClassNames = {},
  disabled = {}
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(month || new Date());
  const [animDirection, setAnimDirection] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (month && !isSameMonth(month, currentMonth)) {
      setCurrentMonth(month);
    }
  }, [month]);

  const onDateClick = (day: Date) => {
    if (onSelect && !isDisabled(day)) {
      onSelect(day);
    }
  };

  const nextMonth = () => {
    if (isAnimating) return;

    setAnimDirection("left");
    setIsAnimating(true);

    setTimeout(() => {
      const nextMonth = addMonths(currentMonth, 1);
      setCurrentMonth(nextMonth);
      if (onMonthChange) {
        onMonthChange(nextMonth);
      }

      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 200);
  };

  const prevMonth = () => {
    if (isAnimating) return;

    setAnimDirection("right");
    setIsAnimating(true);

    setTimeout(() => {
      const prevMonth = subMonths(currentMonth, 1);
      setCurrentMonth(prevMonth);
      if (onMonthChange) {
        onMonthChange(prevMonth);
      }

      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 200);
  };

  // Check if a date should be disabled
  const isDisabled = (date: Date): boolean => {
    if (!disabled) return false;

    if (disabled.after && isAfter(date, disabled.after)) {
      return true;
    }

    if (disabled.before && isBefore(date, disabled.before)) {
      return true;
    }

    if (disabled.dates && disabled.dates.some(disabledDate =>
      isSameDay(date, disabledDate)
    )) {
      return true;
    }

    return false;
  };

  const getDateClasses = (day: Date): string => {
    let classes = "relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ";

    // Check if the day is in the current month
    if (!isSameMonth(day, currentMonth)) {
      classes += "text-gray-300 dark:text-gray-600 ";
    } else if (isDisabled(day)) {
      classes += "text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50 ";
    } else {
      classes += "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ";
    }

    // Apply modifiers
    Object.keys(modifiers).forEach(modKey => {
      const check = modifiers[modKey];
      const modClass = modifiersClassNames[modKey] || "";

      if (check && check(day)) {
        classes += modClass + " ";
      }
    });

    // Handle selected date
    if (selected && isSameDay(day, selected)) {
      classes += "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 ";
    }

    return classes.trim();
  };

  const renderDays = () => {
    const days = [];
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        days.push(
          <div
            key={day.toString()}
            className={getDateClasses(cloneDay)}
            onClick={() => onDateClick(cloneDay)}
          >
            <span className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
              {format(cloneDay, 'd')}
            </span>

            {/* Today indicator */}
            {isSameDay(cloneDay, new Date()) && (
              <span className="absolute bottom-1 w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full"></span>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1 mb-1">
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden p-4 transition-all duration-300 transform hover:shadow-xl dark:shadow-gray-900">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 px-2">
          <button
            onClick={prevMonth}
            disabled={isAnimating}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 focus:outline-none"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="font-bold text-gray-800 dark:text-gray-100 text-lg tracking-wide">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button
            onClick={nextMonth}
            disabled={isAnimating}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 focus:outline-none"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Days of week */}
        {renderDays()}

        {/* Calendar grid */}
        <div
          className={`transition-all duration-500 transform ${
            isAnimating && animDirection === "left" ? "-translate-x-10 opacity-0" : 
            isAnimating && animDirection === "right" ? "translate-x-10 opacity-0" : 
            "translate-x-0 opacity-100"
          }`}
        >
          {renderCells()}
        </div>
      </div>
    </div>
  );
};

export default Calendar;