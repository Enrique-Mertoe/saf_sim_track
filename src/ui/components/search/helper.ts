import TeamController from "@/controllers/TeamController";
import UserController from "@/controllers/UserController";

export const loadRelatedUsers = async (teamId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    return [
        {id: "user-1", full_name: "John Doe", role: "VAN_STAFF"},
        {id: "user-2", full_name: "Jane Smith", role: "MPESA_ONLY_AGENT"},
        {id: "user-3", full_name: "Bob Johnson", role: "NON_MPESA_AGENT"}
    ];
};

export const loadTeamStats = async (teamId: string) => {
    return await TeamController.performance(teamId)
};
export const loadSIMDetails = async (simId: string) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
        id: simId,
        serial_number: "89254021374259301001",
        customer_msisdn: "+254701234567",
        customer_id_number: "87654321",
        agent_msisdn: "+254712345678",
        sale_date: "2024-01-10T00:00:00Z",
        sale_location: "Westlands",
        activation_date: "2024-01-11T00:00:00Z",
        top_up_amount: 100,
        status: "ACTIVATED",
        team_id: "team-1",
        region: "Nairobi",
        match: "MATCHED",
        quality: "QUALITY",
        sold_by_user_id: "user-1",
        created_at: "2024-01-10T00:00:00Z"
    };
};

export const loadTeamDetails = async (teamId: string) => {
    return await TeamController.byId(teamId);
};


export // Mock data loading functions - replace with actual API calls
const loadUserDetails = (userId: string) => {
    return UserController.byId(userId);
};


