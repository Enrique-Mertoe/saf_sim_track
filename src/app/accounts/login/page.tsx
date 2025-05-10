"use client"
import {useState, useEffect} from 'react';
import {Activity, Eye, EyeOff, Lock, User, Phone, AlertCircle} from 'lucide-react';
import toast from "react-hot-toast";
import {authService} from "@/services";
import {$} from "@/lib/request";
import {User as User1} from "@/models";

// Define a utility for animations
const fadeIn = (delay = 0) => {
    return {
        opacity: 0,
        animation: `fadeIn 0.8s ease-out ${delay}s forwards`,
    };
};

export default function LoginPage() {

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginMethod, setLoginMethod] = useState('email');
    const [animationComplete, setAnimationComplete] = useState(false);
    const [formValues, setFormValues] = useState({
        phone: '',
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({
        phone: '',
        email: '',
        password: '',
        general: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimationComplete(true);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const handleInputChange = (e: { target: { name: string; value: string; }; }) => {
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
        const newErrors = {} as {
            phone: string,
            email: string,
            password: string,
        };
        let isValid = true;

        if (loginMethod === 'phone' && !formValues.phone) {
            newErrors.phone = 'Phone number is required';
            isValid = false;
        } else if (loginMethod === 'phone' && !/^\d{10}$/.test(formValues.phone)) {
            alert(formValues.phone)
            newErrors.phone = 'Enter a valid 10-digit phone number';
            isValid = false;
        }

        if (loginMethod === 'email' && !formValues.email) {
            newErrors.email = 'Email address is required';
            isValid = false;
        } else if (loginMethod === 'email' && !/\S+@\S+\.\S+/.test(formValues.email)) {
            newErrors.email = 'Enter a valid email address';
            isValid = false;
        }

        if (!formValues.password) {
            newErrors.password = 'Password is required';
            isValid = false;
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        setErrors(newErrors);
        return isValid;
    };
    const signIn = async (data: any, cb?: Closure) => {
        $.post<User1>({
            url: "/api/auth",
            data: {
                action: "login",
                data
            },
            contentType: $.JSON
        }).then(async () => {
            cb?.(true)
        }).catch(() => {
            cb?.(false)
            toast.error("unable to Login")
        })
    }

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        if (validateForm()) {
            try {
                setIsLoading(true);
                const res = await authService.signIn(formValues.email, formValues.password);
                if (res.error) {
                    throw res.error.message;
                }

                if (res.data?.session)
                    signIn(res.data?.session.user, ok => {
                        if (ok) {
                            toast.success('Login successful');
                            location.href = "/dashboard";
                        } else {
                            throw ('Unable to login. Try again!');
                        }
                    })
            } catch (err: any) {
                toast.error(`Login failed. ${err}`);
                setErrors(prev => ({...prev, general: err.message || 'Failed to login'}));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const _toggleLoginMethod = () => {
        setLoginMethod(loginMethod === 'phone' ? 'email' : 'phone');
        setErrors({general: "", email: "", password: "", phone: ""});
    };

    return (
        <>
            {/* Right side - Login Form */}
            <div className="w-full md:w-1/2 flex justify-center items-center p-6">
                <div
                    className="bg-white w-full max-w-md p-8 rounded-xl shadow-lg"
                    style={{
                        ...fadeIn(0.3),
                        transform: animationComplete ? 'none' : 'translateY(20px)',
                        transition: 'transform 0.8s ease-out',
                    }}
                >
                    {/* Mobile logo */}
                    <div className="md:hidden flex items-center justify-center mb-8">
                        <Activity className="h-8 w-8 mr-2 text-green-600"/>
                        <h1 className="text-2xl font-bold text-green-600">Safaricom</h1>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Sign In to Your Account</h2>

                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 p-1 rounded-lg flex">
                            <button
                                onClick={() => setLoginMethod('phone')}
                                className={`px-4 py-2 rounded ${loginMethod === 'phone'
                                    ? 'bg-green-600 text-white'
                                    : 'text-gray-600'}`}
                            >
                                Phone
                            </button>
                            <button
                                onClick={() => setLoginMethod('email')}
                                className={`px-4 py-2 rounded ${loginMethod === 'email'
                                    ? 'bg-green-600 text-white'
                                    : 'text-gray-600'}`}
                            >
                                Email
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {loginMethod === 'phone' ? (
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone
                                    Number</label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400"/>
                                    </div>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formValues.phone}
                                        onChange={handleInputChange}
                                        className={`pl-10 block w-full rounded-md py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} 
                    focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                                        placeholder="Enter your phone number"
                                    />
                                </div>
                                {errors.phone && (
                                    <div className="mt-1 flex items-center text-red-500 text-sm">
                                        <AlertCircle className="h-4 w-4 mr-1"/>
                                        {errors.phone}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email
                                    Address</label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400"/>
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formValues.email}
                                        onChange={handleInputChange}
                                        className={`pl-10 block w-full rounded-md py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} 
                    focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                                        placeholder="Enter your email address"
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

                        <div>
                            <label htmlFor="password"
                                   className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400"/>
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formValues.password}
                                    onChange={handleInputChange}
                                    className={`pl-10 block w-full rounded-md py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} 
                  focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                                    placeholder="Enter your password"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
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

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Remember me
                                </label>
                            </div>
                            <div className="text-sm">
                                <a href="/accounts/password-reset"
                                   className="font-medium text-green-600 hover:text-green-500">
                                    Forgot password?
                                </a>
                            </div>
                        </div>
                        {errors.general && (
                            <div className="mt-1 flex items-center text-red-500 text-sm">
                                <AlertCircle className="h-4 w-4 mr-1"/>
                                {errors.general}
                            </div>
                        )}

                        <div>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 
                hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div
                                            className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                                        Signing in...
                                    </div>
                                ) : (
                                    'Sign in'
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Don`t have an account?</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="button"
                                className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Contact administrator
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}