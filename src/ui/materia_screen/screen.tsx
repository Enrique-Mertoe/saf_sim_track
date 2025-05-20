import {motion} from "framer-motion";
import React from "react";
import {motionVariants, ScreenProps} from "@/ui/materia_screen/Types";
import {useScreen} from "@/ui/materia_screen/context";

export const Screen = ({children, name, endTask = false}: ScreenProps) => {
    const {activeScreens, transitionType, getCurrentScreenKey} = useScreen();

    // Find all instances of this screen in the active screens stack
    const screenInstances = activeScreens.filter(screen => screen.name === name);

    if (screenInstances.length === 0) return null;

    return (
        <>
            {screenInstances.map((instance, index) => {
                const isTopScreen = instance.key === getCurrentScreenKey();
                const variants = motionVariants[isTopScreen ? transitionType : 'none'];

                // Only the current screen gets animated with the selected transition
                return (
                    <motion.div
                        key={instance.key}
                        className="absolute top-0 left-0 w-full h-full bg-white"
                        style={{zIndex: index + 1}}
                        initial={isTopScreen ? "initial" : false}
                        animate={isTopScreen ? "animate" : {x: 0, opacity: 1}}
                        exit={isTopScreen ? "exit" : {opacity: 0}}
                        variants={variants}
                    >
                        {children}
                    </motion.div>
                );
            })}
        </>
    );
};