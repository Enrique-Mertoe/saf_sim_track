import Accounts from "@/lib/accounts";
import {notFound} from "next/navigation";
import {UserRole} from "@/models";
import StaffUploadPage from "@/app/dashboard/sim/page.view";

export default async function Page() {
    const user = await Accounts.user();
    if (!user || user.role !== UserRole.STAFF) {
        return notFound();
    }
    return <StaffUploadPage/>
}