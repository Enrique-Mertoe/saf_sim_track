"use client"
import React, {ChangeEvent, useEffect, useState} from 'react';
import {AnimatePresence, motion, percent} from 'framer-motion';
import Button from "@/app/accounts/components/Button";
import simService from "@/services/simService";
import MaterialSelect from "@/ui/components/MaterialSelect";
import {SIMCard, SIMCardCreate, SIMStatus, Team as Team1, User} from "@/models";
import {teamService} from "@/services";
import {toast} from "react-hot-toast";
import Progress from "@/ui/components/MaterialProgress";
import useApp from "@/ui/provider/AppProvider";

// Define TypeScript interfaces
interface SerialNumber {
    id: string; // Unique identifier for each serial
    value: string;
    isValid: boolean;
    isChecking: boolean;
    checkError: string | null;
    exists: boolean;
    isUploading: boolean;
    isUploaded: boolean;
    uploadError: string | null;
}

type Team = Team1 & {
    users?: User,
    leader: string
}

// Generate a unique ID
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const SerialNumberForm: React.FC = () => {
    const {user} = useApp()
    const [inputValue, setInputValue] = useState<string>('');
    const [serialNumbers, setSerialNumbers] = useState<SerialNumber[]>([]);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [uploadMessage, setUploadMessage] = useState<string | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [checkingCount, setCheckingCount] = useState<number>(0);
    const [uploadingCount, setUploadingCount] = useState<number>(0);
    const [currentPercentage, setcurrentPercentage] = useState<number>(0)
    const [uploadedSofar, setSofar] = useState<number>(0)
    const [teams, setTeams] = useState<Team[]>([])

    // Handle input change
    const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInputValue(value);
    };

    useEffect(() => {
        async function fetchTeams() {
            const {data, error} = await teamService.getAllTeams()
            if (error)
                return setGlobalError(error.message)
            setTeams((data as Team[])?.map(team => {
                team.leader = team.users?.full_name ?? 'No leader'
                return team
            }))
        }

        fetchTeams().then()
    }, []);

    const process = async () => {
        // Split by whitespace and filter out empty strings
        const serialsToParse = inputValue.split(/\s+/).filter(Boolean);


        if (serialsToParse.length === 0) {
            throw new Error('No valid serial numbers found');
        }

        // Reset the input field
        setInputValue('');
        // eslint-disable-next-line prefer-const
        let {data, error: simError} = await simService.getAllSimCards(user!)
        if (!data || simError)
            data = []
        const simdataMapa = data.map((data: SIMCard) => data.serial_number)

        // Add all serials to the grid immediately, then check each individually
        const newSerials: SerialNumber[] = serialsToParse
            .map(serial => serial.trim())
            .filter(serial => serial.length >= 16 && !isNaN(Number(serial)))
            .map(serial => ({
                id: generateId(),
                value: serial,
                isValid: !isNaN(Number(serial)),
                isChecking: false,
                checkError: null,
                exists: simdataMapa.includes(serial),
                isUploading: false,
                isUploaded: false,
                uploadError: null
            }));

        if (newSerials.length === 0) {
            throw new Error('All serial numbers were too short (less than 16 characters)');
        }

        setCheckingCount(newSerials.length);
        setSerialNumbers(prev => [...prev, ...newSerials]);
        return newSerials.length;
    };

    const handlePaste = async () => {
        if (!inputValue.trim()) {
            setGlobalError('Please paste some serial numbers first!');
            return;
        }

        setGlobalError(null);
        try {
            setIsProcessing(true);
            // Use setTimeout to ensure the UI updates before the process begins
            await new Promise(resolve => setTimeout(resolve, 0));
            await process();
        } catch (err: any) {
            console.error('Error processing serial numbers:', err);
            setGlobalError(err.message || 'Failed to process serial numbers');
            setIsProcessing(false);
        }
    };

    const removeSerial = (id: string) => {
        setSerialNumbers(prev => prev.filter(s => s.id !== id));
    };

    const editSerial = (id: string, newValue: string) => {
        setSerialNumbers(prev =>
            prev.map(s =>
                s.id === id
                    ? {
                        ...s,
                        value: newValue,
                        isValid: !isNaN(Number(newValue)) && newValue.length >= 16,
                        isChecking: true,
                        checkError: null,
                        exists: false
                    }
                    : s
            )
        );
        // Increment checking count when a serial is edited and needs rechecking
        setCheckingCount(prev => prev + 1);
    };

    const updateSerialStatus = (id: string, updates: Partial<SerialNumber>) => {
        setSerialNumbers(prev =>
            prev.map(s => s.id === id ? {...s, ...updates} : s)
        );
    };

    const handleCheckComplete = () => {
        setCheckingCount(prev => Math.max(0, prev - 1));
    };

    const handleUploadComplete = (success: boolean) => {
        setUploadingCount(prev => Math.max(0, prev - 1));

        // Remove successfully uploaded serial after delay
        if (success) {
            setTimeout(() => {
                setSerialNumbers(prev => prev.filter(s => !s.isUploaded));
            }, 2000);
        }
    };

    const uploadAllSerials = async () => {
        if (!selectedTeam) {
            toast.error("Select team")
            return setGlobalError("Select Team")
        }
        // Filter only valid, non-existing, non-uploaded, and not-checking serials
        const serialsToUpload = serialNumbers
            .filter(serial =>
                serial.isValid &&
                !serial.exists &&
                !serial.isUploaded &&
                !serial.isChecking &&
                !serial.isUploading);

        if (serialsToUpload.length === 0) {
            setGlobalError('No valid new serial numbers to upload');
            return;
        }

        setGlobalError(null);
        setUploadMessage(`Starting upload of ${serialsToUpload.length} serials to ${teams.find(t => t.id === selectedTeam)?.name}...`);
        setIsUploading(true);
        setUploadingCount(serialsToUpload.length);


        // Mark all serials as uploading
        await simService.createSIMCardBatch(serialsToUpload.map(ser => {
            const ser_data: SIMCardCreate = {
                match: SIMStatus.UNMATCH, quality: SIMStatus.NONQUALITY, serial_number: ser.value,
                team_id: selectedTeam

            }
            return ser_data
        }), 50, (p, v) => {
            setcurrentPercentage(p)
            setSofar(v)
        });
        setIsUploading(false);
        setTimeout(clearAll, 1000)
    };

    const clearAll = () => {
        setSerialNumbers([]);
        setUploadMessage(null);
        setGlobalError(null);
        setCheckingCount(0);
        setUploadingCount(0);
        setIsProcessing(false);
        setIsUploading(false);
    };

    // Automatically update processing state when all serials are checked
    useEffect(() => {
        if (isProcessing && checkingCount === 0) {
            setIsProcessing(false);
        }
    }, [checkingCount, isProcessing]);

    // Automatically update uploading state when all uploads complete
    useEffect(() => {
        if (isUploading && uploadingCount === 0) {
            setIsUploading(false);
            setUploadMessage(`Upload complete!`);

            // Clear message after 5 seconds
            setTimeout(() => {
                setUploadMessage(null);
            }, 5000);
        }
    }, [uploadingCount, isUploading]);

    // Calculate stats
    const totalCount = serialNumbers.length;
    const validCount = serialNumbers.filter(s => s.isValid && !s.isChecking).length;
    const existingCount = serialNumbers.filter(s => s.exists).length;
    const uploadedCount = serialNumbers.filter(s => s.isUploaded).length;
    const newValidCount = serialNumbers.filter(s =>
        s.isValid && !s.exists && !s.isUploaded && !s.isChecking && !s.isUploading
    ).length;
    const invalidCount = serialNumbers.filter(s => !s.isValid && !s.isChecking).length;

    // Handle team selection
    const handleTeamChange = (value: string) => {
        setSelectedTeam(value);
    };

    return (
        <div className="w-full mx-auto p-6">
            <h1 className="text-3xl font-bold text-center mb-8 text-green-700">
                Safaricom SIM Serial Upload
            </h1>

            {/* Team Selection */}
            <div className="mb-6">
                <label
                    htmlFor="team-select"
                    className="block mb-2 text-lg font-medium text-gray-700"
                >
                    Select Team
                </label>
                <MaterialSelect
                    valueKey={"id"}
                    displayKey={"name,leader"}
                    value={selectedTeam}
                    animation={"slide"}
                    onChange={handleTeamChange}
                    options={teams}
                    // className="w-full p-3 border-2 border-green-300 rounded-lg
                    // focus:ring-green-500 focus:border-green-500 transition-all duration-300
                    // text-gray-700"
                />
            </div>

            {/* Input Section */}
            <div className="mb-8">
                <label
                    htmlFor="serial-input"
                    className="block mb-2 text-lg font-medium text-gray-700"
                >
                    Paste Your Serial Numbers
                </label>

                <div className="flex relative">
                    <textarea
                        id="serial-input"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="Paste serial numbers separated by spaces or new lines (numbers less than 16 digits will be skipped)..."
                        className="w-full h-32 p-4 border-2 border-green-300 rounded-lg
                            focus:ring-green-500 focus:border-green-500 transition-all duration-300
                            placeholder-gray-400 text-sm font-mono outline-0"
                    />
                    <div className="absolute right-4 bottom-4 font-medium">
                        <Button
                            isLoading={isProcessing}
                            text="Process Serial Numbers"
                            onClick={handlePaste}
                        />
                    </div>
                </div>
            </div>
            <Progress
                progress={currentPercentage}
                current={uploadedSofar}
                total={serialNumbers.length}
            />

            {/* Status messages */}
            <AnimatePresence>
                {uploadMessage && (
                    <motion.div
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0}}
                        className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700"
                    >
                        {uploadMessage}
                    </motion.div>
                )}

                {globalError && (
                    <motion.div
                        initial={{opacity: 0, y: -10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0}}
                        className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700"
                    >
                        {globalError}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Section */}
            {serialNumbers.length > 0 && (
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm"
                >
                    <h2 className="text-lg font-medium text-gray-700 mb-2">Summary</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <div className="text-2xl font-bold text-gray-800">{totalCount}</div>
                            <div className="text-sm text-gray-500">Total Numbers</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm">
                            <div className="text-2xl font-bold text-blue-600">{checkingCount}</div>
                            <div className="text-sm text-gray-500">Checking</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-green-200 shadow-sm">
                            <div className="text-2xl font-bold text-green-600">{newValidCount}</div>
                            <div className="text-sm text-gray-500">Ready to Upload</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm">
                            <div className="text-2xl font-bold text-purple-600">{uploadingCount}</div>
                            <div className="text-sm text-gray-500">Uploading</div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Serial Numbers Grid */}
            {serialNumbers.length > 0 && (
                <div className="mb-6">
                    <div className="flex justify-between items-center gap-2 mb-4">
                        <h2 className="text-lg font-medium text-gray-700">Serial Numbers</h2>
                        {/* Action Buttons */}
                        {serialNumbers.length > 0 && (
                            <motion.button
                                whileHover={{scale: 1.05}}
                                whileTap={{scale: 0.95}}
                                onClick={uploadAllSerials}
                                disabled={newValidCount === 0 || isUploading}
                                className="text-green-600 hover:text-green-700 ms-auto px-4 py-2 font-medium
                            flex items-center justify-center min-w-[200px]
                            disabled:text-gray-400 disabled:cursor-not-allowed
                            transition-colors duration-300"
                            >
                                {isUploading ? (
                                    <>
                                        <span
                                            className="inline-block animate-spin h-4 w-4 mr-2 border-2 border-green-600 border-t-transparent rounded-full"></span>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd"
                                                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                                                  clipRule="evenodd"/>
                                        </svg>
                                        Upload {newValidCount} Serial{newValidCount !== 1 ? 's' : ''} to {teams.find(t => t.id === selectedTeam)?.name}
                                    </>
                                )}
                            </motion.button>
                        )}
                        <button
                            onClick={clearAll}
                            className="text-sm text-red-600 hover:text-red-800"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <AnimatePresence>
                            {serialNumbers.map((serial) => (
                                <SerialItem
                                    key={serial.id}
                                    serial={serial}
                                    editSerial={editSerial}
                                    removeSerial={removeSerial}
                                    selectedTeam={selectedTeam}
                                    teams={teams}
                                    onCheckComplete={handleCheckComplete}
                                    onUploadComplete={handleUploadComplete}
                                    updateSerialStatus={updateSerialStatus}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SerialNumberForm;

// SerialItem component handles its own checking and uploading processes
const SerialItem = ({
                        serial,
                        editSerial,
                        removeSerial,
                        selectedTeam,
                        teams,
                        onCheckComplete,
                        onUploadComplete,
                        updateSerialStatus
                    }: {
    serial: SerialNumber;
    editSerial: (id: string, value: string) => void;
    removeSerial: (id: string) => void;
    selectedTeam: string;
    teams: Team[];
    onCheckComplete: () => void;
    onUploadComplete: (success: boolean) => void;
    updateSerialStatus: (id: string, updates: Partial<SerialNumber>) => void;
}) => {
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

        // checkSerialExistence();
    }, [serial.id, serial.value, serial.isValid, serial.isChecking]);

    // Handle serial upload
    useEffect(() => {
        const uploadSerial = async () => {
            if (!serial.isUploading) return;

            try {
                // Skip if not valid, already exists, already uploaded
                if (!serial.isValid || serial.exists || serial.isUploaded || serial.isChecking) {
                    updateSerialStatus(serial.id, {isUploading: false});
                    onUploadComplete(false);
                    return;
                }
                console.log("serial", selectedTeam)
                const simdata = await simService.createSIMCard({
                    serial_number: serial.value,
                    team_id: selectedTeam,
                    sold_by_user_id: null,
                    match: SIMStatus.UNMATCH,
                    quality: SIMStatus.NONQUALITY
                })
                if (!simdata) {
                    throw new Error("Failed to upload SIM serial");
                }
                // Success case
                updateSerialStatus(serial.id, {
                    isUploading: false,
                    isUploaded: true,
                    exists: true,
                    uploadError: null
                });
                onUploadComplete(true);

            } catch (err: any) {
                console.error('Error uploading serial:', serial.value, err);
                updateSerialStatus(serial.id, {
                    isUploading: false,
                    uploadError: err.message || 'Failed to upload'
                });
                onUploadComplete(false);
            }
        };

        uploadSerial().then();
    }, [serial.isUploading]);

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