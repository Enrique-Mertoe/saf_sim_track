import {AppProvider} from "@/ui/provider/AppProvider";
import React from "react";
import {SettingsProvider} from "@/app/_providers/settings-provider";
import RoleBasedSettingsWrapper from "@/app/settings/RoleBasedSettingsWrapper";

export default function SettingsLayout({
                                           children,
                                       }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AppProvider>
            <SettingsProvider>
                <RoleBasedSettingsWrapper>
                    {children}
                </RoleBasedSettingsWrapper>
            </SettingsProvider>
        </AppProvider>
    );
}
