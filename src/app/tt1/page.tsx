import TT1 from "@/app/tt1/p";
import Accounts from "@/lib/accounts";

export default async function Page() {
    const user = await Accounts.user()
    console.log("--user", user)
    return (
        <>
            <TT1/>
        </>
    )
}