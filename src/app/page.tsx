import Home from "@/app/HomePage";
import Accounts from "@/lib/accounts";
import {redirect} from "next/navigation";
export default async function Home1() {
const user = await Accounts.user();
    if (user) {
        return redirect("/accounts/dashboard")
    }
    return (
        <Home/>
    );
}
