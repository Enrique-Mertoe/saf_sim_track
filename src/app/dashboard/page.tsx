"use server"
import SafaricomDashboard from "@/app/dashboard/page.view";
import {UserRole} from "@/models";
import TeamLeader from "@/app/dashboard/TeamLeader";
import Accounts from "@/lib/accounts";
import {redirect} from "next/navigation";
import StaffDashBoard from "@/app/dashboard/StaffDashBoard";

export default async function DashboardPage() {
    const user = await Accounts.user();
    console.log("user", user?.role)
    if (!user) {
        return redirect("/accounts/login")
    }
    return (
        <>
            {
                user.role == UserRole.ADMIN ?
                    <SafaricomDashboard/>
                    : user.role == UserRole.TEAM_LEADER
                        ? <TeamLeader/> : <StaffDashBoard userId={user.id}/>
            }
        </>
    )
}