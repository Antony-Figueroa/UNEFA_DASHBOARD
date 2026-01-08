import React from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    itemsPerPageOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = [5, 10, 25, 50],
}) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    if (totalItems === 0) return null;

    return (
        <div className="p-4 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between sm:justify-start gap-4 order-2 sm:order-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Mostrando <span className="font-medium text-gray-800 dark:text-white">{totalItems > 0 ? startIndex + 1 : 0}</span> a{" "}
                    <span className="font-medium text-gray-800 dark:text-white">{endIndex}</span> de{" "}
                    <span className="font-medium text-gray-800 dark:text-white">{totalItems}</span>
                </p>
                <div className="flex items-center gap-2">
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            onItemsPerPageChange(Number(e.target.value));
                        }}
                        className="text-xs sm:text-sm rounded-lg border border-gray-300 bg-transparent py-1 px-2 text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                        {itemsPerPageOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-center gap-1 order-1 sm:order-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg disabled:opacity-30 transition-colors min-h-11 min-w-11 flex items-center justify-center"
                    aria-label="Página anterior"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center px-4 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Página {currentPage} de {totalPages}
                </div>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg disabled:opacity-30 transition-colors min-h-11 min-w-11 flex items-center justify-center"
                    aria-label="Página siguiente"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
