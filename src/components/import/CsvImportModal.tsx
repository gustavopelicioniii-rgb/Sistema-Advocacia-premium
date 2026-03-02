import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { parseCSV, parseNumber, parseDate } from "@/lib/csvParser";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

interface CsvImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: "fees" | "processos" | "crm_clients";
}

const FIELD_OPTIONS: Record<string, { label: string; fields: { value: string; label: string }[] }> = {
    fees: {
        label: "Honorários",
        fields: [
            { value: "__skip__", label: "— Ignorar —" },
            { value: "client", label: "Cliente" },
            { value: "process_number", label: "Nº Processo" },
            { value: "description", label: "Descrição" },
            { value: "value", label: "Valor (R$)" },
            { value: "status", label: "Status" },
            { value: "due_date", label: "Vencimento" },
            { value: "paid_date", label: "Data Pagamento" },
        ],
    },
    processos: {
        label: "Processos",
        fields: [
            { value: "__skip__", label: "— Ignorar —" },
            { value: "number", label: "Número" },
            { value: "client", label: "Cliente" },
            { value: "court", label: "Tribunal" },
            { value: "class", label: "Classe" },
            { value: "subject", label: "Assunto" },
            { value: "active_party", label: "Parte Ativa" },
            { value: "passive_party", label: "Parte Passiva" },
            { value: "responsible", label: "Responsável" },
            { value: "phase", label: "Fase" },
            { value: "status", label: "Status" },
            { value: "next_deadline", label: "Próximo Prazo" },
            { value: "value", label: "Valor da Causa" },
        ],
    },
    crm_clients: {
        label: "Clientes CRM",
        fields: [
            { value: "__skip__", label: "— Ignorar —" },
            { value: "name", label: "Nome" },
            { value: "email", label: "Email" },
            { value: "phone", label: "Telefone" },
            { value: "source", label: "Origem" },
            { value: "notes", label: "Observações" },
        ],
    },
};

export default function CsvImportModal({ open, onOpenChange, type }: CsvImportModalProps) {
    const { toast } = useToast();
    const qc = useQueryClient();
    const fileRef = useRef<HTMLInputElement>(null);

    const [rows, setRows] = useState<Record<string, string>[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

    const config = FIELD_OPTIONS[type];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const parsed = parseCSV(text);
            if (parsed.length === 0) {
                toast({ title: "Arquivo vazio ou formato inválido", variant: "destructive" });
                return;
            }
            const csvHeaders = Object.keys(parsed[0]);
            setHeaders(csvHeaders);
            setRows(parsed);
            setResult(null);

            // Auto-map headers by name similarity
            const autoMap: Record<string, string> = {};
            csvHeaders.forEach((h) => {
                const lower = h
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "");
                const match = config.fields.find((f) => {
                    const fLower = f.label
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "");
                    return lower.includes(fLower) || fLower.includes(lower) || f.value === lower;
                });
                autoMap[h] = match?.value ?? "__skip__";
            });
            setMapping(autoMap);
        };
        reader.readAsText(file, "utf-8");
    };

    const handleImport = async () => {
        setImporting(true);
        let success = 0;
        let errors = 0;

        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Build records from mapping
        const records = rows.map((row) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const record: Record<string, any> = {};

            for (const [csvHeader, dbField] of Object.entries(mapping)) {
                if (dbField === "__skip__") continue;
                const rawValue = row[csvHeader] ?? "";

                if (dbField === "value") {
                    record[dbField] = parseNumber(rawValue);
                } else if (["due_date", "paid_date", "next_deadline"].includes(dbField)) {
                    record[dbField] = parseDate(rawValue);
                } else {
                    record[dbField] = rawValue;
                }
            }

            // Defaults
            if (type === "fees") {
                if (!record.client) record.client = "Importado";
                if (!record.status) record.status = "Pendente";
                record.owner_id = user?.id ?? null;
            } else if (type === "processos") {
                if (!record.number) record.number = "Importado";
                if (!record.client) record.client = "Importado";
                if (!record.court) record.court = "Importado";
                if (!record.status) record.status = "Em andamento";
                record.owner_id = user?.id ?? null;
            } else if (type === "crm_clients") {
                if (!record.name) record.name = "Importado";
                record.owner_id = user?.id ?? null;
            }

            return record;
        });

        // For CRM clients, we need a stage_id
        if (type === "crm_clients") {
            const { data: stages } = await supabase.from("crm_stages").select("id").order("position").limit(1);
            const firstStageId = stages?.[0]?.id;
            if (!firstStageId) {
                toast({ title: "Crie pelo menos uma coluna no CRM antes de importar", variant: "destructive" });
                setImporting(false);
                return;
            }
            records.forEach((r, i) => {
                r.stage_id = firstStageId;
                r.position = i;
            });
        }

        // Batch insert (chunks of 50)
        const chunkSize = 50;
        for (let i = 0; i < records.length; i += chunkSize) {
            const chunk = records.slice(i, i + chunkSize);
            const { error } = await supabase.from(type === "crm_clients" ? "crm_clients" : type).insert(chunk);
            if (error) {
                errors += chunk.length;
                logger.captureException(error, { component: "CsvImportModal", action: "import", type });
            } else {
                success += chunk.length;
            }
        }

        setResult({ success, errors });
        setImporting(false);
        qc.invalidateQueries({ queryKey: [type === "crm_clients" ? "crm_clients" : type] });
        if (success > 0) {
            toast({ title: `${success} registros importados com sucesso!` });
        }
    };

    const handleClose = () => {
        setRows([]);
        setHeaders([]);
        setMapping({});
        setResult(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Importar {config.label} via CSV
                    </DialogTitle>
                </DialogHeader>

                {rows.length === 0 ? (
                    <div className="space-y-4">
                        <div
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 cursor-pointer hover:border-accent/50 hover:bg-muted/50 transition-all"
                            onClick={() => fileRef.current?.click()}
                        >
                            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-sm font-medium text-foreground">Clique para selecionar um arquivo CSV</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Formatos aceitos: .csv, .txt (separado por vírgula ou ponto-e-vírgula)
                            </p>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv,.txt,.tsv"
                            className="hidden"
                            onChange={handleFileSelect}
                        />

                        <div className="rounded-lg border border-border p-4 bg-muted/30">
                            <p className="text-sm font-medium mb-2">💡 Dicas:</p>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                <li>A primeira linha deve conter os cabeçalhos (nomes das colunas)</li>
                                <li>
                                    Valores monetários podem estar no formato brasileiro (1.234,56) ou inglês (1234.56)
                                </li>
                                <li>Datas podem estar em dd/mm/aaaa ou aaaa-mm-dd</li>
                                <li>Exporte do Excel salvando como "CSV UTF-8"</li>
                            </ul>
                        </div>
                    </div>
                ) : result ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                        {result.errors === 0 ? (
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        ) : (
                            <AlertCircle className="h-16 w-16 text-yellow-500" />
                        )}
                        <div>
                            <p className="text-xl font-bold text-foreground">{result.success} registros importados</p>
                            {result.errors > 0 && (
                                <p className="text-sm text-destructive mt-1">{result.errors} registros com erro</p>
                            )}
                        </div>
                        <Button onClick={handleClose}>Fechar</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Column mapping */}
                        <div>
                            <p className="text-sm font-medium text-foreground mb-3">
                                Mapeie as colunas do seu CSV para os campos do sistema:
                            </p>
                            <div className="grid gap-2">
                                {headers.map((h) => (
                                    <div key={h} className="flex items-center gap-3">
                                        <Badge
                                            variant="outline"
                                            className="min-w-[140px] justify-center font-mono text-xs"
                                        >
                                            {h}
                                        </Badge>
                                        <span className="text-muted-foreground">→</span>
                                        <Select
                                            value={mapping[h] ?? "__skip__"}
                                            onValueChange={(v) => setMapping((prev) => ({ ...prev, [h]: v }))}
                                        >
                                            <SelectTrigger className="w-48">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {config.fields.map((f) => (
                                                    <SelectItem key={f.value} value={f.value}>
                                                        {f.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div>
                            <p className="text-sm font-medium text-foreground mb-2">
                                Pré-visualização ({rows.length} registros):
                            </p>
                            <div className="max-h-[200px] overflow-auto rounded-lg border border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {headers
                                                .filter((h) => mapping[h] !== "__skip__")
                                                .map((h) => (
                                                    <TableHead key={h} className="text-xs whitespace-nowrap">
                                                        {mapping[h]}
                                                    </TableHead>
                                                ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.slice(0, 5).map((row, i) => (
                                            <TableRow key={i}>
                                                {headers
                                                    .filter((h) => mapping[h] !== "__skip__")
                                                    .map((h) => (
                                                        <TableCell key={h} className="text-xs">
                                                            {row[h]}
                                                        </TableCell>
                                                    ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {rows.length > 5 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Mostrando 5 de {rows.length} registros...
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button onClick={handleImport} disabled={importing}>
                                {importing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Importando {rows.length} registros...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Importar {rows.length} Registros
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
