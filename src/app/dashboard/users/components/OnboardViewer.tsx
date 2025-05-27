import {useEffect, useRef, useState} from 'react';
import {AlertTriangle, ArrowLeft, Briefcase, CheckCircle, CreditCard, User, X} from 'lucide-react';
import {AnimatePresence, motion} from 'framer-motion';
import {logService, notificationService, onboardingService, storageService} from "@/services";
import {
    ActivityLogCreate,
    NotificationType,
    OnboardingRequest,
    OnboardingRequestStatus,
    User as User1,
    UserRole
} from "@/models";
import {useDialog} from "@/app/_providers/dialog";
import {toast} from "react-hot-toast";
import {$} from "@/lib/request";
import {generatePassword, suggestRejection} from "@/helper";
import alert from "@/ui/alert";
import Signal from "@/lib/Signal";

// Define the necessary types based on your existing code
export default function RequestDetailViewer({request, user, onClose}: {
    request: OnboardingRequest, onClose: Closure, user: User1
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [back_url, setBack] = useState<string | null>(null)
    const [front_url, setFront] = useState<string | null>(null)
    useEffect(() => {
        async function fetchBack() {
            setBack(await storageService.getDataImage(request.id_back_url))
        }

        fetchBack().then()

        async function fetchFront() {
            setFront(await storageService.getDataImage(request.id_front_url))
        }

        fetchFront().then()
        setIsOpen(true);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        // Delay the actual close to allow for animation
        setTimeout(() => {
            onClose();
        },);
    };

    // Format date in a readable way
    const formatDate = (dateString: string | number | Date) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get appropriate status color
    const getStatusColor = (status: OnboardingRequestStatus) => {
        switch (status) {
            case OnboardingRequestStatus.PENDING:
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case OnboardingRequestStatus.APPROVED:
                return 'bg-green-100 text-green-800 border-green-300';
            case OnboardingRequestStatus.REJECTED:
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    // Get appropriate request type color
    const getRequestTypeColor = (type: string) => {
        return type === 'ONBOARDING'
            ? 'bg-blue-100 text-blue-800 border-blue-300'
            : 'bg-purple-100 text-purple-800 border-purple-300';
    };
    const dialog = useDialog();

    function reject(reason?: string) {
        const dl = dialog.create({
            content: <RejectRequest user={user} options={{reason}} onClose={(rejected: boolean) => {
                dl.dismiss();
                if (rejected) {
                    Signal.trigger("fetchOnboard")
                    setTimeout(() => onClose(rejected), 300);
                }
            }} request={request}/>,

        })
    }

    const [approving, setApproving] = useState<boolean>(false)
    const currentState = {
        status: request.status,
        reviewerId: request.reviewed_by_id,
        review_notes: request.review_notes

    }

    async function deleteRequest() {
        const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/id-documents/`;
        const frontPath = request.id_front_url.replace(baseUrl, '');
        const backPath = request.id_back_url.replace(baseUrl, '');
        await storageService.deleteFiles("id-documents", [frontPath, backPath])
        const {error} = await onboardingService.deleteRequest(request.id);
        if (error)
            throw error
        Signal.trigger("fetchOnboard")
        return "Request Deleted!"
    }

    async function sendEmail() {
        const send_email = () => {
            return new Promise((resolve, reject) => {
                $.post({
                    url: "/api/actions",
                    contentType: $.JSON,
                    data: {

                        action: "admin",
                        target: "send_invite",
                        data: {...request, metadata: {}}
                    }
                }).then(res => {
                    if (res.ok) {
                        return resolve("Invite link sent Deleted!")
                    }
                    // request.requestedBy?.full_name
                    return reject(res.message)
                }).catch(err => {
                    reject(err.message)
                })
            })
        }
        return await send_email();
    }

    async function approve() {
        setApproving(true)
        try {
            // Call the service to update the request status
            const {error} = await onboardingService.updateRequestStatus(request.id, {
                status: OnboardingRequestStatus.APPROVED,
                reviewerId: user?.id,
                review_notes: "Request Accepted"
            });
            if (error)
                throw error
            const r_data = {
                full_name: request.full_name,
                email: request.email,
                id_number: request.id_number,
                phone_number: request.phone_number,
                mobigo_number: request.mobigo_number || undefined,
                role: request.role,
                team_id: request.team_id || undefined,
                staff_type: request.staff_type || undefined,
                id_front_url: request.id_front_url,
                id_back_url: request.id_back_url,
                password: generatePassword()
            };
            const addUser = () => {
                return new Promise((resolve: any, reject: any) => {
                    $.post({
                        url: "/api/actions",
                        contentType: $.JSON,
                        data: {
                            action: "admin",
                            target: "create_user",
                            data: r_data
                        }
                    }).then(async res => {
                        if (!res.ok) {
                            throw res.message
                        }
                        const log_data: ActivityLogCreate = {
                            user_id: user.id,
                            action_type: 'ONBOARDING_APPROVED',
                            details: {
                                onboarding_request_id: request.id,
                                auth_user_id: user.id
                            },
                            is_offline_action: false

                        }
                        const {error: error_log} = await logService.createLog([log_data])
                        if (error_log)
                            reject(error_log.message)

                        // Create notification for team leader
                        if (request.requested_by_id) {
                            await notificationService.createNotification({
                                user_id: request.requested_by_id,
                                title: "Onboarding Request Approved",
                                message: `Your onboarding request for ${request.full_name} has been approved`,
                                type: NotificationType.USER,
                                metadata: {
                                    request_id: request.id,
                                    approver_id: user.id,
                                    approver_name: user.full_name,
                                    staff_name: request.full_name
                                }
                            });
                        }

                        resolve(res.data)

                    }).catch(err => {
                        const message = err.message || 'Failed to create user';
                        reject(message)
                    });
                })
            };
            await addUser();
            Signal.trigger("fetchOnboard")
            setTimeout(() => {
                onClose(!0);
            }, 1500);

        } catch (err) {
            console.error('Error approving request:', err);
            toast.error('Failed to approve the request. Please try again.', {
                duration: 3000
            });
            onboardingService.updateRequestStatus(request.id, currentState as any);
            const reason = suggestRejection(err as string);
            if (reason) {
                reject(reason)
            }
        } finally {
            setApproving(false);
        }
    }


    return (
        <AnimatePresence>
            {request && (
                <div className="h-full overflow-y-auto">
                    <motion.div
                        initial={{opacity: 0, scale: 0.9}}
                        animate={isOpen ? {opacity: 1, scale: 1} : {opacity: 0, scale: 0.9}}
                        exit={{opacity: 0, scale: 0.9}}
                        transition={{duration: 0.5, type: 'spring', bounce: 0.3}}
                        className="bg-white dark:bg-gray-800 rounded w-full "
                    >
                        {/* Header */}
                        <div
                            className="relative bg-gradient-to-r from-green-500 to-green-700 dark:from-green-600 dark:to-green-900 p-6 text-white">
                            <motion.button
                                onClick={handleClose}
                                className="absolute cursor-pointer top-6 left-6 flex items-center text-white hover:bg-green-300 hover:bg-opacity-20 dark:hover:bg-green-400 dark:hover:bg-opacity-20 rounded-full p-1 transition-all"
                                whileHover={{x: -5}}
                            >
                                <ArrowLeft size={20}/>
                                <span className="ml-1">Back</span>
                            </motion.button>

                            <motion.div
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{delay: 0.2, duration: 0.5}}
                                className="text-center mt-4"
                            >
                                <div className="mt-2">
                  <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getRequestTypeColor(request.request_type)} bg-opacity-90`}>
                    {request.request_type}
                  </span>
                                </div>

                                <h2 className="text-2xl font-bold mt-3">
                                    {request.request_type === 'ONBOARDING' ? `${request.full_name}` : 'User Deletion Request'}
                                </h2>

                                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                    {request.status.toUpperCase()}
                  </span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b dark:border-gray-700">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`flex-1 py-4 font-medium ${activeTab === 'details' ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                Request Details
                            </button>
                            <button
                                onClick={() => setActiveTab('timeline')}
                                className={`flex-1 py-4 font-medium ${activeTab === 'timeline' ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                Timeline
                            </button>
                            {request.request_type === 'ONBOARDING' && (
                                <button
                                    onClick={() => setActiveTab('documents')}
                                    className={`flex-1 py-4 font-medium ${activeTab === 'documents' ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    Documents
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h96">
                            <AnimatePresence mode="wait">
                                {activeTab === 'details' && (
                                    <motion.div
                                        key="details"
                                        initial={{opacity: 0, y: 20}}
                                        animate={{opacity: 1, y: 0}}
                                        exit={{opacity: 0, y: -20}}
                                        transition={{duration: 0.2}}
                                    >
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div
                                                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div
                                                    className="flex items-center mb-3 text-green-600 dark:text-green-400">
                                                    <User size={20}/>
                                                    <h3 className="font-semibold ml-2">Request Information</h3>
                                                </div>
                                                <ul className="space-y-3">
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-300">ID:</span>
                                                        <span
                                                            className="font-medium dark:text-gray-200">{request.id.substring(0, 8)}...</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span
                                                            className="text-gray-500 dark:text-gray-300">Created:</span>
                                                        <span
                                                            className="font-medium dark:text-gray-200">{formatDate(request.created_at)}</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span
                                                            className="text-gray-500 dark:text-gray-300">Requested By:</span>
                                                        <span
                                                            className="font-medium dark:text-gray-200">{request.requestedBy?.full_name || 'N/A'}</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-300">Role:</span>
                                                        <span
                                                            className="font-medium dark:text-gray-200">{request.requestedBy?.role || 'N/A'}</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div
                                                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div
                                                    className="flex items-center mb-3 text-green-600 dark:text-green-400">
                                                    <Briefcase size={20}/>
                                                    <h3 className="font-semibold ml-2">Subject Details</h3>
                                                </div>
                                                <ul className="space-y-3">
                                                    {request.request_type === 'ONBOARDING' ? (
                                                        <>
                                                            <li className="flex justify-between">
                                                                <span className="text-gray-500 dark:text-gray-300">Full Name:</span>
                                                                <span
                                                                    className="font-medium dark:text-gray-200">{request.full_name}</span>
                                                            </li>
                                                            <li className="flex justify-between">
                                                                <span className="text-gray-500 dark:text-gray-300">ID Number:</span>
                                                                <span
                                                                    className="font-medium dark:text-gray-200">{request.id_number}</span>
                                                            </li>
                                                            <li className="flex justify-between">
                                                                <span
                                                                    className="text-gray-500 dark:text-gray-300">Phone:</span>
                                                                <span
                                                                    className="font-medium dark:text-gray-200">{request.phone_number}</span>
                                                            </li>
                                                            <li className="flex justify-between">
                                                                <span
                                                                    className="text-gray-500 dark:text-gray-300">Team:</span>
                                                                <span
                                                                    className="font-medium dark:text-gray-200">{request.teams?.name || 'N/A'}</span>
                                                            </li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li className="flex justify-between">
                                                                <span className="text-gray-500 dark:text-gray-300">Target User:</span>
                                                                <span
                                                                    className="font-medium dark:text-gray-200">{
                                                                    //@ts-ignore
                                                                    request.targetUser?.fullName || 'N/A'}</span>
                                                            </li>
                                                            <li className="flex justify-between">
                                                                <span className="text-gray-500 dark:text-gray-300">ID Number:</span>
                                                                <span
                                                                    className="font-medium dark:text-gray-200">{
                                                                    //@ts-ignore
                                                                    request.targetUser?.idNumber || 'N/A'}</span>
                                                            </li>
                                                            <li className="flex justify-between">
                                                                <span
                                                                    className="text-gray-500 dark:text-gray-300">Reason:</span>
                                                                <span
                                                                    className="font-medium dark:text-gray-200">{request.review_notes || 'Not specified'}</span>
                                                            </li>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>

                                            {request.status !== 'pending' && (
                                                <div
                                                    className="md:col-span-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                    <div
                                                        className="flex items-center mb-3 text-green-600 dark:text-green-400">
                                                        <CheckCircle size={20}/>
                                                        <h3 className="font-semibold ml-2">Review Information</h3>
                                                    </div>
                                                    <ul className="space-y-3">
                                                        <li className="flex justify-between">
                                                            <span className="text-gray-500 dark:text-gray-300">Reviewed By:</span>
                                                            <span
                                                                className="font-medium dark:text-gray-200">{
                                                                //@ts-ignore
                                                                request.reviewedBy?.full_name || 'N/A'}</span>
                                                        </li>
                                                        <li className="flex justify-between">
                                                            <span className="text-gray-500 dark:text-gray-300">Review Date:</span>
                                                            <span
                                                                className="font-medium dark:text-gray-200">{request.review_date ? formatDate(request.review_date) : 'N/A'}</span>
                                                        </li>
                                                        <li className="flex flex-col">
                                                            <span
                                                                className="text-gray-500 dark:text-gray-300">Notes:</span>
                                                            <span
                                                                className="font-medium mt-1 dark:text-gray-200">{request.review_notes || 'No notes provided'}</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'timeline' && (
                                    <motion.div
                                        key="timeline"
                                        initial={{opacity: 0, y: 20}}
                                        animate={{opacity: 1, y: 0}}
                                        exit={{opacity: 0, y: -20}}
                                        transition={{duration: 0.2}}
                                    >
                                        <div
                                            className="relative border-l-2 border-green-200 dark:border-green-700 ml-6 pl-6 py-2">
                                            <div className="mb-10">
                                                <motion.div
                                                    initial={{scale: 0}}
                                                    animate={{scale: 1}}
                                                    transition={{delay: 0.1, duration: 0.3}}
                                                    className="w-4 h-4 bg-green-500 rounded-full absolute -left-2"
                                                />
                                                <motion.div
                                                    initial={{x: 20, opacity: 0}}
                                                    animate={{x: 0, opacity: 1}}
                                                    transition={{delay: 0.2, duration: 0.5}}
                                                >
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(request.created_at)}</p>
                                                    <h3 className="font-medium text-lg mt-1 dark:text-gray-200">Request
                                                        Created</h3>
                                                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                                                        {request.requestedBy?.full_name} created a
                                                        new {request.request_type.toLowerCase()} request
                                                    </p>
                                                </motion.div>
                                            </div>

                                            {request.status !== 'pending' && (
                                                <div className="mb-10">
                                                    <motion.div
                                                        initial={{scale: 0}}
                                                        animate={{scale: 1}}
                                                        transition={{delay: 0.3, duration: 0.3}}
                                                        className={`w-4 h-4 ${request.status === 'approved' ? 'bg-green-500' : 'bg-red-500'} rounded-full absolute -left-2`}
                                                    />
                                                    <motion.div
                                                        initial={{x: 20, opacity: 0}}
                                                        animate={{x: 0, opacity: 1}}
                                                        transition={{delay: 0.4, duration: 0.5}}
                                                    >
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(request.review_date || request.created_at)}</p>
                                                        <h3 className="font-medium text-lg mt-1 dark:text-gray-200">Request {request.status.charAt(0).toUpperCase() + request.status.slice(1)}</h3>
                                                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                                                            {
                                                                //@ts-ignore
                                                                request.reviewedBy?.full_name || 'Administrator'} {request.status} the
                                                            request
                                                            {request.review_notes && `: "${request.review_notes}"`}
                                                        </p>
                                                    </motion.div>
                                                </div>
                                            )}

                                            {request.status === 'pending' && (
                                                <div className="mb-10">
                                                    <motion.div
                                                        initial={{scale: 0}}
                                                        animate={{scale: 1}}
                                                        transition={{delay: 0.3, duration: 0.3}}
                                                        className="w-4 h-4 bg-yellow-500 rounded-full absolute -left-2"
                                                    />
                                                    <motion.div
                                                        initial={{x: 20, opacity: 0}}
                                                        animate={{x: 0, opacity: 1}}
                                                        transition={{delay: 0.4, duration: 0.5}}
                                                    >
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Current
                                                            Status</p>
                                                        <h3 className="font-medium text-lg mt-1 dark:text-gray-200">Awaiting
                                                            Review</h3>
                                                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                                                            This request is currently pending review by an administrator
                                                        </p>
                                                    </motion.div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'documents' && request.request_type === 'ONBOARDING' && (
                                    <motion.div
                                        key="documents"
                                        initial={{opacity: 0, y: 20}}
                                        animate={{opacity: 1, y: 0}}
                                        exit={{opacity: 0, y: -20}}
                                        transition={{duration: 0.2}}
                                        className="grid md:grid-cols-2 gap-6"
                                    >
                                        {request.id_front_url && (
                                            <motion.div
                                                whileHover={{y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}}
                                                transition={{duration: 0.2}}
                                                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                                            >
                                                <div
                                                    className="flex items-center mb-3 text-green-600 dark:text-green-400">
                                                    <CreditCard size={20}/>
                                                    <h3 className="font-semibold ml-2">ID Front</h3>
                                                </div>
                                                <div
                                                    className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 p-1 shadow-sm">
                                                    <div
                                                        className="aspect-[3/2] bg-gray-100 dark:bg-gray-900 rounded flex items-center justify-center">
                                                        {front_url ? (
                                                            <img
                                                                src={front_url || "/api/placeholder/300/200"}
                                                                alt="ID Front"
                                                                className="object-cover rounded h-full w-full"
                                                                onError={(e) => {
                                                                    storageService.getDataImage(request.id_front_url)
                                                                        .then(res => {
                                                                            //@ts-ignore
                                                                            e.target.src = res
                                                                        });
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="flex items-center justify-center w-full h-full">
                                                                <div
                                                                    className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600 dark:border-green-400"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {request.id_back_url && (
                                            <motion.div
                                                whileHover={{y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'}}
                                                transition={{duration: 0.2}}
                                                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                                            >
                                                <div
                                                    className="flex items-center mb-3 text-green-600 dark:text-green-400">
                                                    <CreditCard size={20}/>
                                                    <h3 className="font-semibold ml-2">ID Back</h3>
                                                </div>
                                                <div
                                                    className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 p-1 shadow-sm">
                                                    <div
                                                        className="aspect-[3/2] bg-gray-100 dark:bg-gray-900 rounded flex items-center justify-center">
                                                        {back_url ? (
                                                            <img
                                                                src={back_url || "/api/placeholder/300/200"}
                                                                alt="ID Back"
                                                                className="object-cover rounded h-full w-full"
                                                                onError={(e) => {
                                                                    storageService.getDataImage(request.id_back_url)
                                                                        .then(res => {
                                                                            //@ts-ignore
                                                                            e.target.src = res
                                                                        });
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="flex items-center justify-center w-full h-full">
                                                                <div
                                                                    className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600 dark:border-green-400"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer with actions */}
                        <div className="border-t dark:border-gray-700 p-4 flex justify-end space-x-3">
                            <motion.button
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                disabled={approving}
                                className="px-4 py-1 cursor-pointer bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                onClick={handleClose}
                            >
                                Close
                            </motion.button>

                            {user.role === UserRole.ADMIN ? (
                                    <>
                                        {request.status !== OnboardingRequestStatus.REJECTED &&
                                            <motion.button
                                                type={"button"}
                                                whileHover={{scale: 1.05}}
                                                whileTap={{scale: 0.95}}
                                                onClick={() => {
                                                    reject()
                                                }}
                                                disabled={approving}
                                                className="px-4 py-1 cursor-pointer bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
                                            >
                                                Reject
                                            </motion.button>
                                        }
                                        {request.status !== OnboardingRequestStatus.APPROVED &&
                                            <motion.button
                                                onClick={() => {
                                                    approve()
                                                }}
                                                whileHover={{scale: 1.05}}
                                                whileTap={{scale: 0.95}}
                                                disabled={approving}
                                                className="px-4 py-1 cursor-pointer flex place-items-center bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
                                            >
                                                {approving ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                             xmlns="http://www.w3.org/2000/svg" fill="none"
                                                             viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10"
                                                                    stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor"
                                                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Approving...
                                                    </>
                                                ) : (
                                                    'Approve'
                                                )}
                                            </motion.button>
                                        }
                                    </>
                                ) :
                                <>
                                    {request.status == OnboardingRequestStatus.APPROVED &&
                                        <motion.button
                                            whileHover={{scale: 1.05}}
                                            whileTap={{scale: 0.95}}
                                            disabled={approving}
                                            className="px-4 py-1 cursor-pointer bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-400 dark:hover:bg-green-500 transition-colors"
                                            onClick={() => {
                                                alert.confirm({
                                                    title: "Onboarding request",
                                                    message: `An email will be sent to <b>${request.email}</b>`,
                                                    task: sendEmail,
                                                    type: alert.INFO,
                                                    onConfirm: res => {
                                                        alert.success(res)
                                                        onClose(true)
                                                    }
                                                })
                                            }}
                                        >
                                            {approving ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                         xmlns="http://www.w3.org/2000/svg" fill="none"
                                                         viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                                                stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor"
                                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Inviting...
                                                </>
                                            ) : (
                                                'Send Invite'
                                            )}
                                        </motion.button>
                                    }
                                    <motion.button
                                        whileHover={{scale: 1.05}}
                                        whileTap={{scale: 0.95}}
                                        disabled={approving}
                                        className="px-4 py-1 cursor-pointer bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-400 dark:hover:bg-red-500 transition-colors"
                                        onClick={() => {
                                            alert.confirm({
                                                title: "Onboarding request",
                                                message: "This request will be deleted. Confirm to delete!",
                                                task: deleteRequest,
                                                type: alert.ERROR,
                                                onConfirm: res => {
                                                    alert.success(res)
                                                    onClose(true)
                                                }
                                            })
                                        }}
                                    >
                                        {approving ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                     xmlns="http://www.w3.org/2000/svg" fill="none"
                                                     viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10"
                                                            stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor"
                                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Deleteing...
                                            </>
                                        ) : (
                                            'Delete'
                                        )}
                                    </motion.button>
                                </>
                            }
                        </div>
                    </motion.div>
                </div>
            )}

        </AnimatePresence>
    );
}
//@ts-ignore
const RejectRequest = ({request, onClose, user, options}) => {
    const [rejectNotes, setRejectNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const textareaRef = useRef(null);

    const handleReject = async () => {
        if (!options.reason && !rejectNotes.trim()) {
            setError('Please provide rejection notes');
            if (textareaRef.current) {
                //@ts-ignore
                textareaRef.current.focus();
            }
            return;
        }

        const notes = options.reason ?
            `${options.reason}\n ${rejectNotes}` : rejectNotes;

        setIsSubmitting(true);
        setError('');

        try {
            // Call the service to update the request status
            const {error} = await onboardingService.updateRequestStatus(request.id, {
                status: OnboardingRequestStatus.REJECTED,
                reviewerId: user?.id,
                review_notes: notes
            });
            if (error)
                throw error

            onClose(!0);
        } catch (err) {
            console.error('Error rejecting request:', err);
            setError('Failed to reject the request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <AnimatePresence>
            {(
                <div className="">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: 20}}
                        transition={{duration: 0.3}}
                        className="bg-white dark:bg-gray-800 rounded-sm shadow-xl w-full overflow-hidden"
                    >
                        <div className="bg-red-500 dark:bg-red-600 p-4 text-white flex items-center justify-between">
                            <div className="flex items-center">
                                <AlertTriangle className="mr-2" size={20}/>
                                <h3 className="font-bold text-lg">Reject Request</h3>
                            </div>
                            <button
                                onClick={() => onClose()}
                                className="hover:bg-white hover:bg-opacity-20 rounded-full p-1"
                            >
                                <X size={20}/>
                            </button>
                        </div>

                        <div className="p-6 dark:text-gray-100">
                            <p className="mb-4">
                                You are about to reject the {request.request_type.toLowerCase()} request for{' '}
                                <span className="font-semibold">
            {request.request_type === 'ONBOARDING'
                ? request.full_name
                : request.targetUser?.fullName || 'this user'}
          </span>.
                                Please provide a reason for the rejection:
                            </p>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400"/>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {options.reason ? (
                                <div className="mb-4">
                                    <div className="flex flex-col space-y-3">
                                        <div
                                            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-start space-x-3">
                                            <div className="flex-shrink-0 text-red-500 dark:text-red-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                                     viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd"
                                                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                          clipRule="evenodd"/>
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-red-800 dark:text-red-300">System
                                                    Detected Issue</h4>
                                                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{options.reason}</p>
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-600 dark:text-gray-400 px-1">
                                            You can add additional notes below (optional):
                                        </div>

                                        <textarea
                                            value={rejectNotes}
                                            onChange={(e) => setRejectNotes(e.target.value)}
                                            placeholder="Add any additional rejection notes..."
                                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-20 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            disabled={isSubmitting}
                                        ></textarea>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <div className="mb-3">
                                        <label
                                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Select a reason or enter custom notes:
                                        </label>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                            {[
                                                {icon: "user-x", text: "Duplicate user account"},
                                                {icon: "file-x", text: "Invalid documentation"},
                                                {icon: "shield-off", text: "Security concerns"},
                                                {icon: "alert-circle", text: "Policy violation"}
                                            ].map((reason, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setRejectNotes(prev =>
                                                        prev === reason.text ? "" : reason.text
                                                    )}
                                                    className={`flex items-center p-3 border rounded-lg transition-all ${
                                                        rejectNotes === reason.text
                                                            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                                                            : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-650"
                                                    }`}
                                                >
    <span className={`flex-shrink-0 mr-2 ${
        rejectNotes === reason.text ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
    }`}>
      {reason.icon === "user-x" && (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="18" y1="8" x2="23" y2="13"></line>
              <line x1="23" y1="8" x2="18" y2="13"></line>
          </svg>
      )}
        {reason.icon === "file-x" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <path d="M14 2v6h6"></path>
                <line x1="9" y1="15" x2="15" y2="9"></line>
                <line x1="15" y1="15" x2="9" y2="9"></line>
            </svg>
        )}
        {reason.icon === "shield-off" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"></path>
                <path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        )}
        {reason.icon === "alert-circle" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        )}
    </span>
                                                    <span className="text-sm">{reason.text}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative">
<textarea
    ref={textareaRef}
    value={rejectNotes}
    onChange={(e) => setRejectNotes(e.target.value)}
    placeholder="Enter custom rejection reason..."
    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-24 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    disabled={isSubmitting}
></textarea>
                                            {rejectNotes && (
                                                <button
                                                    type="button"
                                                    onClick={() => setRejectNotes("")}
                                                    className="absolute top-3 right-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                                    aria-label="Clear text"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"
                                                         fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end space-x-3">
                                <motion.button
                                    whileHover={{scale: 1.05}}
                                    whileTap={{scale: 0.95}}
                                    onClick={() => onClose(false)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{scale: 1.05}}
                                    whileTap={{scale: 0.95}}
                                    onClick={handleReject}
                                    className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors flex items-center"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                 xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10"
                                                        stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor"
                                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        'Confirm Rejection'
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
