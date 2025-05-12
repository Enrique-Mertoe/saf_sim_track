import React, { useState, useEffect } from 'react';
import { Target, Calendar } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { User, Team } from '@/models';

interface TargetItem {
  id: string;
  title: string;
  target: number;
  current: number;
  endDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface UpcomingTargetsProps {
  userId: string;
  isTeamLead?: boolean;
  limit?: number;
  showViewAll?: boolean;
  onViewAllClick?: () => void;
}

const UpcomingTargets: React.FC<UpcomingTargetsProps> = ({
  userId,
  isTeamLead = false,
  limit = 5,
  showViewAll = true,
  onViewAllClick
}) => {
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTargets = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createSupabaseClient();

        // Get user details to know their team
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (userError) throw userError;

        const user = userData as User;
        let targetItems: TargetItem[] = [];

        // Fetch user's personal targets
        const { data: personalTargets, error: personalTargetsError } = await supabase
          .from('targets')
          .select('*')
          .eq('assigned_to_user_id', userId)
          .eq('is_active', true)
          .order('end_date', { ascending: true })
          .limit(isTeamLead ? Math.floor(limit / 2) : limit);

        if (personalTargetsError) throw personalTargetsError;

        // Transform personal targets to our format
        if (personalTargets) {
          const transformedPersonalTargets = personalTargets.map(target => ({
            id: target.id,
            title: target.name,
            target: target.target_value,
            current: target.current_value || 0,
            endDate: target.end_date,
            priority: determinePriority(target.end_date, target.current_value || 0, target.target_value)
          }));

          targetItems = [...targetItems, ...transformedPersonalTargets];
        }

        // If user is team lead, also fetch team targets
        if (isTeamLead && user.team_id) {
          const { data: teamTargets, error: teamTargetsError } = await supabase
            .from('team_targets')
            .select('*')
            .eq('team_id', user.team_id)
            .eq('is_active', true)
            .order('end_date', { ascending: true })
            .limit(Math.floor(limit / 2));

          if (teamTargetsError) throw teamTargetsError;

          // Transform team targets to our format
          if (teamTargets) {
            const transformedTeamTargets = teamTargets.map(target => ({
              id: `team-${target.id}`,
              title: `Team: ${target.name}`,
              target: target.target_value,
              current: target.current_value || 0,
              endDate: target.end_date,
              priority: determinePriority(target.end_date, target.current_value || 0, target.target_value)
            }));

            targetItems = [...targetItems, ...transformedTeamTargets];
          }
        }

        // Sort targets by priority and end date
        targetItems.sort((a, b) => {
          const priorityValues = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityValues[b.priority] - priorityValues[a.priority];

          if (priorityDiff !== 0) return priorityDiff;

          // If same priority, sort by end date (closest first)
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        });

        // Apply final limit
        setTargets(targetItems.slice(0, limit));

      } catch (err) {
        console.error('Error fetching targets:', err);
        setError('Failed to load targets');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTargets();
  }, [userId, isTeamLead, limit]);

  // Determine priority based on deadline and progress
  const determinePriority = (endDate: string, current: number, target: number): 'high' | 'medium' | 'low' => {
    const today = new Date();
    const deadline = new Date(endDate);
    const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const progress = (current / target) * 100;

    // High priority if deadline is within 7 days and less than 70% complete
    if (daysRemaining <= 7 && progress < 70) {
      return 'high';
    }

    // Medium priority if deadline is within 14 days or less than 50% complete
    if (daysRemaining <= 14 || progress < 50) {
      return 'medium';
    }

    // Low priority for everything else
    return 'low';
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow h-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <Target className="h-5 w-5 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-700">Upcoming Targets</h2>
        </div>
        <div className="flex justify-center items-center p-8">
          <div className="text-gray-500">Loading targets...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow h-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <Target className="h-5 w-5 text-blue-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-700">Upcoming Targets</h2>
        </div>
        <div className="flex justify-center items-center p-8">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow h-full">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center">
        <Target className="h-5 w-5 text-blue-500 mr-2" />
        <h2 className="text-lg font-semibold text-gray-700">Upcoming Targets</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {targets.length > 0 ? (
          targets.map((target) => (
            <div key={target.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-800">{target.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Due {formatDate(target.endDate)}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityClass(target.priority)}`}>
                  {target.priority.charAt(0).toUpperCase() + target.priority.slice(1)}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-medium text-gray-700">{target.current} / {target.target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${calculateProgress(target.current, target.target)}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">
                  {calculateProgress(target.current, target.target)}% Complete
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            No upcoming targets found
          </div>
        )}
      </div>
      {targets.length > 0 && showViewAll && (
        <div className="px-4 py-3 bg-gray-50 text-center border-t border-gray-200">
          <button
            type="button"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
            onClick={onViewAllClick}
          >
            View all targets
          </button>
        </div>
      )}
    </div>
  );
};

export default UpcomingTargets;