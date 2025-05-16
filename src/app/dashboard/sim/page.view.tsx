// "use client"
// import React, {useEffect, useState} from 'react';
// import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/ui/components/Tabs';
// import {BulkSIMCardUpload} from "@/app/dashboard/sim/BulkUpload";
// import {createSupabaseClient} from "@/lib/supabase/client";
// import useApp from "@/ui/provider/AppProvider";
// import {UserRole} from "@/models";
// import {SIMCardForm} from "@/ui/components/SimRegistrationComponents";
//
// // Interface for team data
// interface Team {
//     id: string;
//     name: string;
// }
//
// // Main SIM Registration page component
// const SIMRegistrationPage: React.FC = () => {
//     const [teams, setTeams] = useState<Team[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const {user: currentUser} = useApp();
//
//     useEffect(() => {
//         if (!currentUser)
//             return
//         const fetchTeams = async () => {
//             if (!currentUser) return;
//
//             setIsLoading(true);
//             const supabase = createSupabaseClient();
//
//             try {
//                 // Fetch teams based on user role
//                 let query = supabase.from('teams').select('id, team_name:name');
//
//                 // Filter teams if user is not an admin
//                 if (currentUser.role !== UserRole.ADMIN) {
//                     // Team leaders see only their team, staff see their assigned team
//                     query = query.eq('id', currentUser.team_id);
//                 }
//
//                 const {data, error} = await query.eq('is_active', true);
//
//                 if (error) {
//                     console.error('Error fetching teams:', error);
//                     return;
//                 }
//
//                 if (data) {
//                     setTeams(data.map(team => ({
//                         id: team.id,
//                         name: team.team_name
//                     })));
//                 }
//             } catch (error) {
//                 console.error('Failed to fetch teams:', error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//
//         fetchTeams();
//     }, [currentUser]);
//
//     if (isLoading || !currentUser) {
//         return (
//             <div className="flex justify-center items-center h-64">
//                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
//             </div>
//         );
//     }
//
//     return (
//         <div className="container mx-auto p-4 md:p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
//             <div className="flex justify-between items-center mb-6">
//                 <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">SIM Card Registration</h1>
//             </div>
//
//             <Tabs defaultValue="single" className="w-full">
//                 <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800">
//                     <TabsTrigger value="single"
//                                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100">Single
//                         Registration</TabsTrigger>
//                     <TabsTrigger value="bulk"
//                                  className="data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100">Bulk
//                         Upload</TabsTrigger>
//                 </TabsList>
//
//                 <TabsContent value="single"
//                              className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
//                     <SIMCardForm teams={teams} currentUser={currentUser}/>
//                 </TabsContent>
//
//                 <TabsContent value="bulk"
//                              className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
//                     <BulkSIMCardUpload currentUser={currentUser}/>
//                 </TabsContent>
//             </Tabs>
//         </div>
//     );
// };
//
// export default SIMRegistrationPage;