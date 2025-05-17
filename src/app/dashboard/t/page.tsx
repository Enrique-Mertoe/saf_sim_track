// "use client"
// import React, {useState, useEffect} from 'react';
// // import { supabase } from '../lib/supabaseClient'; // Assuming you have this set up
// import {
//     ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
//     CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, RadarChart,
//     PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
// } from 'recharts';
// import {Calendar, Clock, Users, Check, AlertTriangle, BarChart2, List, Clipboard} from 'lucide-react';
// import {createSupabaseClient} from "@/lib/supabase/client";
// import useApp from "@/ui/provider/AppProvider";
// import {SIMStatus, Team as Team1, User} from "@/models";
// import {teamService} from "@/services";
//
// type Team = Team1 & {
//     leader: User
// }
// const supabase = createSupabaseClient()
// // Team Leader Dashboard Component
// export default function TeamLeaderDashboard() {
//     // State management
//     const {user} = useApp()
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);
//     const [teamData, setTeamData] = useState({
//         teamName: '',
//         teamId: '',
//         totalMembers: 0,
//     });
//     const [dashboardMetrics, setDashboardMetrics] = useState({
//         totalSims: 0,
//         matchedSims: 0,
//         qualitySims: 0,
//         matchRate: 0,
//         qualityRate: 0,
//         performanceStatus: ''
//     });
//     const [dailyPerformanceData, setDailyPerformanceData] = useState([]);
//     const [staffPerformanceData, setStaffPerformanceData] = useState([]);
//     const [qualityDistribution, setQualityDistribution] = useState([]);
//     const [simStatusData, setSimStatusData] = useState([]);
//     const [selectedDateRange, setSelectedDateRange] = useState('week');
//
//     // Fetch team data
//     const fetchTeamData = async () => {
//         if (!user) return;
//         try {
//             setLoading(true);
//             // Get team info
//             const {data: teamInfo, error: teamError} = await teamService.getTeamById(user.team_id)
//
//             if (teamError) throw teamError;
//
//             // Get team members count
//             const {count: memberCount, error: countError} = await supabase
//                 .from('users')
//                 .select('id', {count: 'exact'})
//                 .eq('team_id', teamInfo.id);
//
//             if (countError) throw countError;
//
//             setTeamData({
//                 teamName: teamInfo.team_name,
//                 teamId: teamInfo.team_id,
//                 totalMembers: memberCount || 0
//             });
//
//             // Now that we have team ID, fetch the rest of the data
//             await fetchDashboardMetrics(teamInfo.team_id);
//             await fetchPerformanceData(teamInfo.team_id);
//             await fetchStaffData(teamInfo.team_id);
//
//         } catch (error) {
//             console.error('Error fetching team data:', error);
//             setError('Failed to load team data. Please try again later.');
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     // Fetch dashboard metrics
//     const fetchDashboardMetrics = async (teamId) => {
//         try {
//             // Get total SIMs recorded by team
//             const {count: totalCount, error: totalError} = await supabase
//                 .from('sim_cards')
//                 .select('id', {count: 'exact'})
//                 .eq('team_id', teamId);
//
//             if (totalError) throw totalError;
//
//             // Get matched SIMs count
//             const {count: matchedCount, error: matchedError} = await supabase
//                 .from('sim_cards')
//                 .select('id', {count: 'exact'})
//                 .eq('team_id', teamId)
//                 .eq('match', SIMStatus.MATCH);
//
//             if (matchedError) throw matchedError;
//
//             // Get quality SIMs count
//             const {count: qualityCount, error: qualityError} = await supabase
//                 .from('sim_cards')
//                 .select('id', {count: 'exact'})
//                 .eq('team_id', teamId)
//                 .eq('quality', SIMStatus.QUALITY);
//
//             if (qualityError) throw qualityError;
//
//             // Calculate metrics
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
//             setDashboardMetrics({
//                 totalSims: totalCount,
//                 matchedSims: matchedCount,
//                 qualitySims: qualityCount,
//                 matchRate: matchRate.toFixed(2),
//                 qualityRate: qualityRate.toFixed(2),
//                 performanceStatus
//             });
//
//             // Set up SIM status data for pie chart
//             setSimStatusData([
//                 {name: 'Matched Quality', value: qualityCount, color: '#4ade80'},
//                 {name: 'Matched Non-Quality', value: matchedCount - qualityCount, color: '#facc15'},
//                 {name: 'Unmatched', value: totalCount - matchedCount, color: '#f87171'}
//             ]);
//
//         } catch (error) {
//             console.error('Error fetching dashboard metrics:', error);
//         }
//     };
//
//     // Fetch daily performance data
//     const fetchPerformanceData = async (teamId) => {
//         try {
//             // Get date range
//             const endDate = new Date();
//             let startDate = new Date();
//
//             switch (selectedDateRange) {
//                 case 'week':
//                     startDate.setDate(endDate.getDate() - 7);
//                     break;
//                 case 'month':
//                     startDate.setDate(endDate.getDate() - 30);
//                     break;
//                 case 'quarter':
//                     startDate.setDate(endDate.getDate() - 90);
//                     break;
//                 default:
//                     startDate.setDate(endDate.getDate() - 7);
//             }
//
//             const {data, error} = await supabase
//                 .rpc('get_daily_team_performance', {
//                     team_id_param: teamId,
//                     start_date_param: startDate.toISOString().split('T')[0],
//                     end_date_param: endDate.toISOString().split('T')[0]
//                 });
//
//             if (error) throw error;
//
//             // Transform data for chart
//             const chartData = data.map(item => ({
//                 day: new Date(item.date).toLocaleDateString('en-US', {
//                     weekday: 'short',
//                     month: 'short',
//                     day: 'numeric'
//                 }),
//                 sales: item.total_sims,
//                 quality: item.quality_sims,
//                 target: item.target || 50 // Assuming a default target if not set
//             }));
//
//             setDailyPerformanceData(chartData);
//
//             // Quality distribution over time (for pie chart)
//             let qualityBreakdown = [
//                 {name: 'Top-up ≥50 KES', value: 0, color: '#4ade80'},
//                 {name: 'Top-up <50 KES', value: 0, color: '#facc15'},
//                 {name: 'No Top-up', value: 0, color: '#f87171'},
//                 {name: 'Fraud Flagged', value: 0, color: '#ef4444'}
//             ];
//
//             // This would ideally come from a stored procedure or complex query
//             // For demo purposes, we'll generate some sample data
//             const {data: simData, error: simError} = await supabase
//                 .from('sim_cards')
//                 .select('top_up_amount, fraud_flagged')
//                 .eq('recorded_by_team', teamId)
//                 .eq('match_status', 'MATCHED');
//
//             if (simError) throw simError;
//
//             if (simData) {
//                 simData.forEach(sim => {
//                     if (sim.fraud_flagged) {
//                         qualityBreakdown[3].value++;
//                     } else if (!sim.top_up_amount) {
//                         qualityBreakdown[2].value++;
//                     } else if (sim.top_up_amount >= 50) {
//                         qualityBreakdown[0].value++;
//                     } else {
//                         qualityBreakdown[1].value++;
//                     }
//                 });
//             }
//
//             setQualityDistribution(qualityBreakdown);
//
//         } catch (error) {
//             console.error('Error fetching performance data:', error);
//         }
//     };
//
//     // Fetch staff performance data
//     const fetchStaffData = async (teamId) => {
//         try {
//             const {data: teamMembers, error: memberError} = await supabase
//                 .from('users')
//                 .select('user_id, full_name')
//                 .eq('team_id', teamId);
//
//             if (memberError) throw memberError;
//
//             // For each team member, get their metrics
//             const staffMetrics = [];
//
//             for (const member of teamMembers) {
//                 const {data: memberData, error: dataError} = await supabase
//                     .rpc('get_staff_performance_metrics', {
//                         user_id_param: member.user_id
//                     });
//
//                 if (dataError) throw dataError;
//
//                 if (memberData && memberData.length > 0) {
//                     staffMetrics.push({
//                         name: member.full_name,
//                         totalSims: memberData[0].total_sims || 0,
//                         matchedSims: memberData[0].matched_sims || 0,
//                         qualitySims: memberData[0].quality_sims || 0,
//                         matchRate: memberData[0].match_rate || 0,
//                         qualityRate: memberData[0].quality_rate || 0
//                     });
//                 }
//             }
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
//             // Add staff data to radar data
//             staffMetrics.forEach((staff, index) => {
//                 // Map staff metrics to letters A, B, C, etc. for radar chart
//                 const key = String.fromCharCode(65 + index); // A, B, C, ...
//
//                 radarData[0][key] = Math.min(staff.totalSims, 150);
//                 radarData[1][key] = staff.matchRate;
//                 radarData[2][key] = staff.qualityRate;
//                 radarData[3][key] = Math.min(staff.totalSims / 30, 50); // Rough daily average
//                 radarData[4][key] = Math.random() * 20 + 80; // Random consistency score for demo
//
//                 // Add name mapping for legend
//                 radarData[0][`${key}_name`] = staff.name;
//             });
//
//             setStaffPerformanceData(radarData);
//
//         } catch (error) {
//             console.error('Error fetching staff data:', error);
//         }
//     };
//
//     // Handle date range change
//     const handleDateRangeChange = (range) => {
//         setSelectedDateRange(range);
//     };
//
//     // Initial data fetch
//     useEffect(() => {
//         fetchTeamData().then();
//     }, [user]);
//
//     // Refetch performance data when date range changes
//     useEffect(() => {
//         if (teamData.teamId) {
//             fetchPerformanceData(teamData.teamId);
//         }
//     }, [selectedDateRange, teamData.teamId]);
//
//     // Loading and error states
//     if (loading) {
//         return (
//             <div className="flex justify-center items-center h-screen">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
//             </div>
//         );
//     }
//
//     if (error) {
//         return (
//             <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md m-4">
//                 <p className="text-red-800 dark:text-red-200">{error}</p>
//             </div>
//         );
//     }
//
//     // Dashboard UI
//     return (
//         <div className="p-6">
//             {/* Header */}
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
//                 <div>
//                     <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
//                         {teamData.teamName} Dashboard
//                     </h1>
//                     <p className="text-gray-600 dark:text-gray-400">
//                         Team Performance Overview
//                     </p>
//                 </div>
//
//                 <div className="mt-4 sm:mt-0">
//                     <div className="inline-flex rounded-md shadow-sm" role="group">
//                         <button
//                             type="button"
//                             onClick={() => handleDateRangeChange('week')}
//                             className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
//                                 selectedDateRange === 'week'
//                                     ? 'bg-indigo-600 text-white'
//                                     : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white'
//                             } border border-gray-200 dark:border-gray-600`}
//                         >
//                             Week
//                         </button>
//                         <button
//                             type="button"
//                             onClick={() => handleDateRangeChange('month')}
//                             className={`px-4 py-2 text-sm font-medium ${
//                                 selectedDateRange === 'month'
//                                     ? 'bg-indigo-600 text-white'
//                                     : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white'
//                             } border-t border-b border-gray-200 dark:border-gray-600`}
//                         >
//                             Month
//                         </button>
//                         <button
//                             type="button"
//                             onClick={() => handleDateRangeChange('quarter')}
//                             className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
//                                 selectedDateRange === 'quarter'
//                                     ? 'bg-indigo-600 text-white'
//                                     : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white'
//                             } border border-gray-200 dark:border-gray-600`}
//                         >
//                             Quarter
//                         </button>
//                     </div>
//                 </div>
//             </div>
//
//             {/* Metrics Cards */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
//                     <div className="flex justify-between items-center">
//                         <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total SIM Cards</h3>
//                         <span className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
//               <Clipboard className="h-5 w-5 text-blue-500 dark:text-blue-300"/>
//             </span>
//                     </div>
//                     <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{dashboardMetrics.totalSims}</p>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Recorded by your team</p>
//                 </div>
//
//                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
//                     <div className="flex justify-between items-center">
//                         <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Match Rate</h3>
//                         <span className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
//               <Check className="h-5 w-5 text-green-500 dark:text-green-300"/>
//             </span>
//                     </div>
//                     <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{dashboardMetrics.matchRate}%</p>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
//                         {dashboardMetrics.matchedSims} of {dashboardMetrics.totalSims} SIMs matched
//                     </p>
//                 </div>
//
//                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
//                     <div className="flex justify-between items-center">
//                         <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Quality Rate</h3>
//                         <span className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
//               <BarChart2 className="h-5 w-5 text-purple-500 dark:text-purple-300"/>
//             </span>
//                     </div>
//                     <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{dashboardMetrics.qualityRate}%</p>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
//                         {dashboardMetrics.qualitySims} quality SIMs
//                     </p>
//                 </div>
//
//                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
//                     <div className="flex justify-between items-center">
//                         <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Performance Status</h3>
//                         <span className={`p-2 rounded-full ${
//                             dashboardMetrics.performanceStatus === 'Well done'
//                                 ? 'bg-green-100 dark:bg-green-900'
//                                 : dashboardMetrics.performanceStatus === 'Improve'
//                                     ? 'bg-yellow-100 dark:bg-yellow-900'
//                                     : 'bg-red-100 dark:bg-red-900'
//                         }`}>
//               {dashboardMetrics.performanceStatus === 'Well done' ? (
//                   <Check className="h-5 w-5 text-green-500 dark:text-green-300"/>
//               ) : (
//                   <AlertTriangle className={`h-5 w-5 ${
//                       dashboardMetrics.performanceStatus === 'Improve'
//                           ? 'text-yellow-500 dark:text-yellow-300'
//                           : 'text-red-500 dark:text-red-300'
//                   }`}/>
//               )}
//             </span>
//                     </div>
//                     <p className={`text-2xl font-bold mt-2 ${
//                         dashboardMetrics.performanceStatus === 'Well done'
//                             ? 'text-green-500 dark:text-green-300'
//                             : dashboardMetrics.performanceStatus === 'Improve'
//                                 ? 'text-yellow-500 dark:text-yellow-300'
//                                 : 'text-red-500 dark:text-red-300'
//                     }`}>
//                         {dashboardMetrics.performanceStatus}
//                     </p>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
//                         Team overall rating
//                     </p>
//                 </div>
//             </div>
//
//             {/* Daily Performance & Staff Performance Charts (from template) */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//                 {/* Daily Performance Chart */}
//                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
//                     <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Daily Performance</h2>
//                     <div className="h-72">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <BarChart
//                                 data={dailyPerformanceData}
//                                 margin={{top: 5, right: 30, left: 20, bottom: 5}}
//                             >
//                                 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.8}/>
//                                 <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false}/>
//                                 <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false}/>
//                                 <Tooltip
//                                     contentStyle={{
//                                         backgroundColor: 'var(--tooltip-bg, white)',
//                                         borderColor: 'var(--tooltip-border, #e5e7eb)',
//                                         color: 'var(--tooltip-text, #111827)'
//                                     }}
//                                 />
//                                 <Legend/>
//                                 <Bar dataKey="sales" name="Total Sales" fill="#6366f1" radius={[4, 4, 0, 0]}/>
//                                 <Bar dataKey="quality" name="Quality Sales" fill="#4ade80" radius={[4, 4, 0, 0]}/>
//                                 <Line type="monotone" dataKey="target" name="Target" stroke="#f59e0b" strokeWidth={2}
//                                       dot={{r: 4}}/>
//                             </BarChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>
//
//                 {/* Staff Performance Chart */}
//                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
//                     <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Staff Performance
//                         Comparison</h2>
//                     <div className="h-72">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <RadarChart outerRadius={90} data={staffPerformanceData}>
//                                 <PolarGrid stroke="#e5e7eb" strokeOpacity={0.8}/>
//                                 <PolarAngleAxis dataKey="subject" stroke="#6b7280" fontSize={12}/>
//                                 <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#6b7280" fontSize={12}/>
//                                 <Radar name={staffPerformanceData[0]?.A_name || "Staff 1"} dataKey="A" stroke="#8884d8"
//                                        fill="#8884d8" fillOpacity={0.5}/>
//                                 <Radar name={staffPerformanceData[0]?.B_name || "Staff 2"} dataKey="B" stroke="#82ca9d"
//                                        fill="#82ca9d" fillOpacity={0.5}/>
//                                 <Radar name={staffPerformanceData[0]?.C_name || "Staff 3"} dataKey="C" stroke="#ffc658"
//                                        fill="#ffc658" fillOpacity={0.5}/>
//                                 <Radar name={staffPerformanceData[0]?.D_name || "Staff 4"} dataKey="D" stroke="#ff8042"
//                                        fill="#ff8042" fillOpacity={0.5}/>
//                                 <Radar name={staffPerformanceData[0]?.E_name || "Staff 5"} dataKey="E" stroke="#0088fe"
//                                        fill="#0088fe" fillOpacity={0.5}/>
//                                 <Legend/>
//                                 <Tooltip
//                                     contentStyle={{
//                                         backgroundColor: 'var(--tooltip-bg, white)',
//                                         borderColor: 'var(--tooltip-border, #e5e7eb)',
//                                         color: 'var(--tooltip-text, #111827)'
//                                     }}
//                                 />
//                             </RadarChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>
//             </div>
//
//             {/* Additional metrics */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//                 {/* SIM Status Distribution */}
//                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
//                     <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">SIM Status
//                         Distribution</h2>
//                     <div className="h-72 flex justify-center items-center">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <PieChart>
//                                 <Pie
//                                     data={simStatusData}
//                                     cx="50%"
//                                     cy="50%"
//                                     labelLine={true}
//                                     outerRadius={80}
//                                     fill="#8884d8"
//                                     dataKey="value"
//                                     label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                                 >
//                                     {simStatusData.map((entry, index) => (
//                                         <Cell key={`cell-${index}`} fill={entry.color}/>
//                                     ))}
//                                 </Pie>
//                                 <Tooltip
//                                     formatter={(value, name) => [`${value} SIMs`, name]}
//                                     contentStyle={{
//                                         backgroundColor: 'var(--tooltip-bg, white)',
//                                         borderColor: 'var(--tooltip-border, #e5e7eb)',
//                                         color: 'var(--tooltip-text, #111827)'
//                                     }}
//                                 />
//                                 <Legend/>
//                             </PieChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>
//
//                 {/* Quality Distribution */}
//                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
//                     <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quality Distribution</h2>
//                     <div className="h-72 flex justify-center items-center">
//                         <ResponsiveContainer width="100%" height="100%">
//                             <PieChart>
//                                 <Pie
//                                     data={qualityDistribution}
//                                     cx="50%"
//                                     cy="50%"
//                                     labelLine={true}
//                                     outerRadius={80}
//                                     fill="#8884d8"
//                                     dataKey="value"
//                                     label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                                 >
//                                     {qualityDistribution.map((entry, index) => (
//                                         <Cell key={`cell-${index}`} fill={entry.color}/>
//                                     ))}
//                                 </Pie>
//                                 <Tooltip
//                                     formatter={(value, name) => [`${value} SIMs`, name]}
//                                     contentStyle={{
//                                         backgroundColor: 'var(--tooltip-bg, white)',
//                                         borderColor: 'var(--tooltip-border, #e5e7eb)',
//                                         color: 'var(--tooltip-text, #111827)'
//                                     }}
//                                 />
//                                 <Legend/>
//                             </PieChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>
//             </div>
//
//             {/* Recent Activity & Quick Actions */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Recent Activity */}
//                 <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
//                     <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
//                     <div className="space-y-4">
//                         {[1, 2, 3, 4, 5].map((_, index) => (
//                             <div key={index}
//                                  className="flex items-start space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
//                                 <div className={`p-2 rounded-full ${
//                                     index % 3 === 0 ? 'bg-green-100 dark:bg-green-900' :
//                                         index % 3 === 1 ? 'bg-blue-100 dark:bg-blue-900' :
//                                             'bg-purple-100 dark:bg-purple-900'
//                                 }`}>
//                                     {index % 3 === 0 ? (
//                                         <Check className={`h-5 w-5 text-green-500 dark:text-green-300`}/>
//                                     ) : index % 3 === 1 ? (
//                                         <Users className={`h-5 w-5 text-blue-500 dark:text-blue-300`}/>
//                                     ) : (
//                                         <List className={`h-5 w-5 text-purple-500 dark:text-purple-300`}/>
//                                     )}
//                                 </div>
//                                 <div className="flex-1">
//                                     <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
//                                         {index % 3 === 0 ? 'New SIM cards recorded' :
//                                             index % 3 === 1 ? 'Staff performance updated' :
//                                                 'Quality report generated'}
//                                     </p>
//                                     <p className="text-xs text-gray-500 dark:text-gray-400">
//                                         {index % 2 === 0 ? 'John Doe' : 'Jane Smith'} • {index} hour{index !== 1 ? 's' : ''} ago
//                                     </p>
//                                     <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
//                                         {index % 3 === 0 ? `${10 + index * 5} new SIM cards were recorded by your team.` :
//                                             index % 3 === 1 ? `Performance metrics were updated for your team members.` :
//                                                 `Weekly quality report was generated for your review.`}
//                                     </p>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                     <button
//                         className="mt-4 w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-center transition-colors">
//                         View all activity
//                     </button>
//                 </div>
//
//                 {/* Quick Actions */}
//                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-900">
//                     <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
//                     <div className="space-y-3">
//                         <button
//                             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors">
//                             <Clipboard className="h-5 w-5"/>
//                             <span>Record New SIM Cards</span>
//                         </button>
//
//                         <button
//                             className="w-full bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 py-2 px-4 rounded-md flex items-center justify-center space-x-2 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors">
//                             <Users className="h-5 w-5"/>
//                             <span>Manage Team Members</span>
//                         </button>
//
//                         <button
//                             className="w-full bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 py-2 px-4 rounded-md flex items-center justify-center space-x-2 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors">
//                             <BarChart2 className="h-5 w-5"/>
//                             <span>Generate Reports</span>
//                         </button>
//
//                         <button
//                             className="w-full bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 py-2 px-4 rounded-md flex items-center justify-center space-x-2 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-colors">
//                             <Calendar className="h-5 w-5"/>
//                             <span>View Sales Calendar</span>
//                         </button>
//                     </div>
//
//                     <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
//                         <div className="flex justify-between items-center mb-2">
//                             <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Status</h3>
//                             <span
//                                 className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full">Online</span>
//                         </div>
//                         <div className="flex items-center space-x-2">
//                             <div className="flex flex-wrap gap-1">
//                                 {Array(Math.min(teamData.totalMembers, 5)).fill(0).map((_, idx) => (
//                                     <div key={idx}
//                                          className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-medium text-indigo-700 dark:text-indigo-300">
//                                         {idx + 1}
//                                     </div>
//                                 ))}
//                                 {teamData.totalMembers > 5 && (
//                                     <div
//                                         className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
//                                         +{teamData.totalMembers - 5}
//                                     </div>
//                                 )}
//                             </div>
//                             <span className="text-sm text-gray-600 dark:text-gray-400">{teamData.totalMembers} team members</span>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

export default function Dashboard() {
    return (
        <div>
            <h1>Dashboard</h1>
        </div>
    );
}