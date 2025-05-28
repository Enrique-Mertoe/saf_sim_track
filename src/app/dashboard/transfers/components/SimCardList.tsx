import React from 'react';
import {Trash2} from 'lucide-react';

interface SimCardListProps {
  simcards: any[];
  selectedItems: {
    teams: string[];
    batches: string[];
    simcards: string[];
  };
  toggleSelection: (type: 'teams' | 'batches' | 'simcards', id: string) => void;
}

const SimCardList: React.FC<SimCardListProps> = ({
  simcards,
  selectedItems,
  toggleSelection
}) => {
  const handleDeleteSimCard = (e: React.MouseEvent, simcardId: string) => {
    e.stopPropagation();
    // Implement delete functionality
    console.log(`Delete simcard: ${simcardId}`);
  };

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Select
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Serial Number
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sold By
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sale Date
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {simcards.map((simcard: any) => {
              const isSimcardSelected = selectedItems.simcards.includes(simcard.id);
              
              // Determine status color
              const getStatusColor = () => {
                switch (simcard.status) {
                  case 'COMPLETED':
                    return 'bg-green-100 text-green-800';
                  case 'PENDING':
                    return 'bg-yellow-100 text-yellow-800';
                  case 'FAILED':
                    return 'bg-red-100 text-red-800';
                  default:
                    return 'bg-gray-100 text-gray-800';
                }
              };

              return (
                <tr key={simcard.id} className={isSimcardSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSimcardSelected}
                      onChange={() => toggleSelection('simcards', simcard.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {simcard.serial_number}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor()}`}>
                      {simcard.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {simcard.sold_by_user_id ? simcard.sold_by_user_id : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {simcard.sale_date ? new Date(simcard.sale_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={(e) => handleDeleteSimCard(e, simcard.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SimCardList;