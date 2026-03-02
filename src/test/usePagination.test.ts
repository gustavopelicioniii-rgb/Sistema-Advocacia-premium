import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePagination } from "@/hooks/usePagination";

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("usePagination", () => {
    describe("pageData slicing", () => {
        it("returns first page when page=0", () => {
            const items = range(50);
            const { result } = renderHook(() => usePagination(items, 20));
            expect(result.current.pageData).toEqual(range(20));
            expect(result.current.page).toBe(0);
        });

        it("returns last partial page correctly", () => {
            const items = range(25);
            const { result } = renderHook(() => usePagination(items, 20));
            act(() => result.current.goTo(1));
            expect(result.current.pageData).toEqual([21, 22, 23, 24, 25]);
        });

        it("returns all items when count <= pageSize", () => {
            const items = range(5);
            const { result } = renderHook(() => usePagination(items, 20));
            expect(result.current.pageData).toEqual(items);
            expect(result.current.pageCount).toBe(1);
        });

        it("handles empty list", () => {
            const { result } = renderHook(() => usePagination([], 20));
            expect(result.current.pageData).toEqual([]);
            expect(result.current.totalItems).toBe(0);
            expect(result.current.pageCount).toBe(1); // min 1 to avoid division by 0
        });
    });

    describe("pageCount", () => {
        it("computes exact division correctly", () => {
            const { result } = renderHook(() => usePagination(range(40), 20));
            expect(result.current.pageCount).toBe(2);
        });

        it("rounds up when not divisible", () => {
            const { result } = renderHook(() => usePagination(range(21), 20));
            expect(result.current.pageCount).toBe(2);
        });
    });

    describe("goTo", () => {
        it("advances to next page", () => {
            // stable reference — prevents useEffect reset on re-render
            const items = range(50);
            const { result } = renderHook(() => usePagination(items, 20));
            act(() => result.current.goTo(1));
            expect(result.current.page).toBe(1);
            expect(result.current.pageData[0]).toBe(21);
        });

        it("clamps below 0", () => {
            const items = range(50);
            const { result } = renderHook(() => usePagination(items, 20));
            act(() => result.current.goTo(-5));
            expect(result.current.page).toBe(0);
        });

        it("clamps above last page", () => {
            const items = range(50);
            const { result } = renderHook(() => usePagination(items, 20));
            act(() => result.current.goTo(999));
            expect(result.current.page).toBe(2); // pageCount=3, last=2
        });
    });

    describe("totalItems", () => {
        it("reflects the full list length", () => {
            const { result } = renderHook(() => usePagination(range(37), 20));
            expect(result.current.totalItems).toBe(37);
        });
    });
});
