"use client"
import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import Dashboard from "@/ui/components/dash/Dashboard";

const StaffAppRedirect: React.FC = () => {
  return (
    <Dashboard>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 text-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="mb-6 flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <Smartphone className="h-12 w-12 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Your Dashboard on Mobile</h1>
          
          <p className="text-gray-600 mb-6">
            Your activities are optimized for our mobile application. Please use our app for the best experience and full access to all features.
          </p>
          
          <div className="space-y-4">
            <a 
              href="#" 
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-md transition-colors w-full"
              onClick={() => window.open('https://play.google.com/store/apps', '_blank')}
            >
              <Download className="h-5 w-5" />
              <span>Download Our App</span>
            </a>
            
            <div className="text-sm text-gray-500">
              <p>Available on Android and iOS devices</p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-700 mb-2">Why use our app?</h3>
            <ul className="text-sm text-gray-600 text-left space-y-2">
              <li>• Optimized for field operations</li>
              <li>• Works offline in areas with poor connectivity</li>
              <li>• Real-time updates and notifications</li>
              <li>• Easier data collection and submission</li>
            </ul>
          </div>
        </div>
      </div>
    </Dashboard>
  );
};

export default StaffAppRedirect;