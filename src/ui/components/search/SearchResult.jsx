import React, {useEffect, useState} from 'react';
import {Activity, AlertTriangle, CheckCircle, ExternalLink, Eye, Phone, User, X, XCircle} from 'lucide-react';
import {loadUserDetails} from "@/ui/components/search/helper";
import SIMDetailComponent from "@/ui/components/search/SimDetailComponent";
import {LoadingSpinner, StatusBadge} from "@/ui/components/search/components";
import TeamDetailComponent from "@/ui/components/search/TeamDetailComponent";


// User Detail Component
const UserDetailComponent = ({userId}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserDetails(userId).then(data => {
            setUser(data);
            setLoading(false);
        });
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <LoadingSpinner size={32}/>
                    <p className="text-gray-500 mt-3">Loading user details...</p>
                </div>
            </div>
        );
    }

    const getRoleColor = (role) => {
        const colors = {
            'ADMIN': 'text-purple-600 bg-purple-100',
            'TEAM_LEADER': 'text-blue-600 bg-blue-100',
            'VAN_STAFF': 'text-green-600 bg-green-100',
            'MPESA_ONLY_AGENT': 'text-orange-600 bg-orange-100',
            'NON_MPESA_AGENT': 'text-gray-600 bg-gray-100'
        };
        return colors[role] || 'text-gray-600 bg-gray-100';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start space-x-4">
                <div
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User size={24} className="text-white"/>
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{user.full_name}</h3>
                    <p className="text-gray-500">{user.email}</p>
                    <div className="flex items-center space-x-3 mt-2">
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleColor(user.role)}`}>
    {user.role.replace('_', ' ')}
    </span>
                        <StatusBadge
                            status={user.status}
                            type={user.status === 'ACTIVE' ? 'success' : 'error'}
                        />
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                        <Phone size={16} className="text-gray-500"/>
                        <span className="text-sm font-medium text-gray-700">Contact Info</span>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Phone:</span>
                            <span className="font-medium">{user.phone_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">ID Number:</span>
                            <span className="font-medium">{user.id_number}</span>
                        </div>
                        {user.mobigo_number && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mobigo:</span>
                                <span className="font-medium">{user.mobigo_number}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                        <Activity size={16} className="text-gray-500"/>
                        <span className="text-sm font-medium text-gray-700">Activity</span>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Joined:</span>
                            <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Last Login:</span>
                            <span className="font-medium">
        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
        </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Status:</span>
                            <div className="flex items-center space-x-1">
                                {user.is_active ? (
                                    <CheckCircle size={14} className="text-green-500"/>
                                ) : (
                                    <XCircle size={14} className="text-red-500"/>
                                )}
                                <span className="font-medium">{user.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Eye size={16}/>
                    <span>View Full Profile</span>
                </button>
                <button
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <ExternalLink size={16}/>
                    <span>Open in Users</span>
                </button>
            </div>
        </div>
    );
};

// Main Search Results Component
const SearchResult = ({onClose, result}) => {
    // Mock result data - replace with actual prop
    const mockResult = result || {
        id: 'sim-123',
        category: 'SIM',
        title: 'SIM #301001'
    };

    const renderContent = () => {
        switch (mockResult.category) {
            case 'User':
                return <UserDetailComponent userId={mockResult.id}/>;
            case 'Team':
                return <TeamDetailComponent teamId={mockResult.id}/>;
            case 'SIM':
                return <SIMDetailComponent simId={mockResult.id}/>;
            default:
                return (
                    <div className="text-center py-12">
                        <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4"/>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Unknown Result Type</h3>
                        <p className="text-gray-500">Category: {mockResult.category}</p>
                    </div>
                );
        }
    };

    return (
        <div
            className="bg-white flex flex-col md:max-h-[90vh]   md:rounded-lg md:shadow-xl w-full overflow-hidden max-sm:h-screen">

            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Search Result</h2>
                    <p className="text-sm text-gray-500">{mockResult.category} • {mockResult.title}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <X size={20} className="text-gray-500"/>
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-grow overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default SearchResult;