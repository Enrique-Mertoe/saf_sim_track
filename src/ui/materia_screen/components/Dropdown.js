import React, {useEffect, useRef, useState} from 'react';

// Reusable Dropdown Component
const Dropdown = ({
                      trigger,
                      options = [],
                      onSelect,
                      className = '',
                      dropdownClassName = '',
                      position = 'bottom-left',
                      offset = { x: 0, y: 4 },
                      closeOnSelect = true,
                      disabled = false,
                      maxHeight = '200px',
                      zIndex = 50,
                      ...props
                  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({});
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    // Calculate dynamic positioning
    const calculatePosition = () => {
        if (!triggerRef.current || !dropdownRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const dropdownRect = dropdownRef.current.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let top, left;

        // Determine vertical position
        if (position.includes('top')) {
            top = -dropdownRect.height - offset.y;
        } else {
            top = triggerRect.height + offset.y;
        }

        // Determine horizontal position
        if (position.includes('right')) {
            left = triggerRect.width - dropdownRect.width + offset.x;
        } else if (position.includes('center')) {
            left = (triggerRect.width - dropdownRect.width) / 2 + offset.x;
        } else {
            left = offset.x;
        }

        // Adjust if dropdown would go outside viewport
        const absoluteLeft = triggerRect.left + left;
        const absoluteTop = triggerRect.top + top;

        if (absoluteLeft + dropdownRect.width > viewport.width) {
            left = viewport.width - triggerRect.left - dropdownRect.width - 8;
        }
        if (absoluteLeft < 0) {
            left = -triggerRect.left + 8;
        }
        if (absoluteTop + dropdownRect.height > viewport.height && absoluteTop > dropdownRect.height) {
            top = -dropdownRect.height - offset.y;
        }

        setDropdownPosition({ top, left });
    };

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                triggerRef.current &&
                dropdownRef.current &&
                !triggerRef.current.contains(event.target) &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('scroll', calculatePosition, true);
            window.addEventListener('resize', calculatePosition);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', calculatePosition, true);
            window.removeEventListener('resize', calculatePosition);
        };
    }, [isOpen]);

    // Calculate position when dropdown opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(calculatePosition, 0);
        }
    }, [isOpen]);

    const handleTriggerClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const handleOptionClick = (option, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (onSelect) {
            onSelect(option, e);
        }

        if (closeOnSelect) {
            setIsOpen(false);
        }
    };

    return (
        <div className={`relative inline-block ${className}`} {...props}>
            {/* Trigger */}
            <div
                ref={triggerRef}
                onClick={handleTriggerClick}
                className={disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            >
                {trigger}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className={`absolute bg-white border border-gray-200 rounded-md shadow-lg min-w-full ${dropdownClassName}`}
                    style={{
                        ...dropdownPosition,
                        zIndex,
                        maxHeight,
                        overflowY: 'auto'
                    }}
                >
                    {options.map((option, index) => (
                        <div
                            key={option.key || option.value || index}
                            onClick={(e) => handleOptionClick(option, e)}
                            className={`
                                px-3 py-2 cursor-pointer transition-colors duration-150
                                hover:bg-gray-100 flex items-center gap-2
                                ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                ${index === 0 ? 'rounded-t-md' : ''}
                                ${index === options.length - 1 ? 'rounded-b-md' : 'border-b border-gray-100'}
                                ${option.className || ''}
                            `}
                        >
                            {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                            <span className="flex-grow">{option.label}</span>
                            {option.badge && (
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                                    {option.badge}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};



// Usage Example (replace your existing button with this)
/*
<ScanButton
    showModal={showModal}
    filteredUnassigned={filteredUnassigned}
    setSelectedSims={setSelectedSims}
    alert={alert}
    Theme={Theme}
    BarcodeScanner={BarcodeScanner}
    className="ms-auto"
/>
*/

export default Dropdown;