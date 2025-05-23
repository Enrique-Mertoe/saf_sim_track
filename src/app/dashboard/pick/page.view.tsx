"use client"
import React, {ChangeEvent, useEffect, useState, useRef} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import Button from "@/app/accounts/components/Button";
import simService from "@/services/simService";
import MaterialSelect from "@/ui/components/MaterialSelect";
import {SIMCard, SIMCardCreate, SIMStatus, Team as Team1, User} from "@/models";
import {teamService} from "@/services";
import {toast} from "react-hot-toast";
import Progress from "@/ui/components/MaterialProgress";
import useApp from "@/ui/provider/AppProvider";
import {FileText, Loader2, Maximize2} from 'lucide-react';
import {useDialog} from "@/app/_providers/dialog";
import PaginatedSerialGrid from "@/app/dashboard/pick/components/ItemList";
import * as mammoth from 'mammoth';
import * as Papaparse from 'papaparse';
import alert from "@/ui/alert";
import {string} from "yup";

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
    const [currentPercentage, setcurrentPercentage] = useState<number>(0);
    const [uploadedSofar, setSofar] = useState<number>(0);
    const [teams, setTeams] = useState<Team[]>([]);
    const [isFileProcessing, setIsFileProcessing] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pdfjsLib, setPdfjsLib] = useState(null);
    const [isPdfInitializing, setIsPdfInitializing] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [pdfProgress, setPdfProgress] = useState(0);

    // Initialize PDF.js when needed
    const initializePdfJs = async () => {
        if (pdfjsLib) return pdfjsLib;

        try {
            setIsPdfInitializing(true);
            // Dynamically import PDF.js library
            // @ts-ignore
            const pdfjs = await import('pdfjs-dist/webpack');
            setPdfjsLib(pdfjs);
            setIsPdfInitializing(false);
            return pdfjs;
        } catch (err) {
            console.error('Error initializing PDF.js:', err);
            setGlobalError('Failed to initialize PDF processing library. Please try again later.');
            setIsPdfInitializing(false);
            return null;
        }
    };

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

    const normalizeText = (text: string) => {
        // Remove excessive whitespace and normalize line breaks
        return text
            .replace(/\s+/g, ' ')      // Replace multiple spaces with a single space
            .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
            .trim();
    };

    const processPage = async (pdf: { getPage: (arg0: any) => any; }, pageNum: number) => {
        try {
            // Get the page
            const page = await pdf.getPage(pageNum);

            // Get text content with enhanced options
            const textContent = await page.getTextContent({
                normalizeWhitespace: true,
                disableCombineTextItems: false
            });

            // Track lines for better paragraph detection
            let lastY: number | null = null;
            const lines = [];
            let currentLine: any[] = [];

            // Process each text item
            textContent.items.forEach((item: { str: string; transform: (number | null)[]; }) => {
                // Skip empty items
                if (!item.str.trim()) return;

                // Check if we're on a new line based on y-position
                // @ts-ignore
                if (lastY !== null && Math.abs(lastY - item.transform[5]) > 1) {
                    // New line detected
                    if (currentLine.length > 0) {
                        lines.push(currentLine.join(' '));
                        currentLine = [];
                    }
                }

                currentLine.push(item.str);
                lastY = item.transform[5];
            });

            // Add the last line if it exists
            if (currentLine.length > 0) {
                lines.push(currentLine.join(' '));
            }

            // Combine lines into paragraphs
            return lines.join('\n');
        } catch (err) {
            console.error(`Error processing page ${pageNum}:`, err);
            return `[Error extracting text from page ${pageNum}]`;
        }
    };

    const extractTextFromPdf = async (file: File) => {
        const pdfjs = await initializePdfJs();
        if (!pdfjs) {
            throw new Error('PDF processing library not initialized');
        }
        let p_reason: any = undefined;
        let done: boolean = true;
        let is_prompting: boolean = false;

        try {
            setPdfProgress(0);

            // Read the file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();

            // Load the PDF document with password support
            const loadingTask = pdfjs.getDocument({
                data: arrayBuffer,
                // Enable additional features for better text extraction
                useSystemFonts: true,
                disableFontFace: false,
            });

            // Handle password-protected PDFs
            loadingTask.onPassword = (callback: (arg0: string) => void, reason: number) => {
                p_reason = reason
                done = false
                if (is_prompting) return
                alert.prompt({
                    message:
                        reason === 1
                            ? 'Enter password to open this PDF file:'
                            : 'Invalid password. Please try again:'
                    , onCancel(): void {
                        setGlobalError('Password required to extract text from this PDF.');
                        setIsFileProcessing(false);
                        loadingTask.destroy();
                    },
                    onConfirm() {
                        setIsFileProcessing(false);
                        loadingTask.destroy();
                    }
                    , async task(password: string): Promise<any> {
                        if (password) {
                            callback(password);
                            return await new Promise<any>((resolve, reject) => {
                                const t = setInterval(() => {
                                    console.log("checking")
                                    if (p_reason != undefined && p_reason !== 1) {
                                        clearInterval(t)
                                        return reject('Invalid password. Please try again')
                                    }

                                    if (done) {
                                        clearInterval(t)
                                        return resolve(true)
                                    }

                                }, 300)
                            })
                        } else {
                            throw new Error('Password required to extract text from this PDF.');
                            //     setIsFileProcessing(false);
                            //     return loadingTask.destroy();
                        }
                    }

                })
                // const password = prompt(
                //     reason === 1
                //         ? 'Enter password to open this PDF file:'
                //         : 'Invalid password. Please try again:',
                //     ''
                // );
                //
                // if (password) {
                //     callback(password);
                // } else {
                // setGlobalError('Password required to extract text from this PDF.');
                // setIsFileProcessing(false);
                // loadingTask.destroy();
                // }
            };

            const pdf = await loadingTask.promise;
            done = true;
            is_prompting = false

            // Get total number of pages
            const numPages = pdf.numPages;
            setTotalPages(numPages);

            let fullText = '';

            // Process pages in batches to avoid memory issues with large PDFs
            const BATCH_SIZE = 10;
            for (let i = 1; i <= numPages; i += BATCH_SIZE) {
                const batch = [];

                // Create batch of promises for current set of pages
                for (let j = i; j <= Math.min(i + BATCH_SIZE - 1, numPages); j++) {
                    batch.push(processPage(pdf, j));
                }

                // Process batch
                const batchResults = await Promise.all(batch);
                fullText += batchResults.join('\n\n');

                // Update progress after each batch
                const progress = Math.min(i + BATCH_SIZE - 1, numPages) / numPages * 100;
                setPdfProgress(progress);
            }

            return normalizeText(fullText);
        } catch (err) {
            console.error('Error extracting text from PDF:', err);
            // @ts-ignore
            throw new Error(`Failed to extract text from PDF: ${err.message || 'Please make sure it is a valid PDF file.'}`);
        }
    };

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
        } catch (err) {
            console.error('Error processing serial numbers:', err);
            // @ts-ignore
            setGlobalError(err.message || 'Failed to process serial numbers');
            setIsProcessing(false);
        }
    };

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsFileProcessing(true);
            setGlobalError(null);

            let text = '';

            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                // Use our improved PDF extraction function
                text = await extractTextFromPdf(file);
                toast.success(`PDF processed. ${text.length > 0 ? 'Found potential serial numbers.' : 'No text extracted.'}`);
            } else if (file.type === 'text/plain') {
                text = await file.text();
            } else if (file.type === 'text/csv') {
                const content = await file.text();
                const results = Papaparse.parse(content, {header: true});
                // Find column that might contain serial numbers
                // @ts-ignore
                const serialColumn = Object.keys(results.data[0]).find(key =>
                    key.toLowerCase().includes('serial') ||
                    key.toLowerCase().includes('number') ||
                    key.toLowerCase().includes('sim')
                );

                if (serialColumn) {
                    // @ts-ignore
                    text = results.data.map(row => row[serialColumn]).join('\n');
                } else {
                    // If no obvious column, just join all values
                    // @ts-ignore
                    text = results.data.flatMap(row => Object.values(row)).join('\n');
                }
            } else if (file.type.includes('word') ||
                file.name.endsWith('.docx') ||
                file.name.endsWith('.doc')) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({arrayBuffer});
                text = result.value;
            } else {
                throw new Error('Unsupported file type. Please upload PDF, TXT, CSV, or Word document.');
            }

            setInputValue(text);
        } catch (err) {
            console.error('Error processing file:', err);
            // @ts-ignore
            setGlobalError(err.message || 'Failed to process file');
        } finally {
            setIsFileProcessing(false);
            setPdfProgress(0);
            setTotalPages(0);
            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Trigger the file input click
    const triggerFileUpload = () => {
        fileInputRef.current?.click();
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
                match: SIMStatus.MATCH, quality: SIMStatus.NONQUALITY, serial_number: ser.value,
                team_id: selectedTeam
            }
            updateSerialStatus(ser.id, {
                isUploading: true,
                isUploaded: false,
                exists: true,
                uploadError: null
            })
            return ser_data
        }), 50, (p, v, chunk, errors) => {
            setcurrentPercentage(p)
            setSofar(v)
            const all = chunk.map(s => s.serial_number)
            serialsToUpload.forEach(serial => {
                if (all.includes(serial.value)) {
                    updateSerialStatus(serial.id, {
                        isUploading: false,
                        isUploaded: true,
                        exists: true,
                        uploadError: errors ? errors.join('\n') : null
                    })
                }
            })
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
    const dialog = useDialog();

    // Check if any process is running
    const isAnyProcessRunning = isProcessing || isUploading || isFileProcessing || isPdfInitializing;

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
                    disabled={isAnyProcessRunning}
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
                        className="w-full h-32 p-4 border-2 scrollbar-thin scrollbar-track-rounded-full border-green-300 rounded-lg
                            focus:ring-green-500 focus:border-green-500 transition-all duration-300
                            placeholder-gray-400 text-sm font-mono outline-0"
                        disabled={isAnyProcessRunning}
                    />
                    <div className="absolute right-4 bottom-4 font-medium flex gap-2">
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.txt,.csv,.doc,.docx"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        {/* File upload button */}
                        <Button
                            className={"!h-8  !rounded-sm flex items-center"}
                            isLoading={isFileProcessing}
                            text={isFileProcessing ?
                                (totalPages > 0 ?
                                    `Processing PDF (${Math.ceil(pdfProgress / 100 * totalPages)}/${totalPages})` :
                                    "Processing File...")
                                : "Upload"}
                            onClick={triggerFileUpload}
                            disabled={isAnyProcessRunning && !isFileProcessing}
                            icon={isFileProcessing ? '' : <FileText className="mr-1 h-4 w-4"/>}
                        />

                        {/* Process button */}
                        <Button
                            className={"!h-8 !rounded-sm"}
                            isLoading={isProcessing}
                            text="Process"
                            onClick={handlePaste}
                            disabled={isAnyProcessRunning || !inputValue.trim()}
                        />
                    </div>
                    <div className="absolute right-1 top-1 font-medium">
                        <button
                            onClick={() => {
                                const d = dialog.create({
                                    content: <div className="relative p-2 w-full max-h-full">
                                        <div className="relative bg-white  dark:bg-gray-700">

                                            <div
                                                className="flex items-center justify-between p-2 border-b rounded-t dark:border-gray-600 border-gray-200">
                                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                    Serial numbers
                                                </h3>
                                                <button
                                                    onClick={() => d.dismiss()}
                                                    type="button"
                                                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                                    data-modal-hide="default-modal">
                                                    <svg className="w-3 h-3" aria-hidden="true"
                                                         xmlns="http://www.w3.org/2000/svg" fill="none"
                                                         viewBox="0 0 14 14">
                                                        <path stroke="currentColor" strokeLinecap="round"
                                                              strokeLinejoin="round" strokeWidth="2"
                                                              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                                                    </svg>
                                                    <span className="sr-only">Close modal</span>
                                                </button>
                                            </div>

                                            <div className="p-4 md:p-5 space-y-4">
                                                {inputValue.split("<br>").join("\n")}
                                            </div>
                                        </div>
                                    </div>,
                                    size: "lg",
                                    design: ["scrollable"]
                                })
                            }}
                            disabled={isAnyProcessRunning}
                            className={`cursor-pointer hover:bg-gray-500/10 rounded-full p-2 transition-colors ${isAnyProcessRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Maximize2 size={24}/>
                        </button>
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Supported file formats: PDF, TXT, CSV, DOC, DOCX
                </p>
            </div>

            {/* PDF Processing Progress */}
            {isFileProcessing && totalPages > 0 && (
                <div className="py-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span
                            className="text-gray-600">Extracting PDF text... {totalPages > 0 ? `(Page ${Math.ceil(pdfProgress / 100 * totalPages)} of ${totalPages})` : ''}</span>
                        <span className="text-gray-600">{pdfProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${pdfProgress}%`}}></div>
                    </div>
                </div>
            )}

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
                                disabled={newValidCount === 0 || isAnyProcessRunning}
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
                            disabled={isAnyProcessRunning}
                            className={`text-sm text-red-600 hover:text-red-800 ${isAnyProcessRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Clear All
                        </button>
                    </div>
                    <PaginatedSerialGrid
                        serialNumbers={serialNumbers}
                        editSerial={editSerial}
                        removeSerial={removeSerial}
                        selectedTeam={selectedTeam}
                        teams={teams}
                        onCheckComplete={handleCheckComplete}
                        onUploadComplete={handleUploadComplete}
                        updateSerialStatus={updateSerialStatus}
                    />
                </div>
            )}

        </div>
    );
};

export default SerialNumberForm;