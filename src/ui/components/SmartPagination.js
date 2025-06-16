const designs = {
    default: {
        container: "relative z-0 inline-flex items-center rounded-md shadow-sm",
        button: "relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium transition-all duration-200 ease-in-out",
        buttonDisabled: "text-gray-300 cursor-not-allowed",
        buttonEnabled: "text-gray-500 hover:bg-gray-50",
        prevButton: "rounded-l-md",
        nextButton: "rounded-r-md",
        pageDisplay: "relative inline-flex items-center px-4 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium text-gray-700"
    },

    modern: {
        container: "relative z-0 inline-flex items-center gap-2",
        button: "relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out",
        buttonDisabled: "text-gray-400 cursor-not-allowed bg-gray-100",
        buttonEnabled: "text-gray-700 hover:bg-blue-50 hover:text-blue-600 bg-white shadow-sm border border-gray-200",
        prevButton: "",
        nextButton: "",
        pageDisplay: "relative inline-flex items-center px-4 py-2 rounded-lg bg-blue-50 text-sm font-medium text-blue-700 border border-blue-200"
    },

    minimal: {
        container: "relative z-0 inline-flex items-center gap-4",
        button: "relative inline-flex items-center px-2 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
        buttonDisabled: "text-gray-300 cursor-not-allowed",
        buttonEnabled: "text-gray-600 hover:text-gray-900",
        prevButton: "",
        nextButton: "",
        pageDisplay: "relative inline-flex items-center px-3 py-1 text-sm font-medium text-gray-600"
    },

    dark: {
        container: "relative z-0 inline-flex items-center rounded-md",
        button: "relative inline-flex items-center px-3 py-2 border border-gray-600 bg-gray-800 text-sm font-medium transition-all duration-200 ease-in-out",
        buttonDisabled: "text-gray-500 cursor-not-allowed",
        buttonEnabled: "text-gray-300 hover:bg-gray-700",
        prevButton: "rounded-l-md",
        nextButton: "rounded-r-md",
        pageDisplay: "relative inline-flex items-center px-4 py-2 border-t border-b border-gray-600 bg-gray-800 text-sm font-medium text-gray-200"
    },

    rounded: {
        container: "relative z-0 inline-flex items-center gap-1",
        button: "relative inline-flex items-center px-3 py-2 rounded-full border text-sm font-medium transition-all duration-200 ease-in-out",
        buttonDisabled: "text-gray-400 cursor-not-allowed border-gray-200 bg-gray-50",
        buttonEnabled: "text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border-gray-300 bg-white",
        prevButton: "",
        nextButton: "",
        pageDisplay: "relative inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-sm font-medium text-indigo-700 border border-indigo-200"
    },

    gradient: {
        container: "relative z-0 inline-flex items-center gap-2",
        button: "relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out",
        buttonDisabled: "text-gray-400 cursor-not-allowed bg-gray-100",
        buttonEnabled: "text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-sm",
        prevButton: "",
        nextButton: "",
        pageDisplay: "relative inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 text-sm font-medium text-white shadow-sm"
    }
};

// Simple Pagination Component with customizable designs
export const SmartPagination = ({
                                     currentPage,
                                     totalPages,
                                     onPageChange,
                                     design = "default",
                                     className = ""
                                 }) => {
    if (totalPages <= 1) return null;

    const styles = designs[design] || designs.default;

    return (
        <nav className={`${styles.container} ${className}`} aria-label="Pagination">
            {/* Previous Button */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`${styles.button} ${styles.prevButton} ${
                    currentPage === 1 ? styles.buttonDisabled : styles.buttonEnabled
                }`}
            >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            </button>

            {/* Page Display */}
            <div className={styles.pageDisplay}>
                Page {currentPage} of {totalPages}
            </div>

            {/* Next Button */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`${styles.button} ${styles.nextButton} ${
                    currentPage === totalPages ? styles.buttonDisabled : styles.buttonEnabled
                }`}
            >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
            </button>
        </nav>
    );
};