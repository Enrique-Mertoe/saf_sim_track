// import React, {createContext, useContext, useState, useEffect} from 'react';
// import {createSupabaseClient} from "@/lib/supabase/client";
// // import {supabase} from '../lib/supabaseClient'; // Adjust path as needed
// const supabase = createSupabaseClient()
// // Create the context
// const TeamContext = createContext();
//
// // Create a provider component
// export function TeamProvider({children}) {
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [teamData, setTeamData] = useState(null);
//     const [teamMembers, setTeamMembers] = useState([]);
//     const [teamMetrics, setTeamMetrics] = useState({
//         totalSims: 0,
//         matchedSims: 0,
//         qualitySims: 0,
//         matchRate: 0,
//         qualityRate: 0,
//         performanceStatus: ''
//     });
//     const [dateRange, setDateRange] = useState({
//         startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
//         endDate: new Date(),
//         range: 'month' // 'week', 'month', 'quarter'
//     });
//
//     // Fetch team data for the logged-in team leader
//     const fetchTeamData = async () => {
//         try {
//             setLoading(true);
//             setError(null);
//
//             // Get current user
//             const {data: {user}} = await supabase.auth.getUser();
//
//             if (!user) {
//                 throw new Error('User not authenticated');
//             }
//
//             // Get team for this team leader
//             const {data: teamData, error: teamError} = await supabase
//                 .from('teams')
//                 .select('*')
//                 .eq('team_leader_id', user.id)
//                 .single();
//
//             if (teamError) throw teamError;
//
//             setTeamData(teamData);
//
//             // Now fetch team members
//             await fetchTeamMembers(teamData.team_id);
//
//             // And team metrics
//             await fetchTeamMetrics(teamData.team_id);
//
//         } catch (error) {
//             console.error('Error in fetchTeamData:', error);
//             setError(error.message);
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     // Fetch team members
//     const fetchTeamMembers = async (teamId) => {
//         try {
//             const {data, error} = await supabase
//                 .from('users')
//                 .select('*')
//                 .eq('team_id', teamId)
//                 .eq('status', 'ACTIVE');
//
//             if (error) throw error;
//
//             setTeamMembers(data || []);
//         } catch (error) {
//             console.error('Error fetching team members:', error);
//             setError(error.message);
//         }
//     };
//
//     // Fetch team metrics
//     const fetchTeamMetrics = async (teamId) => {
//         try {
//             // Get total SIMs
//             const {count: totalCount, error: totalError} = await supabase
//                 .from('sim_cards')
//                 .select('sim_id', {count: 'exact'})
//                 .eq('recorded_by_team', teamId);
//
//             if (totalError) throw totalError;
//
//             // Get matched SIMs
//             const {count: matchedCount, error: matchedError} = await supabase
//                 .from('sim_cards')
//                 .select('sim_id', {count: 'exact'})
//                 .eq('recorded_by_team', teamId)
//                 .eq('match_status', 'MATCHED');
//
//             if (matchedError) throw matchedError;
//
//             // Get quality SIMs
//             const {count: qualityCount, error: qualityError} = await supabase
//                 .from('sim_cards')
//                 .select('sim_id', {count: 'exact'})
//                 .eq('recorded_by_team', teamId)
//                 .eq('quality_status', 'QUALITY');
//
//             if (qualityError) throw qualityError;
//
//             // Calculate rates
//             const matchRate = totalCount > 0 ? (matchedCount / totalCount) * 100 : 0;
//             const qualityRate = matchedCount > 0 ? (qualityCount / matchedCount) * 100 : 0;
//
//             // Determine performance status
//             let performanceStatus = '';
//             if (qualityRate >= 95) {
//                 performanceStatus = 'Well done';
//             } else if (qualityRate >= 90) {
//                 performanceStatus = 'Improve';
//             } else {
//                 performanceStatus = 'Needs immediate attention';
//             }
//
//             setTeamMetrics({
//                 totalSims: totalCount || 0,
//                 matchedSims: matchedCount || 0,
//                 qualitySims: qualityCount || 0,
//                 matchRate: matchRate.toFixed(2),
//                 qualityRate: qualityRate.toFixed(2),
//                 performanceStatus
//             });
//
//         } catch (error) {
//             console.error('Error fetching team metrics:', error);
//             setError(error.message);
//         }
//     };
//
//     // Update date range
//     const updateDateRange = (range) => {
//         const endDate = new Date();
//         let startDate = new Date();
//
//         switch (range) {
//             case 'week':
//                 startDate.setDate(endDate.getDate() - 7);
//                 break;
//             case 'month':
//                 startDate.setDate(endDate.getDate() - 30);
//                 break;
//             case 'quarter':
//                 startDate.setDate(endDate.getDate() - 90);
//                 break;
//             default:
//                 startDate.setDate(endDate.getDate() - 30);
//         }
//
//         setDateRange({
//             startDate,
//             endDate,
//             range
//         });
//     };
//
//     // Fetch daily performance data for a specified date range
//     const fetchDailyPerformance = async () => {
//         if (!teamData?.team_id) return [];
//
//         try {
//             const {data, error} = await supabase
//                 .rpc('get_daily_team_performance', {
//                     team_id_param: teamData.team_id,
//                     start_date_param: dateRange.startDate.toISOString().split('T')[0],
//                     end_date_param: dateRange.endDate.toISOString().split('T')[0]
//                 });
//
//             if (error) throw error;
//
//             return data.map(item => ({
//                 day: new Date(item.date).toLocaleDateString('en-US', {
//                     weekday: 'short',
//                     month: 'short',
//                     day: 'numeric'
//                 }),
//                 sales: item.total_sims,
//                 quality: item.quality_sims,
//                 target: item.target || 50
//             }));
//         } catch (error) {
//             console.error('Error fetching daily performance:', error);
//             setError(error.message);
//             return [];
//         }
//     };
//
//     // Fetch staff performance data
//     const fetchStaffPerformance = async () => {
//         if (!teamData?.team_id) return [];
//
//         try {
//             // Get top performers
//             const {data: topPerformers, error} = await supabase
//                 .rpc('get_top_team_performers', {
//                     team_id_param: teamData.team_id
//                 });
//
//             if (error) throw error;
//
//             // Transform for radar chart
//             const radarData = [
//                 {subject: 'Total Sales', fullMark: 150},
//                 {subject: 'Match Rate', fullMark: 100},
//                 {subject: 'Quality Rate', fullMark: 100},
//                 {subject: 'Daily Avg', fullMark: 50},
//                 {subject: 'Consistency', fullMark: 100}
//             ];
//
//             // Add staff data to radar
//             topPerformers.forEach((staff, index) => {
//                 const key = String.fromCharCode(65 + index); // A, B, C, ...
//
//                 radarData[0][key] = Math.min(staff.total_sims, 150);
//                 radarData[1][key] = parseFloat(staff.match_rate) || 0;
//                 radarData[2][key] = parseFloat(staff.quality_rate) || 0;
//                 radarData[3][key] = Math.min(staff.total_sims / 30, 50); // Rough daily average
//                 radarData[4][key] = Math.random() * 20 + 80; // Random consistency score for demo
//
//                 // Add name mapping for legend
//                 radarData[0][`${key}_name`] = staff.full_name;
//             });
//
//             return radarData;
//         } catch (error) {
//             console.error('Error fetching staff performance:', error);
//             setError(error.message);
//             return [];
//         }
//     };
//
//     // Fetch SIM status distribution
//     const fetchSimStatusDistribution = async () => {
//         if (!teamData?.team_id) return [];
//
//         try {
//             const {data: metrics, error} = await supabase
//                 .rpc('get_team_topup_distribution', {
//                     team_id_param: teamData.team_id
//                 });
//
//             if (error) throw error;
//
//             // Transform data for pie chart
//             const colorMap = {
//                 'Top-up ≥50 KES': '#4ade80',
//                 'Top-up <50 KES': '#facc15',
//                 'No Top-up': '#f87171',
//                 'Fraud Flagged': '#ef4444'
//             };
//
//             return metrics.map(item => ({
//                 name: item.category,
//                 value: item.count,
//                 color: colorMap[item.category] || '#a3a3a3'
//             }));
//         } catch (error) {
//             console.error('Error fetching SIM status distribution:', error);
//             setError(error.message);
//             return [];
//         }
//     };
//
//     // Initial data load
//     useEffect(() => {
//         fetchTeamData();
//     }, []);
//
//     // Provide values
//     const value = {
//         loading,
//         error,
//         teamData,
//         teamMembers,
//         teamMetrics,
//         dateRange,
//         updateDateRange,
//         fetchTeamData,
//         fetchTeamMembers,
//         fetchTeamMetrics,
//         fetchDailyPerformance,
//         fetchStaffPerformance,
//         fetchSimStatusDistribution
//     };
//
//     return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
// }
//
// // Custom hook for using the context
// export function useTeam() {
//     const context = useContext(TeamContext);
//     if (context === undefined) {
//         throw new Error('useTeam must be used within a TeamProvider');
//     }
//     return context;
// }