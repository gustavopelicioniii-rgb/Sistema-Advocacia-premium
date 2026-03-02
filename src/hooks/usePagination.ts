import { useState, useEffect } from "react";

interface UsePaginationResult<T> {
    page: number;
    pageCount: number;
    pageData: T[];
    totalItems: number;
    goTo: (page: number) => void;
}

/**
 * Generic client-side pagination over an already-fetched array.
 * Resets to page 0 whenever `items` reference changes (e.g. after search/filter).
 */
export function usePagination<T>(items: T[], pageSize: number): UsePaginationResult<T> {
    const [page, setPage] = useState(0);

    // Reset to first page whenever the underlying list changes
    useEffect(() => {
        setPage(0);
    }, [items]);

    const totalItems = items.length;
    const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, pageCount - 1);
    const pageData = items.slice(safePage * pageSize, (safePage + 1) * pageSize);

    const goTo = (p: number) => setPage(Math.max(0, Math.min(p, pageCount - 1)));

    return { page: safePage, pageCount, pageData, totalItems, goTo };
}
