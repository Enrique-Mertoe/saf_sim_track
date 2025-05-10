import {useDialog} from "@/app/_providers/dialog";
import CreateUserModal from "@/app/dashboard/users/components/CreateUserModal";

export const CreateUser = (dialog: any, {onClose}: {
    onClose?: Closure
}) => {
    const onclose = () => {
        onClose?.();
        d.dismiss();
    }

    const d = dialog.create({
        content: <CreateUserModal onClose={onclose}/>,
        cancelable: !0,
        size: "lg"
    });
}