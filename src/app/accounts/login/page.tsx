"use client"
import {useEffect, useState} from 'react';
import {AlertCircle, CheckCircle, Eye, EyeOff, Lock, Phone, User, UserCircle} from 'lucide-react';
import toast from "react-hot-toast";
import {authService, sessionService} from "@/services";
import Button from "@/app/accounts/components/Button";
import {AnimatePresence, motion} from "framer-motion";
import {UserRole} from "@/models/types";
import {UserAccount} from './types';

// Define a utility for animations
const fadeIn = (delay = 0) => {
    return {
        opacity: 0,
        animation: `fadeIn 0.8s ease-out ${delay}s forwards`,
    };
};

// Enhanced UserAccount type to include tokens for authentication
interface EnhancedUserAccount extends UserAccount {
    hasStoredTokens?: boolean;
    accessToken?: string;
    refreshToken?: string;
}

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);
    const [redirectParams, setRedirectParams] = useState({redirect: '', plan: ''});
    const [previousAccounts, setPreviousAccounts] = useState<EnhancedUserAccount[]>([]);
    const [showPreviousAccounts, setShowPreviousAccounts] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<EnhancedUserAccount | null>(null);
    const [authState, setAuthState] = useState<'loading' | 'selectAccount' | 'newLogin' | 'passwordRequired' | 'authenticating'>('loading');
    const [signInMethod, setSignInMethod] = useState('email');
    const [formValues, setFormValues] = useState<any>({
        email: '',
        phone: '',
        password: '',
    });
    const [errors, setErrors] = useState<any>({
        email: '',
        phone: '',
        password: '',
        general: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimationComplete(true);
        }, 300);

        // Extract redirect parameters from URL
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || '';
            const plan = urlParams.get('plan') || '';
            setRedirectParams({redirect, plan});
        }

        // Initialize the login flow
        initializeLoginFlow();

        return () => clearTimeout(timer);
    }, []);

    const initializeLoginFlow = async () => {
        try {
            const accounts = await sessionService.getPreviousAccounts();
            if (accounts && accounts.length > 0) {
                setPreviousAccounts(accounts);
                setAuthState('selectAccount');
            } else {
                setAuthState('newLogin');
            }
        } catch (error) {
            console.error('Error fetching previous accounts:', error);
            setAuthState('newLogin');
        }
    };

    const handleInputChange = (e: { target: { name: string; value: string; }; }) => {
        const {name, value} = e.target;
        setFormValues({
            ...formValues,
            [name]: value,
        });

        // Clear errors when typing
        if (errors[name as keyof typeof errors]) {
            setErrors({
                ...errors,
                [name]: '',
                general: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {
            email: '',
            phone: '',
            password: '',
            general: ''
        };
        let isValid = true;

        if (signInMethod === 'email') {
            if (!formValues.email) {
                newErrors.email = 'Email address is required';
                isValid = false;
            } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
                newErrors.email = 'Enter a valid email address';
                isValid = false;
            }
        } else if (signInMethod === 'phone') {
            if (!formValues.phone) {
                newErrors.phone = 'Phone number is required';
                isValid = false;
            } else {
                // Remove all non-digit characters for validation
                const digitsOnly = formValues.phone.replace(/\D/g, '');

                // Check if we have at least 9 digits (minimum for a valid phone number)
                if (digitsOnly.length < 9) {
                    newErrors.phone = 'Phone number must have at least 9 digits';
                    isValid = false;
                }
                // If more than 12 digits, it's probably invalid
                else if (digitsOnly.length > 12) {
                    newErrors.phone = 'Phone number has too many digits';
                    isValid = false;
                }
            }
        }

        if (!formValues.password) {
            newErrors.password = 'Password is required';
            isValid = false;
        }

        setErrors({...errors, ...newErrors});
        return isValid;
    };

    const handleRedirectAfterLogin = (user: any) => {
        // Handle redirect based on user role and URL parameters
        const urlParams = new URLSearchParams();
        if (typeof window !== 'undefined') {
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.forEach((value, key) => {
                if (key !== 'redirect') {
                    urlParams.set(key, value);
                }
            });
        }

        if (user.role === UserRole.ADMIN && redirectParams.redirect === 'subscribe' && redirectParams.plan) {
            location.href = `/subscribe?${urlParams.toString()}`;
        } else {
            location.href = "/dashboard";
        }
    };

    const performLogin = async (identifier: string, password: string, isPhone: boolean = false) => {
        try {
            let res;
            if (isPhone) {
                // Use phone-based authentication
                res = await authService.signInWithPhone(identifier, password);
            } else {
                // Use email-based authentication
                res = await authService.signIn(identifier, password);
            }

            if (res.error) {
                throw new Error(res.error.message);
            }

            // Extract tokens from the response
            const accessToken = res.data.session?.access_token;
            const refreshToken = res.data.session?.refresh_token;

            if (!accessToken || !refreshToken) {
                throw new Error('Failed to get authentication tokens');
            }

            // Get current user to check role
            const {user, error} = await authService.getCurrentUser();
            if (error || !user) {
                //@ts-ignore
                throw new Error(error || 'Failed to get user data');
            }

            // Store/update user account with tokens for future seamless login
            await sessionService.storeUserAccount({
                id: user.id,
                email: user.email || (isPhone ? '' : identifier),
                fullName: user.full_name || '',
                lastLogin: new Date().toISOString(),
                hasStoredTokens: true,
                accessToken: accessToken,
                refreshToken: refreshToken
            });

            toast.success('Login successful');
            handleRedirectAfterLogin(user);
        } catch (err: any) {
            throw new Error(err.message || 'Failed to login');
        }
    };

    const performTokenLogin = async (account: EnhancedUserAccount) => {
        try {
            const result = await authService.signWithToken({
                access_token: account.accessToken!,
                refresh_token: account.refreshToken!
            });

            if (result.error) {
                throw new Error(result.error.message);
            }

            // Get current user to check role
            const {user, error} = await authService.getCurrentUser();
            if (error || !user) {
                //@ts-ignore
                throw new Error(error || 'Failed to get user data');
            }

            // Update the last login time
            await sessionService.storeUserAccount({
                ...account,
                lastLogin: new Date().toISOString()
            });

            toast.success('Login successful');
            handleRedirectAfterLogin(user);
        } catch (err: any) {
            throw new Error(err.message || 'Token authentication failed');
        }
    };

    // Handle selecting a previous account for seamless login
    const handleSelectAccount = async (account: EnhancedUserAccount) => {
        setSelectedAccount(account);
        setFormValues({
            email: account.email,
            password: '',
        });

        // If account has stored tokens, try seamless login
        if (account.hasStoredTokens && account.accessToken && account.refreshToken) {
            try {
                setAuthState('authenticating');
                setIsLoading(true);
                await performTokenLogin(account);
            } catch (err: any) {
                // Seamless login failed, require password verification
                setAuthState('passwordRequired');
                toast.error('Please verify your password to continue');
            } finally {
                setIsLoading(false);
            }
        } else {
            // No stored tokens, require password input
            setAuthState('passwordRequired');
        }
    };

    const handleSubmit = async (e?: { preventDefault: () => void; }) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        if (!validateForm()) return;

        try {
            setIsLoading(true);
            setAuthState('authenticating');

            if (signInMethod === 'phone') {
                await performLogin(formValues.phone, formValues.password, true);
            } else {
                await performLogin(formValues.email, formValues.password, false);
            }
        } catch (err: any) {
            toast.error(`Login failed. ${err.message}`);
            setErrors((prev: any) => ({...prev, general: err.message}));

            if (selectedAccount) {
                setAuthState('passwordRequired');
            } else {
                setAuthState('newLogin');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle using a different account or creating new login
    const handleNewLogin = () => {
        setFormValues({
            email: '',
            password: '',
        });
        setSelectedAccount(null);
        setAuthState('newLogin');
        setErrors({email: '', password: '', general: ''});
    };

    const handleBackToAccountSelection = () => {
        setFormValues({
            email: '',
            password: '',
        });
        setSelectedAccount(null);
        setAuthState('selectAccount');
        setErrors({email: '', password: '', general: ''});
    };

    const textVariants = {
        hidden: {opacity: 0},
        visible: {
            opacity: 1,
            transition: {duration: 0.7, ease: "easeOut"}
        }
    };

    const getPageTitle = () => {
        switch (authState) {
            case 'passwordRequired':
                return 'Verify Your Password';
            case 'authenticating':
                return 'Signing You In...';
            case 'selectAccount':
                return 'Welcome Back';
            default:
                return 'Sign In to Your Account';
        }
    };

    return (
        <>
            <div className="w-full min-h-full flex flex-col gap-2 justify-center items-center p-6 dark:bg-gray-900">
                <div
                    className="md:bg-white md:dark:bg-gray-800 w-full md:max-w-md md:p-8 md:rounded-xl md:shadow-lg"
                    style={{
                        ...fadeIn(0.3),
                        transform: animationComplete ? 'none' : 'translateY(20px)',
                        transition: 'transform 0.8s ease-out',
                    }}
                >
                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
                        {getPageTitle()}
                    </h2>

                    {/* Loading State */}
                    <AnimatePresence>
                        {authState === 'loading' && (
                            <motion.div
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                exit={{opacity: 0}}
                                className="text-center py-8"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full mb-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Authenticating State */}
                    <AnimatePresence>
                        {authState === 'authenticating' && (
                            <motion.div
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                exit={{opacity: 0}}
                                className="text-center py-8"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full mb-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Signing you in{selectedAccount ? ` as ${selectedAccount.fullName || selectedAccount.email}` : ''}...
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Account Selection */}
                    <AnimatePresence>
                        {authState === 'selectAccount' && (
                            <motion.div
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                exit={{opacity: 0}}
                                className="space-y-4"
                            >
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Choose an account to continue
                                </p>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {previousAccounts.map((account) => (
                                        <div
                                            key={account.id}
                                            onClick={() => handleSelectAccount(account)}
                                            className="flex items-center p-4 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600"
                                        >
                                            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full mr-3">
                                                <UserCircle className="h-6 w-6 text-green-600 dark:text-green-400"/>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                    {account.fullName || account.email}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {account.email}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    Last login: {new Date(account.lastLogin).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {account.hasStoredTokens && (
                                                <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                                                    <CheckCircle className="h-4 w-4 mr-1"/>
                                                    Quick sign-in
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleNewLogin}
                                    className="w-full mt-4 py-2 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                >
                                    Sign in with a different account
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Selected Account Info */}
                    <AnimatePresence>
                        {selectedAccount && authState === 'passwordRequired' && (
                            <motion.div
                                initial={{opacity: 0, height: 0}}
                                animate={{opacity: 1, height: 'auto'}}
                                exit={{opacity: 0, height: 0}}
                                className="mb-6"
                            >
                                <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full mr-3">
                                        <UserCircle className="h-6 w-6 text-green-600 dark:text-green-400"/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {selectedAccount.fullName || selectedAccount.email}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {selectedAccount.email}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleBackToAccountSelection}
                                    className="w-full mt-2 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                                >
                                    Use a different account
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Login Form */}
                    <AnimatePresence>
                        {(authState === 'newLogin' || authState === 'passwordRequired') && (
                            <motion.div
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                exit={{opacity: 0}}
                                className="space-y-6"
                            >
                                <form onSubmit={handleSubmit}>
                                    {/* Toggle between email and phone */}
                                    {authState === 'newLogin' && (
                                        <div className="mb-6">
                                            <div className="flex flex-col items-center space-y-2">
                                                <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSignInMethod('phone')}
                                                        className={`px-4 py-2 rounded ${signInMethod === 'phone'
                                                            ? 'bg-green-600 text-white dark:bg-green-500'
                                                            : 'text-gray-600 dark:text-gray-300'}`}
                                                    >
                                                        Phone
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSignInMethod('email')}
                                                        className={`px-4 py-2 rounded ${signInMethod === 'email'
                                                            ? 'bg-green-600 text-white dark:bg-green-500'
                                                            : 'text-gray-600 dark:text-gray-300'}`}
                                                    >
                                                        Email
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                                                    {signInMethod === 'phone' 
                                                        ? "You can log in with your phone number even if you registered with email"
                                                        : "Use your registered email address to log in"}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Email Input - only show for new login with email method */}
                                    {authState === 'newLogin' && signInMethod === 'email' && (
                                        <div>
                                            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500"/>
                                                </div>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    value={formValues.email}
                                                    onChange={handleInputChange}
                                                    className={`pl-10 block w-full rounded-md py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                                                        focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white`}
                                                    placeholder="Enter your email address"
                                                    autoFocus={signInMethod === 'email'}
                                                />
                                            </div>
                                            {errors.email && (
                                                <div className="mt-1 flex items-center text-red-500 text-sm">
                                                    <AlertCircle className="h-4 w-4 mr-1"/>
                                                    {errors.email}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Phone Input - only show for new login with phone method */}
                                    {authState === 'newLogin' && signInMethod === 'phone' && (
                                        <div>
                                            <label htmlFor="phone" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Phone className="h-5 w-5 text-gray-400 dark:text-gray-500"/>
                                                </div>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    value={formValues.phone}
                                                    onChange={handleInputChange}
                                                    className={`pl-10 block w-full rounded-md py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                                                        focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white`}
                                                    placeholder="e.g. 0712345678 or +254712345678"
                                                    autoFocus={signInMethod === 'phone'}
                                                    pattern="[0-9+\s\-()]+"
                                                    title="Enter a valid phone number (digits, +, spaces, hyphens allowed)"
                                                />
                                            </div>
                                            {errors.phone && (
                                                <div className="mt-1 flex items-center text-red-500 text-sm">
                                                    <AlertCircle className="h-4 w-4 mr-1"/>
                                                    {errors.phone}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Password Input */}
                                    <div className={"mt-3"}>
                                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {authState === 'passwordRequired' ? 'Enter your password to continue' : 'Password'}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500"/>
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                name="password"
                                                value={formValues.password}
                                                onChange={handleInputChange}
                                                className={`pl-10 pr-10 block w-full rounded-md py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                                                    focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white`}
                                                placeholder="Enter your password"
                                                autoFocus={authState === 'passwordRequired'}
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                                </button>
                                            </div>
                                        </div>
                                        {errors.password && (
                                            <div className="mt-1 flex items-center text-red-500 text-sm">
                                                <AlertCircle className="h-4 w-4 mr-1"/>
                                                {errors.password}
                                            </div>
                                        )}
                                    </div>

                                    {/* Remember me and Forgot password - only show for new login */}
                                    {authState === 'newLogin' && (
                                        <div className="flex mt-3 items-center justify-between">
                                            <div className="flex items-center">
                                                <input
                                                    id="remember-me"
                                                    name="remember-me"
                                                    type="checkbox"
                                                    className="h-4 w-4 text-green-600 dark:text-green-500 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded"
                                                />
                                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                                    Remember me
                                                </label>
                                            </div>
                                            <div className="text-sm">
                                                <a href="/accounts/password-reset" className="font-medium text-green-600 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400">
                                                    Forgot password?
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {errors.general && (
                                        <div className="mt-1 flex items-center text-red-500 text-sm">
                                            <AlertCircle className="h-4 w-4 mr-1"/>
                                            {errors.general}
                                        </div>
                                    )}

                                    <div className={"mt-5"}>
                                        <Button
                                            text={authState === 'passwordRequired' ? "Continue" : "Sign In"}
                                            isLoading={isLoading}
                                            onClick={handleSubmit}
                                        />
                                    </div>
                                </form>

                                {/* Back to accounts option for password verification */}
                                {authState === 'passwordRequired' && previousAccounts.length > 1 && (
                                    <div className="text-center">
                                        <button
                                            onClick={handleBackToAccountSelection}
                                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                        >
                                            Choose a different account
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <motion.div
                    className="mt-2 text-gray-400 text-xs"
                    variants={textVariants}
                >
                    Safaricom SIM Tracker v1.0.0
                </motion.div>

                <motion.div
                    className="mt-6 text-gray-600 text-sm"
                    variants={textVariants}
                >
                    Having trouble logging in? <a href="#" className="text-green-600 hover:text-green-700 font-medium">Contact Support</a>
                </motion.div>

                <motion.div
                    className="mt-2 text-gray-600 text-sm"
                    variants={textVariants}
                >
                    Don't have an account? <a href="/accounts/register" className="text-green-600 hover:text-green-700 font-medium">Register Now</a>
                </motion.div>
            </div>
        </>
    );
};
