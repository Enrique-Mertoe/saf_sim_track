import {Subscription, User} from "@/models";
import {getSession, removeSession, setSession} from "@/lib/session";
import {createServerClient, supabaseAdmin} from "@/lib/supabase/server";
import {admin_id} from "@/services/helper";

class Accounts {
    static inst: Accounts | null = null

    static async session(session: User) {
        if (!session)
            return
        const user = (await getSession("session-user") as User | undefined | null)

        if (session.id !== user?.id) {
            const {data: profile} = await (await createServerClient())
                .from('users')
                .select('*')
                .eq('id', session.id)
                .single();
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
        const session_user = (await getSession("session-user") as User | undefined | null)
        if (!session_user) return null;
        return session_user as User
    }

    static async subscription(user: User, update = false) {
        if (!user)
            return
        if (update) {
            const {data: subscription} = await supabaseAdmin
                .from('subscription_status')
                .select('*')
                .eq('user_id', await admin_id(user))
                .single();
            await setSession("user-subscription", subscription);
        }
        const subs: Subscription | null | undefined = (await getSession("user-subscription")) as any
        if (!subs || subs.user_id != await admin_id(user)) return null;
        return subs as Subscription
    }

    static async logout() {
        await removeSession("session-user")
        await (await createServerClient()).auth.signOut()
    }
}

export default Accounts