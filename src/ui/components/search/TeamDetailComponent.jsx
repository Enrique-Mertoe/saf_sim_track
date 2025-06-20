// Team Detail Component
import {LoadingSpinner, StatusBadge} from "./components";

import {Car, ExternalLink, MapPin, Package, TrendingUp, User, Users,} from 'lucide-react';
import {useEffect, useState} from "react";
import {loadTeamDetails, loadTeamStats} from "@/ui/components/search/helper";
import TeamController from "@/controllers/TeamController";


/**
 * @param {import('./TeamDetailComponentProps').TeamDetailComponentProps} props
 */
const TeamDetailComponent = ({
                                 teamId,
                                 compact = false,
                                 showOpenInTeamsButton = true,
                                 context = 'modal'
                             }) => {
    const [team, setTeam] = useState(null);
    const [stats, setStats] = useState(null);
    const [members, setMembers] = useState(null);
    const [loading, setLoading] = useState(true);
    const [batches, setBatches] = useState(null);
    const [activeTab, setActiveTab] = useState('batches');

    // Determine styles based on context and compact prop
    const isCompact = compact || context === 'sidepanel';
    const isSidepanel = context === 'sidepanel';

    const styles = {
        height: isCompact ? 'max-h-screen' : 'h-auto',
        spacing: isCompact ? 'space-y-4' : 'space-y-6',
        headerSize: isCompact ? 'text-lg' : 'text-xl',
        cardPadding: isCompact ? 'p-3' : 'p-4',
        gridGap: isCompact ? 'gap-3' : 'gap-4',
        tabHeight: isCompact ? 'h-80' : 'h-96',
        performancePadding: isCompact ? 'p-4' : 'p-6',
        avatarSize: isCompact ? 'w-12 h-12' : 'w-16 h-16',
        iconSize: isCompact ? 20 : 24,
        statTextSize: isCompact ? 'text-xl' : 'text-2xl',
        memberCardPadding: isCompact ? 'p-3' : 'p-4'
    };

    useEffect(() => {
        const loadData = async () => {
            const teamData = await loadTeamDetails(teamId);
            setTeam(teamData);
            setLoading(false);

            // Load additional data
            loadTeamStats(teamId).then(setStats);
            //@ts-ignore
            setMembers(teamData.members ?? [])
            TeamController.getTeamBatches(teamId, 1, 10).then(setBatches);
        };
        loadData().then();
    }, [teamId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <LoadingSpinner size={isCompact ? 24 : 32}/>
                    <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">Loading team details...</p>
                </div>
            </div>
        );
    }

    const tabs = [
        {
            id: 'batches',
            name: isCompact ? 'Batches' : 'Team Batches',
            icon: Package,
            count: batches?.total || 0
        },
        {
            id: 'members',
            name: isCompact ? 'Members' : 'Team Members',
            icon: Users,
            count: members?.length || 0
        }
    ];

    return (
        <div className={`${styles.spacing}`}>
            {/* Header */}
            <div className="flex items-start space-x-3">
                <div
                    className={`${styles.avatarSize} bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Users size={styles.iconSize} className="text-white"/>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`${styles.headerSize} font-semibold text-gray-900 dark:text-gray-100 truncate`}>
                        {team.name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
                        {team.region} • {team.territory}
                    </p>

                    {/* Leader info - more compact */}
                    {team.leader && (
                        <div className="mt-2">
                            <div className="font-medium text-blue-900 dark:text-blue-100 text-sm truncate">
                                {team.leader.full_name}
                            </div>
                            {!isCompact && (
                                <>
                                    <div className="text-xs text-blue-700 dark:text-blue-300 truncate">
                                        {team.leader.email}
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400">
                                        {team.leader.phone_number}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex items-center space-x-2 mt-2">
                        <StatusBadge
                            status={team.is_active ? "ACTIVE" : "INACTIVE"}
                            type={team.is_active ? 'success' : 'error'}
                        />
                        {!isCompact && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Created {new Date(team.created_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Team Information - Compact Grid */}
            <div className={`grid grid-cols-1 ${isSidepanel ? 'gap-2' : 'md:grid-cols-2'} ${styles.gridGap}`}>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                        <MapPin size={14} className="text-gray-500 dark:text-gray-400"/>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Location</span>
                    </div>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Region:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{team.region}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Territory:</span>
                            <span
                                className="font-medium text-gray-900 dark:text-gray-100">{team.territory || 'N/A'}</span>
                        </div>
                        {team.van_location && (
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Van Location:</span>
                                <span
                                    className="font-medium text-gray-900 dark:text-gray-100 truncate">{team.van_location}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                        <Car size={14} className="text-gray-500 dark:text-gray-400"/>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Vehicle</span>
                    </div>
                    <div className="text-xs">
                        {team.van_number_plate ? (
                            <div className="flex justify-between">
                                <span className="text-gray-500 dark:text-gray-400">Van Plate:</span>
                                <span
                                    className="font-medium font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded border text-gray-900 dark:text-gray-100">
                                    {team.van_number_plate}
                                </span>
                            </div>
                        ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic">No vehicle assigned</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Enhanced Performance Stats - More Compact */}
            {stats ? (
                <div
                    className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-4">
                    <h4 className={`${isCompact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-gray-100 mb-3`}>
                        Performance Overview
                    </h4>
                    <div className={`grid ${isSidepanel ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-5'} gap-3`}>
                        <div className="text-center">
                            <div className={`${styles.statTextSize} font-bold text-blue-600 dark:text-blue-400`}>
                                {stats.sim_cards.total.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total SIMs</div>
                        </div>
                        <div className="text-center">
                            <div className={`${styles.statTextSize} font-bold text-green-600 dark:text-green-400`}>
                                {stats.rates.match_rate}%
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Match Rate</div>
                        </div>
                        {!isSidepanel && (
                            <>
                                <div className="text-center">
                                    <div
                                        className={`${styles.statTextSize} font-bold text-purple-600 dark:text-purple-400`}>
                                        {stats.rates.quality_rate}%
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Quality Rate</div>
                                </div>
                                <div className="text-center">
                                    <div className={`${styles.statTextSize} font-bold text-red-600 dark:text-red-400`}>
                                        {stats.sim_cards.non_quality || 0}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Non-Quality</div>
                                </div>
                                <div className="text-center">
                                    <div
                                        className={`${styles.statTextSize} font-bold text-orange-600 dark:text-orange-400`}>
                                        {stats.members.active}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Active Members</div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Additional stats for sidepanel - in a second row */}
                    {isSidepanel && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                            <div className="text-center">
                                <div
                                    className={`${styles.statTextSize} font-bold text-purple-600 dark:text-purple-400`}>
                                    {stats.rates.quality_rate}%
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Quality</div>
                            </div>
                            <div className="text-center">
                                <div className={`${styles.statTextSize} font-bold text-red-600 dark:text-red-400`}>
                                    {stats.sim_cards.non_quality || 0}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Non-Quality</div>
                            </div>
                            <div className="text-center">
                                <div
                                    className={`${styles.statTextSize} font-bold text-orange-600 dark:text-orange-400`}>
                                    {stats.members.active}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Members</div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <LoadingSpinner size={isCompact ? 20 : 24}/>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Loading performance data...</p>
                </div>
            )}

            {/* Tabbed Section - More Compact */}
            <div
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Sticky Tab Navigation */}
                <div
                    className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <nav className={`flex ${isSidepanel ? 'space-x-4' : 'space-x-8'} px-4 py-3`} aria-label="Tabs">
                        {tabs.map((tab) => {
                            const IconComponent = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                                        ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                    }
                                    `}
                                >
                                    <IconComponent size={14}/>
                                    <span className={isCompact ? 'text-xs' : 'text-sm'}>{tab.name}</span>
                                    <span className={`
                                        ml-1 py-0.5 px-1.5 text-xs font-medium rounded-full
                                        ${activeTab === tab.id
                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    }
                                    `}>
                                        {tab.count}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content with Fixed Height and Scroll */}
                <div className={styles.tabHeight}>
                    {/* Team Batches Tab */}
                    {activeTab === 'batches' && (
                        <div className="h-full overflow-y-auto">
                            {batches ? (
                                <div className="p-4">
                                    {batches.items.length > 0 ? (
                                        <div className="space-y-2">
                                            {batches.items.map(batch => (
                                                <div key={batch.id}
                                                     className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                        <div
                                                            className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Package size={16}
                                                                     className="text-orange-600 dark:text-orange-400"/>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div
                                                                className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                                                {batch.batch_id}
                                                            </div>
                                                            <div
                                                                className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {batch.company_name}
                                                            </div>
                                                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                {isCompact
                                                                    ? `${batch.quantity?.toLocaleString() || 'N/A'} • ${batch.sim_count?.[0]?.count || 0} SIMs`
                                                                    : `Quantity: ${batch.quantity?.toLocaleString() || 'N/A'} • SIMs: ${batch.sim_count?.[0]?.count || 0}`
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <div
                                                            className="text-xs text-gray-500 dark:text-gray-400">Created
                                                        </div>
                                                        <div
                                                            className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                                            {new Date(batch.date_created || batch.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {batches.total > 10 && (
                                                <div className="text-center pt-3">
                                                    <button
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium">
                                                        View all {batches.total} batches
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                            <Package size={isCompact ? 32 : 48}
                                                     className="mb-2 text-gray-300 dark:text-gray-600"/>
                                            <p className="text-sm font-medium">No batches assigned</p>
                                            <p className="text-xs">This team has no batches assigned yet</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <LoadingSpinner size={isCompact ? 24 : 32}/>
                                        <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">Loading team
                                            batches...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Team Members Tab */}
                    {activeTab === 'members' && (
                        <div className="h-full overflow-y-auto">
                            {members ? (
                                <div className="p-4">
                                    {members.length > 0 ? (
                                        <div
                                            className={`grid grid-cols-1 ${isSidepanel ? 'gap-2' : 'md:grid-cols-2 gap-3'}`}>
                                            {members.map(member => (
                                                <div key={member.id}
                                                     className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                        <div
                                                            className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <User size={16}
                                                                  className="text-blue-600 dark:text-blue-400"/>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div
                                                                className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                                                                {member.full_name}
                                                            </div>
                                                            <div
                                                                className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                {member.role.replace('_', ' ')}
                                                            </div>
                                                            {!isCompact && (
                                                                <div
                                                                    className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                                                    {member.email}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                                        <StatusBadge
                                                            status={member.is_active ? "ACTIVE" : "INACTIVE"}
                                                            type={member.is_active ? 'success' : 'error'}
                                                        />
                                                        <ExternalLink size={14}
                                                                      className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"/>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div
                                            className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                            <Users size={isCompact ? 32 : 48}
                                                   className="mb-2 text-gray-300 dark:text-gray-600"/>
                                            <p className="text-sm font-medium">No team members</p>
                                            <p className="text-xs">This team has no members assigned yet</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <LoadingSpinner size={isCompact ? 24 : 32}/>
                                        <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">Loading team
                                            members...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {
                !isCompact && (
                    <>
                        {/* Actions - Conditional rendering */}
                        <div className="flex space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                                <TrendingUp size={14}/>
                                <span>View Performance</span>
                            </button>
                            {showOpenInTeamsButton && (
                                <button
                                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                                    <ExternalLink size={14}/>
                                    <span>Open in Teams</span>
                                </button>
                            )}
                        </div>
                    </>
                )
            }
        </div>
    );
};

export default TeamDetailComponent;