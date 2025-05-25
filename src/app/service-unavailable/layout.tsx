import {AppProvider} from "@/ui/provider/AppProvider";

const Layout = ({children}: any) => <AppProvider>{children}</AppProvider>;
export default Layout;