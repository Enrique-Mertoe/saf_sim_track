"use client"
import {useState, useEffect} from "react";
import {Users, Check, X, MoreHorizontal, UserPlus, Mail, Phone, AlertTriangle} from "lucide-react";
import {collection, getDocs, updateDoc, doc, query, where, getFirestore} from "firebase/firestore";
import {db} from "@/lib/firebase/client";

export default function TeamManagement() {
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [staffRequests, setStaffRequests] = useState([]);
    const [selectedTab, setSelectedTab] = useState("teamLeaders");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLeader, setSelectedLeader] = useState(null);
    const [viewingDetails, setViewingDetails] = useState(false);

    useEffect(() => {
        fetchTeamLeaders();
        fetchStaffRequests();
    }, []);

    const fetchTeamLeaders = async () => {
        try {
            setLoading(true);
            const teamLeadersRef = collection(db, "users");
            const q = query(teamLeadersRef, where("role", "==", "teamLeader"));
            const querySnapshot = await getDocs(q);

            const leaders = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setTeamLeaders(leaders);
        } catch (error) {
            console.error("Error fetching team leaders:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaffRequests = async () => {
        try {
            setLoading(true);
            const requestsRef = collection(db, "staffRequests");
            const q = query(requestsRef, where("status", "==", "pending"));
            const querySnapshot = await getDocs(q);

            const requests = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setStaffRequests(requests);
        } catch (error) {
            console.error("Error fetching staff requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async (requestId) => {
        try {
            const requestRef = doc(db, "staffRequests", requestId);
            await updateDoc(requestRef, {
                status: "approved",
                approvedAt: new Date().toISOString()
            });

            // Update local state
            setStaffRequests(staffRequests.filter(req => req.id !== requestId));
        } catch (error) {
            console.error("Error approving request:", error);
        }
    };

    const handleRejectRequest = async (requestId) => {
        try {
            const requestRef = doc(db, "staffRequests", requestId);
            await updateDoc(requestRef, {
                status: "rejected",
                rejectedAt: new Date().toISOString()
            });

            // Update local state
            setStaffRequests(staffRequests.filter(req => req.id !== requestId));
        } catch (error) {
            console.error("Error rejecting request:", error);
        }
    };

    const toggleTeamLeaderStatus = async (leaderId, currentStatus) => {
        try {
            const leaderRef = doc(db, "users", leaderId);
            const newStatus = currentStatus === "active" ? "suspended" : "active";

            await updateDoc(leaderRef, {
                status: newStatus
            });

            // Update local state
            setTeamLeaders(teamLeaders.map(leader =>
                leader.id === leaderId ? {...leader, status: newStatus} : leader
            ));
        } catch (error) {
            console.error("Error updating team leader status:", error);
        }
    };

    const filteredLeaders = teamLeaders.filter(leader =>
        leader.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leader.phone?.includes(searchTerm) ||
        leader.vanNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderTeamLeadersList = () => {
        if (loading) {
            return <div className="flex justify-center p-8">Loading team leaders...</div>;
        }

        if (filteredLeaders.length === 0) {
            return <div className="text-center p-8 text-gray-500">No team leaders found</div>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeaders.map(leader => (
                    <div key={leader.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                                <div
                                    className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mr-3">
                                    {leader.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{leader.fullName}</h3>
                                    <p className="text-sm text-gray-500">Team Leader</p>
                                </div>
                            </div>
                            <div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    leader.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {leader.status === 'active' ? 'Active' : 'Suspended'}
                </span>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm">
                                <Phone size={16} className="mr-2 text-gray-500"/>
                                <span>{leader.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <Mail size={16} className="mr-2 text-gray-500"/>
                                <span>{leader.email || 'N/A'}</span>
                            </div>
                            {leader.vanNumber && (
                                <div className="flex items-center text-sm">
                                    <span className="mr-2 text-gray-500">Van:</span>
                                    <span>{leader.vanNumber}</span>
                                </div>
                            )}
                            {leader.location && (
                                <div className="flex items-center text-sm">
                                    <span className="mr-2 text-gray-500">Location:</span>
                                    <span>{leader.location}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setSelectedLeader(leader);
                                    setViewingDetails(true);
                                }}
                                className="text-sm text-blue-600 hover:underline flex items-center"
                            >
                                <MoreHorizontal size={16} className="mr-1"/>
                                View Details
                            </button>
                            <button
                                onClick={() => toggleTeamLeaderStatus(leader.id, leader.status)}
                                className={`text-sm ${
                                    leader.status === 'active'
                                        ? 'text-red-600 hover:text-red-800'
                                        : 'text-green-600 hover:text-green-800'
                                } hover:underline`}
                            >
                                {leader.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderStaffRequests = () => {
        if (loading) {
            return <div className="flex justify-center p-8">Loading staff requests...</div>;
        }

        if (staffRequests.length === 0) {
            return <div className="text-center p-8 text-gray-500">No pending staff requests</div>;
        }

        return (
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff
                            Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team
                            Leader
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date
                            Requested
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {staffRequests.map(request => (
                        <tr key={request.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div
                                        className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <UserPlus size={18} className="text-gray-500"/>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{request.staffName}</div>
                                        <div className="text-sm text-gray-500">{request.staffPhone}</div>
                                        <div className="text-sm text-gray-500">ID: {request.staffIdNumber}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{request.teamLeaderName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                  <span
                      className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {request.staffRole || 'Staff'}
                  </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(request.requestedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleApproveRequest(request.id)}
                                        className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-full"
                                    >
                                        <Check size={16}/>
                                    </button>
                                    <button
                                        onClick={() => handleRejectRequest(request.id)}
                                        className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-full"
                                    >
                                        <X size={16}/>
                                    </button>
                                    <button className="bg-gray-100 text-gray-700 hover:bg-gray-200 p-2 rounded-full">
                                        <MoreHorizontal size={16}/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderLeaderDetails = () => {
        if (!selectedLeader) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">Team Leader Details</h2>
                            <button
                                onClick={() => setViewingDetails(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20}/>
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                            <div
                                className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-white text-xl font-bold">
                                {selectedLeader.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-semibold">{selectedLeader.fullName}</h3>
                                <p className="text-sm text-gray-500 mb-2">Team Leader</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                            <span className="font-medium w-24">Phone:</span>
                                            <span>{selectedLeader.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <span className="font-medium w-24">Email:</span>
                                            <span>{selectedLeader.email || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <span className="font-medium w-24">ID Number:</span>
                                            <span>{selectedLeader.idNumber || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                            <span className="font-medium w-24">Van Number:</span>
                                            <span>{selectedLeader.vanNumber || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <span className="font-medium w-24">Location:</span>
                                            <span>{selectedLeader.location || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <span className="font-medium w-24">Status:</span>
                                            <span className={`${
                                                selectedLeader.status === 'active' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                        {selectedLeader.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <h4 className="font-medium mb-4">ID Documents</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedLeader.idFrontImage ? (
                                    <div className="border rounded-lg overflow-hidden">
                                        <img
                                            src="/api/placeholder/400/320"
                                            alt="ID Front"
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="p-2 text-sm text-center bg-gray-50">ID Front</div>
                                    </div>
                                ) : (
                                    <div
                                        className="border rounded-lg p-4 flex flex-col items-center justify-center h-48 bg-gray-50 text-gray-400">
                                        <AlertTriangle size={24} className="mb-2"/>
                                        <span>ID Front Image Not Available</span>
                                    </div>
                                )}

                                {selectedLeader.idBackImage ? (
                                    <div className="border rounded-lg overflow-hidden">
                                        <img
                                            src="/api/placeholder/400/320"
                                            alt="ID Back"
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="p-2 text-sm text-center bg-gray-50">ID Back</div>
                                    </div>
                                ) : (
                                    <div
                                        className="border rounded-lg p-4 flex flex-col items-center justify-center h-48 bg-gray-50 text-gray-400">
                                        <AlertTriangle size={24} className="mb-2"/>
                                        <span>ID Back Image Not Available</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end space-x-3">
                            <button
                                onClick={() => setViewingDetails(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => toggleTeamLeaderStatus(selectedLeader.id, selectedLeader.status)}
                                className={`px-4 py-2 rounded-md ${
                                    selectedLeader.status === 'active'
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                                {selectedLeader.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Users size={24} className="mr-2 text-green-600"/>
                    Team Management
                </h1>
            </div>

            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setSelectedTab("teamLeaders")}
                            className={`px-4 py-2 rounded-md ${
                                selectedTab === "teamLeaders"
                                    ? "bg-green-100 text-green-700 font-medium"
                                    : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            Team Leaders
                        </button>
                        <button
                            onClick={() => setSelectedTab("staffRequests")}
                            className={`px-4 py-2 rounded-md flex items-center ${
                                selectedTab === "staffRequests"
                                    ? "bg-green-100 text-green-700 font-medium"
                                    : "text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            Staff Approval Requests
                            {staffRequests.length > 0 && (
                                <span
                                    className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {staffRequests.length}
                </span>
                            )}
                        </button>
                    </div>

                    {selectedTab === "teamLeaders" && (
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search team leaders..."
                                className="w-full md:w-64 px-4 py-2 border rounded-md"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {selectedTab === "teamLeaders" ? renderTeamLeadersList() : renderStaffRequests()}
            </div>

            {viewingDetails && renderLeaderDetails()}
        </div>
    );
}