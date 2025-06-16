'use client';
import {useDialog} from "@/app/_providers/dialog";
import {CreateUser} from "@/ui/shortcuts";
import useApp from "@/ui/provider/AppProvider";
import Signal from "@/lib/Signal";
import Theme from "@/ui/Theme";
import {UserRoundPlus} from "lucide-react";

export default function CreateUserButton() {
    const dialog = useDialog()
    const {user} = useApp();
    const createHandler = () => {
        // const d = dialog.create({
        //     content: <CreateUserModal onClose={() => d.dismiss()}/>,
        //     size: "lg",
        //     cancelable:false
        // })
        CreateUser(dialog, user!, {})
    }

    return (
        <>
            <button
                onClick={() => createHandler()}
                className={`${Theme.Button} py-2`}
            >
                <UserRoundPlus size={16}/>
                Create User
            </button>
        </>
    );
}