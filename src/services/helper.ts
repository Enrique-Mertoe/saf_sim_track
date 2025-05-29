import {User, UserRole} from "@/models";

export async function admin_id(currentUser: User) {
    if (currentUser.role === UserRole.ADMIN) {
        return currentUser.id;
    } else {
        return currentUser.admin_id;
    }

}