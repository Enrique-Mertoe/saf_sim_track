'use client';

import React, {useState, useEffect, useRef} from 'react';
import {Team, StaffType, UserRole} from "@/models";
import {motion, AnimatePresence} from 'framer-motion';
import {CheckCircle, AlertCircle, Upload, X, ArrowRight, Loader2} from 'lucide-react';
import {storageService, teamService} from "@/services";
import {generatePassword, generateUUID} from "@/helper";
import {$} from "@/lib/request";

type CreateUserModalProps = {
    onClose: () => void;
    onSuccess?: () => void;
};

export default function CreateUserModal({onClose, onSuccess}: CreateUserModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    const g_password = generatePassword()
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        idNumber: '',
        phoneNumber: '',
        mobigoNumber: '',
        role: 'VAN_STAFF',
        teamId: '',
        password: g_password,
        confirmPassword: g_password,
        staffType: '' as StaffType | '',
        vanNumber: '',
        vanLocation: '',
    });

    // Helper states
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
    const [idBackFile, setIdBackFile] = useState<File | null>(null);
    const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
    const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
    const [formTouched, setFormTouched] = useState({
        fullName: false,
        email: false,
        idNumber: false,
        phoneNumber: false,
        password: false,
        confirmPassword: false,
    });

    // Validation states
    const [validations, setValidations] = useState({
        passwordMatch: true,
        passwordStrength: {
            valid: false,
            message: '',
        },
        phoneValid: true,
        emailValid: true,
    });

    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Focus first input on mount
    useEffect(() => {
        if (firstInputRef.current) {
            firstInputRef.current.focus();
        }
    }, []);

    // Fetch teams on component mount
    useEffect(() => {
        const fetchTeams = async () => {

            try {
                const {data, error} = await teamService.getAllTeams();
                if (error)
                    return setError(`Failed to load teams. Please try again. ${error.message}`);
                // const response = await fetch('/api/teams');
                // const data = await response.json();
                setTeams(data.filter((team: Team) => team.is_active));
            } catch (error) {
                console.error('Error fetching teams:', error);
                setError('Failed to load teams. Please try again.');
            }
        };

        fetchTeams().then();
    }, []);

    // Create file previews
    useEffect(() => {
        if (idFrontFile) {
            const objectUrl = URL.createObjectURL(idFrontFile);
            setIdFrontPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [idFrontFile]);

    useEffect(() => {
        if (idBackFile) {
            const objectUrl = URL.createObjectURL(idBackFile);
            setIdBackPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
    }, [idBackFile]);

    // Password validation
    useEffect(() => {
        // Check if passwords match
        const passwordMatch = !formTouched.confirmPassword || formData.password === formData.confirmPassword;

        // Check password strength
        let strengthValid = false;
        let strengthMessage = '';

        if (formData.password) {
            // const hasLowercase = /[a-z]/.test(formData.password);
            // const hasUppercase = /[A-Z]/.test(formData.password);
            // const hasNumber = /\d/.test(formData.password);
            // const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
            const hasMinLength = formData.password.length >= 8;

            if (!hasMinLength) {
                strengthMessage = 'Password must be at least 8 characters';
            } else {
                strengthValid = true;
                strengthMessage = 'Strong password';
            }
        }

        // Validate phone number
        const phoneRegex = /^(\+\d{1,3})?\d{9,12}$/;
        const phoneValid = !formTouched.phoneNumber || phoneRegex.test(formData.phoneNumber);

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailValid = !formTouched.email || emailRegex.test(formData.email);

        setValidations({
            passwordMatch,
            passwordStrength: {
                valid: strengthValid,
                message: strengthMessage
            },
            phoneValid,
            emailValid
        });
    }, [formData, formTouched]);

    // Form handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        setFormData({...formData, [name]: value});
        setFormTouched({...formTouched, [name]: true});
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'front') {
                setIdFrontFile(file);
            } else {
                setIdBackFile(file);
            }
        }
    };

    const handleSubmit = async () => {
            if (currentStep != totalSteps)
                return
            // Final validation
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }

            if (!validations.passwordStrength.valid) {
                setError('Password does not meet security requirements');
                return;
            }

            if (!idFrontFile || !idBackFile) {
                setError('Both front and back ID images are required');
                return;
            }

            setLoading(true);
            setError('');

            try {
                const key = generateUUID()
                const {url: idFrontUrl, error: e1} = await storageService.uploadIdFrontImage(`team-${key}`, idFrontFile)
                console.log(e1)
                if (e1) {
                    return setError(e1.message)
                }
                const {url: idBackUrl, error: e2} = await storageService.uploadIdBackImage(`team-${key}`, idBackFile)
                console.log(e2)
                if (e2) {
                    return setError(e2.message)
                }
                $.post({
                    url: "/api/actions",
                    contentType: $.JSON,
                    data: {
                        action: "admin",
                        target: "create_user",
                        data: {
                            full_name: formData.fullName,
                            email: formData.email,
                            id_number: formData.idNumber,
                            phone_number: formData.phoneNumber,
                            mobigo_number: formData.mobigoNumber || undefined,
                            role: formData.role,
                            team_id: formData.teamId || undefined,
                            staff_type: formData.staffType || undefined,
                            password: formData.password,
                            id_front_url: idFrontUrl,
                            id_back_url: idBackUrl,
                        }
                    }
                }).then(res => {
                    if (!res.ok) {
                        return setError(res.message || "");
                    }
                    setSuccess(true);
                    setTimeout(() => {
                        // onClose();
                        if (onSuccess) onSuccess();
                    }, 1500);
                }).catch(err => {
                    throw new Error(err.message || 'Failed to create user');
                });

            } catch (error) {
                console.error('Error creating user:', error);
                setError(error instanceof Error ? error.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        }
    ;

    // Step navigation
    const goToNextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const goToPrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Check if current step is valid
    const isCurrentStepValid = () => {
        if (currentStep === 1) {
            return (
                formData.fullName.trim() !== '' &&
                formData.email.trim() !== '' &&
                validations.emailValid &&
                formData.idNumber.trim() !== '' &&
                formData.phoneNumber.trim() !== '' &&
                validations.phoneValid
            );
        } else if (currentStep === 2) {
            return (
                formData.password.trim() !== '' &&
                formData.confirmPassword.trim() !== '' &&
                validations.passwordMatch &&
                validations.passwordStrength.valid
            );
        }
        return true;
    };

    // Progress indicator
    const progressPercent = (currentStep / totalSteps) * 100;

    // Step content based on current step
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div
                        initial={{opacity: 0, x: 20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: -20}}
                        transition={{duration: 0.3}}
                        className="space-y-4"
                    >
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Personal Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    ref={firstInputRef}
                                    required
                                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    className={`w-full border ${!validations.emailValid ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                                {formTouched.email && !validations.emailValid && (
                                    <p className="mt-1 text-sm text-red-500">Please enter a valid email address</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                    ID Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="idNumber"
                                    name="idNumber"
                                    required
                                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    value={formData.idNumber}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="phoneNumber"
                                       className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    required
                                    className={`w-full border ${!validations.phoneValid ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                                {formTouched.phoneNumber && !validations.phoneValid && (
                                    <p className="mt-1 text-sm text-red-500">Please enter a valid phone number</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="mobigoNumber"
                                       className="block text-sm font-medium text-gray-700 mb-1">
                                    Mobigo Number
                                </label>
                                <input
                                    type="tel"
                                    id="mobigoNumber"
                                    name="mobigoNumber"
                                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    value={formData.mobigoNumber}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div
                        initial={{opacity: 0, x: 20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: -20}}
                        transition={{duration: 0.3}}
                        className="space-y-4"
                    >
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Security Information</h3>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    required
                                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                {formTouched.password && formData.password && (
                                    <div className="mt-1 text-sm">
                                        <div
                                            className={`flex items-center ${validations.passwordStrength.valid ? 'text-green-600' : 'text-amber-600'}`}>
                                            {validations.passwordStrength.valid ? (
                                                <CheckCircle className="w-4 h-4 mr-1"/>
                                            ) : (
                                                <AlertCircle className="w-4 h-4 mr-1"/>
                                            )}
                                            {validations.passwordStrength.message}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="confirmPassword"
                                       className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    required
                                    className={`w-full border ${!validations.passwordMatch ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all`}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                                {formTouched.confirmPassword && !validations.passwordMatch && (
                                    <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                            <p className="text-sm text-green-800">
                                <strong>Password requirements:</strong> At least 8 characters, include uppercase and
                                lowercase letters, numbers, and special characters.
                            </p>
                        </div>
                    </motion.div>
                );

            case 3:
                return (
                    <motion.div
                        initial={{opacity: 0, x: 20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: -20}}
                        transition={{duration: 0.3}}
                        className="space-y-6"
                    >
                        <h3 className="text-lg font-medium text-gray-800 mb-4">Role & Documents</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    required
                                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    <option value="ADMIN">Admin</option>
                                    <option value="TEAM_LEADER">Team Leader</option>
                                    <option value="VAN_STAFF">Van Staff</option>
                                    <option value="MPESA_ONLY_AGENT">Mpesa Only Agent</option>
                                    <option value="NON_MPESA_AGENT">Non-Mpesa Agent</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1">
                                    Team
                                </label>
                                <select
                                    id="teamId"
                                    name="teamId"
                                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    value={formData.teamId}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Team</option>
                                    {teams.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="staffType" className="block text-sm font-medium text-gray-700 mb-1">
                                    Staff Type
                                </label>
                                <select
                                    id="staffType"
                                    name="staffType"
                                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    value={formData.staffType}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Staff Type</option>
                                    <option value="FULL_TIME">Full Time</option>
                                    <option value="PART_TIME">Part Time</option>
                                    <option value="CONTRACTOR">Contractor</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="vanNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                    Van Number
                                </label>
                                <input
                                    type="text"
                                    id="vanNumber"
                                    name="vanNumber"
                                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    value={formData.vanNumber}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="vanLocation"
                                       className="block text-sm font-medium text-gray-700 mb-1">
                                    Van Location
                                </label>
                                <input
                                    type="text"
                                    id="vanLocation"
                                    name="vanLocation"
                                    className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                    value={formData.vanLocation}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <h4 className="text-md font-medium text-gray-800 mb-3">ID Documents</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ID Front Image <span className="text-red-500">*</span>
                                    </label>

                                    <div
                                        className={`border-2 border-dashed rounded-lg p-4 ${idFrontFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400'} transition-all`}>
                                        {idFrontPreview ? (
                                            <div className="relative">
                                                <img
                                                    src={idFrontPreview}
                                                    alt="ID Front Preview"
                                                    className="mx-auto max-h-48 rounded"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIdFrontFile(null);
                                                        setIdFrontPreview(null);
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <X size={16}/>
                                                </button>
                                            </div>
                                        ) : (
                                            <label
                                                className="flex flex-col items-center justify-center cursor-pointer py-3">
                                                <Upload className="h-10 w-10 text-gray-400 mb-2"/>
                                                <span
                                                    className="text-sm text-gray-500">Click to upload front of ID</span>
                                                <input
                                                    type="file"
                                                    id="idFront"
                                                    name="idFront"
                                                    accept="image/*"
                                                    required
                                                    className="hidden"
                                                    onChange={(e) => handleFileChange(e, 'front')}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        ID Back Image <span className="text-red-500">*</span>
                                    </label>

                                    <div
                                        className={`border-2 border-dashed rounded-lg p-4 ${idBackFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-green-400'} transition-all`}>
                                        {idBackPreview ? (
                                            <div className="relative">
                                                <img
                                                    src={idBackPreview}
                                                    alt="ID Back Preview"
                                                    className="mx-auto max-h-48 rounded"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIdBackFile(null);
                                                        setIdBackPreview(null);
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <X size={16}/>
                                                </button>
                                            </div>
                                        ) : (
                                            <label
                                                className="flex flex-col items-center justify-center cursor-pointer py-3">
                                                <Upload className="h-10 w-10 text-gray-400 mb-2"/>
                                                <span
                                                    className="text-sm text-gray-500">Click to upload back of ID</span>
                                                <input
                                                    type="file"
                                                    id="idBack"
                                                    name="idBack"
                                                    accept="image/*"
                                                    required
                                                    className="hidden"
                                                    onChange={(e) => handleFileChange(e, 'back')}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <AnimatePresence>
                <div
                >
                    <motion.div
                        ref={modalRef}
                        initial={{scale: 0.9, y: 20}}
                        animate={{scale: 1, y: 0}}
                        exit={{scale: 0.9, y: 20}}
                        transition={{type: "spring", stiffness: 300, damping: 30}}
                        className="bg-white rounded-xl w-full  overflow-hidden relative"
                    >
                        {/* Success overlay */}
                        {success && (
                            <motion.div
                                initial={{opacity: 0}}
                                animate={{opacity: 1}}
                                className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center"
                            >
                                <motion.div
                                    initial={{scale: 0}}
                                    animate={{scale: 1}}
                                    transition={{type: "spring", stiffness: 300, damping: 20}}
                                >
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <CheckCircle className="h-16 w-16 text-green-600"/>
                                    </div>
                                </motion.div>
                                <h2 className="text-2xl font-bold text-gray-800 mt-6">User Created
                                    Successfully!</h2>
                                <p className="text-gray-600 mt-2">The new user has been added to the system.</p>
                            </motion.div>
                        )}

                        {/* Header */}
                        <div className="flex justify-between items-center border-b px-6 py-4">
                            <h2 className="text-xl font-semibold text-gray-800">Create New User</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>

                        {/* Progress bar */}
                        <div className="px-6 pt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <motion.div
                                    initial={{width: 0}}
                                    animate={{width: `${progressPercent}%`}}
                                    className="h-2 rounded-full bg-green-600"
                                ></motion.div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Basic Info</span>
                                <span>Security</span>
                                <span>Role & Documents</span>
                            </div>
                        </div>

                        {/* Error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{opacity: 0, y: -10}}
                                    animate={{opacity: 1, y: 0}}
                                    exit={{opacity: 0}}
                                    transition={{duration: 0.2}}
                                    className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start"
                                >
                                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5"/>
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Form */}
                        <form className="overflow-y-auto max-h-[calc(90vh-8rem)]">
                            <AnimatePresence
                                mode="wait">
                                <div key={currentStep} className="min-h-[300px] px-6 py-4 ">
                                    {renderStepContent()}
                                </div>
                            </AnimatePresence>


                            {/* Footer with action buttons */}
                            <div className="border-t px-6 py-4 bg-gray-50 flex justify-between">
                                {currentStep > 1 ? (
                                    <button
                                        type="button"
                                        onClick={goToPrevStep}
                                        className="flex items-center px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-md transition-colors"
                                    >
                                        <svg className="h-5 w-5 mr-1 rotate-180" fill="none" viewBox="0 0 24 24"
                                             stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                                        </svg>
                                        Back
                                    </button>
                                ) : (
                                    <div></div>
                                )}

                                {currentStep < totalSteps ? (
                                    <button
                                        type="button"
                                        onClick={goToNextStep}
                                        disabled={!isCurrentStepValid()}
                                        className={`flex items-center px-5 py-2 text-white font-medium rounded-md ${isCurrentStepValid() ? 'bg-green-600 hover:bg-green-700' : 'bg-green-300 cursor-not-allowed'} transition-colors`}
                                    >
                                        Next
                                        <ArrowRight className="h-5 w-5 ml-1"/>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={() => handleSubmit()}
                                        className={`flex items-center px-5 py-2 text-white font-medium rounded-md ${loading ? 'bg-green-400 cursor-wait' : 'bg-green-600 hover:bg-green-700'} transition-colors`}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-5 w-5 mr-2 animate-spin"/>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Create User
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </motion.div>
                </div>
            </AnimatePresence>
        </>
    );
}
              
