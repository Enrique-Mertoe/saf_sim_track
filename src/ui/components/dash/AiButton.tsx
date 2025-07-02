import {motion} from "framer-motion";
import Signal from "@/lib/Signal";
import {User} from "@/models";

export default function AIIconButton({user}: { user?:User }) {
    const handleClick = () => {
        Signal.trigger("ssm-copilot", {params: {userRole: user?.role?.toLowerCase() ?? "user"}})
    };

    return (
        <div className="">
            <motion.button
                onClick={handleClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 hover:from-blue-600 hover:via-purple-700 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-400/30"
                aria-label="AI Assistant"
            >
                {/* Animated gradient ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 via-pink-400 to-cyan-400 animate-spin opacity-75"
                     style={{ animation: 'spin 8s linear infinite' }} />
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500" />

                {/* AI Icon */}
                <div className="relative z-10">
                    <svg
                        viewBox="0 0 24 24"
                        className="w-8 h-8 fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Neural network pattern */}
                        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-40"/>
                        <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-60"/>

                        {/* Core AI nodes */}
                        <circle cx="12" cy="12" r="2" className="opacity-90"/>
                        <circle cx="8" cy="8" r="1.5" className="opacity-80"/>
                        <circle cx="16" cy="8" r="1.5" className="opacity-80"/>
                        <circle cx="8" cy="16" r="1.5" className="opacity-80"/>
                        <circle cx="16" cy="16" r="1.5" className="opacity-80"/>

                        {/* Connection lines */}
                        <path d="M8 8L12 12L16 8M8 16L12 12L16 16"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              className="opacity-70"/>

                        {/* Pulsing center dot */}
                        <circle cx="12" cy="12" r="1" className="animate-pulse opacity-100"/>
                    </svg>
                </div>

                {/* Glowing effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-cyan-400/20 blur-sm animate-pulse" />
            </motion.button>
        </div>
    );
}