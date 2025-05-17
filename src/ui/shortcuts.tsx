import CreateUserModal from "@/app/dashboard/users/components/CreateUserModal";
import RequestDetailViewer from "@/app/dashboard/users/components/OnboardViewer";
import {OnboardingRequest, User, UserRole} from "@/models";
import OnboardStaff from "@/app/dashboard/staff/page.view";

export const CreateUser = (dialog: any, user: User, {onClose}: {
    onClose?: Closure
}) => {
    const onclose = () => {
        onClose?.();
        d.dismiss();
    }

    const d = dialog.create({
        content: user.role === UserRole.ADMIN ? <CreateUserModal onClose={onclose}/> :
            user.role === UserRole.TEAM_LEADER ? <OnboardStaff onClose={onclose} user={user}/> : <></>,
        cancelable: !0,
        size: "lg"
    });
}

export const ViewRequest = (dialog: any, user: User, request: OnboardingRequest, {onClose}: {
    onClose?: Closure
}) => {
    const onclose = () => {
        onClose?.();
        d.dismiss();
    }

    const d = dialog.create({
        content: <RequestDetailViewer user={user} request={request} onClose={onclose}/>,
        cancelable: !1,
        size: "lg",
        design:["scrollable"]

    });
}