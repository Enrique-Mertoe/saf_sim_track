import {motion} from "framer-motion";
import React from "react";

export const ScreenOverlay = () => {
    return (
        <motion.div
            className="absolute h-96 inset-0 bg-black pointer-events-none"
            initial={{opacity: 0}}
            animate={{opacity: 0.5}}
            exit={{opacity: 0}}
            transition={{duration: 0.3}}
        />
    );
};