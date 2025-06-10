"use client"
import React, {ChangeEvent, useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import Button from "@/app/accounts/components/Button";
import simService from "@/services/simService";
import {BatchMetadataCreate, SIMCard, SIMCardCreate, SIMStatus} from "@/models";
import {batchMetadataService, teamService} from "@/services";
import {toast} from "react-hot-toast";
import Progress from "@/ui/components/MaterialProgress";
import useApp from "@/ui/provider/AppProvider";
import {FileText, Maximize2} from 'lucide-react';
import {useDialog} from "@/app/_providers/dialog";
import PaginatedSerialGrid from "@/app/dashboard/pick/components/ItemList";
import * as mammoth from 'mammoth';
import * as Papaparse from 'papaparse';
import {isPicklist, parsePicklistText} from "@/utils/picklistParser";
import alert from "@/ui/alert";
import {generateId, SerialNumber, TabType, Team} from "@/app/dashboard/pick/types";
import Signal from "@/lib/Signal";
import {showModal} from "@/ui/shortcuts";
import BatchMetadataModalContent from "@/app/dashboard/pick/components/BatchMetaDataForm";
import TeamSelectionModalContent from "@/app/dashboard/pick/components/TeamSelectionModalContent";

// Using shared types from types.ts

function BatchTeam({team, batch, user}: any) {
    const [count, sC] = useState<number>(0);
    useEffect(() => {
        if (!user)
            return
        simService.countQuery(user, [
            ["batch_id", batch],
            ["team_id", team.id],
        ]).then(r => {
            sC(r.count ?? 0)
        })
    }, [user]);
    return (<span
        className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                                                        {team?.name || 'Unknown Team'}-{count}
                                                                    </span>);
}

function AssignedSims({batch, user}: any) {
    const [count, sC] = useState<number>(0);
    useEffect(() => {
        if (!user)
            return
        simService.countQuery(user, [
            ["batch_id", batch],
            ["assigned_to_user_id", "not", "is", "null"],
        ]).then(r => {
            sC(r.count ?? 0)
        })
    }, [user]);
    if (!user)
        return (
            <span
                className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                            ...
                                                        </span>
        )
    return (<span
        className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                            {count} assigned
                                                        </span>);
}

const SerialNumberForm: React.FC = () => {
    const {user} = useApp()
    const [activeTab, setActiveTab] = useState<TabType>('upload');
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
    const [uploadedBatches, setUploadedBatches] = useState<any[]>([]);
    const [batchMetadata, setBatchMetadata] = useState<BatchMetadataCreate | null>(null);
    const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(false);
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

    // Load uploaded batches when the view tab is selected
    useEffect(() => {
        if (activeTab === 'view' && user) {
            loadUploadedBatches();
        }
    }, [activeTab, user]);

    // Function to load uploaded batches
    const loadUploadedBatches = async () => {
        if (!user) return;

        setIsLoadingBatches(true);
        try {
            const {data, error} = await batchMetadataService.getBatchesWithCounts(user);

            if (error) {
                console.error('Error loading batches:', error);
                setGlobalError('Failed to load uploaded batches. Please try again.');
            } else if (data) {
                setUploadedBatches(data);
            }
        } catch (err) {
            console.error('Exception loading batches:', err);
            setGlobalError('An unexpected error occurred while loading batches.');
        } finally {
            setIsLoadingBatches(false);
        }
    };

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
        try {
            // Split by whitespace and filter out empty strings
            // Improved regex to handle various separators (spaces, commas, newlines)
            const serialsToParse = inputValue
                .split(/[\s,;]+/)
                .filter(Boolean)
                .map(s => s.trim());

            if (serialsToParse.length === 0) {
                throw new Error('No valid serial numbers found');
            }
            if (isPicklist(inputValue)) {
                const metadata = parsePicklistText(
                    inputValue,
                    'null',
                    '',
                    user!.id
                );
                setBatchMetadata(metadata)
            }

            // Reset the input field
            setInputValue('');

            // Fetch existing SIM cards more efficiently with error handling
            let existingSerials: string[] = [];
            try {
                const {data, error: simError} = await simService.getAllSimCards(user!);
                if (data && !simError) {
                    existingSerials = data.map((data: SIMCard) => data.serial_number);
                }
            } catch (err) {
                console.error('Error fetching existing SIM cards:', err);
                // Continue with empty array - we'll check existence individually later
            }


            // Deduplicate serials first
            const uniqueSerials = [...new Set(serialsToParse)];

            // Pre-filter obviously invalid serials
            const validSerials = uniqueSerials
                .filter(serial => serial.length >= 16 && !isNaN(Number(serial)));

            if (validSerials.length === 0) {
                throw new Error('No valid serial numbers found. Serial numbers must be at least 16 digits and contain only numbers.');
            }

            // Create serial objects with initial validation
            const newSerials: SerialNumber[] = validSerials.map(serial => ({
                id: generateId(),
                value: serial,
                isValid: true,
                isChecking: false,
                checkError: null,
                exists: existingSerials.includes(serial),
                isUploading: false,
                isUploaded: false,
                uploadError: null
            }));

            setCheckingCount(newSerials.length);
            setSerialNumbers(prev => [...prev, ...newSerials]);

            // Show user feedback about duplicates if any were removed
            if (uniqueSerials.length < serialsToParse.length) {
                toast.success(`Removed ${serialsToParse.length - uniqueSerials.length} duplicate serial numbers`);
            }

            // Show user feedback about invalid serials if any were filtered out
            if (validSerials.length < uniqueSerials.length) {
                toast.success(`Filtered out ${uniqueSerials.length - validSerials.length} invalid serial numbers`);
            }

            return newSerials.length;
        } catch (error) {
            // More graceful error handling
            console.error('Error in process function:', error);
            throw error; // Re-throw to be handled by the caller
        }
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

    function getSerials() {
        return [...serialNumbers]
            .filter(serial =>
                serial.isValid &&
                !serial.exists &&
                !serial.isUploaded &&
                !serial.isChecking &&
                !serial.isUploading).sort((a, b) => {
                const aVal = a.value || '';
                const bVal = b.value || '';
                return aVal.localeCompare(bVal, undefined, {numeric: true});
            })
    }

    // Function to show team selection modal
    const showTeamSelectionModal = (): Promise<any> => {

        return new Promise((resolve, reject) => {
            showModal({
                content: (onClose) => (
                    <TeamSelectionModalContent
                        teams={teams}
                        setSelectedTeam={setSelectedTeam}
                        onClose={onClose}
                        resolve={resolve}
                        reject={reject}
                        //@ts-ignore
                        serials={getSerials()}
                    />
                ),
                size: "lg",
            });
        });
    };

    // Function to prompt for batch metadata
    const promptForBatchMetadata = (batchId: string): Promise<BatchMetadataCreate> => {
        return new Promise((resolve, reject) => {
            showModal({
                content: (onClose) => (
                    (
                        <BatchMetadataModalContent
                            batchId={batchId}
                            selectedTeam={selectedTeam}
                            user={user}
                            onClose={onClose}
                            resolve={resolve}
                            reject={reject}
                        />
                    )
                ),
                size: "lg",
                // design: ["scrollable"]
            });
        });
    };

    const uploadAllSerials = async (selectionResult: any) => {
        // Handle both old format (string) and new format (object with teams and ranges)
        let selectedTeams: string[] = [];
        let teamRanges: any = {};

        if (typeof selectionResult === 'string') {
            // Old format - single team ID
            selectedTeams = [selectionResult];
            setSelectedTeam(selectionResult);
        } else if (selectionResult && selectionResult.teams) {
            // New format - multiple teams with ranges
            selectedTeams = selectionResult.teams;
            teamRanges = selectionResult.ranges || {};
            setSelectedTeam(selectedTeams[0]); // Set the first team as selected for backward compatibility
        } else {
            toast.error("Invalid team selection");
            return;
        }

        try {
            // Filter only valid, non-existing, non-uploaded, and not-checking serials
            const serialsToUpload = getSerials();

            // Handle case where there are no valid serials to upload with better error message
            if (serialsToUpload.length === 0) {
                const invalidCount = serialNumbers.filter(s => !s.isValid).length;
                const existingCount = serialNumbers.filter(s => s.exists).length;
                const checkingCount = serialNumbers.filter(s => s.isChecking).length;

                let errorMessage = 'No valid new serial numbers to upload.';
                if (invalidCount > 0) {
                    errorMessage += ` ${invalidCount} invalid serial(s).`;
                }
                if (existingCount > 0) {
                    errorMessage += ` ${existingCount} already exist.`;
                }
                if (checkingCount > 0) {
                    errorMessage += ` ${checkingCount} still being checked.`;
                }

                toast.error(errorMessage);
                setGlobalError(errorMessage);
                return;
            }

            // Get team names for better user feedback
            const teamNames = selectedTeams.map(teamId =>
                teams.find(t => t.id === teamId)?.name || "Unknown Team"
            ).join(", ");

            // Clear previous errors and set upload message
            setGlobalError(null);
            setUploadMessage(`Starting upload of ${serialsToUpload.length} serials to ${teamNames}...`);
            setIsUploading(true);
            setUploadingCount(serialsToUpload.length);

            // Create a unique batch ID for this upload
            const batchId = `BATCH-${generateId()}`;

            // Handle batch metadata
            let metadata: BatchMetadataCreate | null = batchMetadata;

            // If no metadata was detected, prompt the user to enter it
            if (!metadata) {
                try {
                    metadata = await promptForBatchMetadata(batchId);
                    // Store the metadata for future use
                    setBatchMetadata(metadata);
                } catch (error) {
                    // User cancelled metadata entry, continue without metadata
                    console.log('User skipped metadata entry:', error);
                    // We'll continue without metadata
                }
            }

            // Mark all serials as uploading before starting the upload
            serialsToUpload.forEach(serial => {
                updateSerialStatus(serial.id, {
                    isUploading: true,
                    isUploaded: false,
                    uploadError: null
                });
            });
            // Initialize team serials arrays
            const teamSerials: { [teamId: string]: SerialNumber[] } = {};
            selectedTeams.forEach(teamId => {
                teamSerials[teamId] = [];
            });

            if (selectedTeams.length === 1) {
                teamSerials[selectedTeams[0]] = [...serialsToUpload];
            } else {
                let currentIndex = 0;
                let assignedCount = 0;

                // Distribute serials based on team ranges and counts
                selectedTeams.forEach(teamId => {
                    const range = teamRanges[teamId];
                    if (!range?.startRange || !range?.endRange || !range?.count) {
                        return;
                    }

                    // Take the expected count of serials for this team
                    const expectedCount = range.count;
                    const teamSerialsBatch = serialsToUpload.slice(currentIndex, currentIndex + expectedCount);

                    // Validate that these serials actually fall within the range
                    const validSerials = teamSerialsBatch.filter(serial => {
                        const serialValue = serial.value || '';
                        return serialValue >= range.startRange && serialValue <= range.endRange;
                    });

                    teamSerials[teamId] = validSerials;
                    assignedCount += validSerials.length;

                    // Move index forward by the number of serials we attempted to assign
                    currentIndex += expectedCount;

                    // Log any discrepancies
                    if (validSerials.length !== expectedCount) {
                        console.warn(`Team ${teamId}: Expected ${expectedCount} serials, got ${validSerials.length} valid serials in range`);
                    }
                });

                // Assign any remaining serials to the first team
                if (currentIndex < serialsToUpload.length) {
                    const remainingSerials = serialsToUpload.slice(currentIndex);
                    teamSerials[selectedTeams[0]].push(...remainingSerials);
                    console.log(`Assigned ${remainingSerials.length} remaining serials to first team`);
                }

                if (assignedCount > 0) {
                    alert.success(`${assignedCount} serials distributed across ${selectedTeams.length} teams`);
                }
            }
            const overallResult: any = {success: 0, errors: []};
            let totalProcessed = 0;
            // Create a single batch metadata record with all teams
            if (metadata) {
                // Update with the current batch ID and teams
                const metadataToSave: BatchMetadataCreate = {
                    ...metadata,
                    batch_id: batchId,
                    team_id: selectedTeams[0], // Set first team as primary for backward compatibility
                    teams: selectedTeams // Store all selected teams
                };

                try {
                    const {data, error} = await batchMetadataService.createBatchMetadata(metadataToSave);
                    if (error) {
                        console.error('Error storing batch metadata:', error);
                        // Don't throw, just log the error and continue
                        toast.error(`Failed to save batch metadata, but will continue with upload`);
                    } else {
                        toast.success(`Batch metadata saved successfully`);
                    }
                } catch (err) {
                    console.error('Exception storing batch metadata:', err);
                    // Don't throw, just log the error and continue
                    toast.error(`Failed to save batch metadata, but will continue with upload`);
                }
            }
            for (const teamId of selectedTeams) {
                const teamSerialsToUpload = teamSerials[teamId];
                if (teamSerialsToUpload.length === 0) continue;
                const teamName = teams.find(t => t.id === teamId)?.name || "Unknown Team";

                // Prepare the data for upload
                const serialDataToUpload = teamSerialsToUpload.map(ser => {
                    return {
                        match: SIMStatus.MATCH,
                        quality: SIMStatus.NONQUALITY,
                        serial_number: ser.value,
                        team_id: teamId,
                        batch_id: batchId,
                        registered_by_user_id: user!.id,
                        //@ts-ignore
                        admin_id: user!.id,
                    } as SIMCardCreate;
                });

                console.log(`Uploading ${serialDataToUpload.length} serials to team ${teamId} (${teamName})`);

                // Upload the serials with progress tracking and error handling
                const result = await simService.createSIMCardBatch(
                    serialDataToUpload,
                    50, // batch size
                    (progress, uploadedCount, chunk, errors) => {
                        // Calculate overall progress
                        const overallProgress = (totalProcessed + uploadedCount) / serialsToUpload.length * 100;

                        // Update progress indicators
                        setcurrentPercentage(overallProgress);
                        setSofar(totalProcessed + uploadedCount);

                        // Get the serial numbers from the current chunk
                        const uploadedSerialNumbers = chunk.map(s => s.serial_number);

                        // Update status for each serial in the current chunk
                        teamSerialsToUpload.forEach(serial => {
                            if (uploadedSerialNumbers.includes(serial.value)) {
                                updateSerialStatus(serial.id, {
                                    isUploading: false,
                                    isUploaded: true,
                                    exists: true,
                                    uploadError: errors && errors.length > 0 ? errors.join('\n') : null
                                });

                                // If there were errors for this serial, show a toast
                                if (errors && errors.length > 0) {
                                    toast.error(`Error uploading ${serial.value} to ${teamName}: ${errors.join(', ')}`);
                                }
                            }
                        });
                    }
                );

                // Add this team's results to the overall results
                overallResult.success += result.success || 0;
                overallResult.errors = [...overallResult.errors, ...result.errors];

                // Update the total processed count
                totalProcessed += teamSerialsToUpload.length;
            }

            // Check if the upload was successful
            if (overallResult.success === 0 || overallResult.errors.length > 0) {
                throw new Error(`Upload failed: ${overallResult.errors.map((e: {
                    message: any;
                }) => e.message || e).join(', ')}`);
            }

            // Show success message with metadata info if available
            let successMessage = `Successfully uploaded ${serialsToUpload.length} serial numbers to ${teamNames}`;
            if (batchMetadata) {
                successMessage += ` with picklist metadata (Order #${batchMetadata.order_number || 'N/A'})`;
            }

            toast.success(successMessage);
            setUploadMessage(successMessage);

            // Clear the form immediately after successful upload
            clearAll();

            // Reset the batch metadata
            setBatchMetadata(null);

            // Reset the selected team
            setSelectedTeam('');

            // Reset the input value
            setInputValue('');

            // Refresh the uploaded batches list if we're in view mode
            if (activeTab === 'view') {
                loadUploadedBatches();
            }

            // Signal refresh to other components
            Signal.trigger("m-refresh", true);
        } catch (error) {
            // Handle any unexpected errors during the upload process
            console.error('Error uploading serials:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during upload';
            toast.error(`Upload failed: ${errorMessage}`);
            setGlobalError(`Upload failed: ${errorMessage}`);

            // Reset uploading state for all serials
            serialNumbers.forEach(serial => {
                if (serial.isUploading) {
                    updateSerialStatus(serial.id, {
                        isUploading: false,
                        uploadError: 'Upload failed due to server error'
                    });
                }
            });
        } finally {
            // Ensure uploading state is reset regardless of success or failure
            setIsUploading(false);
            setcurrentPercentage(0);
            setSofar(0);
        }
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

    // More specific button states for better UX
    const canProcessInput = !isAnyProcessRunning && inputValue.trim().length > 0;
    const canUploadFile = !isAnyProcessRunning || (isFileProcessing && !isPdfInitializing);
    const canUploadSerials = !isAnyProcessRunning && newValidCount > 0;
    const canClearAll = !isAnyProcessRunning && serialNumbers.length > 0;

    // Function to delete a batch
    const deleteBatch = async (batchId: string) => {
        if (!user) return;
        alert.confirm({
            type: alert.WARN,
            title: "Batch management",
            message: "Are you sure you want to delete this batch? This action cannot be undone.",
            async task() {
                try {
                    // Call the API route to delete the batch and its associated SIM cards
                    const response = await fetch('/api/batch/delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({batchId}),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(`Failed to delete batch: ${result.message || 'Please try again.'}`);
                    } else {
                        toast.success('Batch and all associated SIM cards deleted successfully');
                        // Reload the batches
                        return loadUploadedBatches();

                    }
                } catch (err) {
                    console.error('Exception deleting batch:', err);
                    throw new Error('An unexpected error occurred while deleting the batch.');
                }
            }
        });

    };

    // Function to format date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (err) {
            return dateString;
        }
    };

    return (
        <div className="w-full mx-auto p-6">
            <h1 className="text-3xl font-bold text-center mb-4 text-green-700">
                Safaricom SIM Management
            </h1>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                        activeTab === 'upload'
                            ? 'text-green-600 border-b-2 border-green-500'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('upload')}
                >
                    Upload SIM Cards
                </button>
                <button
                    className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                        activeTab === 'view'
                            ? 'text-green-600 border-b-2 border-green-500'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('view')}
                >
                    View Uploaded Batches
                </button>
            </div>

            {/* Upload Tab Content */}
            {activeTab === 'upload' && (
                <>

                    {/* Input Section - Enhanced with better guidance */}
                    <div className="mb-8 bg-white p-4 rounded-lg shadow-sm border border-green-100">
                        <label
                            htmlFor="serial-input"
                            className="block mb-2 text-lg font-medium text-gray-700 flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                      clipRule="evenodd"/>
                            </svg>
                            Enter Serial Numbers
                        </label>

                        <div className="mb-2 text-sm text-gray-600 flex flex-wrap gap-2">
                            <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded">
                                <span className="font-medium mr-1">Format:</span> 16+ digit numbers
                            </span>
                            <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded">
                                <span className="font-medium mr-1">Separators:</span> spaces, commas, new lines
                            </span>
                            <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded">
                                <span className="font-medium mr-1">Or:</span> upload a file
                            </span>
                        </div>

                        <div className="flex relative">
                            <textarea
                                id="serial-input"
                                value={inputValue}
                                onChange={handleInputChange}
                                placeholder="Paste or type serial numbers here..."
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

                                {/* File upload button - clearer state and better feedback */}
                                <Button
                                    className={"!h-8 !rounded-sm flex items-center"}
                                    isLoading={isFileProcessing}
                                    text={isFileProcessing ?
                                        (totalPages > 0 ?
                                            `Processing PDF (${Math.ceil(pdfProgress / 100 * totalPages)}/${totalPages})` :
                                            "Processing File...")
                                        : "Upload"}
                                    onClick={triggerFileUpload}
                                    disabled={!canUploadFile}
                                    icon={isFileProcessing ? '' : <FileText className="mr-1 h-4 w-4"/>}
                                    title="Upload a file containing serial numbers"
                                />

                                {/* Process button - clearer state and better feedback */}
                                <Button
                                    className={`!h-8 !rounded-sm transition-all duration-300`}
                                    isLoading={isProcessing}
                                    text="Process"
                                    onClick={handlePaste}
                                    disabled={!canProcessInput}
                                    title="Process the pasted serial numbers"
                                />
                            </div>
                            <div className="absolute right-1 top-1 p-2 font-medium">

                                <button
                                    onClick={() => {
                                        Signal.trigger("view-pick-content", function ({onDismiss}: any) {
                                            return <div className="relative p-2 w-full max-h-full">
                                                <div className="relative bg-white  dark:bg-gray-700">

                                                    <div
                                                        className="flex items-center justify-between p-2 border-b rounded-t dark:border-gray-600 border-gray-200">
                                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                            Serial numbers
                                                        </h3>
                                                        <button

                                                            onClick={() => onDismiss()}
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
                                            </div>
                                        }, {size: "sm"})

                                    }}
                                    disabled={isAnyProcessRunning || !inputValue.trim()}
                                    className={`cursor-pointer ${
                                        inputValue.trim() ?
                                            'animate-pulse shadow-sm shadow-green-500 ring-1 ring-green-400 ring-opacity-50' : ''
                                    } hover:bg-gray-500/10 rounded-full p-2 transition-colors ${isAnyProcessRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                <div className="bg-blue-600 h-2.5 rounded-full"
                                     style={{width: `${pdfProgress}%`}}></div>
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

                    {/* Serial Numbers Grid - Enhanced with better visual organization */}
                    {serialNumbers.length > 0 && (
                        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-green-100">
                            <div className="flex justify-between items-center gap-2 mb-4">
                                <h2 className="text-lg font-medium text-gray-700 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor"
                                         viewBox="0 0 20 20">
                                        <path
                                            d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                                    </svg>
                                    Serial Numbers
                                    <span className="ml-2 text-sm text-gray-500">({serialNumbers.length} total)</span>
                                </h2>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    {serialNumbers.length > 0 && (
                                        <motion.button
                                            whileHover={{scale: 1.02}}
                                            whileTap={{scale: 0.98}}
                                            onClick={async () => {
                                                try {
                                                    const selectionResult = await showTeamSelectionModal();
                                                    uploadAllSerials(selectionResult).then()
                                                } catch (error) {
                                                    // User cancelled team selection
                                                    toast.error("Team selection is required for upload");
                                                    return;
                                                }
                                            }}
                                            disabled={!canUploadSerials}
                                            className="bg-green-600 hover:bg-green-700 text-white ms-auto px-4 py-2 font-medium
                                            rounded-md shadow-sm flex items-center justify-center min-w-[200px]
                                            disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
                                            transition-colors duration-300"
                                            title={newValidCount === 0 ? "No valid serial numbers to upload" :
                                                `Upload ${newValidCount} serial numbers`}
                                        >
                                            {isUploading ? (
                                                <>
                                                    <span
                                                        className="inline-block animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5 mr-2" fill="currentColor"
                                                         viewBox="0 0 20 20">
                                                        <path fillRule="evenodd"
                                                              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                                                              clipRule="evenodd"/>
                                                    </svg>
                                                    Upload {newValidCount} Serial{newValidCount !== 1 ? 's' : ''}
                                                </>
                                            )}
                                        </motion.button>
                                    )}
                                    <button
                                        onClick={clearAll}
                                        disabled={!canClearAll}
                                        className={`text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-md ${!canClearAll ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Clear all serial numbers"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            {/* Status Legend */}
                            <div className="mb-4 flex flex-wrap gap-2 text-xs">
                                <span
                                    className="inline-flex items-center bg-green-50 text-green-600 px-2 py-1 rounded border border-green-200">
                                    <span
                                        className="w-2 h-2 bg-green-500 rounded-full mr-1"></span> Ready to upload: {newValidCount}
                                </span>
                                <span
                                    className="inline-flex items-center bg-yellow-50 text-yellow-600 px-2 py-1 rounded border border-yellow-200">
                                    <span
                                        className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span> Already exists: {existingCount}
                                </span>
                                <span
                                    className="inline-flex items-center bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200">
                                    <span
                                        className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span> Checking: {checkingCount}
                                </span>
                                <span
                                    className="inline-flex items-center bg-purple-50 text-purple-600 px-2 py-1 rounded border border-purple-200">
                                    <span
                                        className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span> Uploaded: {uploadedCount}
                                </span>
                                <span
                                    className="inline-flex items-center bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200">
                                    <span
                                        className="w-2 h-2 bg-red-500 rounded-full mr-1"></span> Invalid: {invalidCount}
                                </span>
                            </div>

                            <PaginatedSerialGrid
                                user={user!}
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
                </>
            )}

            {/* View Tab Content */}
            {activeTab === 'view' && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gray-700 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                            </svg>
                            Uploaded Batches
                        </h2>
                        <button
                            onClick={loadUploadedBatches}
                            className="text-sm bg-green-50 text-green-600 hover:bg-green-100 px-3 py-2 rounded-md flex items-center"
                            disabled={isLoadingBatches}
                        >
                            {isLoadingBatches ? (
                                <>
                                    <span
                                        className="inline-block animate-spin h-4 w-4 mr-2 border-2 border-green-600 border-t-transparent rounded-full"></span>
                                    Refreshing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd"
                                              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                              clipRule="evenodd"/>
                                    </svg>
                                    Refresh
                                </>
                            )}
                        </button>
                    </div>

                    {isLoadingBatches ? (
                        <div className="flex justify-center items-center py-8">
                            <span
                                className="inline-block animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full"></span>
                            <span className="ml-2 text-gray-600">Loading batches...</span>
                        </div>
                    ) : uploadedBatches.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="currentColor"
                                 viewBox="0 0 20 20">
                                <path fillRule="evenodd"
                                      d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                                      clipRule="evenodd"/>
                            </svg>
                            <p>No batches found. Upload some SIM cards first.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Group batches by team */}
                            {Object.entries(
                                uploadedBatches.reduce((groups: any, batch: any) => {
                                    const teamId = batch.team_id?.id || 'unknown';
                                    const teamName = batch.team_id?.name || 'Unknown Team';

                                    if (!groups[teamId]) {
                                        groups[teamId] = {
                                            name: teamName,
                                            batches: []
                                        };
                                    }

                                    groups[teamId].batches.push(batch);
                                    return groups;
                                }, {})
                            ).map(([teamId, team]: [string, any]) => (
                                <div key={teamId} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                        <h3 className="text-lg font-medium text-gray-700">{team.name}</h3>
                                    </div>

                                    <div className="divide-y divide-gray-200">
                                        {team.batches.map((batch: any) => (
                                            <div key={batch.id} className="p-4 hover:bg-gray-50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-md font-medium text-gray-800">
                                                            Batch ID: {batch.batch_id}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            Created: {formatDate(batch.created_at)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span
                                                            className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                            {batch.sim_count} SIM cards
                                                        </span>

                                                        <AssignedSims batch={batch.batch_id} user={user}/>
                                                        <button
                                                            onClick={() => deleteBatch(batch.id)}
                                                            className="ml-2 text-red-500 hover:text-red-700"
                                                            title="Delete batch"
                                                        >
                                                            <svg className="w-5 h-5" fill="currentColor"
                                                                 viewBox="0 0 20 20">
                                                                <path fillRule="evenodd"
                                                                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                                                      clipRule="evenodd"/>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Batch metadata */}
                                                {(batch.order_number || batch.requisition_number || batch.company_name) && (
                                                    <div
                                                        className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {batch.order_number && (
                                                            <div className="text-sm">
                                                                <span
                                                                    className="font-medium text-gray-600">Order #:</span> {batch.order_number}
                                                            </div>
                                                        )}
                                                        {batch.requisition_number && (
                                                            <div className="text-sm">
                                                                <span className="font-medium text-gray-600">Requisition #:</span> {batch.requisition_number}
                                                            </div>
                                                        )}
                                                        {batch.company_name && (
                                                            <div className="text-sm">
                                                                <span
                                                                    className="font-medium text-gray-600">Company:</span> {batch.company_name}
                                                            </div>
                                                        )}
                                                        {batch.collection_point && (
                                                            <div className="text-sm">
                                                                <span className="font-medium text-gray-600">Collection Point:</span> {batch.collection_point}
                                                            </div>
                                                        )}
                                                        {batch.move_order_number && (
                                                            <div className="text-sm">
                                                                <span className="font-medium text-gray-600">Move Order #:</span> {batch.move_order_number}
                                                            </div>
                                                        )}
                                                        {batch.date_created && (
                                                            <div className="text-sm">
                                                                <span className="font-medium text-gray-600">Date Created:</span> {batch.date_created}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Teams */}
                                                {batch.teams && batch.teams.length > 0 && (
                                                    <div className="mt-2">
                                                        <span
                                                            className="text-sm font-medium text-gray-600">Teams:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {batch.teams.map((teamId: string, index: number) => {
                                                                const team = teams.find(t => t.id === teamId);
                                                                return (
                                                                    <BatchTeam user={user} key={team?.id || index}
                                                                               team={team}
                                                                               batch={batch.batch_id}/>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Lot numbers */}
                                                {batch.lot_numbers && batch.lot_numbers.length > 0 && (
                                                    <div className="mt-2">
                                                        <span
                                                            className="text-sm font-medium text-gray-600">Lot Numbers:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {batch.lot_numbers.map((lot: string, index: number) => (
                                                                <span key={index}
                                                                      className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                                    {lot}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Item description and quantity */}
                                                {(batch.item_description || batch.quantity) && (
                                                    <div className="mt-2 flex flex-wrap gap-4">
                                                        {batch.item_description && (
                                                            <div className="text-sm">
                                                                <span
                                                                    className="font-medium text-gray-600">Description:</span> {batch.item_description}
                                                            </div>
                                                        )}
                                                        {batch.quantity && (
                                                            <div className="text-sm">
                                                                <span
                                                                    className="font-medium text-gray-600">Quantity:</span> {batch.quantity}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Created by */}
                                                <div className="mt-2 text-xs text-gray-500">
                                                    Created by: {batch.created_by_user_id?.full_name || 'Unknown User'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default SerialNumberForm;
