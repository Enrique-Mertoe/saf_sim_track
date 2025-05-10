import {User} from "@/models";
import {flushSession, getSession, setSession} from "@/lib/session";
import {createServerSupabaseClient} from "@/lib/server-supabase";

class Accounts {
    static inst: Accounts | null = null

    static async session(session: User) {
        const user = (await getSession("session-user") as User | undefined | null)
        if (!session)
            return
        if (session.id !== user?.id) {
            const {data: profile} = await createServerSupabaseClient()
                .from('users')
                .select('*')
                .eq('id', session.id)
                .single();
            console.log("profile",profile)
            await setSession("session-user", profile);
        }
        return
    }

    static async user() {
        return (await getSession("session-user")) as User | null | undefined;
    }

    static async logout() {
        await flushSession()
    }
}

export default Accounts