import TransfersPage from "@/app/dashboard/transfers/view";
import AdminTransfersPage from "@/app/dashboard/transfers/transfers";
import Accounts from "@/lib/accounts";
import {UserRole} from "@/models";
import {notFound} from "next/navigation";
import Dashboard from "@/ui/components/dash/Dashboard";

export default async function Page() {
    const user = await Accounts.user();
    if (!user) {
        notFound()
    }
    return (
        <Dashboard>
            {
                user.role == UserRole.TEAM_LEADER ? <TransfersPage/> :
                    <AdminTransfersPage/>
            }
        </Dashboard>
    )
}