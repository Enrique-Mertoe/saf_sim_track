import React, {useEffect, useRef, useState} from 'react';
import {AlertCircle, Camera, Check, Loader2, Scan, Upload, X} from 'lucide-react';
import Script from 'next/script';

const SimCardScanner = ({ onClose }) => {
    const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'upload'
    const [hasCamera, setHasCamera] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scannedSerials, setScannedSerials] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [previewImages, setPreviewImages] = useState([]);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const streamRef = useRef(null);

    // Check camera availability on mount
    useEffect(() => {
        checkCameraAvailability();
        return () => {
            stopCamera();
        };
    }, []);

    const checkCameraAvailability = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setHasCamera(videoDevices.length > 0);
            if (videoDevices.length === 0) {
                setScanMode('upload');
            }
        } catch (error) {
            console.error('Error checking camera:', error);
            setHasCamera(false);
            setScanMode('upload');
        }
    };

    const startCamera = async () => {
        try {
            setError('');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setIsScanning(true);
        } catch (error) {
            console.error('Error starting camera:', error);
            setError('Unable to access camera. Please check permissions or use image upload.');
            setScanMode('upload');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsScanning(false);
    };

    const captureFrame = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Convert canvas to blob and process
        canvas.toBlob(async (blob) => {
            await processImage(blob);
        }, 'image/jpeg', 0.8);

        // Also try direct canvas barcode detection (client-side)
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            await scanCanvasImageData(imageData);
        } catch (_) {
            console.log('Client-side scanning failed, using server-side processing');
        }
    };

    // Client-side barcode scanning function
    const scanCanvasImageData = async (imageData) => {
        try {
            // Use jsQR for client-side QR code detection
            const code = window.jsQR ? window.jsQR(imageData.data, imageData.width, imageData.height) : null;

            if (code && code.data) {
                const serial = code.data.trim();
                setScannedSerials(prev => {
                    if (!prev.some(existing => existing.serial === serial)) {
                        return [...prev, {
                            serial,
                            id: Math.random().toString(36).substr(2, 9),
                            scanned: true
                        }];
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.log('Client-side barcode scanning failed:', error);
        }
    };

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setError('');
        setPreviewImages([]);

        // Create preview URLs
        const previews = files.map(file => URL.createObjectURL(file));
        setPreviewImages(previews);

        // Process all images
        for (const file of files) {
            await processImage(file);
        }
    };

    const processImage = async (imageData) => {
        setIsProcessing(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('image', imageData);

            const response = await fetch('/api/scan-barcodes', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to process image');
            }

            const result = await response.json();

            if (result.serials && result.serials.length > 0) {
                setScannedSerials(prev => {
                    const newSerials = result.serials.filter(serial =>
                        !prev.some(existing => existing.serial === serial)
                    );
                    return [...prev, ...newSerials.map(serial => ({
                        serial,
                        id: Math.random().toString(36).substr(2, 9),
                        scanned: true
                    }))];
                });
            } else {
                setError('No barcodes detected in the image. Please ensure barcodes are clear and well-lit.');
            }
        } catch (error) {
            console.error('Error processing image:', error);
            setError('Failed to process image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const removeSerial = (id) => {
        setScannedSerials(prev => prev.filter(item => item.id !== id));
    };

    const handleProceed = async () => {
        if (scannedSerials.length === 0) {
            setError('Please scan at least one barcode before proceeding.');
            return;
        }

        setIsProcessing(true);
        try {
            // Send serials to backend for database matching
            const response = await fetch('/api/match-simcards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    serials: scannedSerials.map(item => item.serial)
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to match SIM cards');
            }

            const result = await response.json();

            // Close modal and pass results to parent
            onClose(result);
        } catch (error) {
            console.error('Error matching SIM cards:', error);
            setError('Failed to match SIM cards. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            {/* Load jsQR library for client-side scanning */}
            <Script 
                src="https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.min.js"
                strategy="afterInteractive"
            />

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Scan SIM Card Barcodes
                </h2>
                <button
                    onClick={() => onClose()}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Mode Selection */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-4">
                    {hasCamera && (
                        <button
                            onClick={() => {
                                setScanMode('camera');
                                setError('');
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                scanMode === 'camera'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            <Camera size={20} />
                            Use Camera
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setScanMode('upload');
                            stopCamera();
                            setError('');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            scanMode === 'upload'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <Upload size={20} />
                        Upload Images
                    </button>
                </div>
            </div>

            {/* Scanner Content */}
            <div className="p-6">
                {scanMode === 'camera' ? (
                    <div className="space-y-4">
                        {!isScanning ? (
                            <div className="text-center">
                                <button
                                    onClick={startCamera}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Scan size={20} />
                                    Start Camera
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative bg-black rounded-lg overflow-hidden">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-64 object-cover"
                                        playsInline
                                        muted
                                    />
                                    <div className="absolute inset-0 border-2 border-dashed border-white/50 m-4 rounded-lg flex items-center justify-center">
                                        <div className="text-white text-center">
                                            <Scan size={32} className="mx-auto mb-2" />
                                            <p>Position barcodes within the frame</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 justify-center">
                                    <button
                                        onClick={captureFrame}
                                        disabled={isProcessing}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
                                    >
                                        {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                                        Capture & Scan
                                    </button>

                                    <button
                                        onClick={stopCamera}
                                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Stop Camera
                                    </button>
                                </div>
                            </div>
                        )}

                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Upload images containing SIM card barcodes
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
                            >
                                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                Select Images
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>

                        {previewImages.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {previewImages.map((url, index) => (
                                    <img
                                        key={index}
                                        src={url}
                                        alt={`Preview ${index + 1}`}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                        <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Scanned Serials */}
                {scannedSerials.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            Scanned Serials ({scannedSerials.length})
                        </h3>

                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {scannedSerials.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <Check size={20} className="text-green-500" />
                                        <span className="font-mono text-sm text-gray-900 dark:text-white">
                      {item.serial}
                    </span>
                                    </div>
                                    <button
                                        onClick={() => removeSerial(item.id)}
                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                    >
                                        <X size={18} />
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
                    {scannedSerials.length} serials scanned
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => onClose()}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleProceed}
                        disabled={scannedSerials.length === 0 || isProcessing}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg font-medium transition-colors"
                    >
                        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        Proceed to Assignment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimCardScanner;
