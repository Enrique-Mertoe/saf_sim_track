'use client';

import React, {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {AlertCircle, CheckCircle, Loader2, Upload, X} from 'lucide-react';
import {authService, storageService} from "@/services";
import {generateUUID} from "@/helper";
import {$} from "@/lib/request";
import {useRouter} from 'next/navigation';

export default function UploadIDPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
    const [idBackFile, setIdBackFile] = useState<File | null>(null);
    const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
    const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    // Fetch current user on component mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { user, error } = await authService.getCurrentUser();
                if (error) throw error;
                setUser(user);
            } catch (error) {
                console.error('Error fetching user:', error);
                setError('Failed to load user information. Please try again.');
            }
        };

        fetchUser();
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
        // Validation
        if (!idFrontFile || !idBackFile) {
            setError('Both front and back ID images are required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const key = generateUUID();
            
            // Upload front ID image
            const { url: idFrontUrl, error: e1 } = await storageService.uploadIdFrontImage(`team-${key}`, idFrontFile);
            if (e1) {
                throw new Error(e1.message);
            }
            
            // Upload back ID image
            const { url: idBackUrl, error: e2 } = await storageService.uploadIdBackImage(`team-${key}`, idBackFile);
            if (e2) {
                throw new Error(e2.message);
            }

            // Update user profile with ID URLs
            const response = await $.post({
                url: "/api/actions",
                contentType: $.JSON,
                data: {
                    action: "profile",
                    target: "update_id_documents",
                    data: {
                        id_front_url: idFrontUrl,
                        id_back_url: idBackUrl
                    }
                }
            });

            if (!response.ok) {
                throw new Error(response.message || 'Failed to update profile');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error uploading ID documents:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden md:max-w-2xl">
                {/* Success overlay */}
                {success && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-white dark:bg-gray-800 z-10 flex flex-col items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
                            </div>
                        </motion.div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-6">ID Documents Uploaded!</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">Redirecting you to the dashboard...</p>
                    </motion.div>
                )}

                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Your ID Documents</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            As a Team Leader, you need to upload your ID documents to continue using the platform.
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md flex items-start"
                        >
                            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <div className="mt-6">
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-100 mb-3">ID Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    ID Front Image <span className="text-red-500">*</span>
                                </label>

                                <div
                                    className={`border-2 border-dashed rounded-lg p-4 ${idFrontFile ? 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600' : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'} transition-all`}>
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
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            className="flex flex-col items-center justify-center cursor-pointer py-3">
                                            <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                                            <span
                                                className="text-sm text-gray-500 dark:text-gray-400">Click to upload front of ID</span>
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    ID Back Image <span className="text-red-500">*</span>
                                </label>

                                <div
                                    className={`border-2 border-dashed rounded-lg p-4 ${idBackFile ? 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600' : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'} transition-all`}>
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
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            className="flex flex-col items-center justify-center cursor-pointer py-3">
                                            <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
                                            <span
                                                className="text-sm text-gray-500 dark:text-gray-400">Click to upload back of ID</span>
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

                    <div className="mt-8">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleSubmit}
                            className={`w-full flex justify-center items-center px-5 py-3 text-white font-medium rounded-md ${loading ? 'bg-green-400 dark:bg-green-700 cursor-wait' : 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500'} transition-colors`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                'Upload ID Documents'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}