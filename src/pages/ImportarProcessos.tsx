import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProcessoImporter } from "@/components/ProcessoImporter";

/**
 * Página dedicada para importar processos via API Escavador.
 *
 * Utiliza o componente ProcessoImporter que internamente
 * chama a Edge Function `importar-processos` no Supabase.
 *
 * Rota: /processos/importar
 */
const ImportarProcessos = () => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header com navegacao de volta */}
            <div className="flex items-center gap-4">
                <Link to="/processos">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">Importar Processos</h1>
                    <p className="mt-1 text-muted-foreground">
                        Importe processos automaticamente da API Escavador usando seu numero OAB.
                    </p>
                </div>
            </div>

            {/* Componente principal de importacao */}
            <div className="max-w-2xl">
                <ProcessoImporter />
            </div>
        </motion.div>
    );
};

export default ImportarProcessos;
