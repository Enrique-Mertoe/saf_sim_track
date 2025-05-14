"use client";

import { useState, useEffect } from "react";
import { addMonths, isAfter, isBefore, isSameDay, startOfMonth, endOfMonth, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import Calendar from "@/ui/components/Calendar";
import { Button } from "@/ui/components/Button";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";

type DateRange = {
  startDate: Date | null;
  endDate: Date | null;
};

type Props = {
  onClose: () => void;
  onConfirm: (range: DateRange) => void;
  defaultRange?: DateRange;
  maxDate?: Date;
  minDate?: Date;
  className?: string;
};

export default function ReportDateRangeTemplate({
  onClose,
  onConfirm,
  defaultRange,
  maxDate = new Date(),
  minDate,
  className = "",
}: Props) {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: defaultRange?.startDate || null,
    endDate: defaultRange?.endDate || null,
  });
  const [calendarMonth, setCalendarMonth] = useState<Date>(defaultRange?.startDate || new Date());
  const [quickSelection, setQuickSelection] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<'single' | 'dual'>('single');
  const [animating, setAnimating] = useState(false);

  // Responsive handling for calendar view
  useEffect(() => {
    const handleResize = () => {
      setCalendarView(window.innerWidth > 768 ? 'dual' : 'single');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (defaultRange) {
      setDateRange({
        startDate: defaultRange.startDate,
        endDate: defaultRange.endDate,
      });
      if (defaultRange.startDate) {
        setCalendarMonth(defaultRange.startDate);
      }
    }
  }, [defaultRange]);

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;

    setQuickSelection(null);

    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      // Start new selection
      setDateRange({
        startDate: date,
        endDate: null,
      });
    } else {
      // Complete the selection
      if (isBefore(date, dateRange.startDate)) {
        setDateRange({
          startDate: date,
          endDate: dateRange.startDate,
        });
      } else {
        setDateRange({
          startDate: dateRange.startDate,
          endDate: date,
        });
      }
    }
  };

  const handleQuickSelect = (selection: string) => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (selection) {
      case "current-month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "previous-month":
        const lastMonth = addMonths(now, -1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case "last-30-days":
        end = now;
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        break;
      case "last-90-days":
        end = now;
        start = new Date(now);
        start.setDate(start.getDate() - 90);
        break;
      case "mar-1-30":
        // Specifically for March 1-30 of current year
        const currentYear = now.getFullYear();
        start = new Date(currentYear, 2, 1); // March 1
        end = new Date(currentYear, 2, 30); // March 30
        break;
      default:
        break;
    }

    if (start && end) {
      setDateRange({ startDate: start, endDate: end });
      setQuickSelection(selection);
      setCalendarMonth(start);

      // Animate confirmation button
      setAnimating(true);
      setTimeout(() => setAnimating(false), 800);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!dateRange.startDate || !dateRange.endDate) return false;
    return (
      (isAfter(date, dateRange.startDate) && isBefore(date, dateRange.endDate)) ||
      isSameDay(date, dateRange.startDate) ||
      isSameDay(date, dateRange.endDate)
    );
  };

  const isStartDate = (date: Date) =>
    dateRange.startDate && isSameDay(date, dateRange.startDate);

  const isEndDate = (date: Date) =>
    dateRange.endDate && isSameDay(date, dateRange.endDate);

  const nextMonth = () => {
    setCalendarMonth(addMonths(calendarMonth, 1));
  };

  const prevMonth = () => {
    setCalendarMonth(addMonths(calendarMonth, -1));
  };

  const dateRangeText = () => {
    if (!dateRange.startDate) return "Select start date";
    if (!dateRange.endDate) return "Select end date";

    return `${format(dateRange.startDate, "MMM d, yyyy")} - ${format(dateRange.endDate, "MMM d, yyyy")}`;
  };

  const quickSelections = [
    { id: "current-month", label: "Current Month", icon: "📅" },
    { id: "previous-month", label: "Previous Month", icon: "⏮️" },
    { id: "last-30-days", label: "Last 30 Days", icon: "🔄" },
    { id: "last-90-days", label: "Last 90 Days", icon: "📊" },
    { id: "mar-1-30", label: "March 1-30", icon: "🗓️" },
  ];

  return (
    <div className={`w-full max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header with title and close button */}
      <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-indigo-600 dark:from-green-800 dark:to-indigo-900">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-white">Select Date Range</h3>
            <p className="text-green-100 text-sm">Choose dates for your report</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            ✕
          </Button>
        </div>

        {/* Date range summary */}
        <div className="mt-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-white" />
          <span className="text-white font-medium text-sm">
            {dateRangeText()}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Quick selection buttons */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Quick Select</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {quickSelections.map((option) => (
              <Button
                key={option.id}
                variant={quickSelection === option.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSelect(option.id)}
                className={`text-xs justify-start ${
                  quickSelection === option.id 
                    ? "bg-green-500 hover:bg-green-600 text-white border-green-500 dark:bg-green-600 dark:hover:bg-green-700" 
                    : "hover:border-green-400 hover:text-green-500 dark:hover:text-green-400 dark:border-gray-700"
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Calendar section */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-1">
          {/* Calendar header */}
          <div className="flex items-center justify-between px-2 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevMonth}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h3 className="font-medium text-gray-800 dark:text-gray-200">
              {format(calendarMonth, "MMMM yyyy")}
            </h3>

            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar grid */}
          <div className={`${calendarView === 'dual' ? 'grid grid-cols-2 gap-4' : ''}`}>
            <Calendar
              mode="single"
              selected={dateRange.endDate || dateRange.startDate || undefined}
              onSelect={handleSelectDate}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              className="mx-auto"
              modifiers={{
                range: (date) => isDateInRange(date),
                //@ts-ignore
                rangeStart: (date) => isStartDate(date),
                //@ts-ignore
                rangeEnd: (date) => isEndDate(date),
              }}
              modifiersClassNames={{
                range: "bg-green-100 dark:bg-green-900/30",
                rangeStart: "bg-green-500 text-white rounded-l-md",
                rangeEnd: "bg-green-500 text-white rounded-r-md",
                today: "border border-green-300 dark:border-green-700",
              }}
              disabled={{
                after: maxDate,
                before: minDate,
              }}
              classNames={{
                day_today: "font-bold text-green-600 dark:text-green-400",
                day_selected: "bg-green-500 text-white hover:bg-green-600",
                day_outside: "text-gray-400 dark:text-gray-600 opacity-50",
                table: "border-collapse",
                cell: "text-center text-sm p-0",
                head_cell: "text-gray-500 dark:text-gray-400 font-normal text-xs",
                nav_button: "border border-gray-200 dark:border-gray-700 bg-transparent p-1",
                day: "h-8 w-8 p-0 relative [&:has([aria-selected])]:bg-transparent",
              }}
            />

            {calendarView === 'dual' && (
              <Calendar
                mode="single"
                selected={dateRange.endDate || dateRange.startDate || undefined}
                onSelect={handleSelectDate}
                month={addMonths(calendarMonth, 1)}
                onMonthChange={(month) => setCalendarMonth(addMonths(month, -1))}
                className="mx-auto"
                modifiers={{
                  range: (date) => isDateInRange(date),
                  //@ts-ignore
                  rangeStart: (date) => isStartDate(date),
                  //@ts-ignore
                  rangeEnd: (date) => isEndDate(date),
                }}
                modifiersClassNames={{
                  range: "bg-green-100 dark:bg-green-900/30",
                  rangeStart: "bg-green-500 text-white rounded-l-md",
                  rangeEnd: "bg-green-500 text-white rounded-r-md",
                  today: "border border-green-300 dark:border-green-700",
                }}
                disabled={{
                  after: maxDate,
                  before: minDate,
                }}
                classNames={{
                  day_today: "font-bold text-green-600 dark:text-green-400",
                  day_selected: "bg-green-500 text-white hover:bg-green-600",
                  day_outside: "text-gray-400 dark:text-gray-600 opacity-50",
                  table: "border-collapse",
                  cell: "text-center text-sm p-0",
                  head_cell: "text-gray-500 dark:text-gray-400 font-normal text-xs",
                  nav_button: "border border-gray-200 dark:border-gray-700 bg-transparent p-1",
                  day: "h-8 w-8 p-0 relative [&:has([aria-selected])]:bg-transparent",
                }}
              />
            )}
          </div>

          {/* Selected range display */}
          <div className="flex justify-between items-center px-4 py-2 mt-2 text-sm bg-gray-50 dark:bg-gray-900 rounded-md">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Start:</span>{" "}
              <span className="text-gray-600 dark:text-gray-400">
                {dateRange.startDate
                  ? format(dateRange.startDate, "MMM d, yyyy")
                  : "Not selected"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">End:</span>{" "}
              <span className="text-gray-600 dark:text-gray-400">
                {dateRange.endDate
                  ? format(dateRange.endDate, "MMM d, yyyy")
                  : "Not selected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer/Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-between">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Cancel
        </Button>

        <AnimatePresence>
          <motion.div
            animate={animating ? {
              scale: [1, 1.05, 1],
              transition: { duration: 0.5 }
            } : {}}
          >
            <Button
              onClick={() => onConfirm(dateRange)}
              disabled={!dateRange.startDate || !dateRange.endDate}
              className="bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700 relative overflow-hidden"
            >
              <motion.span
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center"
              >
                <span>Apply Range</span>
                {(dateRange.startDate && dateRange.endDate) && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="ml-1"
                  >
                    ✓
                  </motion.span>
                )}
              </motion.span>
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}