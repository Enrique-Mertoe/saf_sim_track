import React, {useState} from 'react';
import {RefreshCw, Search, Trash2, Users} from 'lucide-react';
import {BatchMetadata, Team} from '@/models';
import TeamItem from './TeamItem';
import DeleteModal from './DeleteModal';

interface GeneralTabProps {
  teams: (Team & { batches: BatchMetadata[], user: any })[];
  isLoading: boolean;
  expandedTeams: string[];
  expandedBatches: string[];
  simcards: { [batchId: string]: any[] };
  selectedItems: {
    teams: string[];
    batches: string[];
    simcards: string[];
  };
  toggleTeamExpansion: (teamId: string) => void;
  toggleBatchExpansion: (batchId: string) => void;
  toggleSelection: (type: 'teams' | 'batches' | 'simcards', id: string) => void;
  handleDeleteSelected: () => Promise<void>;
  getBatchCounts: (batchId: string) => { totalSimcards: number; completedSimcards: number };
}

const GeneralTab: React.FC<GeneralTabProps> = ({
  teams,
  isLoading,
  expandedTeams,
  expandedBatches,
  simcards,
  selectedItems,
  toggleTeamExpansion,
  toggleBatchExpansion,
  toggleSelection,
  handleDeleteSelected,
  getBatchCounts
}) => {
  const [generalSearchTerm, setGeneralSearchTerm] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'teams' | 'batches' | 'simcards' | null>(null);
  const [deleteOption, setDeleteOption] = useState<string>('all');
  const [isTabLoading, setIsTabLoading] = useState(false);

  // Filter teams based on search term
  const filteredTeams = teams.filter(team => {
    if (!generalSearchTerm) return true;
    return team.name.toLowerCase().includes(generalSearchTerm.toLowerCase());
  });

  // Open delete modal
  const openDeleteModal = (type: 'teams' | 'batches' | 'simcards') => {
    setDeleteType(type);
    setDeleteOption('all');
    setShowDeleteModal(true);
  };

  // Handle delete
  const onDelete = async () => {
    setIsTabLoading(true);
    await handleDeleteSelected();
    setShowDeleteModal(false);
    setIsTabLoading(false);
  };

  // Get item count for selected type
  const getItemCount = () => {
    if (!deleteType) return 0;
    return selectedItems[deleteType].length;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">SIM Card Management</h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search teams or batches..."
              value={generalSearchTerm}
              onChange={(e) => setGeneralSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading || isTabLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No teams found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selection Actions */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedItems.teams.length > 0 && (
                <button
                  onClick={() => openDeleteModal('teams')}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <span className="flex items-center">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete {selectedItems.teams.length} Teams
                  </span>
                </button>
              )}

              {selectedItems.batches.length > 0 && (
                <button
                  onClick={() => openDeleteModal('batches')}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <span className="flex items-center">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete {selectedItems.batches.length} Batches
                  </span>
                </button>
              )}

              {selectedItems.simcards.length > 0 && (
                <button
                  onClick={() => openDeleteModal('simcards')}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <span className="flex items-center">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete {selectedItems.simcards.length} SIM Cards
                  </span>
                </button>
              )}
            </div>

            {/* Teams List */}
            {filteredTeams.map(team => (
              <TeamItem
                key={team.id}
                team={team}
                isExpanded={expandedTeams.includes(team.id)}
                isSelected={selectedItems.teams.includes(team.id)}
                toggleTeamExpansion={toggleTeamExpansion}
                toggleSelection={toggleSelection}
                selectedItems={selectedItems}
                expandedBatches={expandedBatches}
                toggleBatchExpansion={toggleBatchExpansion}
                simcards={simcards}
                getBatchCounts={getBatchCounts}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={onDelete}
        deleteType={deleteType}
        deleteOption={deleteOption}
        setDeleteOption={setDeleteOption}
        itemCount={getItemCount()}
      />
    </div>
  );
};

export default GeneralTab;