import {motion} from "framer-motion";
import React from "react";

export default function Button({
                                   isLoading, onClick, text, className = '', disabled = false,
                                   icon = null,
                                   ...props
                               }: {
    isLoading: boolean,
    onClick: Closure;
    text: string;
    disabled?: boolean;
    icon?: any
} & React.HTMLAttributes<HTMLButtonElement>) {
    const colorLight = "#4CA350";
    const colorDark = "#005522";
    const buttonVariants = {
        hidden: {y: 10, opacity: 0},
        visible: {
            y: 0,
            opacity: 1,
            transition: {duration: 0.5, ease: "easeOut"}
        },
        hover: {
            scale: 1.03,
            boxShadow: "0 10px 15px -3px rgba(76, 163, 80, 0.3)",
            transition: {duration: 0.2}
        },
        tap: {
            scale: 0.97,
            transition: {duration: 0.1}
        }
    };
    return (
        <motion.button
            className={`w-full h-14 flex cursor-pointer justify-center items-center rounded-2xl text-white font-bold py-3 px-4 overflow-hidden disabled:opacity-70 ${className}`}
            onClick={onClick}
            disabled={isLoading || disabled}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            style={{
                background: `linear-gradient(90deg, ${colorLight}, ${colorDark})`
            }}
        >
            <>
                {icon ? icon : ''}
            </>
            {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <span className="tracking-wider">{text}</span>
            )}
        </motion.button>
    )
}