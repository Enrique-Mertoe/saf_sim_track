import Dashboard from "@/ui/components/dash/Dashboard";
import Accounts from "@/lib/accounts";
import {UserRole} from "@/models";
import SIMAnalysisPage from "@/app/dashboard/analysis/page.client";
import TeamSIMAnalysisPage from "@/app/dashboard/analysis/page.teamleader.client";

export default async function (){
    const user = await Accounts.user()
    return (
        <Dashboard>
            {
                user?.role == UserRole.ADMIN?
                    <SIMAnalysisPage/>
                    :<TeamSIMAnalysisPage/>
            }
        </Dashboard>
    )
}