"use client"
import {authService} from "@/services";
import {User} from "@/models";

class UserManager {
    private static _user: User | null = null;

    static get user(): User | null {
        return this._user;
    }

    static u1() {
        console.log("dfsdf", this._user)
        return this._user;
    }

    static async init(): Promise<User | null> {
        try {
            const {user, error} = await authService.getCurrentUser();
            if (error) {
                console.error("Error initializing UserManager:", error);
                this._user = null;
                return null;
            }
            this._user = user;
            return user
        } catch (error) {
            console.error("Exception initializing UserManager:", error);
            this._user = null;
            return null;
        }
    }
}
export default UserManager;
//
// export default function UserManagerInitProvider() {
//     useEffect(() => {
//         UserManager.init()
//     })
//     return <></>
// };
