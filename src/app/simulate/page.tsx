"use client";

import {useState} from "react";
import {createSupabaseClient} from "@/lib/supabase/client";
import {SIMStatus, StaffType, UserRole, UserStatus} from "@/models/types";
import {faker} from "@faker-js/faker";
// import { createUser } from "@/app/api/actions/admin-actions";
import useApp from "@/ui/provider/AppProvider";
import {userService} from "@/services";

async function createUser(user: any) {
    const supabase = createSupabaseClient();
    const {data, error} = await supabase
        .from('users')
        .insert([user]);
    return {data, error};
}

export default function SimulatePage() {

    const user = useApp().user
    const [isGeneratingUsers, setIsGeneratingUsers] = useState(false);
    const [isGeneratingTeams, setIsGeneratingTeams] = useState(false);
    const [isGeneratingSimCards, setIsGeneratingSimCards] = useState(false);
    const [message, setMessage] = useState("");

    // Generate a random user
    const generateRandomUser = (adminId: string, teamId?: string) => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const fullName = `${firstName} ${lastName}`;
        const email = faker.internet.email({firstName, lastName}).toLowerCase();
        const password = faker.internet.password({length: 12});

        return {
            email,
            auth_user_id: faker.string.uuid(),
            full_name: fullName,
            id_number: faker.string.numeric(8),
            id_front_url: "https://example.com/id_front.jpg",
            id_back_url: "https://example.com/id_back.jpg",
            phone_number: `+254${faker.string.numeric(9)}`,
            mobigo_number: `+254${faker.string.numeric(9)}`,
            role: faker.helpers.arrayElement([UserRole.STAFF, UserRole.TEAM_LEADER]),
            team_id: teamId,
            admin_id: adminId,
            status: UserStatus.ACTIVE,
            staff_type: StaffType.VAN_BA
        };
    };

    // Generate a random team
    const generateRandomTeam = (adminId: string, leaderId: string) => {
        return {
            name: `${faker.company.name()} Team`,
            leader_id: leaderId,
            region: faker.location.state(),
            territory: faker.location.city(),
            van_number_plate: `KAA ${faker.string.numeric(3)}${faker.string.alpha(1)}`,
            van_location: faker.location.city(),
            admin_id: adminId,
            is_active: true
        };
    };

    // Generate a random SIM card
    const generateRandomSimCard = (teamId: string, soldByUserId: string) => {
        return {
            serial_number: `SIM${faker.string.numeric(10)}`,
            customer_msisdn: `+254${faker.string.numeric(9)}`,
            customer_id_number: faker.string.numeric(8),
            agent_msisdn: `+254${faker.string.numeric(9)}`,
            sold_by_user_id: soldByUserId,
            sale_date: faker.date.recent().toISOString(),
            sale_location: faker.location.city(),
            status: faker.helpers.arrayElement([
                SIMStatus.ASSIGNED,
                SIMStatus.ACTIVATED,
                SIMStatus.REGISTERED,
                SIMStatus.SOLD
            ]),
            team_id: teamId,
            region: faker.location.state(),
            match: faker.helpers.arrayElement([SIMStatus.MATCH, SIMStatus.UNMATCH]),
            quality: faker.helpers.arrayElement([SIMStatus.QUALITY, SIMStatus.NONQUALITY])
        };
    };

    // Generate random team members
    const generateTeamMembers = async () => {
        try {
            setIsGeneratingUsers(true);
            setMessage("Generating random team members...");

            const supabase = createSupabaseClient();
            const currentUser = user;

            if (!currentUser) {
                setMessage("Error: You must be logged in to generate data");
                return;
            }

            // Get all teams for this admin
            const {data: teams} = await supabase
                .from('teams')
                .select('id')
                .eq('admin_id', currentUser.id);

            if (!teams || teams.length === 0) {
                setMessage("Error: No teams found. Please create teams first.");
                return;
            }

            // Generate and create 5 users for each team
            let successCount = 0;
            let errorCount = 0;

            for (const team of teams) {
                for (let i = 0; i < 5; i++) {
                    const userData = generateRandomUser(currentUser.id, team.id);

                    try {
                        // Use the createUser function to properly create users with authentication
                        const {data, error} = await createUser(userData);

                        if (error) {
                            //@ts-ignore
                            console.error(`Error creating user: ${error.message || JSON.stringify(error)}`);
                            errorCount++;
                        } else {
                            successCount++;
                        }
                    } catch (err) {
                        console.error(`Exception creating user: ${err instanceof Error ? err.message : String(err)}`);
                        errorCount++;
                    }
                }
            }

            if (errorCount > 0) {
                setMessage(`Created ${successCount} users with ${errorCount} errors`);
            } else {
                setMessage(`Successfully generated ${successCount} random team members`);
            }
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsGeneratingUsers(false);
        }
    };

    // Generate random teams
    const generateTeams = async () => {
        try {
            setIsGeneratingTeams(true);
            setMessage("Generating random teams...");

            const supabase = createSupabaseClient();
            const currentUser = user;

            if (!currentUser) {
                setMessage("Error: You must be logged in to generate data");
                return;
            }

            // Create team leaders and teams
            // const createdLeaders = [];
            let errorCount = 0;

           const createdLeaders = ( (await userService.getUsersByRole(UserRole.TEAM_LEADER)).data || [])

            // Create 5 team leaders
            // for (let i = 0; i < 5; i++) {
            //     try {
            //         // Generate a team leader with TEAM_LEADER role
            //         // const leaderData = {
            //         //     ...generateRandomUser(currentUser.id),
            //         //     role: UserRole.TEAM_LEADER
            //         // };
            //
            //         async function cu(): Promise<any> {
            //             return await new Promise((resolve: any, reject: any) => {
            //                 $.post({
            //                     url: "/api/actions",
            //                     contentType: $.JSON,
            //                     data: {
            //                         action: "admin",
            //                         target: "create_user",
            //                         data: leaderData
            //                     }
            //                 }).then(res => {
            //                     resolve({data: res.data, error: null})
            //                 }).catch(err => {
            //                     resolve({error: err, data: null})
            //                 })
            //             })
            //         }
            //
            //         const {data, error} = await cu()
            //         // Use the createUser function to properly create users with authentication
            //         // const {data, error} = await createUser(leaderData);
            //
            //         if (error) {
            //             //@ts-ignore
            //             console.error(`Error creating team leader: ${error.message || JSON.stringify(error)}`);
            //             errorCount++;
            //         } else if (data) {
            //             createdLeaders.push(data);
            //         }
            //     } catch (err) {
            //         console.error(`Exception creating team leader: ${err instanceof Error ? err.message : String(err)}`);
            //         errorCount++;
            //     }
            // }

            if (createdLeaders.length === 0) {
                setMessage("Failed to create any team leaders. Cannot create teams.");
                return;
            }

            // Now create teams with these leaders
            const teams = createdLeaders.map(leader =>
                generateRandomTeam(currentUser.id, leader.id)
            );

            // Insert teams into the database
            const {error: teamError} = await supabase
                .from('teams')
                .insert(teams);

            if (teamError) {
                console.log("teamError", teamError)
                setMessage(`Error generating teams: ${teamError.message}`);
            } else {
                if (errorCount > 0) {
                    setMessage(`Created ${teams.length} teams with ${errorCount} errors during leader creation`);
                } else {
                    setMessage(`Successfully generated ${teams.length} random teams with leaders`);
                }
            }
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsGeneratingTeams(false);
        }
    };

    // Generate random SIM cards
    const generateSimCards = async () => {
        try {
            setIsGeneratingSimCards(true);
            setMessage("Generating random SIM cards...");

            const supabase = createSupabaseClient();
            const currentUser = user;

            if (!currentUser) {
                setMessage("Error: You must be logged in to generate data");
                return;
            }

            // Get all teams for this admin
            const {data: teams} = await supabase
                .from('teams')
                .select('id')
                .eq('admin_id', currentUser.id);

            if (!teams || teams.length === 0) {
                setMessage("Error: No teams found. Please create teams first.");
                return;
            }

            // Get users for each team to assign as sellers
            const {data: users} = await supabase
                .from('users')
                .select('id, team_id')
                .eq('admin_id', currentUser.id);

            if (!users || users.length === 0) {
                setMessage("Error: No users found. Please create users first.");
                return;
            }

            // Generate 200 SIM cards for each team
            let simCards = [];
            for (const team of teams) {
                // Find users in this team
                const teamUsers = users.filter(user => user.team_id === team.id);
                if (teamUsers.length === 0) continue;

                for (let i = 0; i < 200; i++) {
                    // Randomly select a user from the team to be the seller
                    const randomUser = teamUsers[Math.floor(Math.random() * teamUsers.length)];
                    simCards.push(generateRandomSimCard(team.id, randomUser.id));

                    // Insert in batches of 100 to avoid hitting limits
                    if (simCards.length >= 100) {
                        await supabase.from('sim_cards').insert(simCards);
                        simCards = [];
                    }
                }
            }

            // Insert any remaining SIM cards
            if (simCards.length > 0) {
                await supabase.from('sim_cards').insert(simCards);
            }

            setMessage(`Successfully generated SIM cards for all teams`);
        } catch (error) {
            setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsGeneratingSimCards(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Database Simulation</h1>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Generate Random Data</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Use these buttons to populate your database with random data for testing purposes.
                    All data will be associated with your user account.
                </p>

                <div className="space-y-4">
                    <div>
                        <button
                            onClick={generateTeams}
                            disabled={isGeneratingTeams}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                        >
                            {isGeneratingTeams ? "Generating..." : "Generate Random Teams"}
                        </button>
                        <p className="text-sm text-gray-500 mt-1">
                            Creates 5 random teams with team leaders
                        </p>
                    </div>

                    <div>
                        <button
                            onClick={generateTeamMembers}
                            disabled={isGeneratingUsers}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                        >
                            {isGeneratingUsers ? "Generating..." : "Generate Random Team Members"}
                        </button>
                        <p className="text-sm text-gray-500 mt-1">
                            Creates 5 random users for each team
                        </p>
                    </div>

                    <div>
                        <button
                            onClick={generateSimCards}
                            disabled={isGeneratingSimCards}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300"
                        >
                            {isGeneratingSimCards ? "Generating..." : "Generate Random SIM Cards"}
                        </button>
                        <p className="text-sm text-gray-500 mt-1">
                            Creates 200 random SIM cards for each team
                        </p>
                    </div>
                </div>
            </div>

            {message && (
                <div
                    className={`p-4 rounded-md ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {message}
                </div>
            )}
        </div>
    );
}
