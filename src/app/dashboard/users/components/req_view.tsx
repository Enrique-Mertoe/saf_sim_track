import {useState, useEffect} from 'react';
import {
    ChevronDown,
    User,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    ArrowLeft,
    Phone,
    Briefcase,
    MapPin,
    CreditCard
} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import {storageService} from "@/services";
import {OnboardingRequest} from "@/models";

// Define the necessary types based on your existing code
export default function RequestDetailViewer({request, onClose}: {
    request: OnboardingRequest, onClose: Closure
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
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get appropriate status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'approved':
                return 'bg-green-100 text-green-800 border-green-300';
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    // Get appropriate request type color
    const getRequestTypeColor = (type) => {
        return type === 'ONBOARDING'
            ? 'bg-blue-100 text-blue-800 border-blue-300'
            : 'bg-purple-100 text-purple-800 border-purple-300';
    };

    return (
        <AnimatePresence>
            {request && (
                <div className="">
                    <motion.div
                        initial={{opacity: 0, scale: 0.9}}
                        animate={isOpen ? {opacity: 1, scale: 1} : {opacity: 0, scale: 0.9}}
                        exit={{opacity: 0, scale: 0.9}}
                        transition={{duration: 0.5, type: 'spring', bounce: 0.3}}
                        className="bg-white rounded  w-full overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-green-500 to-green-700 p-6 text-white">
                            <motion.button
                                onClick={handleClose}
                                className="absolute cursor-pointer top-6 left-6 flex items-center text-white hover:bg-green-300 hover:bg-opacity-20 rounded-full p-1 transition-all"
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
                        <div className="flex border-b">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`flex-1 py-4 font-medium ${activeTab === 'details' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
                            >
                                Request Details
                            </button>
                            <button
                                onClick={() => setActiveTab('timeline')}
                                className={`flex-1 py-4 font-medium ${activeTab === 'timeline' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
                            >
                                Timeline
                            </button>
                            {request.request_type === 'ONBOARDING' && (
                                <button
                                    onClick={() => setActiveTab('documents')}
                                    className={`flex-1 py-4 font-medium ${activeTab === 'documents' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}
                                >
                                    Documents
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-96 overflow-y-auto">
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
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <div className="flex items-center mb-3 text-green-600">
                                                    <User size={20}/>
                                                    <h3 className="font-semibold ml-2">Request Information</h3>
                                                </div>
                                                <ul className="space-y-3">
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-500">ID:</span>
                                                        <span
                                                            className="font-medium">{request.id.substring(0, 8)}...</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-500">Created:</span>
                                                        <span
                                                            className="font-medium">{formatDate(request.created_at)}</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-500">Requested By:</span>
                                                        <span
                                                            className="font-medium">{request.requestedBy?.full_name || 'N/A'}</span>
                                                    </li>
                                                    <li className="flex justify-between">
                                                        <span className="text-gray-500">Role:</span>
                                                        <span
                                                            className="font-medium">{request.requestedBy?.role || 'N/A'}</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <div className="flex items-center mb-3 text-green-600">
                                                    <Briefcase size={20}/>
                                                    <h3 className="font-semibold ml-2">Subject Details</h3>
                                                </div>
                                                <ul className="space-y-3">
                                                    {request.request_type === 'ONBOARDING' ? (
                                                        <>
                                                            <li className="flex justify-between">
                                                                <span className="text-gray-500">Full Name:</span>
                                                                <span className="font-medium">{request.full_name}</span>
                                                            </li>
                                                            <li className="flex justify-between">
                                                                <span className="text-gray-500">ID Number:</span>
                                                                <span className="font-medium">{request.id_number}</span>
                                                            </li>
                                                            <li className="flex justify-between">
                                                                <span className="text-gray-500">Phone:</span>
                                                                <span
                                                                    className="font-medium">{request.phone_number}</span>
                                                            </li>
                                                            <li className="flex justify-between">
                                                                <span className="text-gray-500">Team:</span>
                                                                <span
                                                                    className="font-medium">{request.teams?.name || 'N/A'}</span>
                                                            </li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li className="flex justify-between">
                                                                <span className="text-gray-500">Target User:</span>
                                                                <span
                                                                    className="font-medium">{request.targetUser?.fullName || 'N/A'}</span>
                                                            </li>
                                                            <li className="flex justify-between">
                                                                <span className="text-gray-500">ID Number:</span>
                                                                <span
                                                                    className="font-medium">{request.targetUser?.idNumber || 'N/A'}</span>
                                                            </li>
                                                            <li className="flex justify-between">
                                                                <span className="text-gray-500">Reason:</span>
                                                                <span
                                                                    className="font-medium">{request.review_notes || 'Not specified'}</span>
                                                            </li>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>

                                            {request.status !== 'pending' && (
                                                <div
                                                    className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                    <div className="flex items-center mb-3 text-green-600">
                                                        <CheckCircle size={20}/>
                                                        <h3 className="font-semibold ml-2">Review Information</h3>
                                                    </div>
                                                    <ul className="space-y-3">
                                                        <li className="flex justify-between">
                                                            <span className="text-gray-500">Reviewed By:</span>
                                                            <span
                                                                className="font-medium">{request.reviewedBy?.full_name || 'N/A'}</span>
                                                        </li>
                                                        <li className="flex justify-between">
                                                            <span className="text-gray-500">Review Date:</span>
                                                            <span
                                                                className="font-medium">{request.review_date ? formatDate(request.review_date) : 'N/A'}</span>
                                                        </li>
                                                        <li className="flex flex-col">
                                                            <span className="text-gray-500">Notes:</span>
                                                            <span
                                                                className="font-medium mt-1">{request.review_notes || 'No notes provided'}</span>
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
                                        <div className="relative border-l-2 border-green-200 ml-6 pl-6 py-2">
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
                                                    <p className="text-sm text-gray-500">{formatDate(request.created_at)}</p>
                                                    <h3 className="font-medium text-lg mt-1">Request Created</h3>
                                                    <p className="text-gray-600 mt-1">
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
                                                        <p className="text-sm text-gray-500">{formatDate(request.review_date || request.created_at)}</p>
                                                        <h3 className="font-medium text-lg mt-1">Request {request.status.charAt(0).toUpperCase() + request.status.slice(1)}</h3>
                                                        <p className="text-gray-600 mt-1">
                                                            {request.reviewedBy?.full_name || 'Administrator'} {request.status} the
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
                                                        <p className="text-sm text-gray-500">Current Status</p>
                                                        <h3 className="font-medium text-lg mt-1">Awaiting Review</h3>
                                                        <p className="text-gray-600 mt-1">
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
                                                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                                            >
                                                <div className="flex items-center mb-3 text-green-600">
                                                    <CreditCard size={20}/>
                                                    <h3 className="font-semibold ml-2">ID Front</h3>
                                                </div>
                                                <div className="bg-white rounded border border-gray-200 p-1 shadow-sm">
                                                    <div
                                                        className="aspect-[3/2] bg-gray-100 rounded flex items-center justify-center">
                                                        {front_url ? (
                                                            <img
                                                                src={front_url || "/api/placeholder/300/200"}
                                                                alt="ID Front"
                                                                className="object-cover rounded h-full w-full"
                                                                onError={(e) => {
                                                                    storageService.getDataImage(request.id_front_url)
                                                                        .then(res => {
                                                                            e.target.src = res
                                                                        });
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="flex items-center justify-center w-full h-full">
                                                                <div
                                                                    className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
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
                                                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                                            >
                                                <div className="flex items-center mb-3 text-green-600">
                                                    <CreditCard size={20}/>
                                                    <h3 className="font-semibold ml-2">ID Back</h3>
                                                </div>
                                                <div className="bg-white rounded border border-gray-200 p-1 shadow-sm">
                                                    <div
                                                        className="aspect-[3/2] bg-gray-100 rounded flex items-center justify-center">
                                                        {back_url ? (
                                                            <img
                                                                src={back_url || "/api/placeholder/300/200"}
                                                                alt="ID Back"
                                                                className="object-cover rounded h-full w-full"
                                                                onError={(e) => {
                                                                    storageService.getDataImage(request.id_back_url)
                                                                        .then(res => {
                                                                            e.target.src = res
                                                                        });
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="flex items-center justify-center w-full h-full">
                                                                <div
                                                                    className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
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
                        <div className="border-t p-4 flex justify-end space-x-3">
                            <motion.button
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                                onClick={handleClose}
                            >
                                Close
                            </motion.button>

                            {request.status === 'pending' && (
                                <>
                                    <motion.button
                                        whileHover={{scale: 1.05}}
                                        whileTap={{scale: 0.95}}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        Reject
                                    </motion.button>
                                    <motion.button
                                        whileHover={{scale: 1.05}}
                                        whileTap={{scale: 0.95}}
                                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                    >
                                        Approve
                                    </motion.button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}