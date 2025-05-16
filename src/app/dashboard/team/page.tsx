import Dashboard from "@/ui/components/dash/Dashboard";
import TeamManagement from "@/app/dashboard/team/page.view";
import Accounts from "@/lib/accounts";
import {UserRole} from "@/models";
import {notFound} from "next/navigation";

export default async function Page() {
    const user = await Accounts.user();
    if (!user || user.role !== UserRole.ADMIN) {
        return notFound();
    }
    return (
        <>
            <Dashboard>
                <TeamManagement/>
            </Dashboard>
        </>
    )
}