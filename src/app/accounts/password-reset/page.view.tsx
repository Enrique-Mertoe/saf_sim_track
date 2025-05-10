'use client';

import {useState, useEffect} from 'react';
import {CheckCircle, Mail, Lock, ArrowLeft, Loader2} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import {authService} from "@/services";
import toast from "react-hot-toast";

export default function ResetPasswordForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    const showNotification = (message: string, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    };

    useEffect(() => {
        if (showToast) {
            const timer = setTimeout(() => {
                setShowToast(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [showToast]);

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await authService.resetPassword(email);
            if (res.error) {
                toast.error(`Something went wrong. ${res.error}`);
                return;
            }
            setSent(true);
            showNotification('Password reset link sent to your email');
        } catch (error) {
            console.error('Reset password error:', error);
            showNotification('Failed to send reset link. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="flex w-full md:w-1/2 min-h-screen items-center justify-center p-4 bg-gradient-to-br from-green-50 to-indigo-50">
            <AnimatePresence mode="wait">
                {sent ? (
                    <motion.div
                        key="success"
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -20}}
                        transition={{duration: 0.3}}
                        className="w-full bg-whiterounded-xlshadow-lg p-8 mx-auto borderborder-green-900"
                    >
                        <div className="flex flex-col items-center justify-center mb-6">
                            <motion.div
                                initial={{scale: 0}}
                                animate={{scale: 1}}
                                transition={{type: "spring", stiffness: 260, damping: 20, delay: 0.2}}
                            >
                                <div className="bg-green-100 p-3 rounded-full mb-4">
                                    <CheckCircle className="h-12 w-12 text-green-600"/>
                                </div>
                            </motion.div>
                            <h2 className="text-3xl font-bold text-center text-gray-800">Check Your Email</h2>
                            <div className="w-16 h-1 bg-green-400 rounded-full mt-4 mb-6"></div>
                        </div>

                        <motion.p
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            transition={{delay: 0.3}}
                            className="text-center text-gray-600 mb-8 text-lg"
                        >
                            We`ve sent a password reset link to <br/>
                            <span className="font-medium text-indigo-600">{email}</span>
                        </motion.p>

                        <motion.div
                            whileHover={{scale: 1.02}}
                            whileTap={{scale: 0.98}}
                        >
                            <button
                                onClick={() => setSent(false)}
                                className="w-full group flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300"
                            >
                                <ArrowLeft
                                    className="h-5 w-5 mr-2 group-hover:translate-x-[-2px] transition-transform"/>
                                Back to Reset Password
                            </button>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -20}}
                        transition={{duration: 0.3}}
                        className="max-w-md w-full bg-whiterounded-xlshadow-lg p-8 mx-auto border border-green-100"
                    >
                        <div className="flex flex-col items-center justify-center mb-6">
                            <motion.div
                                initial={{scale: 0}}
                                animate={{scale: 1}}
                                transition={{type: "spring", stiffness: 260, damping: 20}}
                            >
                                <div className="bg-green-100 p-3 rounded-full mb-4">
                                    <Lock className="h-10 w-10 text-green-600"/>
                                </div>
                            </motion.div>
                            <h2 className="text-3xl font-bold text-center text-gray-800">Reset Password</h2>
                            <div className="w-16 h-1 bg-green-400 rounded-full mt-4 mb-6"></div>
                        </div>

                        <motion.p
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            transition={{delay: 0.2}}
                            className="text-center text-gray-600 mb-8"
                        >
                            Enter your email address and we`ll send you a link to reset your password.
                        </motion.p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400"/>
                                    </div>
                                    <motion.input
                                        whileFocus={{scale: 1.01}}
                                        transition={{type: "spring", stiffness: 300, damping: 10}}
                                        id="email"
                                        type="email"
                                        className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            <motion.div
                                whileHover={{scale: 1.02}}
                                whileTap={{scale: 0.98}}
                            >
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-70"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin"/>
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </motion.div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{opacity: 0, y: 50, x: "-50%"}}
                        animate={{opacity: 1, y: 0, x: "-50%"}}
                        exit={{opacity: 0, y: 50, x: "-50%"}}
                        className={`fixed bottom-6 left-1/2 transform px-4 py-3 rounded-lg shadow-lg flex items-center ${
                            toastType === 'success' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
                        }`}
                    >
                        {toastType === 'success' ? (
                            <CheckCircle className="h-5 w-5 mr-2 text-green-500"/>
                        ) : (
                            <div
                                className="h-5 w-5 mr-2 text-red-500 flex items-center justify-center font-bold">!</div>
                        )}
                        <p className={`text-sm ${toastType === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                            {toastMessage}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}