"use client"
import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {useSecurity} from "@/hooks/useSecurity";

const fadeIn = {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {duration: 0.3}}
};

const slideIn = {
    hidden: {opacity: 0, y: 20},
    visible: {opacity: 1, y: 0, transition: {duration: 0.4}}
};

const SessionManagementModal = ({
                                    isOpen,
                                    onClose,
                                    sessions,
                                    onTerminate,
                                    onTerminateAll,
                                    loading
                                }: {
    isOpen: boolean;
    onClose: () => void;
    sessions: { id: string; device: string; lastActive: Date; ipAddress: string }[];
    onTerminate: (id: string) => Promise<void>;
    onTerminateAll: () => Promise<void>;
    loading: boolean;
}) => {
    const [terminating, setTerminating] = useState<string | null>(null);
    const [terminatingAll, setTerminatingAll] = useState(false);

    const handleTerminate = async (id: string) => {
        setTerminating(id);
        await onTerminate(id);
        setTerminating(null);
    };

    const handleTerminateAll = async () => {
        setTerminatingAll(true);
        await onTerminateAll();
        setTerminatingAll(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{opacity: 0, scale: 0.95}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.95}}
                className="bg-white rounded-lg p-6 w-full max-w-2xl m-4"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Active Sessions</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20"
                             fill="currentColor">
                            <path fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"/>
                        </svg>
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        These are all the devices currently signed in to your account.
                    </p>
                </div>

                {loading ? (
                    <div className="py-8 text-center">
                        <p className="text-gray-500">Loading sessions...</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-hidden border border-gray-200 rounded-md mb-4">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last
                                        Active
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP
                                        Address
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {sessions.map((session) => (
                                    <tr key={session.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{session.device}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(session.lastActive).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{session.ipAddress}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleTerminate(session.id)}
                                                disabled={terminating === session.id}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                            >
                                                {terminating === session.id ? 'Terminating...' : 'Terminate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {sessions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                                            No active sessions found.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        {sessions.length > 1 && (
                            <div className="text-right">
                                <button
                                    onClick={handleTerminateAll}
                                    disabled={terminatingAll}
                                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                    {terminatingAll ? 'Terminating All...' : 'Terminate All Other Sessions'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </motion.div>
        </div>
    );
};

// Two Factor Method Selection Modal
const TwoFactorMethodModal = ({
                                  isOpen,
                                  onClose,
                                  onSelect,
                                  currentMethod
                              }: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (method: 'email' | 'sms') => void;
    currentMethod: 'email' | 'sms';
}) => {
    const [selectedMethod, setSelectedMethod] = useState<'email' | 'sms'>(currentMethod);

    const handleConfirm = () => {
        onSelect(selectedMethod);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-modal bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{opacity: 0, scale: 0.95}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.95}}
                className="bg-white rounded-lg p-6 w-full max-w-md m-4"
            >
                <h3 className="text-lg font-medium mb-4">Select Verification Method</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Choose how you want to receive verification codes:
                </p>

                <div className="space-y-2 mb-6">
                    <label className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 cursor-pointer">
                        <input
                            type="radio"
                            name="twoFactorMethod"
                            value="email"
                            checked={selectedMethod === 'email'}
                            onChange={() => setSelectedMethod('email')}
                            className="h-5 w-5 text-green-600"
                        />
                        <div>
                            <p className="font-medium">Email</p>
                            <p className="text-sm text-gray-500">Receive verification codes via email</p>
                        </div>
                    </label>

                    <label className="flex items-center space-x-3 p-3 rounded-md border border-gray-200 cursor-pointer">
                        <input
                            type="radio"
                            name="twoFactorMethod"
                            value="sms"
                            checked={selectedMethod === 'sms'}
                            onChange={() => setSelectedMethod('sms')}
                            className="h-5 w-5 text-green-600"
                        />
                        <div>
                            <p className="font-medium">SMS</p>
                            <p className="text-sm text-gray-500">Receive verification codes via text message</p>
                        </div>
                    </label>
                </div>

                <div className="flex justify-end space-x-2">
                    <button
                        type={"button"}
                        onClick={onClose}
                        className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        type={"button"}
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        Confirm
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Main Security Settings Component
const SecuritySettings = () => {
    const {
        securityFormik,
        securityActivity,
        activeSessions,
        loading,
        error,
        twoFactorMethod,
        twoFactorPending,
        verificationId,
        fetchSecurityData,
        terminateSession,
        terminateAllOtherSessions,
        verifyTwoFactorCode,
        resendVerificationCode,
        changeTwoFactorMethod,
    } = useSecurity();

    // Modal states
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showSessionsModal, setShowSessionsModal] = useState(false);
    const [showMethodModal, setShowMethodModal] = useState(false);

    // Handle two-factor toggle
    const handleTwoFactorToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        securityFormik.setFieldValue('twoFactor', checked);

        if (checked) {
            // If enabling, show method selection modal
            setShowMethodModal(true);
        } else {
            // If disabling, just submit the form
            securityFormik.handleSubmit();
        }
    };

    // Effect to show verification modal when two-factor is pending
    React.useEffect(() => {
        if (twoFactorPending && verificationId) {
            setShowVerificationModal(true);
        } else {
            setShowVerificationModal(false);
        }
    }, [twoFactorPending, verificationId]);

    return (
        <>
            <motion.div
                className="space-y-6"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
            >
                {error && (
                    <motion.div
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={securityFormik.handleSubmit}>
                    <div>
                        <h3 className="text-md font-medium text-gray-700 mb-3">Password Management</h3>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={securityFormik.values.currentPassword}
                                    onChange={securityFormik.handleChange}
                                    onBlur={securityFormik.handleBlur}
                                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                                        securityFormik.touched.currentPassword && securityFormik.errors.currentPassword
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300'
                                    }`}
                                />
                                {securityFormik.touched.currentPassword && securityFormik.errors.currentPassword && (
                                    <motion.p
                                        initial={{opacity: 0, y: -10}}
                                        animate={{opacity: 1, y: 0}}
                                        className="mt-1 text-sm text-red-600"
                                    >
                                        {securityFormik.errors.currentPassword}
                                    </motion.p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={securityFormik.values.newPassword}
                                    onChange={securityFormik.handleChange}
                                    onBlur={securityFormik.handleBlur}
                                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                                        securityFormik.touched.newPassword && securityFormik.errors.newPassword
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300'
                                    }`}
                                />
                                {securityFormik.touched.newPassword && securityFormik.errors.newPassword && (
                                    <motion.p
                                        initial={{opacity: 0, y: -10}}
                                        animate={{opacity: 1, y: 0}}
                                        className="mt-1 text-sm text-red-600"
                                    >
                                        {securityFormik.errors.newPassword}
                                    </motion.p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New
                                    Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={securityFormik.values.confirmPassword}
                                    onChange={securityFormik.handleChange}
                                    onBlur={securityFormik.handleBlur}
                                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                                        securityFormik.touched.confirmPassword && securityFormik.errors.confirmPassword
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300'
                                    }`}
                                />
                                {securityFormik.touched.confirmPassword && securityFormik.errors.confirmPassword && (
                                    <motion.p
                                        initial={{opacity: 0, y: -10}}
                                        animate={{opacity: 1, y: 0}}
                                        className="mt-1 text-sm text-red-600"
                                    >
                                        {securityFormik.errors.confirmPassword}
                                    </motion.p>
                                )}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={!(securityFormik.dirty && securityFormik.isValid) || securityFormik.isSubmitting}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {securityFormik.isSubmitting ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                <motion.div
                    variants={slideIn}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="twoFactor"
                                checked={securityFormik.values.twoFactor}
                                onChange={handleTwoFactorToggle}
                                className="sr-only peer"
                                disabled={loading}
                            />
                            <div
                                className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    <AnimatePresence>
                        {securityFormik.values.twoFactor && (
                            <motion.div
                                initial={{opacity: 0, height: 0}}
                                animate={{opacity: 1, height: 'auto'}}
                                exit={{opacity: 0, height: 0}}
                                className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-green-800">
                                        Two-factor authentication
                                        is {twoFactorPending ? 'pending verification' : 'enabled'}.
                                        {twoFactorMethod === 'email'
                                            ? ' Verification codes will be sent to your registered email address.'
                                            : ' Verification codes will be sent to your registered phone number.'}
                                    </p>

                                    <button
                                        type={"button"}
                                        onClick={() => setShowMethodModal(true)}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline ml-2"
                                    >
                                        Change Method
                                    </button>
                                </div>

                                {twoFactorPending && (
                                    <motion.div
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        className="mt-2"
                                    >
                                        <button
                                            onClick={() => setShowVerificationModal(true)}
                                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Verify Now
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div
                    className="mt-6"
                    variants={slideIn}
                >
                    <h3 className="text-md font-medium text-gray-700 mb-3">Security Activity</h3>
                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                        <div className="p-3 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium">Last password change</p>
                                <p className="text-xs text-gray-500">
                                    {securityActivity?.lastPasswordChange
                                        ? new Date(securityActivity.lastPasswordChange).toLocaleDateString()
                                        : 'Never'}
                                </p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {securityActivity?.lastPasswordChange &&
                new Date(securityActivity.lastPasswordChange).getTime() > Date.now() - (90 * 24 * 60 * 60 * 1000)
                    ? 'Secure'
                    : 'Update Recommended'}
              </span>
                        </div>
                        <div className="p-3 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium">Last login</p>
                                <p className="text-xs text-gray-500">
                                    {securityActivity?.lastLogin
                                        ? new Date(securityActivity.lastLogin).toLocaleString()
                                        : 'Unknown'}
                                </p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Current</span>
                        </div>
                        <div className="p-3 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium">Active sessions</p>
                                <p className="text-xs text-gray-500">{securityActivity?.activeSessions || 0} devices</p>
                            </div>
                            <button
                                onClick={() => setShowSessionsModal(true)}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                                Manage
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {showVerificationModal && (
                    <TwoFactorVerificationModal
                        isOpen={showVerificationModal}
                        onClose={() => setShowVerificationModal(false)}
                        onVerify={verifyTwoFactorCode}
                        onResend={resendVerificationCode}
                        method={twoFactorMethod}
                    />
                )}

                {showSessionsModal && (
                    <SessionManagementModal
                        isOpen={showSessionsModal}
                        onClose={() => setShowSessionsModal(false)}
                        sessions={activeSessions}
                        onTerminate={terminateSession}
                        onTerminateAll={terminateAllOtherSessions}
                        loading={loading}
                    />
                )}

                {showMethodModal && (
                    <TwoFactorMethodModal
                        isOpen={showMethodModal}
                        onClose={() => setShowMethodModal(false)}
                        onSelect={(method) => {
                            changeTwoFactorMethod(method);
                            if (securityFormik.dirty)
                                securityFormik.handleSubmit();
                        }}
                        currentMethod={twoFactorMethod}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default SecuritySettings;

// Two Factor Verification Modal
const TwoFactorVerificationModal = ({
                                        isOpen,
                                        onClose,
                                        onVerify,
                                        onResend,
                                        method
                                    }: {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (code: string) => Promise<boolean>;
    onResend: () => Promise<boolean>;
    method: 'email' | 'sms';
}) => {
    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleVerify = async () => {
        if (!code.trim()) {
            setError('Please enter the verification code');
            return;
        }

        setVerifying(true);
        setError(null);

        try {
            const success = await onVerify(code);
            if (success) {
                setCode('');
                onClose();
            } else {
                setError('Invalid verification code. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setResendSuccess(false);
        setError(null);

        try {
            const success = await onResend();
            if (success) {
                setResendSuccess(true);
                setTimeout(() => setResendSuccess(false), 3000);
            } else {
                setError('Failed to resend code');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{opacity: 0, scale: 0.95}}
                animate={{opacity: 1, scale: 1}}
                exit={{opacity: 0, scale: 0.95}}
                className="bg-white rounded-lg p-6 w-full max-w-md m-4"
            >
                <h3 className="text-lg font-medium mb-4">Verify Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600 mb-4">
                    {method === 'email'
                        ? 'We sent a verification code to your email address.'
                        : 'We sent a verification code to your phone number.'}
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                    />
                    {error && (
                        <p className="mt-1 text-sm text-red-600">{error}</p>
                    )}
                    {resendSuccess && (
                        <p className="mt-1 text-sm text-green-600">Code resent successfully!</p>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    <button
                        onClick={handleResend}
                        disabled={resending}
                        className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
                    >
                        {resending ? 'Resending...' : 'Resend Code'}
                    </button>

                    <div className="space-x-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleVerify}
                            disabled={verifying}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            {verifying ? 'Verifying...' : 'Verify'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};