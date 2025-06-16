"use client";

import {useEffect, useState} from "react";
import {addMonths, endOfMonth, format, isAfter, isBefore, isSameDay, startOfMonth} from "date-fns";
import {AnimatePresence, motion} from "framer-motion";
import Calendar from "@/ui/components/Calendar";
import {Button} from "@/ui/components/Button";
import {CalendarIcon, ChevronLeft, ChevronRight} from "lucide-react";

export type DateSelection = {
    type: 'range' | 'single';
    single: Date | null;
    range: {
        startDate: Date | null;
        endDate: Date | null;
    };
};

type Props = {
    onClose: () => void;
    onConfirm: (selection: DateSelection) => void;
    defaultSelection?: DateSelection;
    maxDate?: Date;
    minDate?: Date;
    className?: string;
};

export default function ReportDateRangeTemplate({
                                                    onClose,
                                                    onConfirm,
                                                    defaultSelection,
                                                    maxDate = new Date(),
                                                    minDate,
                                                    className = "",
                                                }: Props) {
    useEffect(() => {
        const themeColor = "#00a63e"; // Between green-600 and green-700
        let meta = document.querySelector("meta[name='theme-color']");
        if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute("name", "theme-color");
            document.head.appendChild(meta);
        }
        meta.setAttribute("content", themeColor);

        return () => {
            // Reset if needed
            meta?.setAttribute("content", "#ffffff");
        };
    }, []);
    const [dateSelection, setDateSelection] = useState<DateSelection>(
        defaultSelection || {
            type: 'range',
            single: null,
            range: {
                startDate: null,
                endDate: null,
            },
        }
    );
    const [calendarMonth, setCalendarMonth] = useState<Date>(
        defaultSelection?.type === 'single' && defaultSelection.single ?
            defaultSelection.single :
            defaultSelection?.type === 'range' && defaultSelection.range.startDate ?
                defaultSelection.range.startDate :
                new Date()
    );
    const [quickSelection, setQuickSelection] = useState<string | null>("last-30-days");
    const [calendarView, setCalendarView] = useState<'single' | 'dual'>('single');
    const [animating, setAnimating] = useState(false);

    // Set default to last 30 days on mount
    useEffect(() => {
        // Only set default if no defaultSelection is provided
        if (!defaultSelection) {
            handleQuickSelect("last-30-days");
        }
        // We're intentionally not including handleQuickSelect in the deps array
        // as it would cause the effect to run on every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultSelection]);

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
        if (defaultSelection) {
            setDateSelection(defaultSelection);

            if (defaultSelection.type === 'single' && defaultSelection.single) {
                setCalendarMonth(defaultSelection.single);
            } else if (defaultSelection.type === 'range' && defaultSelection.range.startDate) {
                setCalendarMonth(defaultSelection.range.startDate);
            }
        }
    }, [defaultSelection]);

    const handleSelectDate = (date: Date | undefined) => {
        if (!date) return;

        setQuickSelection(null);

        if (dateSelection.type === 'single') {
            // Single date selection mode
            setDateSelection({
                ...dateSelection,
                single: date
            });

            // Animate confirmation button
            setAnimating(true);
            setTimeout(() => setAnimating(false), 800);
        } else {
            // Range selection mode
            if (!dateSelection.range.startDate || (dateSelection.range.startDate && dateSelection.range.endDate)) {
                // Start new selection
                setDateSelection({
                    ...dateSelection,
                    range: {
                        startDate: date,
                        endDate: null,
                    }
                });
            } else {
                // Complete the selection
                if (isBefore(date, dateSelection.range.startDate)) {
                    setDateSelection({
                        ...dateSelection,
                        range: {
                            startDate: date,
                            endDate: dateSelection.range.startDate,
                        }
                    });
                } else {
                    setDateSelection({
                        ...dateSelection,
                        range: {
                            startDate: dateSelection.range.startDate,
                            endDate: date,
                        }
                    });
                }

                // Animate confirmation button
                setAnimating(true);
                setTimeout(() => setAnimating(false), 800);
            }
        }
    };

    const handleQuickSelect = (selection: string) => {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;
        let singleDate: Date | null = null;

        switch (selection) {
            case "today":
                singleDate = now;
                setDateSelection({
                    type: 'single',
                    single: singleDate,
                    range: {startDate: null, endDate: null}
                });
                setCalendarMonth(singleDate);
                break;
            case "yesterday":
                singleDate = new Date(now);
                singleDate.setDate(singleDate.getDate() - 1);
                setDateSelection({
                    type: 'single',
                    single: singleDate,
                    range: {startDate: null, endDate: null}
                });
                setCalendarMonth(singleDate);
                break;
            case "current-month":
                start = startOfMonth(now);
                end = endOfMonth(now);
                setDateSelection({
                    type: 'range',
                    single: null,
                    range: {startDate: start, endDate: end}
                });
                setCalendarMonth(start);
                break;
            case "previous-month":
                const lastMonth = addMonths(now, -1);
                start = startOfMonth(lastMonth);
                end = endOfMonth(lastMonth);
                setDateSelection({
                    type: 'range',
                    single: null,
                    range: {startDate: start, endDate: end}
                });
                setCalendarMonth(start);
                break;
            case "last-30-days":
                end = now;
                start = new Date(now);
                start.setDate(start.getDate() - 30);
                setDateSelection({
                    type: 'range',
                    single: null,
                    range: {startDate: start, endDate: end}
                });
                setCalendarMonth(start);
                break;
            case "last-90-days":
                end = now;
                start = new Date(now);
                start.setDate(start.getDate() - 90);
                setDateSelection({
                    type: 'range',
                    single: null,
                    range: {startDate: start, endDate: end}
                });
                setCalendarMonth(start);
                break;
            case "mar-1-30":
                // Specifically for March 1-30 of current year
                const currentYear = now.getFullYear();
                start = new Date(currentYear, 2, 1); // March 1
                end = new Date(currentYear, 2, 30); // March 30
                setDateSelection({
                    type: 'range',
                    single: null,
                    range: {startDate: start, endDate: end}
                });
                setCalendarMonth(start);
                break;
            default:
                break;
        }

        setQuickSelection(selection);

        // Animate confirmation button
        setAnimating(true);
        setTimeout(() => setAnimating(false), 800);
    };

    const toggleSelectionType = () => {
        if (dateSelection.type === 'range') {
            // When switching to single, set the single date to start date if available
            setDateSelection({
                type: 'single',
                single: dateSelection.range.startDate,
                range: dateSelection.range
            });
        } else {
            // When switching to range, use the single date as start date if available
            setDateSelection({
                type: 'range',
                single: dateSelection.single,
                range: {
                    startDate: dateSelection.single,
                    endDate: null
                }
            });
        }

        setQuickSelection(null);
    };

    const isDateInRange = (date: Date) => {
        if (!dateSelection.range.startDate || !dateSelection.range.endDate) return false;
        return (
            (isAfter(date, dateSelection.range.startDate) && isBefore(date, dateSelection.range.endDate)) ||
            isSameDay(date, dateSelection.range.startDate) ||
            isSameDay(date, dateSelection.range.endDate)
        );
    };

    const isStartDate = (date: Date) =>
        dateSelection.range.startDate && isSameDay(date, dateSelection.range.startDate);

    const isEndDate = (date: Date) =>
        dateSelection.range.endDate && isSameDay(date, dateSelection.range.endDate);

    const isSingleSelectedDate = (date: Date) =>
        dateSelection.type === 'single' && dateSelection.single && isSameDay(date, dateSelection.single);

    const nextMonth = () => {
        setCalendarMonth(addMonths(calendarMonth, 1));
    };

    const prevMonth = () => {
        setCalendarMonth(addMonths(calendarMonth, -1));
    };

    const dateSelectionText = () => {
        if (dateSelection.type === 'single') {
            return dateSelection.single
                ? format(dateSelection.single, "MMM d, yyyy")
                : "Select a date";
        } else {
            if (!dateSelection.range.startDate) return "Select start date";
            if (!dateSelection.range.endDate) return "Select end date";
            return `${format(dateSelection.range.startDate, "MMM d, yyyy")} - ${format(dateSelection.range.endDate, "MMM d, yyyy")}`;
        }
    };

    const quickSelections = [
        {id: "today", label: "Today", icon: "📅", type: "single"},
        {id: "yesterday", label: "Yesterday", icon: "⬅️", type: "single"},
        {id: "current-month", label: "Current Month", icon: "📅", type: "range"},
        {id: "previous-month", label: "Previous Month", icon: "⏮️", type: "range"},
        {id: "last-30-days", label: "Last 30 Days", icon: "🔄", type: "range"},
        {id: "last-90-days", label: "Last 90 Days", icon: "📊", type: "range"},
    ];

    const isSelectionValid = () => {
        if (dateSelection.type === 'single') {
            return dateSelection.single !== null;
        } else {
            return dateSelection.range.startDate !== null && dateSelection.range.endDate !== null;
        }
    };

    return (
        <div
            className={`w-full min-h-full max-sm:min-h-screen flex flex-col h-full max-h-[80vh] mx-auto bg-white dark:bg-gray-900 sm:rounded-md sm:shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
            {/* Header with title, selection type toggle and close button */}
            <div
                className="p-2  bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-semibold text-white">Select Date</h3>
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

                {/* Selection type toggle */}
                <div className="mt-3 flex md:flex-row flex-col gap-2  md:items-center md:justify-between">
                   <div className="flex">
                       <div className="bg-white/20 backdrop-blur-sm rounded-md p-1 flex">
                           <button
                               onClick={() => dateSelection.type !== 'single' && toggleSelectionType()}
                               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                   dateSelection.type === 'single'
                                       ? 'bg-white text-green-700'
                                       : 'text-white hover:bg-white/10'
                               }`}
                           >
                               Single Date
                           </button>
                           <button
                               onClick={() => dateSelection.type !== 'range' && toggleSelectionType()}
                               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                   dateSelection.type === 'range'
                                       ? 'bg-white text-green-700'
                                       : 'text-white hover:bg-white/10'
                               }`}
                           >
                               Date Range
                           </button>
                       </div>
                   </div>

                    {/* Date selection summary */}
                    <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-white"/>
                        <span className="text-white font-medium text-sm">
              {dateSelectionText()}
            </span>
                    </div>
                </div>
            </div>
            <div
                className="flex-grow scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 overflow-y-auto">
                <div className="p-2">
                    {/* Quick selection buttons */}
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Quick Select</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {quickSelections
                                .filter(option => (
                                    dateSelection.type === 'single' ? option.type === 'single' : true
                                ))
                                .map((option) => (
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
                    <div
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-1">
                        {/* Calendar header */}
                        <div className="flex items-center justify-between px-2 py-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={prevMonth}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                                <ChevronLeft className="h-4 w-4"/>
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
                                <ChevronRight className="h-4 w-4"/>
                            </Button>
                        </div>

                        {/* Calendar grid */}
                        <div className={`${calendarView === 'dual' ? 'grid grid-cols-2 gap-4' : ''}`}>
                            <Calendar
                                mode="single"
                                selected={
                                    dateSelection.type === 'single'
                                        ? dateSelection.single || undefined
                                        : dateSelection.range.endDate || dateSelection.range.startDate || undefined
                                }
                                onSelect={handleSelectDate}
                                month={calendarMonth}
                                onMonthChange={setCalendarMonth}
                                className="mx-auto"
                                modifiers={{
                                    range: (date) => dateSelection.type === 'range' && isDateInRange(date),
                                    //@ts-ignore
                                    rangeStart: (date) => dateSelection.type === 'range' && isStartDate(date),
                                    //@ts-ignore
                                    rangeEnd: (date) => dateSelection.type === 'range' && isEndDate(date),
                                    //@ts-ignore
                                    singleSelected: (date) => dateSelection.type === 'single' && isSingleSelectedDate(date),
                                }}
                                modifiersClassNames={{
                                    range: "bg-green-100 dark:bg-green-900/30",
                                    rangeStart: "bg-green-500 text-white rounded-l-md",
                                    rangeEnd: "bg-green-500 text-white rounded-r-md",
                                    singleSelected: "bg-green-500 text-white rounded-md",
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
                                    selected={
                                        dateSelection.type === 'single'
                                            ? dateSelection.single || undefined
                                            : dateSelection.range.endDate || dateSelection.range.startDate || undefined
                                    }
                                    onSelect={handleSelectDate}
                                    month={addMonths(calendarMonth, 1)}
                                    onMonthChange={(month) => setCalendarMonth(addMonths(month, -1))}
                                    className="mx-auto"
                                    modifiers={{
                                        range: (date) => dateSelection.type === 'range' && isDateInRange(date),
                                        //@ts-ignore
                                        rangeStart: (date) => dateSelection.type === 'range' && isStartDate(date),
                                        //@ts-ignore
                                        rangeEnd: (date) => dateSelection.type === 'range' && isEndDate(date),
                                        //@ts-ignore
                                        singleSelected: (date) => dateSelection.type === 'single' && isSingleSelectedDate(date),
                                    }}
                                    modifiersClassNames={{
                                        range: "bg-green-100 dark:bg-green-900/30",
                                        rangeStart: "bg-green-500 text-white rounded-l-md",
                                        rangeEnd: "bg-green-500 text-white rounded-r-md",
                                        singleSelected: "bg-green-500 text-white rounded-md",
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

                        {/* Selected date/range display */}
                        <div
                            className="flex justify-between items-center px-4 py-2 mt-2 text-sm bg-gray-50 dark:bg-gray-900 rounded-md">
                            {dateSelection.type === 'single' ? (
                                <div className="w-full text-center">
                                <span
                                    className="font-medium text-gray-700 dark:text-gray-300">Selected Date:</span>{" "}
                                    <span className="text-gray-600 dark:text-gray-400">
                  {dateSelection.single
                      ? format(dateSelection.single, "MMM d, yyyy")
                      : "Not selected"}
                </span>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <span
                                            className="font-medium text-gray-700 dark:text-gray-300">Start:</span>{" "}
                                        <span className="text-gray-600 dark:text-gray-400">
                    {dateSelection.range.startDate
                        ? format(dateSelection.range.startDate, "MMM d, yyyy")
                        : "Not selected"}
                  </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300">End:</span>{" "}
                                        <span className="text-gray-600 dark:text-gray-400">
                    {dateSelection.range.endDate
                        ? format(dateSelection.range.endDate, "MMM d, yyyy")
                        : "Not selected"}
                  </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {/* Footer/Actions */}
                <div
                    className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-between">
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
                                transition: {duration: 0.5}
                            } : {}}
                        >
                            <Button
                                onClick={() => onConfirm(dateSelection)}
                                disabled={!isSelectionValid()}
                                className="bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700 relative overflow-hidden"
                            >
                                <motion.span
                                    initial={{x: -20, opacity: 0}}
                                    animate={{x: 0, opacity: 1}}
                                    transition={{duration: 0.3}}
                                    className="flex items-center"
                                >
                                    <span>Apply {dateSelection.type === 'single' ? 'Date' : 'Range'}</span>
                                    {isSelectionValid() && (
                                        <motion.span
                                            initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{delay: 0.2}}
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

        </div>

    );
}
