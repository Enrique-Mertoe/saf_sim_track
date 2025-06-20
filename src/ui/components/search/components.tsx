import {Loader2} from "lucide-react";
import React from "react";

export const LoadingSpinner = ({size = 20}) => (
    <Loader2 size={size} className="animate-spin text-blue-500"/>
);

export
const StatusBadge = ({status, type = "default"}:any) => {
    const variants = {
        success: "bg-green-100 text-green-800 border-green-200",
        warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
        error: "bg-red-100 text-red-800 border-red-200",
        default: "bg-gray-100 text-gray-800 border-gray-200"
    };

    return (
        //@ts-ignore
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${variants[type]}`}>
    {status}
    </span>
    );
};