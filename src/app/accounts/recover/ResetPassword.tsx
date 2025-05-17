"use client"
import {useState, useEffect} from 'react';
import {CheckCircle, AlertCircle, Eye, EyeOff, Lock, KeyRound, Loader2} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import {authService} from "@/services";

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordChecks, setPasswordChecks] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false
    });
    // Check if user is authenticated with a recovery token
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const {user} = await authService.getCurrentUser();
                if (!user) {
                    setError('Invalid or expired password reset link. Please request a new password reset.');
                } else {
                    // Success animation for valid session
                    setMessage('Valid reset link detected. Please set your new password.');
                    setTimeout(() => setMessage(''), 3000);
                }
            } catch {
                setError('Error verifying reset link. Please try again.');
            }
        };
        checkAuth().then();
    }, []);

    // Password strength checker
    useEffect(() => {
        const checkPasswordStrength = () => {
            const checks = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
                special: /[^A-Za-z0-9]/.test(password)
            };

            setPasswordChecks(checks);

            // Calculate strength based on passed checks
            const passedChecks = Object.values(checks).filter(Boolean).length;
            setPasswordStrength(passedChecks / 5);
        };

        checkPasswordStrength();
    }, [password]);

    const getStrengthColor = () => {
        if (passwordStrength <= 0.2) return "bg-red-500";
        if (passwordStrength <= 0.4) return "bg-orange-500";
        if (passwordStrength <= 0.6) return "bg-yellow-500";
        if (passwordStrength <= 0.8) return "bg-blue-500";
        return "bg-green-500";
    };

    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        // Reset states
        setError('');
        setMessage('');

        // Validate passwords
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {

            // Update the user's password
            const {error} = await authService.changePassword(password);
            console.log(error)

            if (error) {
                setError('Password must be at least 6 characters');
                throw error;
            }
            setMessage('Password updated successfully!');
            // Success animation sequence
            setTimeout(() => {
                setMessage('Securing your account...');
            }, 1000);
            setTimeout(() => {
                setMessage('All done! Redirecting you to login...');
            }, 2000);

            // Redirect to login page after animation sequence
            setTimeout(() => {
                location.href = '/accounts/login';
            }, 3500);

        } catch (error) {
            setError((error as any).message || 'An error occurred while resetting your password');
        } finally {
            setLoading(false);
        }
    };

    return (
        
        <div
            className="flex w-full flex-col items-center justify-center bg-gradient-to-br from-green-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 min-h-screen p-4">
        <motion.div
                initial={{opacity: 0, y: -20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
                className="w-full  p-8"
            >
                <div className="flex items-center justify-center mb-6">
                    <motion.div
                        initial={{scale: 0}}
                        animate={{scale: 1}}
                        transition={{delay: 0.2, type: "spring", stiffness: 200}}
                    >
                        <KeyRound size={40} className="text-green-500 mr-2"/>
                    </motion.div>
                    <motion.h2
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        transition={{delay: 0.3}}
                        className="text-2xl font-bold text-gray-800 dark:text-gray-100"
                    >
                        Reset Your Password
                    </motion.h2>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: "auto"}}
                            exit={{opacity: 0, height: 0}}
                            className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded mb-4 flex items-start"
                        >
                            <AlertCircle className="mr-2 mt-1 flex-shrink-0" size={18}/>
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {message && (
                        <motion.div
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: "auto"}}
                            exit={{opacity: 0, height: 0}}
                            className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-700 dark:text-green-400 p-4 rounded mb-4 flex items-start"
                        >
                            <CheckCircle className="mr-2 mt-1 flex-shrink-0" size={18}/>
                            <span>{message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                            <Lock size={16} className="mr-2"/>
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10 transition-all duration-200"
                                required
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                        </div>

                        {/* Password strength meter */}
                        {password && (
                            <motion.div
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                className="mt-2"
                            >
                                <div
                                    className="h-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                        initial={{width: 0}}
                                        animate={{width: `${passwordStrength * 100}%`}}
                                        transition={{duration: 0.5}}
                                        className={`h-full ${getStrengthColor()}`}
                                    />
                                </div>
                                <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                                Password strength: {
                                    passwordStrength <= 0.2 ? "Very weak" :
                                        passwordStrength <= 0.4 ? "Weak" :
                                            passwordStrength <= 0.6 ? "Medium" :
                                                passwordStrength <= 0.8 ? "Strong" : "Very strong"
                                }
                                </div>

                                {/* Password requirements checklist */}
                                <div className="mt-2 grid grid-cols-2 gap-1">
                                    <div
                                        className={`text-xs flex items-center ${passwordChecks.length ? "text-green-500" : "text-gray-400"}`}>
                                        <CheckCircle size={12} className="mr-1"/>
                                        At least 8 characters
                                    </div>
                                    <div
                                        className={`text-xs flex items-center ${passwordChecks.uppercase ? "text-green-500" : "text-gray-400"}`}>
                                        <CheckCircle size={12} className="mr-1"/>
                                        Uppercase letter
                                    </div>
                                    <div
                                        className={`text-xs flex items-center ${passwordChecks.lowercase ? "text-green-500" : "text-gray-400"}`}>
                                        <CheckCircle size={12} className="mr-1"/>
                                        Lowercase letter
                                    </div>
                                    <div
                                        className={`text-xs flex items-center ${passwordChecks.number ? "text-green-500" : "text-gray-400"}`}>
                                        <CheckCircle size={12} className="mr-1"/>
                                        Number
                                    </div>
                                    <div
                                        className={`text-xs flex items-center ${passwordChecks.special ? "text-green-500" : "text-gray-400"}`}>
                                        <CheckCircle size={12} className="mr-1"/>
                                        Special character
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center">
                            <Lock size={16} className="mr-2"/>
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10 transition-all duration-200 dark:bg-gray-700 dark:text-gray-100 ${
                                    confirmPassword && password !== confirmPassword
                                        ? "border-red-300 bg-red-50 dark:border-red-500 dark:bg-red-900/30"
                                        : confirmPassword
                                            ? "border-green-300 bg-green-50 dark:border-green-500 dark:bg-green-900/30"
                                            : "border-gray-300 dark:border-gray-600"
                                }`}
                                required
                            />
                            {confirmPassword && (
                                <span className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    {password !== confirmPassword ? (
                                        <AlertCircle size={18} className="text-red-500"/>
                                    ) : (
                                        <CheckCircle size={18} className="text-green-500"/>
                                    )}
                                </span>
                            )}
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">Passwords don't match</p>
                        )}
                    </div>

                    <motion.button
                        whileHover={{scale: 1.02}}
                        whileTap={{scale: 0.98}}
                        type="submit"
                        className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 hover:bg-green-700 transition-all duration-200 flex items-center justify-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="mr-2 animate-spin"/>
                                Processing...
                            </>
                        ) : (
                            <>Reset Password</>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;