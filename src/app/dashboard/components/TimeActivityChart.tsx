import React, {useMemo} from 'react';
import {Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis} from 'recharts';
import {motion} from 'framer-motion';
import {Clock} from 'lucide-react';

interface SIMCardData {
  id: string;
  activation_date?: string;
  sale_date?: string;
  created_at: string;
}

interface TimeActivityChartProps {
  data: SIMCardData[];
  loading: boolean;
}

// Helper function to get hour from date string
const getHour = (dateString: string): number => {
  return new Date(dateString).getHours();
};

// Helper function to get day of week from date string (0 = Sunday, 6 = Saturday)
const getDayOfWeek = (dateString: string): number => {
  return new Date(dateString).getDay();
};

// Day names for y-axis
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimeActivityChart: React.FC<TimeActivityChartProps> = ({ data, loading }) => {
  // Process data for the heatmap
  const activityData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Initialize a 7x24 grid with zeros (7 days, 24 hours)
    const activityGrid: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
    
    // Count activations for each day and hour
    data.forEach(card => {
      // Use activation_date if available, otherwise fall back to sale_date or created_at
      const dateString = card.activation_date || card.sale_date || card.created_at;
      if (!dateString) return;
      
      const day = getDayOfWeek(dateString);
      const hour = getHour(dateString);
      
      // Increment the count for this day and hour
      activityGrid[day][hour]++;
    });
    
    // Convert the grid to a format suitable for the scatter chart
    const result = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        result.push({
          day,
          hour,
          value: activityGrid[day][hour]
        });
      }
    }
    
    return result;
  }, [data]);
  
  // Find the maximum value for color scaling
  const maxValue = useMemo(() => {
    if (activityData.length === 0) return 1;
    return Math.max(...activityData.map(item => item.value));
  }, [activityData]);
  
  // Color function based on value intensity
  const getColor = (value: number) => {
    // Calculate intensity (0 to 1)
    const intensity = value / maxValue;
    
    // Use a gradient from light blue to dark blue
    if (intensity === 0) return '#f3f4f6'; // Very light gray for zero values
    if (intensity < 0.2) return '#dbeafe'; // Very light blue
    if (intensity < 0.4) return '#bfdbfe'; // Light blue
    if (intensity < 0.6) return '#93c5fd'; // Medium blue
    if (intensity < 0.8) return '#60a5fa'; // Blue
    return '#3b82f6'; // Dark blue
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
        <Clock size={18} className="mr-2 text-purple-600 dark:text-purple-400" />
        Activity Heatmap
      </h2>
      <div className="h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
          </div>
        ) : activityData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 70 }}
            >
              <XAxis 
                type="number" 
                dataKey="hour" 
                name="Hour" 
                domain={[0, 23]}
                tickCount={12}
                tick={{ fontSize: 10 }}
                tickFormatter={(hour) => `${hour}:00`}
                label={{ value: 'Hour of Day', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="day" 
                name="Day" 
                domain={[0, 6]}
                tickCount={7}
                tick={{ fontSize: 10 }}
                tickFormatter={(day) => dayNames[day]}
                label={{ value: 'Day of Week', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis 
                type="number"
                dataKey="value"
                range={[0, 500]}
                domain={[0, maxValue]}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value) => [`${value} activations`, 'Count']}
                labelFormatter={(_, payload) => {
                  if (payload && payload.length > 0) {
                    const { day, hour } = payload[0].payload;
                    return `${dayNames[day]}, ${hour}:00 - ${hour+1}:00`;
                  }
                  return '';
                }}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  borderRadius: '4px',
                  border: 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                }}
              />
              <Scatter 
                name="Activity" 
                data={activityData} 
                fill="#8884d8"
              >
                {activityData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getColor(entry.value)}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No activity data available</p>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-4">
        <div className="flex items-center justify-center">
          <div className="text-xs text-gray-600 dark:text-gray-400 mr-2">Low</div>
          <div className="flex">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, i) => (
              <div 
                key={i}
                className="w-6 h-4"
                style={{ backgroundColor: getColor(intensity * maxValue) }}
              />
            ))}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 ml-2">High</div>
        </div>
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
          Activity Intensity
        </div>
      </div>
      
      {/* Insights */}
      {activityData.length > 0 && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium">Key Insights:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>
              {(() => {
                // Find the busiest day
                const dayTotals = Array(7).fill(0);
                activityData.forEach(item => {
                  dayTotals[item.day] += item.value;
                });
                const busiestDayIndex = dayTotals.indexOf(Math.max(...dayTotals));
                return `Busiest day: ${dayNames[busiestDayIndex]}`;
              })()}
            </li>
            <li>
              {(() => {
                // Find the busiest hour
                const hourTotals = Array(24).fill(0);
                activityData.forEach(item => {
                  hourTotals[item.hour] += item.value;
                });
                const busiestHourIndex = hourTotals.indexOf(Math.max(...hourTotals));
                return `Peak hour: ${busiestHourIndex}:00 - ${busiestHourIndex+1}:00`;
              })()}
            </li>
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default TimeActivityChart;