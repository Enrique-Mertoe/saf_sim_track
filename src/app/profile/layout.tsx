import React from "react";
import {AppProvider} from "@/ui/provider/AppProvider";
import Dashboard from "@/ui/components/dash/Dashboard";

export default function ProfileLayout({
                                          children,
                                      }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AppProvider>
            <Dashboard>
                {children}
            </Dashboard>
        </AppProvider>
    );
}