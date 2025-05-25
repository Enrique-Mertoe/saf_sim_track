import {Suspense} from 'react';

// Green themed loader component
function PaymentLoader() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                {/* Animated spinner */}
                <div className="relative mb-4">
                    <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-green-300 rounded-full animate-ping mx-auto"></div>
                </div>

                {/* Loading text with dots animation */}
                <div className="flex items-center justify-center space-x-1 mb-2">
                    <span className="text-gray-700 font-medium">Processing payment</span>
                    <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                </div>

                {/* Status message */}
                <p className="text-sm text-gray-500">Please wait while we verify your transaction</p>

                {/* Progress bar */}
                <div className="w-64 bg-gray-200 rounded-full h-2 mt-4 mx-auto overflow-hidden">
                    <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}

// Alternative compact loader
function CompactPaymentLoader() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-sm mx-auto">
                {/* Simple spinner */}
                <div className="w-12 h-12 border-3 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>

                {/* Loading message */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
                <p className="text-sm text-gray-600 mb-4">Verifying your M-Pesa transaction...</p>

                {/* Animated progress dots */}
                <div className="flex justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
            </div>
        </div>
    );
}

// Premium loader with payment icons
function PremiumPaymentLoader() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
                {/* Payment icon with pulse animation */}
                <div className="relative mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    </div>
                    <div className="absolute inset-0 w-20 h-20 border-4 border-green-200 rounded-full animate-ping mx-auto"></div>
                </div>

                {/* Loading content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payment Processing</h3>
                <p className="text-gray-600 mb-6">Your transaction is being processed securely via M-Pesa</p>

                {/* Loading steps */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Initiating payment</span>
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Connecting to M-Pesa</span>
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Verifying transaction</span>
                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>

                <p className="text-xs text-gray-500 mt-4">This may take up to 30 seconds</p>
            </div>
        </div>
    );
}

// Your actual payment processing component (placeholder)
function PaymentProcessingPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Processing</h1>
                {/* Your actual payment processing content goes here */}
                <div className="bg-white rounded-lg shadow p-6">
                    <p>Payment processing content...</p>
                </div>
            </div>
        </div>
    );
}

// Main wrapper with Suspense
export default function PaymentPageWrapper() {
    return (
        <Suspense fallback={<PremiumPaymentLoader />}>
            <PaymentProcessingPage />
        </Suspense>
    );
}