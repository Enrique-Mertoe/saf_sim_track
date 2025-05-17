"use client"
// WelcomePage.tsx
import React, {useState, useEffect} from 'react';
import Image from 'next/image';
import {motion} from 'framer-motion';
import {authService} from "@/services";
import welcomIcon from "@/app/welcome-illustration.svg"

// Type definitions
interface FormState {
    password: string;
    confirmPassword: string;
}

interface FormErrors {
    password?: string;
    confirmPassword?: string;
    general?: string;
}

const WelcomePage: React.FC = () => {
    const [token, setAccessToken] = useState<string | null>(null);
    const [formState, setFormState] = useState<FormState>({
        password: '',
        confirmPassword: '',
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [pageStep, setPageStep] = useState<'welcome' | 'password' | 'success'>('welcome');
    const [animation, setAnimation] = useState<string>('');
    useEffect(() => {
        const fragment = window.location.hash;
        if (fragment) {
            const params = new URLSearchParams(fragment.substring(1));
            const token = params.get('access_token');
            if (token) {
                setAccessToken(token);
            }
        }
    }, []);
    useEffect(() => {
        const authorise = async () => {
            const hash = window.location.hash;
            const {error} = await authService.tokenAuthorise(hash);
            if (error) {
                // console.error("Error signing in:", error);
                setFormErrors({general: 'Invalid or expired password reset link. Please request a new password reset.'});
            }

        }
        authorise().then()
    }, []);

    const validateForm = (): boolean => {
        const errors: FormErrors = {};

        if (!formState.password) {
            errors.password = 'Password is required';
        } else if (formState.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        if (!formState.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formState.confirmPassword !== formState.password) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormState(prev => ({...prev, [name]: value}));

        // Clear errors when typing
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({...prev, [name]: undefined}));
        }
    };

    const handleStartClick = () => {
        setAnimation('slideOut');
        setTimeout(() => {
            setPageStep('password');
            setAnimation('slideIn');
        }, 500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const {error} = await authService.changePassword(formState.password);

            if (error) {
                throw error;
            }

            // Success
            setAnimation('fadeOut');
            setTimeout(() => {
                setIsSuccess(true);
                setPageStep('success');
                setAnimation('fadeIn');
            }, 500);

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
                location.href = "/dashboard"
            }, 3000);

        } catch (error) {
            console.error('Error setting password:', error);
            setFormErrors({
                general: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getAnimationClass = () => {
        switch (animation) {
            case 'slideIn':
                return 'animate-in slide-in-from-right duration-500';
            case 'slideOut':
                return 'animate-out slide-out-to-left duration-500';
            case 'fadeIn':
                return 'animate-in fade-in duration-500';
            case 'fadeOut':
                return 'animate-out fade-out duration-500';
            default:
                return '';
        }
    };

    return (
        <div
            className="w-full min-h-full light:bg-gradient-to-b from-green-50 to-white dark:!bg-gray-600  text-center flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background animated elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-0 left-0 w-64 h-64 bg-green-100 dark:bg-green-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
                <div
                    className="absolute top-0 right-0 w-64 h-64 bg-purple-100 dark:bg-purple-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div
                    className="absolute bottom-0 left-0 w-64 h-64 bg-pink-100 dark:bg-pink-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
                <div
                    className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-100 dark:bg-yellow-800 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
            </div>

            {/* Main content container */}
            <motion.div
                className={`overflow-hidden ${getAnimationClass()}`}
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
            >
                {/* Header */}
                <div className="p-6 md:p-8">
                    <div className="flex flex-col items-center space-x-4">
                        <div className="bg-white dark:bg-gray-800 bg-opacity-20 dark:bg-opacity-20 p-3 rounded-full">
                            <svg className="w-8 h-8 text-gray-800 dark:text-gray-200" fill="currentColor"
                                 viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm0-3a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z"
                                      clipRule="evenodd"/>
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">SIM Card Management
                                System</h1>
                            <p className="text-green-500 dark:text-green-400">Welcome to your account setup</p>
                        </div>
                    </div>
                </div>

                {/* Content based on current step */}
                <div className="p-6 md:p-8">
                    {pageStep === 'welcome' && (
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="w-32 h-32 relative mb-6 animate-float">
                                <Image
                                    src={welcomIcon}
                                    alt="Welcome"
                                    layout="fill"
                                    className="object-contain"
                                />
                            </div>

                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Welcome
                                Aboard!</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-8">
                                We're excited to have you join our SIM Card Management System. Let's get your account
                                set up so you can get started right away.
                            </p>

                            <button
                                onClick={handleStartClick}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white py-3 px-6 rounded-lg font-medium transition-all hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                            >
                                Get Started
                                <svg className="w-5 h-5 inline-block ml-2" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                                </svg>
                            </button>
                        </motion.div>
                    )}

                    {pageStep === 'password' && (
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                        >
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Set Your
                                Password</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">Create a strong password to secure your
                                account</p>

                            {formErrors.general && (
                                <div
                                    className="bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6 animate-shake">
                                    <p>{formErrors.general}</p>
                                </div>
                            )}
                            {token?.length &&
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-5">
                                        <label htmlFor="password"
                                               className="block text-gray-700 dark:text-gray-300 font-medium mb-2">New
                                            Password</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                id="password"
                                                name="password"
                                                value={formState.password}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-lg border ${formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all dark:bg-gray-700 dark:text-white`}
                                                placeholder="Enter your new password"
                                            />
                                            {formErrors.password && (
                                                <p className="mt-1 text-red-500 dark:text-red-400 text-sm">{formErrors.password}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label htmlFor="confirmPassword"
                                               className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Confirm
                                            Password</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={formState.confirmPassword}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-lg border ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all dark:bg-gray-700 dark:text-white`}
                                                placeholder="Confirm your password"
                                            />
                                            {formErrors.confirmPassword && (
                                                <p className="mt-1 text-red-500 dark:text-red-400 text-sm">{formErrors.confirmPassword}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white py-3 px-6 rounded-lg font-medium transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-70"
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                             fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                  strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                                            ) : (
                                                <span>Set Password & Continue</span>
                                            )}
                                        </button>
                                    </div>

                                    <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                                        <p>Password must be at least 8 characters and include a mix of letters, numbers
                                            and
                                            symbols</p>
                                    </div>
                                </form>
                            }
                        </motion.div>
                    )}

                    {pageStep === 'success' && (
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            className="flex flex-col items-center text-center"
                        >
                            <div
                                className="w-20 h-20 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mb-6">
                                <motion.svg
                                    className="w-10 h-10 text-green-500 dark:text-green-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    initial={{pathLength: 0}}
                                    animate={{pathLength: 1}}
                                    transition={{duration: 0.5, delay: 0.2}}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                                          d="M5 13l4 4L19 7"/>
                                </motion.svg>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Success!</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-2">Your password has been set
                                successfully</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Redirecting you to the
                                dashboard...</p>

                            <div
                                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-4 overflow-hidden">
                                <motion.div
                                    className="bg-green-600 dark:bg-green-500 h-1.5"
                                    initial={{width: 0}}
                                    animate={{width: '100%'}}
                                    transition={{duration: 3}}
                                ></motion.div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Footer */}
            <p className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} SIM Card Management System. All rights reserved.
            </p>
        </div>
    );
};

export default WelcomePage;