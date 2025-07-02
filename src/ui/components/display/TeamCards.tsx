"use client"
import React from 'react';
import {Award, MapPin, TrendingUp, Users} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  leader_name?: string;
  member_count?: number;
  region?: string;
  territory?: string;
  performance_score?: number;
  sim_cards_sold?: number;
  activation_rate?: number;
  quality_rate?: number;
}

interface TeamCardsProps {
  data: Team[];
  title?: string;
  className?: string;
}

const TeamCards: React.FC<TeamCardsProps> = ({ data, title = "Team Overview", className = "" }) => {
  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 95) return "Excellent";
    if (score >= 90) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 50) return "Needs Improvement";
    return "Critical";
  };

  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-600" />
          {title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{data.length} teams active</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((team) => (
          <div key={team.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">{team.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Led by {team.leader_name || 'Unassigned'}
                  </p>
                </div>
                {team.performance_score && (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getPerformanceColor(team.performance_score)
                  }`}>
                    {getPerformanceLabel(team.performance_score)}
                  </div>
                )}
              </div>
              
              {(team.region || team.territory) && (
                <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{[team.region, team.territory].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
            
            {/* Metrics */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Team Size */}
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {team.member_count || 0}
                  </div>
                  <div className="text-xs text-gray-500">Members</div>
                </div>
                
                {/* SIM Cards Sold */}
                <div className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {team.sim_cards_sold?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500">SIMs Sold</div>
                </div>
                
                {/* Activation Rate */}
                {team.activation_rate !== undefined && (
                  <div className="text-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-2">
                      <Award className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {team.activation_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Activation</div>
                  </div>
                )}
                
                {/* Quality Rate */}
                {team.quality_rate !== undefined && (
                  <div className="text-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
                      <Award className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {team.quality_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Quality</div>
                  </div>
                )}
              </div>
              
              {/* Performance Score */}
              {team.performance_score && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall Performance</span>
                    <span className="font-semibold text-gray-900">
                      {team.performance_score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        team.performance_score >= 90 ? 'bg-green-500' :
                        team.performance_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${team.performance_score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamCards;