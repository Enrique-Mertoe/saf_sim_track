import CreateUserModal from "@/app/dashboard/users/components/CreateUserModal";
import RequestDetailViewer from "@/app/dashboard/users/components/req_view";
import {OnboardingRequest, User} from "@/models";

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

export const ViewRequest = (dialog: any,user:User, request: OnboardingRequest, {onClose}: {
    onClose?: Closure
}) => {
    const onclose = () => {
        onClose?.();
        d.dismiss();
    }

    const d = dialog.create({
        content: <RequestDetailViewer user={user} request={request} onClose={onclose}/>,
        cancelable: !0,
        size: "lg",

    });
}