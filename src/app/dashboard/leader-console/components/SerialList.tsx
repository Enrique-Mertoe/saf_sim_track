import {useState} from "react";
import {Check, CreditCard, ChevronLeft, ChevronRight} from "lucide-react";
import {motion} from "framer-motion";
import {badgeVariants, itemVariants} from "@/app/dashboard/leader-console/components/Design";
import Screentester from "@/app/dashboard/leader-console/Screentester";

export default function SerialList({filteredSims, selectedSims, toggleSimSelection, selectionMode}: any) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Adjust this based on your preference

    // Calculate pagination values
    const totalItems = filteredSims.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const currentItems = filteredSims.slice(startIndex, endIndex);

    // Pagination controls
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };


    return (
        <div className="flex flex-col dark:bg-gray-900">

            {/* Table body */}
            <div className="">
                {currentItems.map((sim: any, index: number) => (
                    <motion.div
                        key={sim.id}
                        className={`grid grid-cols-12 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            selectedSims.includes(sim.id) ? "bg-green-50 dark:bg-green-900/30" : ""
                        }`}
                        variants={itemVariants}
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.03 * index, duration: 0.2}}
                        // whileHover={{backgroundColor: selectedSims.includes(sim.id) ? "#e0f2f1" : "#f5f5f5"}}
                    >
                        {selectionMode === "individual" && (
                            <div className="col-span-1 p-4 flex justify-center items-center">
                                <motion.button
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        selectedSims.includes(sim.id)
                                            ? "bg-green-600 text-white dark:bg-green-500 "
                                            : "border-2 border-gray-300 dark:border-gray-600"
                                    }`}
                                    onClick={() => toggleSimSelection(sim.id)}
                                    whileHover={{scale: 1.1}}
                                    whileTap={{scale: 0.9}}
                                >
                                    {selectedSims.includes(sim.id) && <Check size={14}/>}
                                </motion.button>
                            </div>
                        )}
                        <div
                            className={`${selectionMode === "individual" ? 'col-span-11' : 'col-span-12'} p-4 flex items-center`}
                            onClick={() => selectionMode !== "individual" && toggleSimSelection(sim.id)}
                        >
                            <motion.div
                                className="flex items-center cursor-pointer"
                                whileHover={{x: 5}}
                            >
                                <CreditCard size={16} className="text-gray-500 dark:text-gray-400 mr-3"/>
                                <span className="dark:text-gray-200">{sim.serial_number}</span>

                                {selectedSims.includes(sim.id) && selectionMode !== "individual" && (
                                    <motion.div
                                        className="ml-3 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-full px-2 py-0.5 text-xs flex items-center"
                                        {...badgeVariants}
                                    >
                                        <Check size={12} className="mr-1"/> Selected
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Pagination footer */}
            <div className="mt-4 flex items-center justify-between px-2 border-t dark:border-gray-700 py-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {startIndex + 1} to {endIndex} of {totalItems} items
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className={`p-1 rounded border ${currentPage === 1 ? 'text-gray-300 dark:text-gray-600 border-gray-200 dark:border-gray-700' : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <ChevronLeft size={16}/>
                    </button>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                    </div>
                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className={`p-1 rounded border ${currentPage === totalPages ? 'text-gray-300 dark:text-gray-600 border-gray-200 dark:border-gray-700' : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <ChevronRight size={16}/>
                    </button>
                </div>
            </div>
        </div>
    );
}