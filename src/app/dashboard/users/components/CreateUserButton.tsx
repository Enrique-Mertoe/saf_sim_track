'use client';
import {useDialog} from "@/app/_providers/dialog";
import {CreateUser} from "@/ui/shortcuts";
import useApp from "@/ui/provider/AppProvider";
import Signal from "@/lib/Signal";

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
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
                Create User
            </button>
        </>
    );
}