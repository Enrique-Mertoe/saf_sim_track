"use client"
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  time: string;
  type: 'meeting' | 'deadline' | 'training';
}

const StaffCalendar: React.FC = () => {
  const [currentDate] = useState(new Date());
  const [events] = useState<Event[]>([
    { id: 1, title: 'Team Meeting', time: '10:00 AM', type: 'meeting' },
    { id: 2, title: 'Project Deadline', time: '5:00 PM', type: 'deadline' },
    { id: 3, title: 'Training Session', time: '2:00 PM', type: 'training' },
  ]);

  const getEventTypeClass = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'deadline':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'training':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Format today's date as Month Day, Year
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Get day of week
  const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Calendar</h2>
        <div className="flex items-center space-x-2">
          <button className="p-1 rounded-full hover:bg-gray-200">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium">Today</span>
          <button className="p-1 rounded-full hover:bg-gray-200">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 text-center">
        <p className="text-lg font-bold">{dayOfWeek}</p>
        <p className="text-sm text-gray-600">{formattedDate}</p>
      </div>

      <div className="space-y-3">
        {events.map(event => (
          <div
            key={event.id}
            className={`p-3 border rounded-lg flex items-center justify-between ${getEventTypeClass(event.type)}`}
          >
            <div>
              <p className="font-medium">{event.title}</p>
              <p className="text-xs">{event.time}</p>
            </div>
            <button className="text-xs px-2 py-1 bg-white rounded-md hover:bg-gray-100">
              Details
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <button className="text-sm text-blue-600 hover:text-blue-800">
          View Full Calendar
        </button>
      </div>
    </div>
  );
};

export default StaffCalendar;