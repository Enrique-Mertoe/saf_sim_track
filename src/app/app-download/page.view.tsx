"use client";

import {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import Link from 'next/link';

export default function AppDownloadPage() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDownloadUrl() {
      try {
        setIsLoading(true);
        // const url = await getAppDownloadUrl();
        setDownloadUrl("https://aukjtuadtfpmlcfqusaa.supabase.co/storage/v1/object/public/sim-management/apps/ssm.apk");
      } catch (err) {
        setError('Failed to get download link. Please try again later.');
        console.error('Error fetching app download URL:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDownloadUrl();
  }, []);

  return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <section className="bg-gradient-to-r from-slate-900 to-green-800 text-white py-16">
          <div className="container mx-auto px-6 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold mb-4">SIM Manager Mobile</h1>
              <p className="text-xl text-slate-300">Manage your SIM operations on the go</p>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-6 py-12">
          {/* Download Section */}
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              {isLoading ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Preparing download...</p>
                  </div>
              ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold text-red-600 mb-2">Download Unavailable</h3>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <Link
                        href="/"
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Return to Home
                    </Link>
                  </div>
              ) : (
                  <div className="text-center">
                    <div className="text-5xl mb-4">📱</div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Download SIM Manager</h2>
                    <p className="text-slate-600 mb-6">Android APK • Version 1.0.0</p>

                    <a
                        href={downloadUrl || '#'}
                        download="ssm.apk"
                        className={`inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all ${!downloadUrl && 'opacity-50 cursor-not-allowed'}`}
                        onClick={(e) => !downloadUrl && e.preventDefault()}
                    >
                      <span>⬇️</span>
                      Download APK
                    </a>

                    <p className="mt-4 text-sm text-slate-500">
                      By downloading, you agree to our <Link href="#" className="text-green-600 hover:underline">Terms of Service</Link>
                    </p>
                  </div>
              )}
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Key Features</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "📊", title: "Real-time Tracking" },
                  { icon: "🔔", title: "Push Notifications" },
                  { icon: "📈", title: "Performance Metrics" },
                  { icon: "🔒", title: "Secure Access" }
                ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg">
                        {feature.icon}
                      </div>
                      <span className="font-semibold text-slate-800">{feature.title}</span>
                    </div>
                ))}
              </div>
            </div>

            {/* Installation Steps */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Installation Steps</h3>
              <div className="space-y-3">
                {[
                  "Download the APK file",
                  "Enable 'Unknown Sources' in Android Settings > Security",
                  "Open the APK file and install"
                ].map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <span className="text-slate-700">{step}</span>
                    </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <p className="text-amber-800 text-sm flex items-start gap-2">
                <span className="text-lg">ℹ️</span>
                <span>This app is not available on Google Play Store. You'll need to enable installation from unknown sources.</span>
              </p>
            </div>

            {/* Back to Home */}
            <div className="text-center">
              <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold"
              >
                <span>←</span> Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
  );
}