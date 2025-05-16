import Reports from "@/app/dashboard/report/page.view";
import Accounts from "@/lib/accounts";
import {notFound} from "next/navigation";
import {UserRole} from "@/models";

export default async function Page() {
    const user = await Accounts.user();
    if (!user || user.role !== UserRole.ADMIN) {
        return notFound();
    }
    return <Reports/>
}