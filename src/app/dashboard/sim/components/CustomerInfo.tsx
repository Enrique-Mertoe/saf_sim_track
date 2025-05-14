import React, { useState } from 'react';
import { Controller } from 'react-hook-form';
import {Label} from "@/ui/components/Label";
import {Input} from "@/ui/components/Input";
import FileUpload from "@/ui/components/FileUpload";

export interface CustomerInfoActions {
    uploadFront: (file: File) => Promise<string | null>;
    uploadBack: (file: File, ...args: any[]) => Promise<string | null>;
}

const CustomerInfo = ({control, errors, actions}: {
    control: any,
    errors: any,
    actions: CustomerInfoActions
}) => {
    const [frontIdFile, setFrontIdFile] = useState<File | null>(null);
    const [backIdFile, setBackIdFile] = useState<File | null>(null);
    const [isUploadingFront, setIsUploadingFront] = useState(false);
    const [isUploadingBack, setIsUploadingBack] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Handle file selection for front ID
    const handleFrontIdSelected = (file: File | null, url?: string) => {
        setFrontIdFile(file);
    };

    // Handle file selection for back ID
    const handleBackIdSelected = (file: File | null, url?: string) => {
        setBackIdFile(file);
    };

    // When proceeding to next step, this will be called to upload files
    const uploadFiles = async () => {
        if (frontIdFile && backIdFile) {
            try {
                setIsUploadingFront(true);
                setIsUploadingBack(true);
                setUploadProgress(10);

                // Simulate progress for better UX
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return 90;
                        }
                        return prev + 10;
                    });
                }, 200);

                // Upload files using the provided actions
                const [frontUrl, backUrl] = await Promise.all([
                    actions.uploadFront(frontIdFile),
                    actions.uploadBack(backIdFile, frontIdFile) // Pass any additional arguments as needed
                ]);

                clearInterval(progressInterval);
                setUploadProgress(100);

                // Return URLs for form updates
                return { frontUrl, backUrl };
            } catch (error) {
                console.error('Error uploading files:', error);
                throw error;
            } finally {
                setIsUploadingFront(false);
                setIsUploadingBack(false);
            }
        }
        return { frontUrl: null, backUrl: null };
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customer_msisdn">Customer MSISDN*</Label>
                    <Controller
                        name="customer_msisdn"
                        control={control}
                        rules={{
                            required: 'Customer phone number is required',
                            pattern: {
                                value: /^[0-9]{10,12}$/,
                                message: 'Please enter a valid phone number'
                            }
                        }}
                        render={({field}) => (
                            <Input
                                id="customer_msisdn"
                                placeholder="e.g., 254722XXXXXX"
                                {...field}
                                className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${errors.customer_msisdn ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                            />
                        )}
                    />
                    {errors.customer_msisdn &&
                        <p className="text-red-500 dark:text-red-400 text-sm">{errors.customer_msisdn.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="customer_id_number">Customer ID Number*</Label>
                    <Controller
                        name="customer_id_number"
                        control={control}
                        rules={{required: 'Customer ID number is required'}}
                        render={({field}) => (
                            <Input
                                id="customer_id_number"
                                placeholder="Enter customer ID number"
                                {...field}
                                className={`bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${errors.customer_id_number ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                            />
                        )}
                    />
                    {errors.customer_id_number &&
                        <p className="text-red-500 dark:text-red-400 text-sm">{errors.customer_id_number.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="customer_id_front">ID Front</Label>
                    <Controller
                        name="customer_id_front_url"
                        control={control}
                        render={({field}) => (
                            <FileUpload
                                onChange={(file, url) => {
                                    handleFrontIdSelected(file, url);
                                    field.onChange(url || '');
                                }}
                                value={field.value}
                                acceptedFileTypes=".jpg,.jpeg,.png"
                                maxFileSizeMB={5}
                                showUpload={false}
                                label="Upload front ID photo"
                                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            />
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="customer_id_back">ID Back</Label>
                    <Controller
                        name="customer_id_back_url"
                        control={control}
                        render={({field}) => (
                            <FileUpload
                                onChange={(file, url) => {
                                    handleBackIdSelected(file, url);
                                    field.onChange(url || '');
                                }}
                                value={field.value}
                                acceptedFileTypes=".jpg,.jpeg,.png"
                                maxFileSizeMB={5}
                                showUpload={false}
                                label="Upload back ID photo"
                                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            />
                        )}
                    />
                </div>
            </div>

            {(isUploadingFront || isUploadingBack) && (
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                        <span>Uploading ID documents...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-600 rounded-full transition-all duration-300"
                            style={{width: `${uploadProgress}%`}}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export { CustomerInfo };