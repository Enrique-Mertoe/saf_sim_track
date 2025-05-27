import {AppProvider} from "@/ui/provider/AppProvider";

export default function Layout({children}: any) {
    return (
        <AppProvider>
            {children}
        </AppProvider>
    )
}