import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TablePaginationProps {
    page: number;
    pageCount: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export function TablePagination({ page, pageCount, totalItems, pageSize, onPageChange }: TablePaginationProps) {
    if (totalItems === 0) return null;

    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, totalItems);

    return (
        <div className="flex items-center justify-between px-1 py-3 border-t">
            <p className="text-sm text-muted-foreground">
                Exibindo {start}–{end} de {totalItems}
            </p>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 0}>
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                </Button>
                <span className="text-sm text-muted-foreground min-w-[90px] text-center">
                    Página {page + 1} de {pageCount}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= pageCount - 1}
                >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
