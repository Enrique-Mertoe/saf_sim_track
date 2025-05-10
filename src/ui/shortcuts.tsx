import {useDialog} from "@/app/_providers/dialog";
import CreateUserModal from "@/app/dashboard/users/components/CreateUserModal";
import RequestDetailViewer from "@/app/dashboard/users/components/req_view";
import {OnboardingRequest} from "@/models";

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

export const ViewRequest = (dialog: any,request:OnboardingRequest, {onClose}: {
    onClose?: Closure
}) => {
    const onclose = () => {
        onClose?.();
        d.dismiss();
    }

    const d = dialog.create({
        content: <RequestDetailViewer request={request} onClose={onclose}/>,
        cancelable: !0,
        size: "lg",

    });
}