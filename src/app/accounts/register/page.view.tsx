"use client"
import {useEffect, useState} from 'react';
import {Activity, AlertCircle, Eye, EyeOff, Lock, Phone, User} from 'lucide-react';
import {useRouter} from 'next/navigation';
import toast from "react-hot-toast";
import {$} from "@/lib/request";
import {authService} from "@/services";

// Define a utility for animations
const fadeIn = (delay = 0) => {
    return {
        opacity: 0,
        animation: `fadeIn 0.8s ease-out ${delay}s forwards`,
    };
};

type ErrorVals = {
    phone: string,
    email: string,
    password: string,
    confirmPassword: string,
    fullName: string,
    general: string
}

export default function AdminSetupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [signupMethod, setSignupMethod] = useState('email');
    const [animationComplete, setAnimationComplete] = useState(false);
    const _router = useRouter();
    const [formValues, setFormValues] = useState({
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: ''
    });
    const [errors, setErrors] = useState({
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        general: ''
    });

    useEffect(() => {
        // Set animation complete after all animations finish
        const timer = setTimeout(() => {
            setAnimationComplete(true);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
        const {name, value} = e.target;
        setFormValues({
            ...formValues,
            [name]: value,
        });

        // Clear errors when typing
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: '',
            });
        }
    };

    const validateForm = () => {
        const newErrors = {} as ErrorVals;
        let isValid = true;

        if (!formValues.fullName) {
            newErrors.fullName = 'Full name is required';
            isValid = false;
        }

        if (signupMethod === 'phone' && !formValues.phone) {
            newErrors.phone = 'Phone number is required';
            isValid = false;
        } else if (signupMethod === 'phone' && !/^\d{10}$/.test(formValues.phone)) {
            newErrors.phone = 'Enter a valid 10-digit phone number';
            isValid = false;
        }

        if (signupMethod === 'email' && !formValues.email) {
            newErrors.email = 'Email address is required';
            isValid = false;
        } else if (signupMethod === 'email' && !/\S+@\S+\.\S+/.test(formValues.email)) {
            newErrors.email = 'Enter a valid email address';
            isValid = false;
        }

        if (!formValues.password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (formValues.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        if (formValues.password !== formValues.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setErrors({...errors, ...newErrors});
        return isValid;
    };

    const handleSubmit = async (e: any) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        if (validateForm()) {
            setErrors({} as any)
            setIsLoading(true);
            $.post({
                url: "/api/auth/admin-setup", // Using the same endpoint for now, but with different role
                contentType: $.JSON,
                data: {
                    email: formValues.email,
                    password: formValues.password,
                    full_name: formValues.fullName,
                    id_number: '',
                    id_front_url: '',
                    id_back_url: '',
                    phone_number: formValues.phone,
                    role: 'user', // Changed from 'admin' to 'user'
                }
            }).catch(err => {
                toast.error(`Registration failed. ${err.message}`);
                setErrors(prev => ({...prev, general: err.message || 'Failed to create account'}));
            }).then(async res => {
                toast.success('Registration successful ' + res.message);
                const {error: signInError} = await authService.signIn(
                    formValues.email, formValues.password);
                if (signInError) {
                    toast.error(`Unable to sign in, redirecting to login page. ${signInError.message}`);
                    return
                }
                // Redirect to subscription page instead of dashboard
                location.href = "/subscribe"
            }).done(() => {
                setIsLoading(false);
            });
            // const res = await userService.createUser(})
            // if (res.error) {
            //     throw res.error.message;
            // }

            // const userCredential = await createUserWithEmailAndPassword(auth, formValues.email, formValues.password);
            // const user = userCredential.user;
            //
            // // Get ID token
            // const idToken = await user.getIdToken();
            // // Send token to backend to create a session cookie and set up admin role
            // const response = await fetch('/api/auth/admin-setup', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({
            //         idToken,
            //         fullName: formValues.fullName,
            //         phone: formValues.phone,
            //         email: formValues.email,
            //         role: 'admin'
            //     }),
            // });
            //
            // if (response.ok) {
            //     // Redirect to dashboard after successful setup
            //     location.href = "/dashboard";
            // } else {
            //     const data = await response.json();
            //     throw new Error(data.error || 'Failed to create admin account');
            // }

        }
    };

    const toggleSignupMethod = () => {
        setSignupMethod(signupMethod === 'phone' ? 'email' : 'phone');
        setErrors({general: "", email: "", password: "", phone: "", confirmPassword: "", fullName: ""});
    };

    return (
   <>
            {/* Right side - Signup Form */}
            <div className="flex min-h-full justify-center items-center p-6">
                <div
                    className="bg-white dark:bg-gray-800 w-full max-w-md p-8 rounded-xl shadow-lg"
                    style={{
                        ...fadeIn(0.3),
                        transform: animationComplete ? 'none' : 'translateY(20px)',
                        transition: 'transform 0.8s ease-out',
                    }}
                >
                    {/* Mobile logo */}
                    <div className="md:hidden flex items-center justify-center mb-8">
                        <Activity className="h-8 w-8 mr-2 text-green-600 dark:text-green-500"/>
                        <h1 className="text-2xl font-bold text-green-600 dark:text-green-500">Safaricom</h1>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">Create Your Account</h2>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-6">Register to access Safaricom SIM card dealer services</p>

                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex">
                            <button
                                onClick={() => setSignupMethod('phone')}
                                className={`px-4 py-2 rounded ${signupMethod === 'phone'
                                    ? 'bg-green-600 text-white dark:bg-green-500'
                                    : 'text-gray-600 dark:text-gray-300'}`}
                            >
                                Phone
                            </button>
                            <button
                                onClick={() => setSignupMethod('email')}
                                className={`px-4 py-2 rounded ${signupMethod === 'email'
                                    ? 'bg-green-600 text-white dark:bg-green-500'
                                    : 'text-gray-600 dark:text-gray-300'}`}
                            >
                                Email
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400 dark:text-gray-500"/>
                                </div>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formValues.fullName}
                                    onChange={handleInputChange}
                                    className={`pl-10 block w-full rounded-md py-3 border ${errors.fullName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                    focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white`}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            {errors.fullName && (
                                <div className="mt-1 flex items-center text-red-500 dark:text-red-400 text-sm">
                                    <AlertCircle className="h-4 w-4 mr-1"/>
                                    {errors.fullName}
                                </div>
                            )}
                        </div>

                        {signupMethod === 'phone' ? (
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone
                                    Number</label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                                {errors.phone && (
                                    <div className="mt-1 flex items-center text-red-500 dark:text-red-400 text-sm">
                                        <AlertCircle className="h-4 w-4 mr-1"/>
                                        {errors.phone}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email
                                    Address</label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
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
                                    />
                                </div>
                                {errors.email && (
                                    <div className="mt-1 flex items-center text-red-500 dark:text-red-400 text-sm">
                                        <AlertCircle className="h-4 w-4 mr-1"/>
                                        {errors.email}
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label htmlFor="password"
                                   className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
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
                                    className={`pl-10 block w-full rounded-md py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                  focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white`}
                                    placeholder="Create a password"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                    </button>
                                </div>
                            </div>
                            {errors.password && (
                                <div className="mt-1 flex items-center text-red-500 dark:text-red-400 text-sm">
                                    <AlertCircle className="h-4 w-4 mr-1"/>
                                    {errors.password}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword"
                                   className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500"/>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formValues.confirmPassword}
                                    onChange={handleInputChange}
                                    className={`pl-10 block w-full rounded-md py-3 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} 
                  focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white`}
                                    placeholder="Confirm your password"
                                />
                            </div>
                            {errors.confirmPassword && (
                                <div className="mt-1 flex items-center text-red-500 dark:text-red-400 text-sm">
                                    <AlertCircle className="h-4 w-4 mr-1"/>
                                    {errors.confirmPassword}
                                </div>
                            )}
                        </div>

                        {errors.general && (
                            <div className="mt-1 flex items-center text-red-500 dark:text-red-400 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1"/>
                                {errors.general}
                            </div>
                        )}

                        <div>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className={`w-full cursor-pointer flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 
                hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div
                                            className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                                        Creating account...
                                    </div>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Already have an account?</span>
                            </div>
                        </div>

                        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
                            <p>
                                <a href="/accounts/login" className="text-green-600 hover:text-green-700 font-medium">
                                    Sign in to your account
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
