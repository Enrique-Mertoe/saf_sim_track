import {useEffect, useRef, useState} from 'react'
import {Html5Qrcode, Html5QrcodeSupportedFormats} from 'html5-qrcode'

function App() {
    const [count, setCount] = useState(0)
    const [showModal, setShowModal] = useState(false)
    const [barcodes, setBarcodes] = useState([])
    const [recentBarcodes, setRecentBarcodes] = useState([])
    const [scanning, setScanning] = useState(false)
    const [error, setError] = useState('')
    const [multiScanMode, setMultiScanMode] = useState(true)
    const [scanCount, setScanCount] = useState(0)
    const [selectedBarcode, setSelectedBarcode] = useState(null)
    const [activeTab, setActiveTab] = useState('camera') // 'camera' or 'file'
    const [isProcessingFile, setIsProcessingFile] = useState(false)
    const [filePreview, setFilePreview] = useState(null)

    const html5QrCodeRef = useRef(null)
    const fileInputRef = useRef(null)
    const scannerInitializedRef = useRef(false)
    const detectedBarcodesRef = useRef(new Set())
    const scanTimeoutRef = useRef(null)

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
    ]

    const openBarcodeScanner = () => {
        setShowModal(true)
        setBarcodes([])
        setError('')
        setScanCount(0)
        setActiveTab('camera')
        setFilePreview(null)
        detectedBarcodesRef.current.clear()
    }

    const closeModal = () => {
        setShowModal(false)
        stopScanning()
        clearScanner()
        setFilePreview(null)
        if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current)
        }
    }

    const addBarcode = (decodedText, decodedResult) => {
        if (!detectedBarcodesRef.current.has(decodedText)) {
            detectedBarcodesRef.current.add(decodedText)

            const newBarcode = {
                text: decodedText,
                format: decodedResult.result?.format?.formatName || 'Unknown',
                timestamp: new Date().toLocaleTimeString(),
                id: Date.now() + Math.random(),
                status: 'loading'
            }

            setBarcodes(prev => [...prev, newBarcode])
            setScanCount(prev => prev + 1)
            setError('')

            // Simulate processing
            setTimeout(() => {
                const processedBarcode = {
                    ...newBarcode,
                    status: Math.random() > 0.3 ? 'success' : 'error',
                    message: Math.random() > 0.3 ? 'Successfully processed' : 'Failed to process barcode'
                }

                setBarcodes(prev => prev.map(b => b.id === processedBarcode.id ? processedBarcode : b))

                // Add to recent barcodes
                setRecentBarcodes(prev => {
                    const filtered = prev.filter(b => b.text !== processedBarcode.text)
                    return [processedBarcode, ...filtered].slice(0, 10)
                })
            }, 2000)

            console.log(`Barcode ${detectedBarcodesRef.current.size} detected: ${decodedText}`)

            if (!multiScanMode && activeTab === 'camera') {
                stopScanning()
            }
        }
    }

    const onScanSuccess = (decodedText, decodedResult) => {
        console.log(`Barcode detected: ${decodedText}`, decodedResult);
        addBarcode(decodedText, decodedResult)

        if (multiScanMode && scanning) {
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current)
            }
            scanTimeoutRef.current = setTimeout(() => {
                // Scanner continues automatically
            }, 1000)
        }
    }

    const onScanFailure = (error) => {
        // Handle scan failure silently
    }

    const clearScanner = async () => {
        try {
            if (html5QrCodeRef.current) {
                await html5QrCodeRef.current.clear()
                html5QrCodeRef.current = null
            }
        } catch (error) {
            console.error('Error clearing scanner:', error)
        }
    }

    const startCameraScanning = async () => {
        try {
            setScanning(true)
            setError('')
            setScanCount(0)

            // Clear any existing scanner
            await clearScanner()

            const html5QrCode = new Html5Qrcode("scanner-container", {
                formatsToSupport: supportedFormats
            });

            html5QrCodeRef.current = html5QrCode;

            const config = {
                fps: multiScanMode ? 5 : 10,
                qrbox: { width: 250, height: 150 },
                disableFlip: false,
                rememberLastUsedCamera: true,
                showTorchButtonIfSupported: false
            };

            await html5QrCode.start(
                { facingMode: "environment" },
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
    }

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
                    format: { formatName: 'File Upload' },
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
    }

    const stopScanning = async () => {
        if (!scannerInitializedRef.current) return;

        try {
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current)
            }

            if (html5QrCodeRef.current) {
                await html5QrCodeRef.current.stop();
            }

            scannerInitializedRef.current = false;
            setScanning(false);
        } catch (error) {
            console.error('Error stopping scanner:', error);
            setScanning(false);
        }
    }

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
    }

    const handleMultiScanToggle = () => {
        setMultiScanMode(!multiScanMode);
        setBarcodes([]);
        setScanCount(0);
        detectedBarcodesRef.current.clear();
        setError('');
        if (scanning) {
            stopScanning();
        }
    }

    const clearBarcodes = () => {
        setBarcodes([]);
        setScanCount(0);
        detectedBarcodesRef.current.clear();
        setError('');
    }

    const removeBarcode = (id) => {
        setBarcodes(prev => {
            const updated = prev.filter(barcode => barcode.id !== id);
            const newSet = new Set(updated.map(b => b.text));
            detectedBarcodesRef.current = newSet;
            setScanCount(updated.length);
            return updated;
        });
    }

    const removeRecentBarcode = (id) => {
        setRecentBarcodes(prev => prev.filter(barcode => barcode.id !== id));
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Copied to clipboard:', text);
        });
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'loading': return 'bg-blue-100 text-blue-800'
            case 'success': return 'bg-green-100 text-green-800'
            case 'error': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'loading': return '⏳'
            case 'success': return '✅'
            case 'error': return '❌'
            default: return '📱'
        }
    }

    useEffect(() => {
        if (showModal && activeTab === 'camera' && barcodes.length === 0 && !scanning) {
            const timer = setTimeout(() => {
                startCameraScanning();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showModal, activeTab, multiScanMode]);

    useEffect(() => {
        return () => {
            stopScanning();
            clearScanner();
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current)
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Barcode Scanner</h1>
                    <div className="mb-4">
                        <button
                            onClick={() => setCount((count) => count + 1)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mr-4"
                        >
                            Count: {count}
                        </button>
                    </div>
                    <button
                        onClick={openBarcodeScanner}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg"
                    >
                        📱 Scan Barcode{multiScanMode ? 's' : ''}
                    </button>
                </div>

                {/* Recently Scanned Section */}
                {recentBarcodes.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Recently Scanned</h2>
                            <button
                                onClick={() => setRecentBarcodes([])}
                                className="text-sm text-red-600 hover:text-red-800"
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {recentBarcodes.map((barcode) => (
                                <div
                                    key={barcode.id}
                                    onClick={() => setSelectedBarcode(barcode)}
                                    className="min-w-32 bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors relative"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 mx-auto ${getStatusColor(barcode.status)}`}>
                                        <span className="text-sm">{getStatusIcon(barcode.status)}</span>
                                    </div>

                                    <div className="text-xs text-gray-600 text-center truncate">
                                        {barcode.text}
                                    </div>

                                    {barcode.status === 'loading' && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Scanner Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-gray-800">Scanner</h2>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 text-3xl w-8 h-8 flex items-center justify-center"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                                    <button
                                        onClick={() => handleTabChange('camera')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                            activeTab === 'camera'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        📹 Camera
                                    </button>
                                    <button
                                        onClick={() => handleTabChange('file')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                            activeTab === 'file'
                                                ? 'bg-white text-blue-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-800'
                                        }`}
                                    >
                                        📁 File Upload
                                    </button>
                                </div>

                                {/* Multi-scan toggle - only show for camera mode */}
                                {activeTab === 'camera' && (
                                    <label className="flex items-center text-sm bg-blue-50 p-3 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={multiScanMode}
                                            onChange={handleMultiScanToggle}
                                            disabled={scanning}
                                            className="mr-3 w-4 h-4"
                                        />
                                        <span className="font-medium">Multi-scan mode</span>
                                        <span className="text-gray-500 ml-2">(Keep scanning for multiple barcodes)</span>
                                    </label>
                                )}
                            </div>

                            {/* Scanner Area */}
                            <div className="flex-1 relative">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-4 rounded-lg text-sm whitespace-pre-line">
                                        {error}
                                    </div>
                                )}

                                {scanCount > 0 && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 m-4 rounded-lg text-sm text-center">
                                        ✓ {scanCount} barcode{scanCount !== 1 ? 's' : ''} detected
                                    </div>
                                )}

                                <div
                                    id="scanner-container"
                                    className="w-full h-72 bg-gray-100 mx-4 mb-4 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center relative"
                                    style={{ width: 'calc(100% - 2rem)' }}
                                >
                                    {activeTab === 'file' && !isProcessingFile && !filePreview && (
                                        <div className="text-center">
                                            <div className="text-4xl mb-2">📁</div>
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
                                                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                <p className="text-gray-600 text-sm">Processing file...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Status Messages */}
                                {activeTab === 'camera' && scanning && (
                                    <div className="text-center text-gray-600 text-sm px-4 mb-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                            {multiScanMode ? 'Continuous scanning active...' : 'Scanning for barcode...'}
                                        </div>
                                    </div>
                                )}

                                {/* File Upload Section */}
                                {activeTab === 'file' && (
                                    <div className="px-4 mb-4">
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
                                        <div className="text-xs text-gray-400 mt-1 text-center">
                                            Tips: Use good lighting, avoid blurry images, make sure the barcode is clearly visible
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bottom Card - Current Scan Results */}
                            {barcodes.length > 0 && (
                                <div className="bg-gray-50 border-t max-h-48 overflow-y-auto">
                                    <div className="p-4 border-b bg-white">
                                        <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-600">
                        Current Session: {barcodes.length} barcode{barcodes.length !== 1 ? 's' : ''}
                      </span>
                                            <button
                                                onClick={clearBarcodes}
                                                className="text-xs text-red-600 hover:text-red-800"
                                            >
                                                Clear Session
                                            </button>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-gray-200">
                                        {barcodes.map((barcode) => (
                                            <div key={barcode.id} className="p-4 hover:bg-gray-100 relative">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 min-w-0">
                                                        <button
                                                            onClick={() => copyToClipboard(barcode.text)}
                                                            className="text-left w-full hover:text-blue-600"
                                                        >
                                                            <div className="font-mono text-sm font-medium truncate">
                                                                {barcode.text}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(barcode.status)}`}>
                                  {barcode.status}
                                </span>
                                                                <span>{barcode.format} • {barcode.timestamp}</span>
                                                            </div>
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeBarcode(barcode.id)}
                                                        className="ml-2 text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        ×
                                                    </button>
                                                </div>

                                                {barcode.status === 'loading' && (
                                                    <div className="absolute right-8 top-4">
                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Barcode Details Dialog */}
                {selectedBarcode && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className={`text-lg font-semibold ${
                                    selectedBarcode.status === 'success' ? 'text-green-600' :
                                        selectedBarcode.status === 'error' ? 'text-red-600' : 'text-blue-600'
                                }`}>
                                    {selectedBarcode.status === 'success' ? 'Success' :
                                        selectedBarcode.status === 'error' ? 'Error' : 'Processing'}
                                </h3>
                                <button
                                    onClick={() => setSelectedBarcode(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Barcode:</p>
                                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">{selectedBarcode.text}</p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600">Status:</p>
                                    <p className="text-sm">{selectedBarcode.message || 'Processing in progress...'}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setSelectedBarcode(null)}
                                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
                                >
                                    OK
                                </button>
                                <button
                                    onClick={() => {
                                        removeRecentBarcode(selectedBarcode.id);
                                        setSelectedBarcode(null);
                                    }}
                                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default App