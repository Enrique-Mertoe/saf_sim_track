import React from 'react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  deleteType: 'teams' | 'batches' | 'simcards' | null;
  deleteOption: string;
  setDeleteOption: (option: string) => void;
  itemCount: number;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onDelete,
  deleteType,
  deleteOption,
  setDeleteOption,
  itemCount
}) => {
  if (!isOpen || !deleteType) return null;

  const getTypeName = () => {
    switch (deleteType) {
      case 'teams':
        return 'Teams';
      case 'batches':
        return 'Batches';
      case 'simcards':
        return 'SIM Cards';
      default:
        return 'Items';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Delete {getTypeName()}
        </h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete the selected {itemCount} {getTypeName().toLowerCase()}?
        </p>

        {deleteType === 'simcards' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delete Options
            </label>
            <select
              value={deleteOption}
              onChange={(e) => setDeleteOption(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Delete All Selected</option>
              <option value="completed">Delete Only Completed</option>
              <option value="unsold">Delete Only Unsold</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;