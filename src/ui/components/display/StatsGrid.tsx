"use client"
import React from 'react';
import {AlertCircle, Award, Smartphone, TrendingDown, TrendingUp, Users} from 'lucide-react';

interface Stat {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: 'users' | 'sim' | 'award' | 'alert' | 'trend';
  color?: 'green' | 'blue' | 'purple' | 'red' | 'yellow';
}

interface StatsGridProps {
  data: Stat[];
  title?: string;
  className?: string;
}

const StatsGrid: React.FC<StatsGridProps> = ({ data, title = "Key Metrics", className = "" }) => {
  const getIcon = (iconType: string, color: string) => {
    const iconClass = `w-6 h-6`;
    const colorClasses = {
      green: 'text-green-600',
      blue: 'text-blue-600', 
      purple: 'text-purple-600',
      red: 'text-red-600',
      yellow: 'text-yellow-600'
    };
    
    const iconColor = colorClasses[color as keyof typeof colorClasses] || 'text-gray-600';
    
    switch (iconType) {
      case 'users':
        return <Users className={`${iconClass} ${iconColor}`} />;
      case 'sim':
        return <Smartphone className={`${iconClass} ${iconColor}`} />;
      case 'award':
        return <Award className={`${iconClass} ${iconColor}`} />;
      case 'alert':
        return <AlertCircle className={`${iconClass} ${iconColor}`} />;
      case 'trend':
        return <TrendingUp className={`${iconClass} ${iconColor}`} />;
      default:
        return <TrendingUp className={`${iconClass} ${iconColor}`} />;
    }
  };
  
  const getBackgroundColor = (color: string) => {
    const colors = {
      green: 'bg-green-100',
      blue: 'bg-blue-100',
      purple: 'bg-purple-100', 
      red: 'bg-red-100',
      yellow: 'bg-yellow-100'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-100';
  };
  
  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value;
  };
  
  const getChangeIcon = (changeType: string) => {
    if (changeType === 'increase') {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (changeType === 'decrease') {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };
  
  const getChangeColor = (changeType: string) => {
    if (changeType === 'increase') return 'text-green-600';
    if (changeType === 'decrease') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">Current performance overview</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map((stat) => (
          <div key={stat.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${getBackgroundColor(stat.color || 'green')}`}>
                {getIcon(stat.icon || 'trend', stat.color || 'green')}
              </div>
              
              {stat.change !== undefined && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  getChangeColor(stat.changeType || 'neutral')
                }`}>
                  {getChangeIcon(stat.changeType || 'neutral')}
                  <span>{Math.abs(stat.change)}%</span>
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-900">
                {formatValue(stat.value)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {stat.label}
              </div>
            </div>
            
            {stat.change !== undefined && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className={`text-xs ${
                  getChangeColor(stat.changeType || 'neutral')
                }`}>
                  {stat.changeType === 'increase' ? '+' : stat.changeType === 'decrease' ? '-' : ''}
                  {Math.abs(stat.change)}% from last period
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsGrid;