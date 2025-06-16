import React, {useEffect, useRef, useState} from 'react';
import {Html5Qrcode, Html5QrcodeSupportedFormats} from 'html5-qrcode';
import {Check, Loader2, Upload, X} from 'lucide-react';

const BarcodeScanner = ({onClose,tab}) => {
    const [showScanner, setShowScanner] = useState(true);
    const [barcodes, setBarcodes] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState('');
    const [multiScanMode, setMultiScanMode] = useState(true);
    const [scanCount, setScanCount] = useState(0);
    const [activeTab, setActiveTab] = useState(tab ?? 'camera'); // 'camera' or 'file'
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [filePreview, setFilePreview] = useState(null);

    const html5QrCodeRef = useRef(null);
    const fileInputRef = useRef(null);
    const scannerInitializedRef = useRef(false);
    const detectedBarcodesRef = useRef(new Set());
    const scanTimeoutRef = useRef(null);

    const supportedFormats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
        Html5QrcodeSupportedFormats.AZTEC,
        Html5QrcodeSupportedFormats.PDF_417,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.ITF
    ];

    const closeScanner = () => {
        stopScanning();
        clearScanner();
        setFilePreview(null);
        if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
        }
        onClose();
    };

    const addBarcode = (decodedText, decodedResult) => {
        if (!detectedBarcodesRef.current.has(decodedText)) {
            detectedBarcodesRef.current.add(decodedText);

            const newBarcode = {
                text: decodedText,
                format: decodedResult.result?.format?.formatName || 'Unknown',
                timestamp: new Date().toLocaleTimeString(),
                id: Date.now() + Math.random(),
                status: 'success'
            };

            setBarcodes(prev => [...prev, newBarcode]);
            setScanCount(prev => prev + 1);
            setError('');

            console.log(`Barcode detected: ${decodedText}`);

            if (!multiScanMode && activeTab === 'camera') {
                stopScanning();
            }
        }
    };

    const onScanSuccess = (decodedText, decodedResult) => {
        console.log(`Barcode detected: ${decodedText}`, decodedResult);
        addBarcode(decodedText, decodedResult);

        if (multiScanMode && scanning) {
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
            scanTimeoutRef.current = setTimeout(() => {
                // Scanner continues automatically
            }, 1000);
        }
    };

    const onScanFailure = (error) => {
        // Handle scan failure silently
    };

    const clearScanner = async () => {
        try {
            if (html5QrCodeRef.current) {
                await html5QrCodeRef.current.clear();
                html5QrCodeRef.current = null;
            }
        } catch (error) {
            console.error('Error clearing scanner:', error);
        }
    };

    const startCameraScanning = async () => {
        try {
            setScanning(true);
            setError('');
            setScanCount(0);

            // Clear any existing scanner
            await clearScanner();

            const html5QrCode = new Html5Qrcode("scanner-container", {
                formatsToSupport: supportedFormats
            });

            html5QrCodeRef.current = html5QrCode;

            const config = {
                fps: multiScanMode ? 5 : 10,
                qrbox: {width: 350, height: 250},
                disableFlip: false,
                rememberLastUsedCamera: true,
                showTorchButtonIfSupported: false
            };

            await html5QrCode.start(
                {facingMode: "environment"},
                config,
                onScanSuccess,
                onScanFailure
            );

            scannerInitializedRef.current = true;
        } catch (error) {
            console.error('Error starting camera scanner:', error);
            setError('Camera scanner error: ' + error.message);
            setScanning(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size too large. Please select an image under 10MB');
            return;
        }

        setIsProcessingFile(true);
        setError('');

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setFilePreview(e.target.result);
        };
        reader.readAsDataURL(file);

        try {
            // Stop camera scanning first
            await stopScanning();
            await clearScanner();

            const html5QrCode = new Html5Qrcode("scanner-container", {
                formatsToSupport: supportedFormats,
                verbose: false
            });

            html5QrCodeRef.current = html5QrCode;

            // Try to scan the file with enhanced options
            const decodedText = await html5QrCode.scanFile(file, true);

            const mockResult = {
                result: {
                    format: {formatName: 'File Upload'},
                    text: decodedText
                }
            };

            addBarcode(decodedText, mockResult);

            // Clear the scanner after file processing
            await clearScanner();

        } catch (error) {
            console.error('Error scanning file:', error);

            // Provide more specific error messages
            let errorMessage = 'No barcode detected in the selected file';

            if (error.message.includes('No MultiFormat Readers')) {
                errorMessage = 'No barcode or QR code found in this image. Please try:\n' +
                    '• A clearer, higher quality image\n' +
                    '• Better lighting in the photo\n' +
                    '• Making sure the barcode fills more of the frame\n' +
                    '• A different image format (JPG, PNG)';
            } else if (error.message.includes('not supported')) {
                errorMessage = 'This file format is not supported. Please use JPG, PNG, or other common image formats';
            } else if (error.message.includes('too large')) {
                errorMessage = 'Image file is too large. Please use a smaller image file';
            }

            setError(errorMessage);
        } finally {
            setIsProcessingFile(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const stopScanning = async () => {
        if (!scannerInitializedRef.current) return;

        try {
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }

            if (html5QrCodeRef.current) {
                await html5QrCodeRef.current.stop();
            }

            scannerInitializedRef.current = false;
            html5QrCodeRef.current = null;
            setScanning(false);
        } catch (error) {
            console.error('Error stopping scanner:', error);
            setScanning(false);
        }
    };

    const handleTabChange = async (tab) => {
        if (tab === activeTab) return;

        // Stop current scanning and clear
        await stopScanning();
        await clearScanner();

        setActiveTab(tab);
        setError('');
        setFilePreview(null);

        // If switching to camera tab, start camera scanning
        if (tab === 'camera') {
            setTimeout(() => {
                startCameraScanning();
            }, 100);
        }
    };

    const handleMultiScanToggle = () => {
        setMultiScanMode(!multiScanMode);
        setBarcodes([]);
        setScanCount(0);
        detectedBarcodesRef.current.clear();
        setError('');
        if (scanning) {
            stopScanning();
        }
    };

    const clearBarcodes = () => {
        setBarcodes([]);
        setScanCount(0);
        detectedBarcodesRef.current.clear();
        setError('');
    };

    const removeBarcode = (id) => {
        setBarcodes(prev => {
            const updated = prev.filter(barcode => barcode.id !== id);
            const newSet = new Set(updated.map(b => b.text));
            detectedBarcodesRef.current = newSet;
            setScanCount(updated.length);
            return updated;
        });
    };

    const handleProceed = () => {
        if (barcodes.length === 0) {
            setError('Please scan at least one barcode before proceeding.');
            return;
        }

        // Extract the serial numbers from the barcodes
        const serials = barcodes.map(barcode => barcode.text);

        // Close the scanner and pass the results back
        onClose(serials);
    };

    useEffect(() => {
        if (showScanner && activeTab === 'camera' && barcodes.length === 0 && !scanning) {
            const timer = setTimeout(() => {
                startCameraScanning();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showScanner, activeTab, multiScanMode]);

    useEffect(() => {
        return () => {
            stopScanning();
            clearScanner();
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="w-full max-w-4xl max-lg:min-h-screen  mx-auto bg-white dark:bg-gray-800 md:rounded-lg md:shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Scan SIM Card Barcodes
                </h2>
                <button
                    onClick={closeScanner}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <X size={24}/>
                </button>
            </div>

            {/* Tabs */}
            {/*<div className="p-6 border-b border-gray-200 dark:border-gray-700">*/}
            {/*    <div className="flex bg-gray-100 rounded-lg p-1 mb-4">*/}
            {/*        <button*/}
            {/*            onClick={() => handleTabChange('camera')}*/}
            {/*            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${*/}
            {/*                activeTab === 'camera'*/}
            {/*                    ? 'bg-white text-blue-600 shadow-sm'*/}
            {/*                    : 'text-gray-600 hover:text-gray-800'*/}
            {/*            }`}*/}
            {/*        >*/}
            {/*            <Camera className="h-4 w-4 inline-block mr-2"/> Camera*/}
            {/*        </button>*/}
            {/*        <button*/}
            {/*            onClick={() => handleTabChange('file')}*/}
            {/*            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${*/}
            {/*                activeTab === 'file'*/}
            {/*                    ? 'bg-white text-blue-600 shadow-sm'*/}
            {/*                    : 'text-gray-600 hover:text-gray-800'*/}
            {/*            }`}*/}
            {/*        >*/}
            {/*            <Upload className="h-4 w-4 inline-block mr-2"/> File Upload*/}
            {/*        </button>*/}
            {/*    </div>*/}

            {/*    /!* Multi-scan toggle - only show for camera mode *!/*/}
            {/*    {activeTab === 'camera' && (*/}
            {/*        <label className="flex items-center text-sm bg-blue-50 p-3 rounded-lg">*/}
            {/*            <input*/}
            {/*                type="checkbox"*/}
            {/*                checked={multiScanMode}*/}
            {/*                onChange={handleMultiScanToggle}*/}
            {/*                disabled={scanning}*/}
            {/*                className="mr-3 w-4 h-4"*/}
            {/*            />*/}
            {/*            <span className="font-medium">Multi-scan mode</span>*/}
            {/*            <span className="text-gray-500 ml-2">(Keep scanning for multiple barcodes)</span>*/}
            {/*        </label>*/}
            {/*    )}*/}
            {/*</div>*/}

            {/* Scanner Area */}
            <div className="px-6 py-2">
                <div className={"flex items-center justify-start"}>
                    {error && (

                        <div
                            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 rounded-lg text-sm whitespace-pre-line">
                            {error}
                        </div>
                    )}

                    {scanCount > 0 && (
                        <div
                            className="bg-green-50 border border-green-200 text-green-700 px-4 py-1 mb-4 rounded-full text-xs text-center">
                            <Check className="h-4 w-4 inline-block mr-2"/>
                            {scanCount} barcode{scanCount !== 1 ? 's' : ''} detected
                        </div>
                    )}
                </div>

                <div
                    id="scanner-container"
                    className="w-full h-72 bg-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center relative mb-4"
                >
                    {activeTab === 'file' && !isProcessingFile && !filePreview && (
                        <div className="text-center">
                            <Upload className="h-12 w-12 mx-auto mb-2 text-gray-400"/>
                            <p className="text-gray-600 text-sm">Click "Choose File" below to select an image</p>
                            <p className="text-xs text-gray-500 mt-2">
                                Supported: JPG, PNG, WebP<br/>
                                Max size: 10MB
                            </p>
                        </div>
                    )}

                    {filePreview && activeTab === 'file' && (
                        <img
                            src={filePreview}
                            alt="Selected file preview"
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    )}

                    {isProcessingFile && (
                        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500"/>
                                <p className="text-gray-600 text-sm">Processing file...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Messages */}
                {activeTab === 'camera' && scanning && (
                    <div className="text-center text-gray-600 text-sm mb-4">
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            {multiScanMode ? 'Continuous scanning active...' : 'Scanning for barcode...'}
                        </div>
                    </div>
                )}

                {/* File Upload Section */}
                {activeTab === 'file' && (
                    <div className="mb-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={isProcessingFile}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white cursor-pointer hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Select a clear image containing a barcode or QR code
                        </p>
                    </div>
                )}

                {/* Scanned Barcodes */}
                {barcodes.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Scanned Serials ({barcodes.length})
                            </h3>
                            <button
                                onClick={clearBarcodes}
                                className="text-sm text-red-600 hover:text-red-800"
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {barcodes.map((barcode) => (
                                <div
                                    key={barcode.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <Check size={20} className="text-green-500"/>
                                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                                            {barcode.text}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeBarcode(barcode.id)}
                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                    >
                                        <X size={18}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {barcodes.length} serials scanned
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={closeScanner}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleProceed}
                        disabled={barcodes.length === 0 || isProcessingFile}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg font-medium transition-colors"
                    >
                        {isProcessingFile ? <Loader2 size={18} className="animate-spin"/> : <Check size={18}/>}
                        Proceed
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
