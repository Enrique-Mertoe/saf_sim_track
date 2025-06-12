import React, {useState} from 'react';
import {ArrowLeftRight, Check, Info, RefreshCw, Search, X} from 'lucide-react';
import {SimCardTransfer, TransferStatus} from '@/models';
import RejectModal from './RejectModal';

interface TransfersTabProps {
  transfers: SimCardTransfer[];
  isLoading: boolean;
  error: string | null;
  getTeamName: (teamId: string) => string;
  handleApproveTransfer: (transfer: any) => Promise<void>;
  handleRejectTransfer: () => Promise<void>;
  viewTransferDetails: (transfer: SimCardTransfer) => void;
}

const TransfersTab: React.FC<TransfersTabProps> = ({
  transfers,
  isLoading,
  error,
  getTeamName,
  handleApproveTransfer,
  handleRejectTransfer,
  viewTransferDetails
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [selectedTransfer, setSelectedTransfer] = useState<SimCardTransfer | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Filter transfers based on active tab and search term
  const filteredTransfers = transfers.filter(transfer => {
    // Filter by tab
    if (activeTab === 'pending' && transfer.status !== TransferStatus.PENDING) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const sourceTeamName = getTeamName(transfer.source_team_id);
      const destinationTeamName = getTeamName(transfer.destination_team_id);

      return (
        transfer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sourceTeamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        destinationTeamName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return true;
  });

  // Get status badge color
  const getStatusBadgeColor = (status: TransferStatus) => {
    switch (status) {
      case TransferStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TransferStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case TransferStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case TransferStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Open reject modal
  const openRejectModal = (transfer: SimCardTransfer) => {
    setSelectedTransfer(transfer);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Handle reject transfer
  const onRejectTransfer = async () => {
    await handleRejectTransfer();
    setShowRejectModal(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Transfer Requests</h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1 text-sm rounded-md ${
                activeTab === 'pending'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                activeTab === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No transfer requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransfers.map(transfer => (
              <div key={transfer.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-gray-900">
                        Transfer from {getTeamName(transfer.source_team_id)} to {getTeamName(transfer.destination_team_id)}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusBadgeColor(transfer.status)}`}>
                        {transfer.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {Array.isArray(transfer.sim_cards) ? transfer.sim_cards.length : 0} SIM cards
                    </p>
                    {transfer.reason && (
                      <p className="text-sm text-gray-600">Reason: {transfer.reason}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Requested on {new Date(transfer.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                    <button
                      onClick={() => viewTransferDetails(transfer)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      <span className="flex items-center">
                        <Info className="w-4 h-4 mr-1" />
                        Details
                      </span>
                    </button>

                    {transfer.status === TransferStatus.PENDING && (
                      <>
                        <button
                          onClick={() => handleApproveTransfer(transfer)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          <span className="flex items-center">
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </span>
                        </button>

                        <button
                          onClick={() => openRejectModal(transfer)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          <span className="flex items-center">
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onReject={onRejectTransfer}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
      />
    </div>
  );
};

export default TransfersTab;