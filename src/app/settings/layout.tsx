import {AppProvider} from "@/ui/provider/AppProvider";
import React from "react";
import {SettingsProvider} from "@/app/_providers/settings-provider";

export default function SettingsLayout({
                                           children,
                                       }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AppProvider>
            <SettingsProvider>
                {children}
            </SettingsProvider>
        </AppProvider>
    );
}
