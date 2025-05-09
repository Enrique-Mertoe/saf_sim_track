import {AppProvider} from "@/ui/provider/AppProvider";
import React from "react";

export default function DashLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AppProvider>
            {children}
        </AppProvider>
    );
}
