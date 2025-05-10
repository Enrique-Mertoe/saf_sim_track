// app/user-management/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Types
type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_APPROVAL";
type UserRole = "ADMIN" | "TEAM_LEADER" | "VAN_STAFF" | "MPESA_ONLY_AGENT" | "NON_MPESA_AGENT";

interface User {
  id: string;
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  mobigoNumber?: string;
  role: UserRole;
  team?: Team;
  idFrontUrl?: string;
  idBackUrl?: string;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
  vanNumber?: string;
  vanLocation?: string;
}

interface Team {
  id: string;
  name: string;
  leader?: User;
  region?: string;
  territory?: string;
  cluster?: string;
  status: "ACTIVE" | "INACTIVE";
}

interface OnboardingRequest {
  id: string;
  requestType: "ONBOARDING" | "DELETION";
  requestedBy: User;
  targetUser?: User;
  userData: Partial<User>;
  idFrontUrl?: string;
  idBackUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: User;
  reviewDate?: string;
  createdAt: string;
}

// Mock Data
const mockTeams: Team[] = [
  { id: "t1", name: "Eastern Region Team", status: "ACTIVE", region: "Eastern" },
  { id: "t2", name: "Western Region Team", status: "ACTIVE", region: "Western" },
  { id: "t3", name: "Central Region Team", status: "ACTIVE", region: "Central" },
  { id: "t4", name: "Nairobi Team", status: "ACTIVE", region: "Nairobi" },
  { id: "t5", name: "Coast Team", status: "INACTIVE", region: "Coast" }
];

const mockUsers: User[] = [
  {
    id: "u1",
    fullName: "Abuti Martin",
    idNumber: "12345678",
    phoneNumber: "0714356761",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2023-01-15T10:30:00Z",
    lastLogin: "2025-05-09T06:31:00Z"
  },
  {
    id: "u2",
    fullName: "Abuti Martin",
    idNumber: "23456789",
    phoneNumber: "0714356762",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2023-02-20T14:15:00Z"
  },
  {
    id: "u3",
    fullName: "Abuti Martin",
    idNumber: "34567890",
    phoneNumber: "0714356763",
    mobigoNumber: "0734567890",
    role: "TEAM_LEADER",
    team: mockTeams[0],
    status: "ACTIVE",
    createdAt: "2023-03-05T09:45:00Z"
  },
  {
    id: "u4",
    fullName: "Abuti Martin",
    idNumber: "45678901",
    phoneNumber: "0714356764",
    role: "TEAM_LEADER",
    team: mockTeams[1],
    status: "SUSPENDED",
    createdAt: "2023-04-10T16:20:00Z"
  },
  {
    id: "u5",
    fullName: "Ian Boke",
    idNumber: "56789012",
    phoneNumber: "0714356765",
    role: "TEAM_LEADER",
    team: mockTeams[2],
    status: "PENDING_APPROVAL",
    createdAt: "2023-05-22T11:10:00Z"
  },
  {
    id: "u6",
    fullName: "John Kimani",
    idNumber: "67890123",
    phoneNumber: "0714356766",
    mobigoNumber: "0767890123",
    role: "VAN_STAFF",
    team: mockTeams[0],
    vanNumber: "V001",
    vanLocation: "Nairobi CBD",
    status: "ACTIVE",
    createdAt: "2023-06-15T08:30:00Z",
    lastLogin: "2025-05-08T13:45:00Z"
  },
  {
    id: "u7",
    fullName: "Mary Wanjiku",
    idNumber: "78901234",
    phoneNumber: "0714356767",
    role: "MPESA_ONLY_AGENT",
    team: mockTeams[3],
    status: "ACTIVE",
    createdAt: "2023-07-05T14:50:00Z",
    lastLogin: "2025-05-07T10:30:00Z"
  }
];

const mockOnboardingRequests: OnboardingRequest[] = [
  {
    id: "r1",
    requestType: "ONBOARDING",
    requestedBy: mockUsers[2],
    userData: {
      fullName: "Peter Omondi",
      idNumber: "89012345",
      phoneNumber: "0714356768",
      role: "VAN_STAFF",
      team: mockTeams[0]
    },
    idFrontUrl: "/placeholder-id-front.jpg",
    idBackUrl: "/placeholder-id-back.jpg",
    status: "PENDING",
    createdAt: "2025-05-08T09:15:00Z"
  },
  {
    id: "r2",
    requestType: "ONBOARDING",
    requestedBy: mockUsers[3],
    userData: {
      fullName: "Sarah Kamau",
      idNumber: "90123456",
      phoneNumber: "0714356769",
      role: "NON_MPESA_AGENT",
      team: mockTeams[1]
    },
    idFrontUrl: "/placeholder-id-front.jpg",
    idBackUrl: "/placeholder-id-back.jpg",
    status: "PENDING",
    createdAt: "2025-05-09T11:30:00Z"
  },
  {
    id: "r3",
    requestType: "DELETION",
    requestedBy: mockUsers[4],
    targetUser: mockUsers[6],
    status: "PENDING",
    createdAt: "2025-05-10T08:45:00Z"
  }
];

// User Management Page Component
export default function TT1() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users");
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [requests, setRequests] = useState<OnboardingRequest[]>(mockOnboardingRequests);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  
  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All Roles");
  const [teamFilter, setTeamFilter] = useState<string>("All Teams");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [showIDModal, setShowIDModal] = useState(false);
  const [currentIDUrls, setCurrentIDUrls] = useState<{front?: string, back?: string}>({});

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = search === "" || 
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.idNumber.includes(search) ||
      user.phoneNumber.includes(search);
    
    const matchesRole = roleFilter === "All Roles" || user.role === roleFilter;
    const matchesTeam = teamFilter === "All Teams" || user.team?.name === teamFilter;
    const matchesStatus = statusFilter === "All Statuses" || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesTeam && matchesStatus;
  });

  // Handle user actions
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    router.push(`/user-management/edit/${user.id}`);
  };

  const handleChangeStatus = (user: User, newStatus: UserStatus) => {
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      )
    );
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    }
  };

  const handleViewIDs = (user: User) => {
    setCurrentIDUrls({
      front: user.idFrontUrl,
      back: user.idBackUrl
    });
    setShowIDModal(true);
  };

  // Handle request actions
  const handleViewRequest = (request: OnboardingRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleApproveRequest = (requestId: string) => {
    // Simulate approving a request
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId 
          ? { ...req, status: "APPROVED", reviewDate: new Date().toISOString() } 
          : req
      )
    );
    
    // If it's an onboarding request, add the user
    const request = requests.find(req => req.id === requestId);
    if (request && request.requestType === "ONBOARDING" && request.userData) {
      const newUser: User = {
        id: `u${users.length + 1}`,
        fullName: request.userData.fullName || "",
        idNumber: request.userData.idNumber || "",
        phoneNumber: request.userData.phoneNumber || "",
        mobigoNumber: request.userData.mobigoNumber,
        role: request.userData.role as UserRole || "NON_MPESA_AGENT",
        team: request.userData.team,
        idFrontUrl: request.idFrontUrl,
        idBackUrl: request.idBackUrl,
        status: "ACTIVE",
        createdAt: new Date().toISOString()
      };
      
      setUsers(prevUsers => [...prevUsers, newUser]);
    }
    
    // If it's a deletion request, delete the user
    if (request && request.requestType === "DELETION" && request.targetUser) {
      setUsers(prevUsers => prevUsers.filter(user => user.id !== request.targetUser?.id));
    }
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId 
          ? { ...req, status: "REJECTED", reviewDate: new Date().toISOString() } 
          : req
      )
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 rounded-md ${activeTab === "users" ? "bg-green-600 text-white" : "bg-gray-200"}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${activeTab === "requests" ? "bg-green-600 text-white" : "bg-gray-200"}`}
            onClick={() => setActiveTab("requests")}
          >
            Onboarding Requests
            {requests.filter(r => r.status === "PENDING").length > 0 && (
              <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                {requests.filter(r => r.status === "PENDING").length}
              </span>
            )}
          </button>
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded-md"
            onClick={() => router.push("/user-management/create")}
          >
            Create User
          </button>
        </div>
      </div>

      {activeTab === "users" && (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-md shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input 
                  type="text" 
                  placeholder="Name, ID, or Phone" 
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option>All Roles</option>
                  <option>ADMIN</option>
                  <option>TEAM_LEADER</option>
                  <option>VAN_STAFF</option>
                  <option>MPESA_ONLY_AGENT</option>
                  <option>NON_MPESA_AGENT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                >
                  <option>All Teams</option>
                  {teams.map(team => (
                    <option key={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All Statuses</option>
                  <option>ACTIVE</option>
                  <option>SUSPENDED</option>
                  <option>PENDING_APPROVAL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-md shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500">ID: {user.idNumber}</div>
                          <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : ""}
                            ${user.role === "TEAM_LEADER" ? "bg-blue-100 text-blue-800" : ""}
                            ${user.role === "VAN_STAFF" ? "bg-green-100 text-green-800" : ""}
                            ${user.role === "MPESA_ONLY_AGENT" ? "bg-yellow-100 text-yellow-800" : ""}
                            ${user.role === "NON_MPESA_AGENT" ? "bg-gray-100 text-gray-800" : ""}
                          `}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.team ? user.team.name : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.status === "ACTIVE" ? "bg-green-100 text-green-800" : ""}
                            ${user.status === "SUSPENDED" ? "bg-red-100 text-red-800" : ""}
                            ${user.status === "PENDING_APPROVAL" ? "bg-yellow-100 text-yellow-800" : ""}
                          `}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleViewUser(user)}
                          >
                            View
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-900"
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </button>
                          {user.status === "ACTIVE" ? (
                            <button 
                              className="text-yellow-600 hover:text-yellow-900"
                              onClick={() => handleChangeStatus(user, "SUSPENDED")}
                            >
                              Suspend
                            </button>
                          ) : user.status === "SUSPENDED" ? (
                            <button 
                              className="text-green-600 hover:text-green-900"
                              onClick={() => handleChangeStatus(user, "ACTIVE")}
                            >
                              Activate
                            </button>
                          ) : (
                            <button 
                              className="text-green-600 hover:text-green-900"
                              onClick={() => handleChangeStatus(user, "ACTIVE")}
                            >
                              Approve
                            </button>
                          )}
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No users found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "requests" && (
        <div className="bg-white rounded-md shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${request.requestType === "ONBOARDING" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        `}>
                          {request.requestType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{request.requestedBy.fullName}</div>
                        <div className="text-sm text-gray-500">{request.requestedBy.role}</div>
                      </td>
                      <td className="px-6 py-4">
                        {request.requestType === "ONBOARDING" && request.userData ? (
                          <>
                            <div className="font-medium text-gray-900">{request.userData.fullName}</div>
                            <div className="text-sm text-gray-500">ID: {request.userData.idNumber}</div>
                            <div className="text-sm text-gray-500">{request.userData.phoneNumber}</div>
                            <div className="text-sm text-gray-500">Role: {request.userData.role}</div>
                            <div className="text-sm text-gray-500">Team: {request.userData.team?.name || "N/A"}</div>
                          </>
                        ) : request.targetUser ? (
                          <>
                            <div className="font-medium text-gray-900">{request.targetUser.fullName}</div>
                            <div className="text-sm text-gray-500">ID: {request.targetUser.idNumber}</div>
                            <div className="text-sm text-gray-500">{request.targetUser.phoneNumber}</div>
                          </>
                        ) : (
                          <span className="text-gray-500">No details available</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${request.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : ""}
                          ${request.status === "APPROVED" ? "bg-green-100 text-green-800" : ""}
                          ${request.status === "REJECTED" ? "bg-red-100 text-red-800" : ""}
                        `}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleViewRequest(request)}
                        >
                          View
                        </button>
                        {request.status === "PENDING" && (
                          <>
                            <button 
                              className="text-green-600 hover:text-green-900"
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              Approve
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {request.requestType === "ONBOARDING" && request.idFrontUrl && (
                          <button 
                            className="text-purple-600 hover:text-purple-900"
                            onClick={() => {
                              setCurrentIDUrls({
                                front: request.idFrontUrl,
                                back: request.idBackUrl
                              });
                              setShowIDModal(true);
                            }}
                          >
                            View IDs
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No pending requests
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
