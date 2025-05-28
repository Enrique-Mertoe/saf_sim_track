import React, {useState} from 'react';
import {ChevronDown, ChevronRight, Trash2, Users} from 'lucide-react';
import {BatchMetadata, Team} from '@/models';
import BatchItem from './BatchItem';

interface TeamItemProps {
  team: Team & { batches: BatchMetadata[], user: any };
  isExpanded: boolean;
  isSelected: boolean;
  toggleTeamExpansion: (teamId: string) => void;
  toggleSelection: (type: 'teams' | 'batches' | 'simcards', id: string) => void;
  selectedItems: {
    teams: string[];
    batches: string[];
    simcards: string[];
  };
  expandedBatches: string[];
  toggleBatchExpansion: (batchId: string) => void;
  simcards: { [batchId: string]: any[] };
  getBatchCounts: (batchId: string) => { totalSimcards: number; completedSimcards: number };
}

const TeamItem: React.FC<TeamItemProps> = ({
  team,
  isExpanded,
  isSelected,
  toggleTeamExpansion,
  toggleSelection,
  selectedItems,
  expandedBatches,
  toggleBatchExpansion,
  simcards,
  getBatchCounts
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Get counts for a team
  const getTeamCounts = () => {
    const batches = team.batches;
    const totalBatches = batches.length;

    // Count total simcards across all batches
    let totalSimcards = 0;
    let completedSimcards = 0;

    batches.forEach(batch => {
      const batchSimcards = simcards[batch.batch_id] || [];
      totalSimcards += batchSimcards.length;
      completedSimcards += batchSimcards.filter((card: any) => card.status === 'COMPLETED').length;
    });

    return { totalBatches, totalSimcards, completedSimcards };
  };

  const { totalBatches, totalSimcards, completedSimcards } = getTeamCounts();

  const handleTeamExpansion = () => {
    setIsLoading(true);
    toggleTeamExpansion(team.id);
    // Simulate loading for demonstration
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleDeleteTeam = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implement delete functionality
    console.log(`Delete team: ${team.id}`);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Team Header */}
      <div
        className={`p-4 flex items-center justify-between cursor-pointer ${
          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection('teams', team.id)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={handleTeamExpansion}
            className="flex items-center"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-500 mr-2" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500 mr-2" />
            )}
            <Users className="w-5 h-5 text-blue-500 mr-2" />
            <span className="font-medium text-gray-900">{team.name}</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{totalBatches}</span> Batches
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{completedSimcards}</span>/{totalSimcards} Completed
          </div>
          <button
            onClick={handleDeleteTeam}
            className="p-1 text-red-500 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Batches List with Loading State */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-sm text-gray-500">Loading batches...</p>
            </div>
          ) : team.batches.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No batches found for this team
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {team.batches.map(batch => (
                <BatchItem
                  key={batch.batch_id}
                  batch={batch}
                  isBatchExpanded={expandedBatches.includes(batch.batch_id)}
                  isBatchSelected={selectedItems.batches.includes(batch.batch_id)}
                  toggleSelection={toggleSelection}
                  toggleBatchExpansion={toggleBatchExpansion}
                  simcards={simcards}
                  getBatchCounts={getBatchCounts}
                  selectedItems={selectedItems}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamItem;