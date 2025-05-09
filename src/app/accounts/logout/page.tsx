import {authService} from "@/services";
import {redirect} from "next/navigation";

export default async function Logout() {
    await authService.signOut();
    return redirect("/accounts/login")
}