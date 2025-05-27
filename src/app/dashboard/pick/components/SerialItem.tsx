import React, {ChangeEvent, useEffect, useState} from "react";
import simService from "@/services/simService";
import {motion} from "framer-motion";
import {SerialItemProps} from "@/app/dashboard/pick/types";

export const SerialItem = ({
                        serial,
                        editSerial,
                        removeSerial,
                        selectedTeam,
                        teams,
                        onCheckComplete,
                        onUploadComplete,
                        updateSerialStatus
                    }: SerialItemProps) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);

    // Check if a serial exists in the database
    const checkIfSerialExists = async (serial: string): Promise<boolean> => {
        try {
            const simCard = await simService.getSIMCardBySerialNumber(serial);
            return !!(simCard && simCard.id);
        } catch (error) {
            console.error("Error checking serial:", error);
            return false;
        }
    };

    // Check the serial existence when component mounts or when serial value changes
    useEffect(() => {
        const checkSerialExistence = async () => {
            if (!serial.isChecking) return;

            try {
                if (!serial.isValid) {
                    updateSerialStatus(serial.id, {
                        isChecking: false,
                        checkError: 'Not a valid number'
                    });
                    onCheckComplete();
                    return;
                }

                // Check if serial exists
                const exists = await checkIfSerialExists(serial.value);

                updateSerialStatus(serial.id, {
                    isChecking: false,
                    exists: exists,
                    checkError: null
                });
            } catch (err: any) {
                console.error('Error checking serial existence:', err);
                updateSerialStatus(serial.id, {
                    isChecking: false,
                    checkError: 'Check failed: ' + (err.message || 'Unknown error')
                });
            } finally {
                onCheckComplete();
            }
        };

        // Uncommented to ensure serial existence checking works properly
        checkSerialExistence();
    }, [serial.id, serial.value, serial.isValid, serial.isChecking, onCheckComplete, updateSerialStatus]);

    // Handle serial upload


    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        editSerial(serial.id, newValue);
        setIsEditing(true);
    };

    const handleInputBlur = () => {
        setIsEditing(false);
    };

    return (
        <motion.div
            key={serial.id}
            initial={{opacity: 0, scale: 0.8}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.8, transition: {duration: 0.3}}}
            transition={{duration: 0.2}}
            className={`p-3 rounded-lg border shadow-sm relative
                ${serial.isUploaded
                ? 'border-purple-200 bg-purple-50'
                : serial.isUploading
                    ? 'border-blue-200 bg-blue-50'
                    : serial.isChecking
                        ? 'border-blue-200 bg-blue-50'
                        : serial.isValid
                            ? serial.exists
                                ? 'border-yellow-200 bg-yellow-50'
                                : serial.uploadError
                                    ? 'border-red-200 bg-red-50'
                                    : 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'}`}
        >
            <input
                type="text"
                value={serial.value}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                disabled={serial.isUploaded || serial.isUploading || serial.isChecking}
                className={`w-full p-2 rounded border font-mono text-sm
                    ${serial.isValid && !serial.isChecking
                    ? isEditing ? 'border-blue-500' : 'border-gray-200 focus:border-green-500'
                    : serial.isChecking
                        ? 'border-blue-300'
                        : 'border-red-300 focus:border-red-500'}
                    ${(serial.isUploaded || serial.isUploading || serial.isChecking) ? 'bg-gray-100' : ''}`}
            />

            <div className="mt-2 flex justify-between items-center">
                <div className="flex items-center">
                    {serial.isChecking ? (
                        <span className="flex items-center text-blue-600 text-xs">
                            <span
                                className="inline-block animate-spin h-3 w-3 mr-1 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                            Checking...
                        </span>
                    ) : serial.isUploading ? (
                        <span className="flex items-center text-blue-600 text-xs">
                            <span
                                className="inline-block animate-spin h-3 w-3 mr-1 border-2 border-blue-600 border-t-transparent rounded-full"></span>
                            Uploading to {teams.find(t => t.id === selectedTeam)?.name}...
                        </span>
                    ) : serial.isUploaded ? (
                        <span className="flex items-center text-purple-600 text-xs">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"/>
                            </svg>
                            Uploaded to {teams.find(t => t.id === selectedTeam)?.name}
                        </span>
                    ) : serial.uploadError ? (
                        <span className="flex items-center text-red-600 text-xs">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"/>
                            </svg>
                            {serial.uploadError}
                        </span>
                    ) : serial.isValid ? (
                        serial.exists ? (
                            <span className="flex items-center text-yellow-600 text-xs">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd"
                                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z"
                                          clipRule="evenodd"/>
                                </svg>
                                Already exists
                            </span>
                        ) : (
                            <span className="flex items-center text-green-600 text-xs">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"/>
                                </svg>
                                Ready to upload
                            </span>
                        )
                    ) : (
                        <span className="flex items-center text-red-600 text-xs">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"/>
                            </svg>
                            {serial.checkError || 'Invalid format'}
                        </span>
                    )}
                </div>

                {!serial.isUploaded && !serial.isUploading && !serial.isChecking && (
                    <motion.button
                        whileHover={{scale: 1.1}}
                        whileTap={{scale: 0.9}}
                        onClick={() => removeSerial(serial.id)}
                        className="text-gray-400 hover:text-red-600"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"/>
                        </svg>
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};
