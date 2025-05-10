'use client';
import CreateUserModal from './CreateUserModal';
import {useDialog} from "@/app/_providers/dialog";

export default function CreateUserButton() {
    const dialog = useDialog()
    const createHandler = () => {
        const d = dialog.create({
            content: <CreateUserModal onClose={() => d.dismiss()}/>,
            size: "lg",
            cancelable:false
        })
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