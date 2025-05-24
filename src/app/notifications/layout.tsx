import {AppProvider} from "@/ui/provider/AppProvider";
import React from "react";

export default function NotificationsLayout({
                                                children,
                                            }: {
    children: React.ReactNode;
}) {
    return <AppProvider>{children}</AppProvider>;
}