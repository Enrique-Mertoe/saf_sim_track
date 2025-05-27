import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {motion} from 'framer-motion';
import {Users} from 'lucide-react';

interface TeamPerformanceData {
  name: string;
  sales: number;
  target: number;
}

interface TeamPerformanceChartProps {
  data: TeamPerformanceData[];
  loading: boolean;
}

const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({ data, loading }) => {
  // Calculate achievement percentages for each team
  const dataWithPercentage = data.map(team => ({
    ...team,
    achievementPercentage: Math.round((team.sales / team.target) * 100)
  }));

  // Sort teams by sales performance
  const sortedData = [...dataWithPercentage].sort((a, b) => b.sales - a.sales);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
        <Users size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
        Team Performance
      </h2>
      <div className="h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
          </div>
        ) : sortedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#888"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
              />
              <YAxis stroke="#888" />
              <Tooltip
                formatter={(value, name) => [value, name === 'sales' ? 'Sales' : 'Target']}
                labelFormatter={(label) => `Team: ${label}`}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  borderRadius: '4px',
                  border: 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                }}
              />
              <Legend 
                formatter={(value) => <span className="text-sm">{value === 'sales' ? 'Actual Sales' : 'Target'}</span>}
              />
              <Bar 
                dataKey="sales" 
                fill="#4F46E5" 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
                name="sales"
              />
              <Bar 
                dataKey="target" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]} 
                animationDuration={1500}
                name="target"
              />
              <ReferenceLine y={0} stroke="#000" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No team performance data available</p>
          </div>
        )}
      </div>
      
      {/* Team Performance Summary */}
      {sortedData.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Performing Teams</h3>
          <div className="space-y-2">
            {sortedData.slice(0, 3).map((team, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                    index === 1 ? 'bg-gray-100 text-gray-800' : 
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{team.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 mr-2">{team.sales}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    team.achievementPercentage >= 100 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : team.achievementPercentage >= 75
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {team.achievementPercentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TeamPerformanceChart;