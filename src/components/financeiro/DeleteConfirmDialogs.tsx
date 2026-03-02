import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogsProps {
    deleteFeeTarget: string | null;
    deleteExpenseTarget: string | null;
    onConfirmDeleteFee: () => void;
    onConfirmDeleteExpense: () => void;
    onCancelDeleteFee: () => void;
    onCancelDeleteExpense: () => void;
}

export const DeleteConfirmDialogs = ({
    deleteFeeTarget,
    deleteExpenseTarget,
    onConfirmDeleteFee,
    onConfirmDeleteExpense,
    onCancelDeleteFee,
    onCancelDeleteExpense,
}: DeleteConfirmDialogsProps) => {
    return (
        <>
            <AlertDialog open={!!deleteFeeTarget} onOpenChange={(open) => !open && onCancelDeleteFee()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Honorário</AlertDialogTitle>
                        <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onConfirmDeleteFee}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteExpenseTarget} onOpenChange={(open) => !open && onCancelDeleteExpense()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Despesa</AlertDialogTitle>
                        <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onConfirmDeleteExpense}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
