// theme.ts - A robust theming utility for Tailwind CSS components

/**
 * Utility for merging class names and removing duplicates
 */
export function cn(...classes: (string | undefined)[]): string {
    // Filter out undefined values and split classes by whitespace
    const allClasses = classes
        .filter(Boolean)
        .flatMap(cls => cls?.split(/\s+/).filter(Boolean) || []);

    // Create a Set to remove duplicates and join back with spaces
    return [...new Set(allClasses)].join(' ');
}

/**
 * Type for defining a component style that can be accessed as a property or function
 */
type StyleDefinition = string & {
    (additionalClasses?: string): string;
};

/**
 * Creates a StyleDefinition that can be used both as a string and a function
 */
function createStyle(classes: string): StyleDefinition {
    // Create a function that returns the combined classes
    const styleFn = (additionalClasses?: string) => {
        return cn(classes, additionalClasses);
    };

    // Add the classes string as a valueOf property to allow using as a string
    Object.defineProperty(styleFn, 'valueOf', {
        value: () => classes,
        writable: false
    });

    // Add toString to properly convert to string when concatenated
    Object.defineProperty(styleFn, 'toString', {
        value: () => classes,
        writable: false
    });

    return styleFn as StyleDefinition;
}

/**
 * Theme utility class providing styling for common UI components
 */
export class Theme {
    // Main Button Styles
    static readonly Button = createStyle('inline-flex items-center justify-center rounded-full border border-gray-500 px-4 py-1 text-sm cursor-pointer hover:border-green-600  border-1 font-medium hover:bg-gray-50 transition-all transform hover:scale-105 duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none');
    static readonly BtnPrimary = createStyle('bg-green-600 text-white hover:bg-green-700');
    static readonly BtnSecondary = createStyle('bg-green-100 text-green-900 hover:bg-green-200');
    static readonly BtnOutline = createStyle('border border-green-600 text-green-700 hover:bg-green-50');
    static readonly BtnGhost = createStyle('hover:bg-green-100 hover:text-green-900');
    static readonly BtnLink = createStyle('text-green-600 underline-offset-4 hover:underline');
    static readonly BtnDanger = createStyle('bg-red-600 text-white hover:bg-red-700');
    static readonly BtnSoftDanger = createStyle('bg-red-100 text-red-900 hover:bg-red-200');
    static readonly BtnWarning = createStyle('bg-amber-500 text-white hover:bg-amber-600');
    static readonly BtnSuccess = createStyle('bg-emerald-600 text-white hover:bg-emerald-700');
    static readonly BtnLight = createStyle('bg-slate-100 text-slate-900 hover:bg-slate-200');
    static readonly BtnSoftLight = createStyle('bg-slate-50 text-slate-800 hover:bg-slate-200');
    static readonly BtnDark = createStyle('bg-slate-900 text-white hover:bg-slate-800');

    // Button Sizes
    static readonly BtnSm = createStyle('h-8 px-3 text-xs');
    static readonly BtnMd = createStyle('h-10 px-4 py-2');
    static readonly BtnLg = createStyle('h-12 px-6 py-3 text-lg');
    static readonly BtnXl = createStyle('h-14 px-8 py-4 text-xl');
    static readonly BtnFull = createStyle('w-full');
    static readonly BtnIcon = createStyle('p-2');

    // Card Styles
    static readonly Card = createStyle('rounded-lg border bg-white shadow-sm overflow-hidden');
    static readonly CardHeader = createStyle('flex flex-col space-y-1.5 p-6');
    static readonly CardTitle = createStyle('font-semibold text-lg text-slate-900');
    static readonly CardDescription = createStyle('text-sm text-slate-500');
    static readonly CardContent = createStyle('p-6 pt-0');
    static readonly CardFooter = createStyle('flex items-center p-6 pt-0');
    static readonly CardHover = createStyle('transition-shadow hover:shadow-md');

    // Input Styles
    static readonly Input = createStyle('flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:cursor-not-allowed disabled:opacity-50');
    static readonly InputError = createStyle('border-red-300 focus:ring-red-500 focus:border-red-500');
    static readonly InputSuccess = createStyle('border-green-300 focus:ring-green-500 focus:border-green-500');

    // Label Styles
    static readonly Label = createStyle('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70');

    // Badge Styles
    static readonly Badge = createStyle('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors');
    static readonly BadgePrimary = createStyle('bg-green-100 text-green-800');
    static readonly BadgeSecondary = createStyle('bg-slate-100 text-slate-800');
    static readonly BadgeOutline = createStyle('text-slate-900 border border-slate-200');
    static readonly BadgeSuccess = createStyle('bg-emerald-100 text-emerald-800');
    static readonly BadgeWarning = createStyle('bg-amber-100 text-amber-800');
    static readonly BadgeDanger = createStyle('bg-red-100 text-red-800');

    // Alert Styles
    static readonly Alert = createStyle('relative w-full rounded-lg border p-4');
    static readonly AlertPrimary = createStyle('bg-green-100 border-green-200 text-green-800');
    static readonly AlertWarning = createStyle('bg-amber-100 border-amber-200 text-amber-800');
    static readonly AlertDanger = createStyle('bg-red-100 border-red-200 text-red-800');
    static readonly AlertTitle = createStyle('mb-1 font-medium leading-none tracking-tight');
    static readonly AlertDescription = createStyle('text-sm opacity-90');

    // Dialog/Modal Styles
    static readonly Dialog = createStyle('fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/50');
    static readonly DialogPanel = createStyle('w-full max-w-md rounded-lg bg-white p-6 shadow-lg');
    static readonly DialogTitle = createStyle('text-lg font-medium');
    static readonly DialogDescription = createStyle('mt-2 text-sm text-slate-500');
    static readonly DialogClose = createStyle('absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100');

    // Form Styles
    static readonly Form = createStyle('space-y-6');
    static readonly FormItem = createStyle('space-y-2');
    static readonly FormLabel = createStyle('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70');
    static readonly FormDescription = createStyle('text-sm text-slate-500');
    static readonly FormMessage = createStyle('text-sm font-medium text-red-500');
    static readonly FormControl = createStyle('mt-2');

    // Toggle/Switch Styles
    static readonly Switch = createStyle('peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 data-[state=checked]:bg-green-600');

    // Checkbox Styles
    static readonly Checkbox = createStyle('h-4 w-4 rounded border border-slate-300 text-green-600 focus:ring-green-500');

    // Radio Styles
    static readonly Radio = createStyle('h-4 w-4 border border-slate-300 text-green-600 focus:ring-green-500');

    // Select Styles
    static readonly Select = createStyle('flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:cursor-not-allowed disabled:opacity-50');
    static readonly SelectTrigger = createStyle('flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50');

    // Tooltip Styles
    static readonly Tooltip = createStyle('z-50 overflow-hidden rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white');

    // Table Styles
    static readonly Table = createStyle('w-full caption-bottom text-sm');
    static readonly TableHeader = createStyle('border-b');
    static readonly TableRow = createStyle('border-b transition-colors hover:bg-slate-50');
    static readonly TableHead = createStyle('h-12 px-4 text-left align-middle font-medium text-slate-500');
    static readonly TableBody = createStyle('divide-y');
    static readonly TableCell = createStyle('p-4 align-middle');

    // Navigation Styles
    static readonly Nav = createStyle('flex items-center space-x-4');
    static readonly NavItem = createStyle('text-slate-700 hover:text-green-600 transition-colors');
    static readonly NavItemActive = createStyle('text-green-600 font-medium');

    // Tabs Styles
    static readonly Tabs = createStyle('relative w-full');
    static readonly TabsList = createStyle('flex items-center');
    static readonly TabsTrigger = createStyle('inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm border-b-2 data-[state=active]:border-green-600');
    static readonly TabsContent = createStyle('mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2');

    // Dropdown/Menu Styles
    static readonly Menu = createStyle('z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-slate-700 shadow-md');
    static readonly MenuItem = createStyle('relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-green-50 hover:text-green-700 focus:bg-green-50 focus:text-green-700');
    static readonly MenuSeparator = createStyle('my-1 h-px bg-slate-200');

    // Scrollbar Styles
    static readonly Scrollbar = createStyle('scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400');

    // Layout Styles
    static readonly Container = createStyle('mx-auto px-4 sm:px-6 lg:px-8');
    static readonly ContainerSm = createStyle('max-w-3xl');
    static readonly ContainerMd = createStyle('max-w-5xl');
    static readonly ContainerLg = createStyle('max-w-7xl');
    static readonly ContainerXl = createStyle('max-w-[90rem]');
    static readonly ContainerFull = createStyle('max-w-full');

    // Flex Layouts
    static readonly FlexRow = createStyle('flex flex-row');
    static readonly FlexCol = createStyle('flex flex-col');
    static readonly FlexCenter = createStyle('items-center justify-center');
    static readonly FlexBetween = createStyle('items-center justify-between');
    static readonly FlexWrap = createStyle('flex-wrap');

    // Grid Layouts
    static readonly Grid = createStyle('grid');
    static readonly Grid2 = createStyle('grid grid-cols-2 gap-4');
    static readonly Grid3 = createStyle('grid grid-cols-3 gap-4');
    static readonly Grid4 = createStyle('grid grid-cols-4 gap-4');

    // Responsive Helpers
    static readonly HideMobile = createStyle('hidden sm:block');
    static readonly HideDesktop = createStyle('sm:hidden');

    // Spacing
    static readonly SpaceY1 = createStyle('space-y-1');
    static readonly SpaceY2 = createStyle('space-y-2');
    static readonly SpaceY4 = createStyle('space-y-4');
    static readonly SpaceY6 = createStyle('space-y-6');
    static readonly SpaceY8 = createStyle('space-y-8');
    static readonly SpaceX1 = createStyle('space-x-1');
    static readonly SpaceX2 = createStyle('space-x-2');
    static readonly SpaceX4 = createStyle('space-x-4');
    static readonly SpaceX6 = createStyle('space-x-6');
    static readonly SpaceX8 = createStyle('space-x-8');

    // Text Styles
    static readonly TextXs = createStyle('text-xs');
    static readonly TextSm = createStyle('text-sm');
    static readonly TextBase = createStyle('text-base');
    static readonly TextLg = createStyle('text-lg');
    static readonly TextXl = createStyle('text-xl');
    static readonly Text2xl = createStyle('text-2xl');
    static readonly TextPrimary = createStyle('text-green-600');
    static readonly TextSecondary = createStyle('text-slate-600');
    static readonly TextMuted = createStyle('text-slate-500');
    static readonly TextLight = createStyle('text-slate-300');
    static readonly TextDark = createStyle('text-slate-900');
    static readonly TextDanger = createStyle('text-red-600');
    static readonly TextWarning = createStyle('text-amber-600');
    static readonly TextSuccess = createStyle('text-emerald-600');

    // Margin/Padding Helpers
    static readonly M0 = createStyle('m-0');
    static readonly M1 = createStyle('m-1');
    static readonly M2 = createStyle('m-2');
    static readonly M4 = createStyle('m-4');
    static readonly M6 = createStyle('m-6');
    static readonly M8 = createStyle('m-8');
    static readonly P0 = createStyle('p-0');
    static readonly P1 = createStyle('p-1');
    static readonly P2 = createStyle('p-2');
    static readonly P4 = createStyle('p-4');
    static readonly P6 = createStyle('p-6');
    static readonly P8 = createStyle('p-8');

    // Shadow Styles
    static readonly ShadowNone = createStyle('shadow-none');
    static readonly ShadowSm = createStyle('shadow-sm');
    static readonly ShadowMd = createStyle('shadow-md');
    static readonly ShadowLg = createStyle('shadow-lg');
    static readonly ShadowXl = createStyle('shadow-xl');

    // Animation Helpers
    static readonly Animate = createStyle('transition-all duration-200');
    static readonly AnimateSlow = createStyle('transition-all duration-300');
    static readonly AnimateFast = createStyle('transition-all duration-150');

    // Combined component styles for convenience
    static getButton(variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'danger' | 'softDanger' | 'warning' | 'success' | 'light' | 'softLight' | 'dark' = 'primary',
                     size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md',
                     additionalClasses?: string): string {
        const variantMap = {
            primary: Theme.BtnPrimary,
            secondary: Theme.BtnSecondary,
            outline: Theme.BtnOutline,
            ghost: Theme.BtnGhost,
            link: Theme.BtnLink,
            danger: Theme.BtnDanger,
            softDanger: Theme.BtnSoftDanger,
            warning: Theme.BtnWarning,
            success: Theme.BtnSuccess,
            light: Theme.BtnLight,
            softLight: Theme.BtnSoftLight,
            dark: Theme.BtnDark,
        };

        const sizeMap = {
            sm: Theme.BtnSm,
            md: Theme.BtnMd,
            lg: Theme.BtnLg,
            xl: Theme.BtnXl,
            full: Theme.BtnFull,
        };

        return cn(
            Theme.Button,
            variantMap[variant],
            sizeMap[size],
            additionalClasses
        );
    }

    static getBadge(variant: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' = 'primary',
                    additionalClasses?: string): string {
        const variantMap = {
            primary: Theme.BadgePrimary,
            secondary: Theme.BadgeSecondary,
            outline: Theme.BadgeOutline,
            success: Theme.BadgeSuccess,
            warning: Theme.BadgeWarning,
            danger: Theme.BadgeDanger,
        };

        return cn(
            Theme.Badge,
            variantMap[variant],
            additionalClasses
        );
    }

    static getAlert(variant: 'primary' | 'warning' | 'danger' = 'primary',
                    additionalClasses?: string): string {
        const variantMap = {
            primary: Theme.AlertPrimary,
            warning: Theme.AlertWarning,
            danger: Theme.AlertDanger,
        };

        return cn(
            Theme.Alert,
            variantMap[variant],
            additionalClasses
        );
    }

    // Helper for combining any styles
    static combine(...styles: (string | undefined)[]): string {
        return cn(...styles);
    }
}

export default Theme;