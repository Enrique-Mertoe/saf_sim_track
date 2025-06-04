import React, {useState} from 'react';

const TeamSelectionModalContent = ({ teams, setSelectedTeam, onClose, resolve, reject }) => {
    // Add state for search term
    const [searchTerm, setSearchTerm] = useState('');

    // Filter teams based on search term
    const filteredTeams = teams.filter(team => {
        const teamNameMatch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
        const leaderNameMatch = (team.leader || '').toLowerCase().includes(searchTerm.toLowerCase());
        return teamNameMatch || leaderNameMatch;
    });

    const handleCancel = () => {
        onClose();
        reject(new Error("Team selection cancelled"));
    };

    const handleTeamSelect = (teamId) => {
        setSelectedTeam(teamId);
        onClose();
        resolve(teamId);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Team</h2>
                <button
                    onClick={handleCancel}
                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                         xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please select a team to assign these SIM cards to:
            </p>

            {/* Search input */}
            <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none"
                         stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full p-2 pl-10 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
                    placeholder="Search by team or leader name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setSearchTerm('')}
                    >
                        <svg
                            className="w-4 h-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {filteredTeams.length > 0 ? (
                    filteredTeams.map(team => (
                        <div
                            key={team.id}
                            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            onClick={() => handleTeamSelect(team.id)}
                        >
                            <div className="flex items-center">
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{team.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Leader: {team.leader || 'No leader'}</p>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                          d="M9 5l7 7-7 7"></path>
                                </svg>
                            </div>
                        </div>
                    ))
                ) : searchTerm ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No teams found matching "{searchTerm}"
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No teams available. Please create a team first.
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};
export default TeamSelectionModalContent