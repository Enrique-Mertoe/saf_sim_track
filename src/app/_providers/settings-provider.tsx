"use client"
import {createContext, ReactNode, useContext} from "react";

type SettingType = {
    action: Closure
}
const SettingContext = createContext<SettingType | undefined>(undefined)
export const SettingsProvider = ({children}: {
    children: ReactNode
}) => {
    const handler: SettingType = {
        action(_args): void {
        }

    }
    return (
        <SettingContext.Provider value={handler}>
            {children}
        </SettingContext.Provider>
    )
}
export const useSettings = () => {
    const context = useContext(SettingContext);
    if (!context)
        throw new Error("useSetting must be used inside SettingsProvider.")
    return context
}