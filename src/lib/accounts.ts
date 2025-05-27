import {User} from "@/models";
import {flushSession, getSession, setSession} from "@/lib/session";
import {createServerClient} from "@/lib/supabase/server";

class Accounts {
    static inst: Accounts | null = null

    static async session(session: User) {
        const user = (await getSession("session-user") as User | undefined | null)
        if (!session)
            return
        if (session.id !== user?.id) {
            const {data: profile} = await (await createServerClient())
                .from('users')
                .select('*')
                .eq('id', session.id)
                .single();
            console.log("profile", profile)
            await setSession("session-user", profile);
        }
        return
    }

    static async update(user: User) {
        try {
            if (!user)
                return
            const {data: profile} = await (await createServerClient())
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            await setSession("session-user", profile);

            return
        } catch (e: any) {
            console.log(e)
        }
    }

    static async user() {
        const user = (await (await createServerClient()).auth.getUser()).data.user
        if (!user)
            return
        const {data: profile} = await (await createServerClient())
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        return profile as User
    }

    static async logout() {
        await flushSession()
    }
}

export default Accounts