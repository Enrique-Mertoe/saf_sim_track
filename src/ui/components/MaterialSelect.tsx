import React, {useState, useRef, useEffect} from 'react';
import {ChevronDown, Check, X} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';

// Type definitions
type OptionType = string | number | boolean;

type ObjectOptionType = {
    [key: string]: any;
};

type SelectProps = {
    // Required props
    options: OptionType[] | ObjectOptionType[];
    onChange?: (value: any) => void;

    // Configuration for object options
    valueKey?: string;
    displayKey?: string;

    // Value transformation
    onTransformDisplay?: (value: any) => any;

    // Initial value
    defaultValue?: any;
    value?: any;

    // Styling props
    width?: string;
    height?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'soft';
    size?: 'sm' | 'md' | 'lg';
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    disabled?: boolean;
    error?: boolean;
    placeholder?: string;
    clearable?: boolean;

    // Dropdown positioning
    dropdownPosition?: 'auto' | 'top' | 'bottom';

    // Animation options
    animation?: 'fade' | 'scale' | 'slide' | 'none';
    animationDuration?: number;

    // Custom class names
    className?: string;
    dropdownClassName?: string;
    optionClassName?: string;
};

export default function MaterialSelect({
                                           options,
                                           onChange,
                                           valueKey = 'value',
                                           displayKey = 'label',
                                           onTransformDisplay,
                                           defaultValue,
                                           value,
                                           width = '100%',
                                           height,
                                           variant = 'default',
                                           size = 'md',
                                           rounded = 'md',
                                           disabled = false,
                                           error = false,
                                           placeholder = 'Select an option',
                                           clearable = false,
                                           dropdownPosition = 'auto',
                                           animation = 'fade',
                                           animationDuration = 0.2,
                                           className = '',
                                           dropdownClassName = '',
                                           optionClassName = '',
                                       }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<any>(value || defaultValue || null);
    const [dropdownPlacement, setDropdownPlacement] = useState<'top' | 'bottom'>('bottom');
    const selectRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Update selected value when value prop changes
    useEffect(() => {
        if (value !== undefined) {
            setSelectedValue(value);
        }
    }, [value]);

    // Calculate dropdown position when opened
    useEffect(() => {
        if (!isOpen || !selectRef.current || dropdownPosition !== 'auto') {
            return;
        }

        const calculatePosition = () => {
            const selectRect = selectRef.current?.getBoundingClientRect();
            if (!selectRect) return;

            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - selectRect.bottom;
            const dropdownHeight = dropdownRef.current?.offsetHeight || 300; // Default height estimation

            // If there's not enough space below and more space above, show dropdown above
            if (spaceBelow < dropdownHeight && selectRect.top > dropdownHeight) {
                setDropdownPlacement('top');
            } else {
                setDropdownPlacement('bottom');
            }
        };

        calculatePosition();

        // Recalculate on window resize
        window.addEventListener('resize', calculatePosition);
        return () => {
            window.removeEventListener('resize', calculatePosition);
        };
    }, [isOpen, dropdownPosition]);

    // Helper to determine if options are objects or primitives
    const isObjectOptions = options.length > 0 && typeof options[0] === 'object';

    // Get animation variants based on dropdown placement and animation type
    const getAnimationVariants = () => {
        const fromTop = dropdownPlacement === 'top' || dropdownPosition === 'top';

        switch (animation) {
            case 'fade':
                return {
                    hidden: {opacity: 0},
                    visible: {opacity: 1}
                };
            case 'scale':
                return {
                    hidden: {opacity: 0, scale: 0.95, transformOrigin: fromTop ? 'bottom' : 'top'},
                    visible: {opacity: 1, scale: 1, transformOrigin: fromTop ? 'bottom' : 'top'}
                };
            case 'slide':
                return {
                    hidden: {opacity: 0, y: fromTop ? 10 : -10},
                    visible: {opacity: 1, y: 0}
                };
            case 'none':
            default:
                return {
                    hidden: {},
                    visible: {}
                };
        }
    };
    const getDisplayValue = (option: any): string => {
        let displayValue: any;

        if (isObjectOptions) {
            const keys = displayKey.split(",").map(k => k.trim());
            displayValue = keys.map(key => option[key] || "").join(" - ");
        } else {
            displayValue = option;
        }

        if (onTransformDisplay) {
            return onTransformDisplay(displayValue);
        }

        return String(displayValue);
    };
    // Helper to get value
    const getValue = (option: any): any => {
        if (isObjectOptions) {
            return option[valueKey];
        }
        return option;
    };

    // Find selected option object
    const getSelectedOption = () => {
        if (selectedValue === null) return null;

        return options.find((option: any) => {
            const value = isObjectOptions ? option[valueKey] : option;
            return value === selectedValue;
        });
    };

    // Handle option selection
    const handleSelect = (option: any) => {
        const value = getValue(option);
        setSelectedValue(value);
        onChange?.(value);
        setIsOpen(false);
    };

    // Handle clear selection
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedValue(null);
        onChange?.(null);
    };

    // Compute dynamic class names based on props
    const getContainerClasses = () => {
        const baseClasses = "relative";
        const widthClass = width ? "" : "w-full";
        const disabledClass = disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer";

        return `${baseClasses} ${widthClass} ${disabledClass} ${className}`;
    };

    const getTriggerClasses = () => {
        const baseClasses = "flex items-center justify-between w-full overflow-hidden";

        // Height classes
        let heightClass = "h-10"; // Default height
        if (height) {
            heightClass = "";
        } else if (size === 'sm') {
            heightClass = "h-8";
        } else if (size === 'lg') {
            heightClass = "h-12";
        }

        // Border radius classes
        let roundedClass = "rounded-md";
        if (rounded === 'none') roundedClass = "";
        if (rounded === 'sm') roundedClass = "rounded";
        if (rounded === 'lg') roundedClass = "rounded-lg";
        if (rounded === 'full') roundedClass = "rounded-full";

        // Variant classes
        let variantClass = "border border-gray-300 bg-white";
        if (variant === 'outline') variantClass = "border border-gray-300 bg-transparent";
        if (variant === 'ghost') variantClass = "bg-transparent hover:bg-gray-100";
        if (variant === 'soft') variantClass = "bg-gray-100 border-none";

        // Error state
        if (error) {
            variantClass = "border border-red-500";
        }

        return `${baseClasses} ${heightClass} ${roundedClass} ${variantClass} px-3 focus:outline-none focus:ring-2 focus:ring-blue-500`;
    };

    const getDropdownClasses = () => {
        const baseClasses = "absolute z-50 w-full bg-white border border-gray-300 shadow-lg";

        // Border radius classes
        let roundedClass = "rounded-md";
        if (rounded === 'none') roundedClass = "";
        if (rounded === 'sm') roundedClass = "rounded";
        if (rounded === 'lg') roundedClass = "rounded-lg";

        // Position classes
        let positionClass = "";

        // Apply forced position from props
        if (dropdownPosition === 'top') {
            positionClass = "bottom-full mb-1";
        } else if (dropdownPosition === 'bottom') {
            positionClass = "top-full mt-1";
        } else {
            // Auto position based on calculation
            positionClass = dropdownPlacement === 'top' ? "bottom-full mb-1" : "top-full mt-1";
        }

        return `${baseClasses} ${roundedClass} ${positionClass} max-h-60 overflow-auto scrollbar-thin scrollbar-track-rounded-full ${dropdownClassName}`;
    };

    const getOptionClasses = (isSelected: boolean) => {
        const baseClasses = "flex items-center justify-between px-3 py-2 cursor-pointer";
        const selectedClass = isSelected ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100";

        // Size classes
        let sizeClass = "text-sm";
        if (size === 'sm') sizeClass = "text-xs py-1";
        if (size === 'lg') sizeClass = "text-base py-3";

        return `${baseClasses} ${selectedClass} ${sizeClass} ${optionClassName}`;
    };

    const selectedOption = getSelectedOption();
    const displayText = selectedOption ? getDisplayValue(selectedOption) : placeholder;

    return (
        <div
            ref={selectRef}
            className={getContainerClasses()}
            style={{width}}
        >
            <div
                className={getTriggerClasses()}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{height: height || undefined}}
            >
                <div className="truncate">
                    {selectedValue !== null ? (
                        <span className={selectedValue === null ? "text-gray-400" : ""}>{displayText}</span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center space-x-1">
                    {clearable && selectedValue !== null && (
                        <motion.button
                            type="button"
                            onClick={handleClear}
                            className="p-1 rounded-full hover:bg-gray-200"
                            whileHover={{scale: 1.1}}
                            whileTap={{scale: 0.95}}
                        >
                            <X size={16}/>
                        </motion.button>
                    )}
                    <motion.div
                        animate={{rotate: isOpen ? 180 : 0}}
                        transition={{duration: 0.2}}
                    >
                        <ChevronDown size={18}/>
                    </motion.div>
                </div>
            </div>

            {/* Dropdown Menu with Animations */}
            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        ref={dropdownRef}
                        className={getDropdownClasses()}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={getAnimationVariants()}
                        transition={{duration: animationDuration}}
                    >
                        {options.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
                        ) : (
                            options.map((option: any, index: number) => {
                                const value = getValue(option);
                                const isSelected = value === selectedValue;

                                return (
                                    <motion.div
                                        key={index}
                                        className={getOptionClasses(isSelected)}
                                        onClick={() => handleSelect(option)}
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        transition={{delay: index * 0.03}}
                                    >
                                        <div className="truncate">{getDisplayValue(option)}</div>
                                        {isSelected && <Check size={16}/>}
                                    </motion.div>
                                );
                            })
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}