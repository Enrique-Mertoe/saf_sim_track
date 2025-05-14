import React, {useState, useRef, useCallback} from 'react';
import {cn} from '@/lib/utils';
import {v4 as uuidv4} from 'uuid';

interface FileUploadProps {
    onChange: (file: File | null, url?: string) => void;
    value?: string;
    label?: string;
    acceptedFileTypes?: string;
    maxFileSizeMB?: number;
    className?: string;
    bucketName?: string;
    folderPath?: string;
    showUpload?: boolean;
    uploadFunction?: (file: File) => Promise<string | null>;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    showUpload = true,
    uploadFunction,
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset states when clearing file
    const resetFileStates = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Generate preview when file is selected
    const generatePreview = useCallback((file: File) => {
        // Clear any previous preview
        if (filePreview) {
            URL.revokeObjectURL(filePreview);
        }

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const preview = URL.createObjectURL(file);
            setFilePreview(preview);
        } else if (file.type === 'application/pdf') {
            // Show PDF icon for PDFs
            setFilePreview('pdf');
        } else {
            // Show generic file icon for other types
            setFilePreview('file');
        }

        setSelectedFile(file);

        // Notify parent component about the file selection
        onChange(file);
    }, [filePreview, onChange]);

    const validateFile = (file: File): boolean => {
        // File size validation
        if (maxFileSizeMB && file.size > maxFileSizeMB * 1024 * 1024) {
            setError(`File size exceeds the ${maxFileSizeMB}MB limit`);
            return false;
        }

        // File type validation
        if (acceptedFileTypes) {
            const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
            const acceptedTypes = acceptedFileTypes.split(',');

            if (!acceptedTypes.some(type =>
                type.trim() === fileExtension ||
                type.trim() === file.type ||
                (type.includes('/*') && file.type.startsWith(type.replace('/*', '/')))
            )) {
                setError(`File type not accepted. Please upload ${acceptedFileTypes}`);
                return false;
            }
        }

        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setError(null);

        if (!file) return;

        if (validateFile(file)) {
            generatePreview(file);
        } else {
            resetFileStates();
            onChange(null);
        }
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setError(null);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        if (validateFile(file)) {
            generatePreview(file);
        } else {
            onChange(null);
        }
    };

    const handleCancel = () => {
        resetFileStates();
        onChange(null);
    };

    const handleRemove = () => {
        resetFileStates();
        onChange(null, '');
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

    const openFileSelector = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const formatFileSize = (size: number) => {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className={cn('space-y-4', className)}>
            {!value && !selectedFile ? (
                <div
                    className={cn(
                        'border-2 border-dashed rounded-lg p-6 transition-all duration-300 cursor-pointer',
                        isDragging ? 'border-green-500 bg-green-50 scale-105' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
                        error ? 'border-red-400 bg-red-50' : '',
                        'focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500'
                    )}
                    onClick={openFileSelector}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-3 rounded-full bg-gray-100 transition-transform duration-300 hover:scale-110">
                            <svg
                                className="h-8 w-8 text-gray-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-green-600">
                                {isDragging ? 'Drop your file here' : label}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Drag & drop or click to browse
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {acceptedFileTypes.replace(/\./g, '').toUpperCase()} up to {maxFileSizeMB}MB
                            </p>
                            <input
                                id={`file-upload-${label?.replace(/\s+/g, '-').toLowerCase()}`}
                                ref={fileInputRef}
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                                accept={acceptedFileTypes}
                                disabled={isUploading}
                            />
                        </div>
                    </div>
                </div>
            ) : selectedFile ? (
                <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="p-4 bg-gray-50 border-b">
                        <h3 className="text-sm font-medium">Preview</h3>
                    </div>

                    <div className="p-4">
                        <div className="flex flex-col space-y-4">
                            {/* File Preview */}
                            <div className="flex justify-center p-4 bg-gray-100 rounded-lg">
                                {filePreview && filePreview !== 'pdf' && filePreview !== 'file' ? (
                                    <img
                                        src={filePreview}
                                        alt="File preview"
                                        className="max-h-48 max-w-full object-contain rounded shadow-sm transform transition-transform hover:scale-105"
                                    />
                                ) : filePreview === 'pdf' ? (
                                    <div
                                        className="h-40 w-32 flex items-center justify-center bg-red-50 rounded border border-red-200 p-2 transform transition-transform hover:scale-105">
                                        <svg className="h-16 w-16 text-red-500" xmlns="http://www.w3.org/2000/svg"
                                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                    </div>
                                ) : (
                                    <div
                                        className="h-40 w-32 flex items-center justify-center bg-blue-50 rounded border border-blue-200 p-2 transform transition-transform hover:scale-105">
                                        <svg className="h-16 w-16 text-blue-500" xmlns="http://www.w3.org/2000/svg"
                                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* File Info */}
                            <div className="flex flex-col space-y-1 text-sm">
                                <p className="font-medium">{selectedFile.name}</p>
                                <p className="text-gray-500">{formatFileSize(selectedFile.size)}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-150"
                                    disabled={isUploading}
                                >
                                    Cancel
                                </button>
                                {showUpload && (
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-150 flex items-center space-x-1"
                                        disabled={true}
                                    >
                                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none"
                                             viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                        </svg>
                                        <span>Selected</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : value ? (
                <div
                    className="border rounded-lg p-4 bg-gray-50 shadow-sm transform transition-all duration-300 hover:shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div
                                className="p-2 rounded-full bg-green-100 transform transition-transform duration-300 hover:scale-110">
                                <svg
                                    className="h-5 w-5 text-green-600"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{getFileName(value)}</p>
                                <p className="text-xs text-gray-500">Uploaded successfully</p>
                                <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-green-600 hover:text-green-500 inline-flex items-center space-x-1 mt-1 transition-colors duration-150"
                                >
                                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                    </svg>
                                    <span>View file</span>
                                </a>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors duration-150"
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
            ) : null}

            {isUploading && (
                <div className="space-y-1 animate-pulse">
                    <div className="flex justify-between items-center text-xs">
                        <span>Uploading...</span>
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

            {error && (
                <div
                    className="flex items-center space-x-2 p-2 rounded-md bg-red-50 border border-red-200 animate-fadeIn">
                    <svg className="h-4 w-4 text-red-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p className="text-xs text-red-700">{error}</p>
                </div>
            )}

            {/* Add animation keyframes to global style */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
};

export default FileUpload;