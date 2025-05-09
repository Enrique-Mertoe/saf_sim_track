"use client"
import {useState, useEffect, SetStateAction} from 'react';
import {Save, Bell, Lock, User, Shield, Phone, Check, Loader2, AlertTriangle} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import useApp from "@/ui/provider/AppProvider";
import {userService} from '@/services/userService';
import {toast} from 'react-hot-toast';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import Dashboard from "@/ui/components/dash/Dashboard";
import SecuritySettings from "@/app/settings/components/Security";

// Animation variants
const fadeIn = {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {duration: 0.4}}
};

const slideIn = {
    hidden: {x: 20, opacity: 0},
    visible: {x: 0, opacity: 1, transition: {duration: 0.4}}
};

export default function Settings() {
    const {user, refreshUser} = useApp();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [tabChangeAllowed, setTabChangeAllowed] = useState(true);

    // Form validation schemas
    const profileSchema = Yup.object({
        fullName: Yup.string().required('Full name is required'),
        email: Yup.string().email('Invalid email').required('Email is required'),
        phone: Yup.string().matches(/^\+?[0-9]{10,15}$/, 'Phone number is invalid')
    });

    const securitySchema = Yup.object({
        currentPassword: Yup.string().min(6, 'Password must be at least 6 characters'),
        newPassword: Yup.string().min(6, 'Password must be at least 6 characters'),
        confirmPassword: Yup.string().oneOf([Yup.ref('newPassword')], 'Passwords must match')
    }).test('password-change', 'All fields required for password change', function (values) {
        // If any password field is filled, all must be filled
        if (values.currentPassword || values.newPassword || values.confirmPassword) {
            if (!values.currentPassword || !values.newPassword || !values.confirmPassword) {
                return this.createError({message: 'All password fields are required'});
            }
        }
        return true;
    });

    // Initialize formik
    const profileFormik = useFormik({
        initialValues: {
            fullName: user?.full_name || '',
            email: user?.email || '',
            phone: user?.phone_number || '',
            idNumber: user?.id_number || '',
            mobigoNumber: user?.mobigo_number || ''
        },
        validationSchema: profileSchema,
        onSubmit: async (values) => {
            await handleSubmit('profile', values);
        },
        validateOnChange: false
    });

    const notificationsFormik = useFormik({
        initialValues: {
            notifyEmail: user?.notifications?.email || true,
            notifyPush: user?.notifications?.push || true,
            notifySMS: user?.notifications?.sms || false
        },
        onSubmit: async (values) => {
            await handleSubmit('notifications', values);
        }
    });

    const securityFormik = useFormik({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            twoFactor: user?.two_factor_enabled || false
        },
        validationSchema: securitySchema,
        onSubmit: async (values) => {
            await handleSubmit('security', values);
        },
        validateOnChange: false
    });

    const appFormik = useFormik({
        initialValues: {
            syncFrequency: user?.settings?.sync_frequency || '30',
            offlineMode: user?.settings?.offline_mode || false,
            locationServices: user?.settings?.location_services !== false,
            autoApprove: user?.role === 'admin' ? (user?.settings?.auto_approve || false) : false,
            regionalRestrictions: user?.role === 'admin' ? (user?.settings?.regional_restrictions || true) : true
        },
        onSubmit: async (values) => {
            await handleSubmit('app', values);
        }
    });

    // Use current form based on active tab
    const getCurrentFormik = () => {
        switch (activeTab) {
            case 'profile':
                return profileFormik;
            case 'notifications':
                return notificationsFormik;
            case 'security':
                return securityFormik;
            case 'app':
                return appFormik;
            default:
                return profileFormik;
        }
    };

    // Reset success status when changing tabs
    useEffect(() => {
        setSuccess(false);
    }, [activeTab]);

    // Handle tab changes
    const handleTabChange = (tab: string) => {
        if (!tabChangeAllowed) return;

        const currentFormik = getCurrentFormik();

        // Check if form has unsaved changes
        if (currentFormik.dirty) {
            if (window.confirm('You have unsaved changes. Are you sure you want to leave this tab?')) {
                currentFormik.resetForm();
                setActiveTab(tab);
            }
        } else {
            setActiveTab(tab);
        }
    };

    // Handle form submission
    const handleSubmit = async (formType, values) => {
        setLoading(true);
        setSuccess(false);
        setTabChangeAllowed(false);

        try {
            let userData = {};

            switch (formType) {
                case 'profile':
                    userData = {
                        full_name: values.fullName,
                        phone_number: values.phone,
                        id_number: values.idNumber,
                        mobigo_number: values.mobigoNumber
                    };

                    // Email changes require special handling in most systems
                    if (values.email !== user?.email) {
                        // Normally would handle this with special logic
                        userData.email = values.email;
                    }
                    break;

                case 'notifications':
                    userData = {
                        notifications: {
                            email: values.notifyEmail,
                            push: values.notifyPush,
                            sms: values.notifySMS
                        }
                    };
                    break;

                case 'security':
                    // Handle password changes
                    if (values.currentPassword && values.newPassword) {
                        // Would integrate with authentication service
                        // This is a placeholder for the actual implementation
                        console.log('Password change requested');

                        // For now, we'll simulate success
                        toast.success('Password updated successfully');

                        // Reset password fields
                        await securityFormik.setValues({
                            ...securityFormik.values,
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                        });
                        await securityFormik.setTouched({});
                    }

                    // Handle two-factor authentication toggle
                    if (values.twoFactor !== user?.two_factor_enabled) {
                        userData.two_factor_enabled = values.twoFactor;
                    }
                    break;

                case 'app':
                    userData = {
                        settings: {
                            sync_frequency: values.syncFrequency,
                            offline_mode: values.offlineMode,
                            location_services: values.locationServices
                        }
                    };

                    // Admin-specific settings
                    if (user?.role === 'admin') {
                        userData.settings.auto_approve = values.autoApprove;
                        userData.settings.regional_restrictions = values.regionalRestrictions;
                    }
                    break;
            }

            // Only update if there are changes
            if (Object.keys(userData).length > 0) {
                const {data, error} = await userService.updateUser(user.id, userData);

                if (error) {
                    throw new Error(error.message || 'Failed to update settings');
                }

                // Update user in context
                if (refreshUser) {
                    refreshUser();
                }

                // Mark as successful
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);

                // Show success toast
                toast.success('Settings updated successfully');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error(error.message || 'Failed to update settings');
        } finally {
            setLoading(false);
            setTabChangeAllowed(true);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <motion.div
                        className="space-y-6"
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={profileFormik.values.fullName}
                                    onChange={profileFormik.handleChange}
                                    onBlur={profileFormik.handleBlur}
                                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                                        profileFormik.touched.fullName && profileFormik.errors.fullName
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300'
                                    }`}
                                />
                                {profileFormik.touched.fullName && profileFormik.errors.fullName && (
                                    <motion.p
                                        initial={{opacity: 0, y: -10}}
                                        animate={{opacity: 1, y: 0}}
                                        className="mt-1 text-sm text-red-600"
                                    >
                                        {profileFormik.errors.fullName}
                                    </motion.p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileFormik.values.email}
                                    onChange={profileFormik.handleChange}
                                    onBlur={profileFormik.handleBlur}
                                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                                        profileFormik.touched.email && profileFormik.errors.email
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300'
                                    }`}
                                />
                                {profileFormik.touched.email && profileFormik.errors.email && (
                                    <motion.p
                                        initial={{opacity: 0, y: -10}}
                                        animate={{opacity: 1, y: 0}}
                                        className="mt-1 text-sm text-red-600"
                                    >
                                        {profileFormik.errors.email}
                                    </motion.p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileFormik.values.phone}
                                    onChange={profileFormik.handleChange}
                                    onBlur={profileFormik.handleBlur}
                                    className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                                        profileFormik.touched.phone && profileFormik.errors.phone
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="+1234567890"
                                />
                                {profileFormik.touched.phone && profileFormik.errors.phone && (
                                    <motion.p
                                        initial={{opacity: 0, y: -10}}
                                        animate={{opacity: 1, y: 0}}
                                        className="mt-1 text-sm text-red-600"
                                    >
                                        {profileFormik.errors.phone}
                                    </motion.p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                                <input
                                    type="text"
                                    name="idNumber"
                                    value={profileFormik.values.idNumber}
                                    onChange={profileFormik.handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">MobiGo Number</label>
                                <input
                                    type="text"
                                    name="mobigoNumber"
                                    value={profileFormik.values.mobigoNumber}
                                    onChange={profileFormik.handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                />
                            </div>
                        </div>

                        {user?.id_front_url && (
                            <motion.div
                                className="mt-6"
                                variants={slideIn}
                            >
                                <h3 className="text-md font-medium text-gray-700 mb-3">Identification Documents</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-gray-200 rounded-md p-2">
                                        <p className="text-sm text-gray-600 mb-2">ID Front</p>
                                        <div
                                            className="aspect-video bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                            <img
                                                src={user.id_front_url}
                                                alt="ID Front"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "/api/placeholder/400/200";
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {user?.id_back_url && (
                                        <div className="border border-gray-200 rounded-md p-2">
                                            <p className="text-sm text-gray-600 mb-2">ID Back</p>
                                            <div
                                                className="aspect-video bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={user.id_back_url}
                                                    alt="ID Back"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "/api/placeholder/400/200";
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                );
            case 'notifications':
                return (
                    <motion.div
                        className="space-y-6"
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                    >
                        <AnimatePresence>
                            {notificationsFormik.dirty && (
                                <motion.div
                                    initial={{opacity: 0, height: 0}}
                                    animate={{opacity: 1, height: 'auto'}}
                                    exit={{opacity: 0, height: 0}}
                                    className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-4"
                                >
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <AlertTriangle className="h-5 w-5 text-blue-500"/>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-blue-700">
                                                You have unsaved notification preferences. Don't forget to save changes!
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4 bg-white rounded-lg">
                            <motion.div
                                className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition-colors rounded-t-lg"
                                whileHover={{scale: 1.01}}
                            >
                                <div>
                                    <h3 className="font-medium">Email Notifications</h3>
                                    <p className="text-sm text-gray-500">Receive updates via email</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="notifyEmail"
                                        checked={notificationsFormik.values.notifyEmail}
                                        onChange={notificationsFormik.handleChange}
                                        className="sr-only peer"
                                    />
                                    <div
                                        className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </motion.div>

                            <motion.div
                                className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition-colors"
                                whileHover={{scale: 1.01}}
                            >
                                <div>
                                    <h3 className="font-medium">Push Notifications</h3>
                                    <p className="text-sm text-gray-500">Receive in-app notifications</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="notifyPush"
                                        checked={notificationsFormik.values.notifyPush}
                                        onChange={notificationsFormik.handleChange}
                                        className="sr-only peer"
                                    />
                                    <div
                                        className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </motion.div>

                            <motion.div
                                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-b-lg"
                                whileHover={{scale: 1.01}}
                            >
                                <div>
                                    <h3 className="font-medium">SMS Notifications</h3>
                                    <p className="text-sm text-gray-500">Receive text message alerts</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="notifySMS"
                                        checked={notificationsFormik.values.notifySMS}
                                        onChange={notificationsFormik.handleChange}
                                        className="sr-only peer"
                                    />
                                    <div
                                        className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </motion.div>
                        </div>

                        <motion.div
                            className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            transition={{delay: 0.3}}
                        >
                            <h3 className="font-medium text-green-800 flex items-center">
                                <Check size={18} className="mr-2"/>
                                Notification Preferences
                            </h3>
                            <p className="text-sm text-green-700 mt-1">
                                Customize your notification preferences to stay updated on important activities.
                            </p>
                        </motion.div>
                    </motion.div>
                );
            case 'security':
                return (
                    <SecuritySettings/>
                    // <motion.div
                    //     className="space-y-6"
                    //     initial="hidden"
                    //     animate="visible"
                    //     variants={fadeIn}
                    // >
                    //     <div>
                    //         <h3 className="text-md font-medium text-gray-700 mb-3">Password Management</h3>
                    //         <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
                    //             <div>
                    //                 <label className="block text-sm font-medium text-gray-700 mb-1">Current
                    //                     Password</label>
                    //                 <input
                    //                     type="password"
                    //                     name="currentPassword"
                    //                     value={securityFormik.values.currentPassword}
                    //                     onChange={securityFormik.handleChange}
                    //                     onBlur={securityFormik.handleBlur}
                    //                     className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                    //                         securityFormik.touched.currentPassword && securityFormik.errors.currentPassword
                    //                             ? 'border-red-300 bg-red-50'
                    //                             : 'border-gray-300'
                    //                     }`}
                    //                 />
                    //                 {securityFormik.touched.currentPassword && securityFormik.errors.currentPassword && (
                    //                     <motion.p
                    //                         initial={{opacity: 0, y: -10}}
                    //                         animate={{opacity: 1, y: 0}}
                    //                         className="mt-1 text-sm text-red-600"
                    //                     >
                    //                         {securityFormik.errors.currentPassword}
                    //                     </motion.p>
                    //                 )}
                    //             </div>
                    //
                    //             <div>
                    //                 <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    //                 <input
                    //                     type="password"
                    //                     name="newPassword"
                    //                     value={securityFormik.values.newPassword}
                    //                     onChange={securityFormik.handleChange}
                    //                     onBlur={securityFormik.handleBlur}
                    //                     className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                    //                         securityFormik.touched.newPassword && securityFormik.errors.newPassword
                    //                             ? 'border-red-300 bg-red-50'
                    //                             : 'border-gray-300'
                    //                     }`}
                    //                 />
                    //                 {securityFormik.touched.newPassword && securityFormik.errors.newPassword && (
                    //                     <motion.p
                    //                         initial={{opacity: 0, y: -10}}
                    //                         animate={{opacity: 1, y: 0}}
                    //                         className="mt-1 text-sm text-red-600"
                    //                     >
                    //                         {securityFormik.errors.newPassword}
                    //                     </motion.p>
                    //                 )}
                    //             </div>
                    //
                    //             <div>
                    //                 <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New
                    //                     Password</label>
                    //                 <input
                    //                     type="password"
                    //                     name="confirmPassword"
                    //                     value={securityFormik.values.confirmPassword}
                    //                     onChange={securityFormik.handleChange}
                    //                     onBlur={securityFormik.handleBlur}
                    //                     className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                    //                         securityFormik.touched.confirmPassword && securityFormik.errors.confirmPassword
                    //                             ? 'border-red-300 bg-red-50'
                    //                             : 'border-gray-300'
                    //                     }`}
                    //                 />
                    //                 {securityFormik.touched.confirmPassword && securityFormik.errors.confirmPassword && (
                    //                     <motion.p
                    //                         initial={{opacity: 0, y: -10}}
                    //                         animate={{opacity: 1, y: 0}}
                    //                         className="mt-1 text-sm text-red-600"
                    //                     >
                    //                         {securityFormik.errors.confirmPassword}
                    //                     </motion.p>
                    //                 )}
                    //             </div>
                    //         </div>
                    //     </div>
                    //
                    //     <motion.div
                    //         variants={slideIn}
                    //         className="bg-white rounded-lg p-4 border border-gray-200"
                    //     >
                    //         <div className="flex items-center justify-between">
                    //             <div>
                    //                 <h3 className="font-medium">Two-Factor Authentication</h3>
                    //                 <p className="text-sm text-gray-500">Add an extra layer of security to your
                    //                     account</p>
                    //             </div>
                    //             <label className="relative inline-flex items-center cursor-pointer">
                    //                 <input
                    //                     type="checkbox"
                    //                     name="twoFactor"
                    //                     checked={securityFormik.values.twoFactor}
                    //                     onChange={securityFormik.handleChange}
                    //                     className="sr-only peer"
                    //                 />
                    //                 <div
                    //                     className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                    //             </label>
                    //         </div>
                    //
                    //         <AnimatePresence>
                    //             {securityFormik.values.twoFactor && (
                    //                 <motion.div
                    //                     initial={{opacity: 0, height: 0}}
                    //                     animate={{opacity: 1, height: 'auto'}}
                    //                     exit={{opacity: 0, height: 0}}
                    //                     className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md"
                    //                 >
                    //                     <p className="text-sm text-green-800">
                    //                         Two-factor authentication is enabled. Verification codes will be sent to
                    //                         your registered phone number.
                    //                     </p>
                    //                 </motion.div>
                    //             )}
                    //         </AnimatePresence>
                    //     </motion.div>
                    //
                    //     <motion.div
                    //         className="mt-6"
                    //         variants={slideIn}
                    //     >
                    //         <h3 className="text-md font-medium text-gray-700 mb-3">Security Activity</h3>
                    //         <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                    //             <div className="p-3 flex justify-between items-center">
                    //                 <div>
                    //                     <p className="text-sm font-medium">Last password change</p>
                    //                     <p className="text-xs text-gray-500">3 months ago</p>
                    //                 </div>
                    //                 <span
                    //                     className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Secure</span>
                    //             </div>
                    //             <div className="p-3 flex justify-between items-center">
                    //                 <div>
                    //                     <p className="text-sm font-medium">Last login</p>
                    //                     <p className="text-xs text-gray-500">Today, 09:32 AM</p>
                    //                 </div>
                    //                 <span
                    //                     className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Current</span>
                    //             </div>
                    //             <div className="p-3 flex justify-between items-center">
                    //                 <div>
                    //                     <p className="text-sm font-medium">Active sessions</p>
                    //                     <p className="text-xs text-gray-500">2 devices</p>
                    //                 </div>
                    //                 <button className="text-xs text-blue-600 hover:text-blue-800 underline">Manage
                    //                 </button>
                    //             </div>
                    //         </div>
                    //     </motion.div>
                    // </motion.div>
                );
            case 'app':
                return (
                    <motion.div
                        className="space-y-6"
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                    >
                        {user?.role === 'admin' && (
                            <motion.div
                                className="p-4 bg-yellow-50 border border-yellow-200 rounded-md"
                                variants={slideIn}
                            >
                                <h3 className="font-medium text-yellow-800 flex items-center">
                                    <Shield size={18} className="mr-2"/>
                                    Admin Settings
                                </h3>
                                <p className="text-sm text-yellow-700 mt-1">
                                    These settings apply to all users in the organization. Changes will be applied
                                    immediately.
                                </p>
                            </motion.div>
                        )}

                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="p-4">
                                <h3 className="font-medium text-gray-700 mb-4">Application Settings</h3>

                                <div className="space-y-4">
                                    <motion.div
                                        className="flex items-center justify-between p-2 border-b border-gray-100"
                                        whileHover={{x: 5}}
                                        transition={{type: "spring", stiffness: 400, damping: 10}}
                                    >
                                        <div>
                                            <h3 className="font-medium">Data Sync Frequency</h3>
                                            <p className="text-sm text-gray-500">How often your data syncs with the
                                                server</p>
                                        </div>
                                        <select
                                            name="syncFrequency"
                                            value={appFormik.values.syncFrequency}
                                            onChange={appFormik.handleChange}
                                            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                        >
                                            <option value="15">Every 15 minutes</option>
                                            <option value="30">Every 30 minutes</option>
                                            <option value="60">Every hour</option>
                                            <option value="manual">Manual only</option>
                                        </select>
                                    </motion.div>

                                    <motion.div
                                        className="flex items-center justify-between p-2 border-b border-gray-100"
                                        whileHover={{x: 5}}
                                        transition={{type: "spring", stiffness: 400, damping: 10}}
                                    >
                                        <div>
                                            <h3 className="font-medium">Offline Mode</h3>
                                            <p className="text-sm text-gray-500">Enable work without internet
                                                connection</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="offlineMode"
                                                checked={appFormik.values.offlineMode}
                                                onChange={appFormik.handleChange}
                                                className="sr-only peer"
                                            />
                                            <div
                                                className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </motion.div>

                                    {user?.role === 'staff' && (
                                        <motion.div
                                            className="flex items-center justify-between p-2"
                                            whileHover={{x: 5}}
                                            transition={{type: "spring", stiffness: 400, damping: 10}}
                                        >
                                            <div>
                                                <h3 className="font-medium">Location Services</h3>
                                                <p className="text-sm text-gray-500">Allow app to access your
                                                    location</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="locationServices"
                                                    checked={appFormik.values.locationServices}
                                                    onChange={appFormik.handleChange}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {user?.role === 'admin' && (
                                <motion.div
                                    initial={{opacity: 0}}
                                    animate={{opacity: 1}}
                                    transition={{delay: 0.3}}
                                    className="mt-4 p-4 border-t border-gray-200"
                                >
                                    <h3 className="font-medium text-gray-700 mb-4">System Administration</h3>
                                    <div className="p-4 border border-gray-200 rounded-md bg-gray-50 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span
                                                className="text-sm font-medium">Auto-approve staff registrations</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="autoApprove"
                                                    checked={appFormik.values.autoApprove}
                                                    onChange={appFormik.handleChange}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Enable regional restrictions</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="regionalRestrictions"
                                                    checked={appFormik.values.regionalRestrictions}
                                                    onChange={appFormik.handleChange}
                                                    className="sr-only peer"
                                                />
                                                <div
                                                    className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>

                                        <div className="pt-3 mt-3 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">System Status</span>
                                                <span
                                                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Operational
                        </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">Last system check: Today, 08:15
                                                AM
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-4 border border-blue-200 rounded-md bg-blue-50">
                                        <h4 className="text-sm font-medium text-blue-800 mb-2">Administrator
                                            Controls</h4>
                                        <p className="text-xs text-blue-700 mb-3">
                                            Additional system controls are available in the admin dashboard.
                                        </p>
                                        <button
                                            className="text-sm text-blue-700 hover:text-blue-900 font-medium flex items-center">
                                            <Shield size={14} className="mr-1"/>
                                            Go to Admin Dashboard
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <motion.div
                            className="p-4 border border-gray-200 rounded-md bg-gray-50"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            transition={{delay: 0.4}}
                        >
                            <h3 className="font-medium text-gray-700 mb-2">App Information</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-500">Version</span>
                                    <p>2.5.3</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Last Update</span>
                                    <p>April 28, 2025</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Database</span>
                                    <p>Up to date</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Storage Used</span>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                        <div className="bg-green-600 h-2.5 rounded-full" style={{width: '25%'}}></div>
                                    </div>
                                    <p className="text-xs mt-1">1.2 GB / 5 GB</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    // Tab animation variants
    const tabVariants = {
        inactive: {color: '#6b7280', borderColor: 'transparent'},
        active: {color: '#059669', borderColor: '#059669', transition: {duration: 0.3}},
    };

    return (
        <Dashboard>
            <div className="mx-auto py-8 px-4">
                <motion.div
                    className="mb-6"
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.5}}
                >
                    <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                    <p className="text-gray-500">Manage your account preferences and application settings</p>
                </motion.div>

                <motion.div
                    className="bg-white rounded-lg shadow-lg overflow-hidden"
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.5, delay: 0.2}}
                >
                    <div className="flex overflow-x-auto border-b scrollbar-hide">
                        <motion.button
                            onClick={() => handleTabChange('profile')}
                            className={`flex items-center space-x-2 px-6 py-4 border-b-2 ${
                                activeTab === 'profile' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'
                            }`}
                            animate={activeTab === 'profile' ? 'active' : 'inactive'}
                            variants={tabVariants}
                            whileHover={{backgroundColor: '#f9fafb'}}
                        >
                            <User size={18}/>
                            <span>Profile</span>
                        </motion.button>
                        <motion.button
                            onClick={() => handleTabChange('notifications')}
                            className={`flex items-center space-x-2 px-6 py-4 border-b-2 ${
                                activeTab === 'notifications' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'
                            }`}
                            animate={activeTab === 'notifications' ? 'active' : 'inactive'}
                            variants={tabVariants}
                            whileHover={{backgroundColor: '#f9fafb'}}
                        >
                            <Bell size={18}/>
                            <span>Notifications</span>
                        </motion.button>
                        <motion.button
                            onClick={() => handleTabChange('security')}
                            className={`flex items-center space-x-2 px-6 py-4 border-b-2 ${
                                activeTab === 'security' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'
                            }`}
                            animate={activeTab === 'security' ? 'active' : 'inactive'}
                            variants={tabVariants}
                            whileHover={{backgroundColor: '#f9fafb'}}
                        >
                            <Lock size={18}/>
                            <span>Security</span>
                        </motion.button>
                        <motion.button
                            onClick={() => handleTabChange('app')}
                            className={`flex items-center space-x-2 px-6 py-4 border-b-2 ${
                                activeTab === 'app' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500'
                            }`}
                            animate={activeTab === 'app' ? 'active' : 'inactive'}
                            variants={tabVariants}
                            whileHover={{backgroundColor: '#f9fafb'}}
                        >
                            {user?.role === 'admin' ? <Shield size={18}/> : <Phone size={18}/>}
                            <span>{user?.role === 'admin' ? 'System' : 'App'} Settings</span>
                        </motion.button>
                    </div>

                    <form onSubmit={getCurrentFormik().handleSubmit}>
                        <div className="p-6">
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <Loader2 size={32} className="animate-spin text-green-600"/>
                                    <span className="ml-3 text-gray-600">Updating settings...</span>
                                </div>
                            ) : (
                                renderTabContent()
                            )}
                        </div>

                        <motion.div
                            className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center"
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            transition={{delay: 0.5}}
                        >
                            <AnimatePresence>
                                {success && (
                                    <motion.div
                                        initial={{opacity: 0, x: -20}}
                                        animate={{opacity: 1, x: 0}}
                                        exit={{opacity: 0}}
                                        className="flex items-center text-green-700"
                                    >
                                        <Check size={16} className="mr-2"/>
                                        <span>Settings saved successfully</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.button
                                type="submit"
                                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md shadow-sm"
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                disabled={loading || !getCurrentFormik().dirty}
                            >
                                {loading ? (
                                    <Loader2 size={18} className="animate-spin"/>
                                ) : (
                                    <Save size={18}/>
                                )}
                                <span>Save Changes</span>
                            </motion.button>
                        </motion.div>
                    </form>
                </motion.div>
            </div>
        </Dashboard>
    );
}