import {Activity} from "lucide-react";
import React from "react";

const fadeIn = (delay = 0) => {
    return {
        opacity: 0,
        animation: `fadeIn 0.8s ease-out ${delay}s forwards`,
    };
};
export default function AccountsPage({children}: { children: React.ReactNode }) {
    return (
        <div className="flex auth flex-col md:flex-row h-screen bg-gray-50">
            {/* Left side - Branding */}
            <div className="hidden md:flex md:w-1/2 bg-green-600 text-white flex-col justify-center items-center p-8">
                <div style={fadeIn(0)} className="max-w-md">
                    <div className="flex items-center justify-center mb-8">
                        <Activity className="h-12 w-12 mr-4"/>
                        <h1 className="text-4xl font-bold">Safaricom</h1>
                    </div>
                    <h2 className="text-2xl font-semibold mb-6" style={fadeIn(0.3)}>SIM Card Sales Tracking</h2>
                    <p className="text-lg mb-8" style={fadeIn(0.6)}>
                        Track SIM card sales, monitor activations, and manage your teams efficiently from anywhere.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mt-12" style={fadeIn(0.9)}>
                        <div className="bg-green-500 p-4 rounded-lg">
                            <h3 className="font-bold mb-2">Track Sales</h3>
                            <p className="text-sm">Monitor sales performance in real-time</p>
                        </div>
                        <div className="bg-green-500 p-4 rounded-lg">
                            <h3 className="font-bold mb-2">Manage Teams</h3>
                            <p className="text-sm">Efficiently handle team operations</p>
                        </div>
                        <div className="bg-green-500 p-4 rounded-lg">
                            <h3 className="font-bold mb-2">Generate Reports</h3>
                            <p className="text-sm">Access detailed insights and analytics</p>
                        </div>
                    </div>
                </div>
            </div>
            {children}
        </div>
    )
}