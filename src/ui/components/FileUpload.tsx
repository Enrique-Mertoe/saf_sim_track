import React, {useState, useRef} from 'react';
import {cn} from '@/lib/utils';
import {createSupabaseClient} from '@/lib/supabase/client';
import {v4 as uuidv4} from 'uuid';

interface FileUploadProps {
    onChange: (url: string) => void;
    value?: string;
    label?: string;
    acceptedFileTypes?: string;
    maxFileSizeMB?: number;
    className?: string;
    bucketName?: string;
    folderPath?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
                                                          onChange,
                                                          value,
                                                          label = 'Upload file',
                                                          acceptedFileTypes = '.jpg,.jpeg,.png,.pdf',
                                                          maxFileSizeMB = 5,
                                                          className,
                                                          bucketName = 'customer-documents',
                                                          folderPath = 'id-documents',
                                                      }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // File validation
        if (maxFileSizeMB && file.size > maxFileSizeMB * 1024 * 1024) {
            setError(`File size exceeds the ${maxFileSizeMB}MB limit`);
            return;
        }

        if (acceptedFileTypes) {
            const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
            const acceptedTypes = acceptedFileTypes.split(',');

            if (!acceptedTypes.some(type =>
                type.trim() === fileExtension ||
                type.trim() === file.type ||
                (type.includes('/*') && file.type.startsWith(type.replace('/*', '/')))
            )) {
                setError(`File type not accepted. Please upload ${acceptedFileTypes}`);
                return;
            }
        }

        // Start upload
        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const supabase = createSupabaseClient();

            // Create a unique file name to prevent overwriting
            const uniqueFileName = `${folderPath}/${uuidv4()}-${file.name}`;

            // Upload the file to Supabase Storage
            const {data, error: uploadError} = await supabase.storage
                .from(bucketName)
                .upload(uniqueFileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                throw new Error(uploadError.message);
            }

            // Get the public URL
            const {data: urlData} = supabase.storage
                .from(bucketName)
                .getPublicUrl(uniqueFileName);

            if (urlData?.publicUrl) {
                onChange(urlData.publicUrl);
            } else {
                throw new Error('Failed to get public URL');
            }

            setUploadProgress(100);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Failed to upload file');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onChange('');
    };

    const getFileName = (url: string) => {
        if (!url) return '';
        try {
            // Extract the filename from the URL
            const path = new URL(url).pathname;
            const fullName = path.split('/').pop() || '';
            // Remove the UUID prefix if present
            const nameParts = fullName.split('-');
            return nameParts.length > 1 ? nameParts.slice(1).join('-') : fullName;
        } catch (e) {
            return url.split('/').pop() || '';
        }
    };

    return (
        <div className={cn('space-y-2', className)}>
            {!value ? (
                <div
                    className={cn(
                        'border-2 border-dashed rounded-lg p-4',
                        error ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-gray-400',
                        'focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500',
                        'transition duration-150'
                    )}
                >
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-2 rounded-full bg-gray-100">
                            <svg
                                className="h-6 w-6 text-gray-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                        </div>
                        <div className="text-center">
                            <label
                                htmlFor={`file-upload-${label?.replace(/\s+/g, '-').toLowerCase()}`}
                                className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                                {label}
                                <input
                                    id={`file-upload-${label?.replace(/\s+/g, '-').toLowerCase()}`}
                                    ref={fileInputRef}
                                    type="file"
                                    className="sr-only"
                                    onChange={handleFileChange}
                                    accept={acceptedFileTypes}
                                    disabled={isUploading}
                                />
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                                {acceptedFileTypes.replace(/\./g, '').toUpperCase()} up to {maxFileSizeMB}MB
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-blue-100">
                                <svg
                                    className="h-5 w-5 text-blue-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{getFileName(value)}</p>
                                <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-500"
                                >
                                    View file
                                </a>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            title="Remove"
                        >
                            <svg
                                className="h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {isUploading && (
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{width: `${uploadProgress}%`}}
                        ></div>
                    </div>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};

export default FileUpload;