import Accounts from "@/lib/accounts";
import {UserRole} from "@/models";
import {notFound} from "next/navigation";
import Dashboard from "@/ui/components/dash/Dashboard";
import RegisteredSimCards from "@/app/dashboard/cards/page.view";

export default async function Page() {
    const user = await Accounts.user();
    if (!user || user.role !== UserRole.STAFF) {
        return notFound();
    }
    return (
        <>
            <Dashboard>
                <RegisteredSimCards/>
            </Dashboard>
        </>
    )
}