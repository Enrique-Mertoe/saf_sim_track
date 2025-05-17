import {OnboardingRequest, OnboardingRequestStatus, User} from "@/models";
import {ViewRequest} from "@/ui/shortcuts";
import {useDialog} from "@/app/_providers/dialog";
import useApp from "@/ui/provider/AppProvider";

type OnBoardTableProps = {
    requests: OnboardingRequest[];
    onStatusChange: (userId: string, status: 'ACTIVE' | 'SUSPENDED') => void;
    onDeleteUser: (userId: string) => void;
};
export default function OnBoardTable({requests, onStatusChange, onDeleteUser}: OnBoardTableProps) {
    const dialog = useDialog()
    const {user} = useApp()
    return (

        <div className="bg-white dark:bg-gray-800 rounded-md shadow overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request
                            Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested
                            By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User
                            Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {requests.length > 0 ? (
                        requests.map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${request.request_type === "ONBOARDING" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        `}>
                          {request.request_type}
                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div
                                        className="font-medium text-gray-900 dark:text-gray-100">{request.requestedBy?.full_name}</div>
                                    <div
                                        className="text-sm text-gray-500 dark:text-gray-400">{request.requestedBy?.role}</div>
                                </td>
                                <td className="px-6 py-4">
                                    {request.request_type === "ONBOARDING" ? (
                                        <>
                                            <div className="font-medium text-gray-900">{request.full_name}</div>
                                            <div className="text-sm text-gray-500">ID: {request.id_number}</div>
                                            <div
                                                className="text-sm text-gray-500">Team: {request.teams?.name || "N/A"}</div>
                                        </>
                                        //@ts-ignore
                                    ) : request.targetUser ? (
                                        <>
                                            <div
                                                className="font-medium text-gray-900">{
                                                //@ts-ignore
                                                request.targetUser.fullName}</div>
                                            <div
                                                className="text-sm text-gray-500">ID: {
                                                //@ts-ignore
                                                request.targetUser.idNumber}</div>
                                            <div
                                                className="text-sm text-gray-500">{
                                                //@ts-ignore
                                                request.targetUser.phoneNumber}</div>
                                        </>
                                    ) : (
                                        <span className="text-gray-500">No details available</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(request.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${request.status === OnboardingRequestStatus.PENDING ? "bg-yellow-100 text-yellow-800" : ""}
                          ${request.status === OnboardingRequestStatus.APPROVED ? "bg-green-100 text-green-800" : ""}
                          ${request.status === OnboardingRequestStatus.REJECTED ? "bg-red-100 text-red-800" : ""}
                        `}>
                          {request.status}
                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                        type={"button"}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                                        onClick={() => ViewRequest(dialog, user!, request, {
                                            onClose: (reload: boolean) => {
                                                if (reload)
                                                    alert()
                                            }
                                        })}
                                    >
                                        View
                                    </button>

                                    {
                                        //@ts-ignore
                                        request.status === "PENDING" && (
                                            <>
                                                <button
                                                    className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                                                    //@ts-ignore
                                                    onClick={() => handleApproveRequest(request.id)}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                                    //@ts-ignore
                                                    onClick={() => handleRejectRequest(request.id)}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                    {request.request_type === "ONBOARDING" && request.id_front_url && (
                                        <button
                                            className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                                            onClick={() => {
                                                //@ts-ignore
                                                ViewRequest(dialog, request, {})
                                                // setCurrentIDUrls({
                                                //     front: request.idFrontUrl,
                                                //     back: request.idBackUrl
                                                // });
                                                // setShowIDModal(true);
                                            }}
                                        >
                                            View IDs
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            No pending requests
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}