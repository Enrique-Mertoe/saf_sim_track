"use client";
"use client";

import {useState, useEffect, useRef} from "react";
import {useRouter} from "next/navigation";
import {Camera, Upload, Check, X, Loader2, Image, Scan, ChevronRight} from "lucide-react";
import {motion, AnimatePresence} from "framer-motion";
import toast from "react-hot-toast";
import useApp from "@/ui/provider/AppProvider";
import simService from "@/services/simService";

// Import barcode scanner library
// @ts-ignore
import Quagga from "quagga";
import Dashboard from "@/ui/components/dash/Dashboard";
import {SIMCard, SIMCardCreate} from "@/models";

type UploadState = "idle" | "scanning" | "uploading" | "success" | "error";
type CaptureMethod = "camera" | "file" | null;

export default function StaffUploadPage() {
    const router = useRouter();
    const {user} = useApp();
    const [simSerial, setSimSerial] = useState<string>("");
    const [location, setLocation] = useState<string>("");
    const [uploadState, setUploadState] = useState<UploadState>("idle");
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [uploadedSerials, setUploadedSerials] = useState<string[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [dealerShortcode, setDealerShortcode] = useState<string>("");
    const [dealerName, setDealerName] = useState<string>("");
    const [showCaptureDialog, setShowCaptureDialog] = useState<boolean>(false);
    const [captureMethod, setCaptureMethod] = useState<CaptureMethod>(null);
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isScannerActive, setIsScannerActive] = useState<boolean>(false);
    const [scanningStatus, setScanningStatus] = useState<string>("");
    const [cameraAvailable, setCameraAvailable] = useState<boolean>(true);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scannerRef = useRef<HTMLDivElement>(null);
    const liveScannerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch user dealer info
        const fetchUserDealerInfo = async () => {
            try {
                if (user) {
                    setDealerShortcode("");
                    setDealerName(user.full_name || "");
                }
            } catch (error) {
                console.error("Error fetching user dealer info:", error);
            }
        };

        fetchUserDealerInfo();

        // Check if camera is available
        if (navigator && navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia({video: true})
                .then(stream => {
                    // Camera is available
                    setCameraAvailable(true);
                    // Stop the stream since we're just checking availability
                    stream.getTracks().forEach(track => track.stop());
                })
                .catch(err => {
                    console.error("Camera not available:", err);
                    setCameraAvailable(false);
                });
        } else {
            setCameraAvailable(false);
        }
    }, [user]);

    // Initialize and cleanup scanner when active
    useEffect(() => {
        if (isScannerActive && liveScannerRef.current) {
            initLiveScanner();

            return () => {
                stopScanner();
            };
        }
    }, [isScannerActive]);

    // Initialize live barcode scanner
    const initLiveScanner = () => {
        // First check if camera is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setScanningStatus("Camera access not supported in this browser");
            setIsScannerActive(false);
            toast.error("Camera access not supported");
            return;
        }

        setScanningStatus("Requesting camera access...");

        // Try to initialize with more lenient constraints
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: liveScannerRef.current,
                constraints: {
                    // Use less strict constraints
                    facingMode: {ideal: "environment"},
                    width: {min: 320},
                    height: {min: 240}
                },
                area: { // Define scan area
                    top: "25%",
                    right: "10%",
                    left: "10%",
                    bottom: "25%",
                },
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: 2,
            frequency: 10,
            decoder: {
                readers: ["ean_reader", "code_128_reader", "code_39_reader", "code_93_reader"]
            },
            locate: true
        }, function (err:any) {
            if (err) {
                console.error("Error initializing scanner:", err);
                setScanningStatus("Failed to access camera. Please ensure camera permissions are granted.");
                setIsScannerActive(false);

                // Fallback to file upload
                if (fileInputRef.current) {
                    toast.error("Camera access failed. Please use image upload instead.");
                    setCaptureMethod("file");
                    setTimeout(() => {
                        fileInputRef.current?.click();
                    }, 500);
                }
                return;
            }

            // Scanner is initialized, start it
            Quagga.start();
            setScanningStatus("Scanning for barcode...");

            // Add detection event listener
            Quagga.onDetected(handleScanResult);

            // Draw detection areas for visual feedback
            Quagga.onProcessed(function (result:any) {
                const drawingCtx = Quagga.canvas.ctx.overlay;
                const drawingCanvas = Quagga.canvas.dom.overlay;

                if (drawingCtx && drawingCanvas) {
                    drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

                    if (result) {
                        if (result.boxes) {
                            drawingCtx.strokeStyle = '#FF3B58';
                            drawingCtx.lineWidth = 2;

                            for (const box of result.boxes) {
                                drawingCtx.beginPath();
                                drawingCtx.moveTo(box[0][0], box[0][1]);
                                drawingCtx.lineTo(box[1][0], box[1][1]);
                                drawingCtx.lineTo(box[2][0], box[2][1]);
                                drawingCtx.lineTo(box[3][0], box[3][1]);
                                drawingCtx.lineTo(box[0][0], box[0][1]);
                                drawingCtx.stroke();
                            }
                        }

                        if (result.codeResult && result.codeResult.code) {
                            // Highlight successful scan
                            drawingCtx.font = '24px Arial';
                            drawingCtx.fillStyle = '#00FF00';
                            drawingCtx.fillText('✓', 10, 50);
                        }
                    }
                }
            });
        });
    };

    const stopScanner = () => {
        if (Quagga) {
            try {
                Quagga.stop();
                Quagga.offDetected(handleScanResult);
            } catch (e) {
                console.log("Scanner already stopped");
            }
        }
        setIsScannerActive(false);
    };

    // Handle successful barcode detection
    const handleScanResult = (result:any) => {
        if (result && result.codeResult) {
            const code = result.codeResult.code;
            console.log("Barcode detected:", code);
            setScanningStatus("Barcode detected! Processing...");

            // Stop scanner once we have a result
            stopScanner();

            // Process the scanned barcode
            setTimeout(() => {
                setSimSerial(code);
                setShowCaptureDialog(false);
                toast.success("SIM serial scanned successfully");
            }, 1000);
        }
    };

    const openCaptureDialog = () => {
        setShowCaptureDialog(true);
        setCaptureMethod(null);
        setPreviewImage(null);
        setScanningStatus("");
    };

    const handleCaptureMethodSelect = (method: CaptureMethod) => {
        setCaptureMethod(method);

        if (method === "camera") {
            if (cameraAvailable) {
                // Start live scanner immediately
                setIsScannerActive(true);
            } else {
                toast.error("Camera not available. Please use file upload instead.");
                setCaptureMethod("file");
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
            }
        } else if (method === "file" && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setIsScanning(true);
        setUploadState("scanning");
        setScanningStatus("Processing image...");

        // Create preview
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setPreviewImage(event.target.result as string);

                // Process the image with Quagga
                //@ts-ignore
                const img = new Image();
                img.onload = () => {
                    if (scannerRef.current) {
                        scannerRef.current.innerHTML = '';
                        scannerRef.current.appendChild(img);

                        Quagga.decodeSingle({
                            decoder: {
                                readers: ["ean_reader", "code_128_reader", "code_39_reader", "code_93_reader"]
                            },
                            locate: true,
                            //@ts-ignore
                            src: event.target.result
                        }, function (result:any) {
                            if (result && result.codeResult) {
                                const code = result.codeResult.code;
                                console.log("Barcode found in image:", code);
                                setScanningStatus("Barcode found!");

                                setTimeout(() => {
                                    setSimSerial(code);
                                    setIsScanning(false);
                                    setUploadState("idle");
                                    setShowCaptureDialog(false);
                                    toast.success("SIM serial scanned successfully");
                                }, 1000);
                            } else {
                                console.log("No barcode found");
                                setScanningStatus("No barcode detected. Please try again or enter manually.");
                                setIsScanning(false);
                                setUploadState("idle");

                                // If we can't detect the barcode, fallback to a random one for demo
                                setTimeout(() => {
                                    const fakeScanResult = "89254021" + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
                                    setSimSerial(fakeScanResult);
                                    setShowCaptureDialog(false);
                                    toast.success("SIM serial generated (demo)");
                                }, 1500);
                            }
                        });
                    }
                };
                img.src = event.target.result as string;
            }
        };
        reader.readAsDataURL(file);
    };

    const generateRandomSerial = () => {
        const fakeScanResult = "89254021" + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
        setSimSerial(fakeScanResult);
        toast.success("SIM serial generated (demo)");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!simSerial) {
            toast.error("Please enter or scan a SIM serial number");
            return;
        }

        setUploadState("uploading");
        setUploadError(null);
        setCurrentStep(2);

        try {
            const simData: SIMCardCreate = {
                serial_number: simSerial,
                sale_location: location,
                sold_by_user_id: user!.id,
                team_id: user!.team_id,
            };

            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Upload to service
            const data = await simService.createSIMCard(simData);
            // Success state
            setUploadState("success");
            setCurrentStep(3);
            toast.success("SIM card registered successfully!");

            // Reset state after delay
            setTimeout(() => {
                setSimSerial("");
                setLocation("");
                setUploadState("idle");
                setCurrentStep(1);
            }, 3000);

        } catch (error: any) {
            console.error("Error uploading SIM:", error);
            setUploadState("error");
            setUploadError(error.message || "Failed to upload SIM card data");
            toast.error("Upload failed. Please try again.");

            // Reset error state after delay
            setTimeout(() => {
                setUploadState("idle");
            }, 3000);
        }
    };

    const resetForm = () => {
        setSimSerial("");
        setLocation("");
        setUploadState("idle");
        setCurrentStep(1);
    };

    // Animation variants
    const containerVariants = {
        hidden: {opacity: 0},
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            transition: {when: "afterChildren"}
        }
    };

    const childVariants = {
        hidden: {y: 20, opacity: 0},
        visible: {y: 0, opacity: 1},
        exit: {y: -20, opacity: 0}
    };

    // Scanner overlay animations
    const scanLineAnimation = {
        initial: {y: "0%", opacity: 0.8},
        animate: {
            y: ["0%", "100%", "0%"],
            opacity: [0.8, 1, 0.8],
            transition: {
                duration: 2.5,
                ease: "linear",
                repeat: Infinity
            }
        }
    };

    return (
        <Dashboard>
            <main className="max-w-lg mx-auto p-4 sm:p-6 lg:p-8 dark:bg-gray-900">
                {/* Step indicator */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.3}}
                    className="mb-6"
                >
                    <div className="flex justify-between items-center">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                                    currentStep === step
                                        ? "border-green-600 bg-green-600 text-white dark:border-green-500 dark:bg-green-500"
                                        : currentStep > step
                                            ? "border-green-500 bg-green-500 text-white"
                                            : "border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                }`}>
                                    {currentStep > step ? <Check className="h-5 w-5"/> : step}
                                </div>
                                {step < 3 && (
                                    <div className={`w-16 h-1 mx-1 ${
                                        currentStep > step ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                                    }`}/>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Scan</span>
                        <span>Upload</span>
                        <span>Complete</span>
                    </div>
                </motion.div>

                {/* Card container */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`step-${currentStep}`}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                    >
                        {currentStep === 1 && (
                            <>
                                {/* Form header */}
                                <motion.div
                                    variants={childVariants}
                                    className="bg-green-50 dark:bg-green-900 px-6 py-4 border-b border-green-100 dark:border-green-800"
                                >
                                    <h2 className="text-xl font-medium text-green-800 dark:text-green-200">Register New
                                        SIM Card</h2>
                                    <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                                        Scan or enter SIM serial number
                                    </p>
                                </motion.div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                    {/* SIM Serial Input with Scan button */}
                                    <motion.div variants={childVariants} className="space-y-2">
                                        <label htmlFor="simSerial"
                                               className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            SIM Serial Number
                                        </label>
                                        <div className="flex space-x-2">
                                            <div className="relative flex-grow">
                                                <input
                                                    type="text"
                                                    id="simSerial"
                                                    value={simSerial}
                                                    onChange={(e) => setSimSerial(e.target.value)}
                                                    className="block py-3 px-2 outline-0 w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 text-base dark:bg-gray-700 dark:text-white"
                                                    placeholder="Enter SIM serial number"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={openCaptureDialog}
                                                disabled={isScanning}
                                                className={`flex items-center justify-center p-3 rounded-md ${
                                                    isScanning
                                                        ? "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                                                        : "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800"
                                                }`}
                                            >
                                                {isScanning ? <Loader2 className="h-5 w-5 animate-spin"/> :
                                                    <Scan className="h-5 w-5"/>}
                                            </button>
                                        </div>
                                    </motion.div>

                                    {/* Location Input (Optional) */}
                                    <motion.div variants={childVariants} className="space-y-2">
                                        <label htmlFor="location"
                                               className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Location (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            id="location"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="block py-3 px-2 outline-0 w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 text-base dark:bg-gray-700 dark:text-white"
                                            placeholder="Enter sale location"
                                        />
                                    </motion.div>

                                    {/* Continue Button */}
                                    <motion.button
                                        variants={childVariants}
                                        whileHover={{scale: 1.02}}
                                        whileTap={{scale: 0.98}}
                                        type="submit"
                                        disabled={!simSerial || uploadState === "uploading" || uploadState === "scanning"}
                                        className={`w-full flex items-center justify-center py-3 px-4 rounded-md text-white font-medium transition ${
                                            !simSerial || uploadState === "uploading" || uploadState === "scanning"
                                                ? "bg-gray-400 dark:bg-gray-600"
                                                : "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                                        }`}
                                    >
                                        Continue
                                        <ChevronRight className="ml-2 h-5 w-5"/>
                                    </motion.button>
                                </form>

                                {/* Recently Uploaded SIMs */}
                                {uploadedSerials.length > 0 && (
                                    <motion.div
                                        variants={childVariants}
                                        className="border-t border-gray-200 dark:border-gray-700 px-6 py-4"
                                    >
                                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recently
                                            Registered SIMs</h3>
                                        <ul className="space-y-2 max-h-40 overflow-y-auto">
                                            {uploadedSerials.map((serial, index) => (
                                                <motion.li
                                                    initial={{opacity: 0, x: -20}}
                                                    animate={{opacity: 1, x: 0}}
                                                    transition={{delay: index * 0.1}}
                                                    key={index}
                                                    className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm py-2 px-3 rounded-md flex items-center"
                                                >
                                                    <Check className="h-4 w-4 text-green-500 mr-2"/>
                                                    {serial}
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                )}
                            </>
                        )}

                        {currentStep === 2 && (
                            <>
                                {/* Upload in progress */}
                                <div className="p-8 flex flex-col items-center justify-center">
                                    <motion.div
                                        initial={{scale: 0.8, opacity: 0}}
                                        animate={{scale: 1, opacity: 1}}
                                        className="mb-6 relative"
                                    >
                                        <motion.div
                                            animate={{
                                                rotate: 360
                                            }}
                                            transition={{
                                                duration: 2,
                                                ease: "linear",
                                                repeat: Infinity
                                            }}
                                            className="w-24 h-24 rounded-full border-t-4 border-b-4 border-green-600 dark:border-green-500"
                                        />
                                        <motion.div
                                            initial={{scale: 0}}
                                            animate={{scale: 1}}
                                            transition={{delay: 0.5}}
                                            className="absolute inset-0 flex items-center justify-center"
                                        >
                                            <Upload className="h-10 w-10 text-green-600 dark:text-green-400"/>
                                        </motion.div>
                                    </motion.div>

                                    <motion.h3
                                        initial={{opacity: 0, y: 20}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{delay: 0.3}}
                                        className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2"
                                    >
                                        Registering SIM Card
                                    </motion.h3>

                                    <motion.p
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        transition={{delay: 0.5}}
                                        className="text-gray-600 dark:text-gray-400 text-center"
                                    >
                                        Please wait while we register your SIM card...
                                    </motion.p>

                                    <motion.div
                                        initial={{width: "0%"}}
                                        animate={{width: "100%"}}
                                        transition={{duration: 2}}
                                        className="h-1 bg-green-500 dark:bg-green-600 rounded-full mt-6 w-full"
                                    />
                                </div>
                            </>
                        )}

                        {currentStep === 3 && (
                            <>
                                {/* Success state */}
                                <div className="p-8 flex flex-col items-center justify-center">
                                    <motion.div
                                        initial={{scale: 0, opacity: 0}}
                                        animate={{scale: 1, opacity: 1}}
                                        transition={{
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 10
                                        }}
                                        className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-6"
                                    >
                                        <Check className="h-12 w-12 text-green-600 dark:text-green-400"/>
                                    </motion.div>

                                    <motion.h3
                                        initial={{opacity: 0, y: 20}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{delay: 0.3}}
                                        className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2"
                                    >
                                        Registration Successful!
                                    </motion.h3>

                                    <motion.p
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        transition={{delay: 0.5}}
                                        className="text-gray-600 dark:text-gray-400 text-center mb-8"
                                    >
                                        SIM card has been registered successfully
                                    </motion.p>

                                    <motion.button
                                        initial={{opacity: 0, y: 20}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{delay: 0.7}}
                                        whileHover={{scale: 1.05}}
                                        whileTap={{scale: 0.95}}
                                        onClick={resetForm}
                                        className="px-6 py-3 bg-green-600 dark:bg-green-700 text-white rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600 transition"
                                    >
                                        Register Another SIM
                                    </motion.button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
            {/* Hidden scanner element for file processing */}
            <div ref={scannerRef} className="hidden"></div>

            {/* Capture Dialog with Real-time Scanner */}
            <AnimatePresence>
                {showCaptureDialog && (
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
                        onClick={() => {
                            stopScanner();
                            setShowCaptureDialog(false);
                        }}
                    >
                        <motion.div
                            initial={{scale: 0.9, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            exit={{scale: 0.9, opacity: 0}}
                            transition={{type: "spring", damping: 25, stiffness: 300}}
                            className="bg-white rounded-xl max-w-sm w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">Scan SIM Serial</h3>
                                <p className="text-sm text-gray-600 mt-1">Choose how you want to capture the barcode</p>
                            </div>

                            <div className="p-6">
                                {isScannerActive ? (
                                    // Real-time scanner view
                                    <div className="space-y-4">
                                        <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                                            {/* Scanner viewfinder */}
                                            <div
                                                ref={liveScannerRef}
                                                className="absolute inset-0 w-full h-full"
                                            />

                                            {/* Scanner overlay UI */}
                                            <div className="absolute inset-0 pointer-events-none">
                                                {/* Scanning area indicator */}
                                                <div
                                                    className="absolute left-1/10 right-1/10 top-1/4 bottom-1/4 border-2 border-white/70 rounded-lg">
                                                    {/* Corner markers */}
                                                    <div
                                                        className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-green-400"></div>
                                                    <div
                                                        className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-green-400"></div>
                                                    <div
                                                        className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-green-400"></div>
                                                    <div
                                                        className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-green-400"></div>

                                                    {/* Scanning animation line */}
                                                    <motion.div
                                                        variants={scanLineAnimation}
                                                        initial="initial"
                                                        animate="animate"
                                                        className="absolute left-0 right-0 h-0.5 bg-green-400"
                                                    />
                                                </div>

                                                {/* Status text */}
                                                <div
                                                    className="absolute bottom-2 left-0 right-0 text-center text-white bg-black/40 py-1">
                                                    {scanningStatus || "Position barcode in frame..."}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                stopScanner();
                                                setCaptureMethod(null);
                                            }}
                                            className="w-full py-3 bg-gray-100 rounded-lg font-medium text-gray-800 hover:bg-gray-200 transition"
                                        >
                                            Cancel Scanning
                                        </button>
                                    </div>
                                ) : previewImage ? (
                                    // Processing image view
                                    <div className="space-y-4">
                                        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                            <img
                                                src={previewImage}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <div
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center flex-col">
                                                <div className="text-white flex flex-col items-center">
                                                    <Loader2 className="h-8 w-8 animate-spin mb-2"/>
                                                    <span>{scanningStatus || "Processing image..."}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Selection view
                                    <div className="grid grid-cols-1 gap-4">
                                        <motion.button
                                            whileHover={{scale: 1.03}}
                                            whileTap={{scale: 0.97}}
                                            onClick={() => handleCaptureMethodSelect("camera")}
                                            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition"
                                        >
                                            <div
                                                className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                                                <Image className="h-6 w-6 text-green-600"/>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">Choose Image</h4>
                                                <p className="text-sm text-gray-600">Select existing photo from
                                                    gallery</p>
                                            </div>
                                        </motion.button>
                                    </div>
                                )}

                                {!isScannerActive && !previewImage && (
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={() => setShowCaptureDialog(false)}
                                            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                {/* Hidden file input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleFileSelected}
                                    className="hidden"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Dashboard>
    );
}