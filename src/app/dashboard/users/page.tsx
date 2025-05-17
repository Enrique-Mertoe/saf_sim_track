import UsersPage from "@/app/dashboard/users/page.view";
import Accounts from "@/lib/accounts";
import {UserRole} from "@/models";
import {notFound} from "next/navigation";

export default async function Page() {
    const user = await Accounts.user();
    if (!user || ![UserRole.ADMIN,UserRole.TEAM_LEADER].includes(user.role)) {
        return notFound();
    }
    return (
        <UsersPage/>
    )
}