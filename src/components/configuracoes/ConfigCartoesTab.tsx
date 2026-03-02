import { CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ConfigCartoesTab() {
    return (
        <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium text-foreground">Cartões</p>
                <p className="text-sm">Em breve. Você poderá cadastrar e gerenciar cartões aqui.</p>
            </CardContent>
        </Card>
    );
}
