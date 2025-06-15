import React, {useEffect, useState} from 'react';
import {User} from '@/models';
import simService from '@/services/simService';
import {showModal} from '@/ui/shortcuts';
import BatchTeamSerials from './BatchTeamSerials';

interface BatchTeamsListProps {
  batchId: string;
  user: User | null;
}

const BatchTeamsList: React.FC<BatchTeamsListProps> = ({ batchId, user }) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamsForBatch = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get all SIM cards for this batch
        const { data, error } = await simService.countQuery(user, [
          ["batch_id", batchId]
        ]);

        if (error) {
          //@ts-ignore
          throw new Error(error);
        }

        // Get all SIM cards for this batch
        const simCards = await simService.getInBatched(user, "batch_id", [batchId]);

        // Group by team_id and count
        const teamCounts: { [key: string]: { id: string, name: string, count: number } } = {};

        simCards.forEach((card: any) => {
          const teamId = card.team_id;
          if (!teamId) return;

          if (!teamCounts[teamId]) {
            teamCounts[teamId] = {
              id: teamId,
              name: 'Unknown Team', // Will be updated later
              count: 0
            };
          }

          teamCounts[teamId].count++;
        });

        // Fetch team names
        const teamsData = await Promise.all(
          Object.keys(teamCounts).map(async (teamId) => {
            try {
              const teamSims = await simService.getSIMCardsByTeamId(teamId, user);
              if (teamSims.length > 0 && teamSims[0].team_id) {
                const teamName = typeof teamSims[0].team_id === 'string' 
                  ? 'Unknown Team'
                    //@ts-ignore
                  : teamSims[0].team_id.name || 'Unknown Team';

                return {
                  id: teamId,
                  name: teamName,
                  count: teamCounts[teamId].count
                };
              }
              return teamCounts[teamId];
            } catch (err) {
              console.error(`Error fetching team name for ${teamId}:`, err);
              return teamCounts[teamId];
            }
          })
        );

        setTeams(teamsData);
      } catch (err) {
        console.error('Error fetching teams for batch:', err);
        setError('Failed to load teams for this batch');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamsForBatch();
  }, [batchId, user]);

  const handleTeamClick = (teamId: string, teamName: string) => {
    if (!user) return;

    showModal({
      content: (onClose) => (
        <BatchTeamSerials
          teamId={teamId}
          teamName={teamName}
          batchId={batchId}
          user={user}
          onClose={onClose}
        />
      ),
      size: "lg",
    });
  };

  if (isLoading) {
    return (
      <div className="mt-2 flex items-center text-sm text-gray-500">
        <span className="inline-block animate-spin h-4 w-4 mr-2 border-2 border-green-600 border-t-transparent rounded-full"></span>
        Loading teams...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-2 text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="mt-2 text-sm text-gray-500">
        No teams found for this batch
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="text-sm text-gray-600 font-medium">Teams:</div>
      <div className="flex flex-wrap gap-2 mt-1">
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => handleTeamClick(team.id, team.name)}
            className="inline-flex items-center bg-green-50 text-green-700 hover:bg-green-100 px-2 py-1 rounded-md text-sm transition-colors"
          >
            {team.name}-{team.count}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BatchTeamsList;
