import React from 'react';
import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts';
import {motion} from 'framer-motion';
import {Activity} from 'lucide-react';

interface ActivationStatusChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  loading: boolean;
}

const COLORS = ['#10B981', '#FFBB28', '#FF8042'];
const RADIAN = Math.PI / 180;

// Custom label for the pie chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ActivationStatusChart: React.FC<ActivationStatusChartProps> = ({ data, loading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
    >
      <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100">
        <Activity size={18} className="mr-2 text-indigo-600 dark:text-indigo-400" />
        SIM Activation Status
      </h2>
      <div className="h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Loading chart data...</p>
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'Percentage']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  borderRadius: '4px',
                  border: 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
                }}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                formatter={(value, entry, index) => (
                  <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">No data available</p>
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {data.map((item, index) => (
          <div key={index} className="text-center">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</div>
            <div 
              className="text-lg font-bold" 
              style={{ color: COLORS[index % COLORS.length] }}
            >
              {item.value}%
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ActivationStatusChart;