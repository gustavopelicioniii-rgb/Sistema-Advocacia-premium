/**
 * Cron diário: monitoramento de processos via API Escavador.
 * - Consulta 1x por dia por processo (last_checked_at >= 24h).
 * - Compara movimentações com as salvas, filtra por palavras-chave, salva novas e notifica.
 *
 * Agendar: cron "0 6 * * *" (ex.: 6h todo dia) ou chamar via POST com Authorization.
 * Env: ESCAVADOR_API_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Env opcional: CRON_SECRET — se definido, exige Authorization: Bearer <CRON_SECRET>.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ESCAVADOR_BASE = "https://api.escavador.com/api/v2";
const RELEVANT_KEYWORDS = ["Sentença", "Decisão", "Decisão interlocutória", "Despacho", "Publicação", "Intimação"];
const HOURS_BETWEEN_CHECKS = 24;

/** Log estruturado para produção. */
function logStructured(
    level: "info" | "warn" | "error",
    message: string,
    meta?: { process_id?: string; process_number?: string; run_id?: string; [k: string]: unknown },
) {
    const payload = { ts: new Date().toISOString(), level, message, ...meta };
    if (level === "error") console.error(JSON.stringify(payload));
    else console.log(JSON.stringify(payload));
}

function shouldCheckProcess(lastCheckedAt: string | null): boolean {
    if (!lastCheckedAt) return true;
    const last = new Date(lastCheckedAt).getTime();
    const diffHours = (Date.now() - last) / (1000 * 60 * 60);
    return diffHours >= HOURS_BETWEEN_CHECKS;
}

function isRelevantMovement(text: string): boolean {
    if (!text || typeof text !== "string") return false;
    const n = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    return RELEVANT_KEYWORDS.some((kw) =>
        n.includes(
            kw
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase(),
        ),
    );
}

function detectMovementType(text: string): string {
    if (!text || typeof text !== "string") return "Andamento";
    const n = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    for (const kw of RELEVANT_KEYWORDS) {
        const kwNorm = kw
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
        if (n.includes(kwNorm)) return kw;
    }
    return "Andamento";
}

function normalizeNum(num: string): string {
    const c = num.replace(/\D/g, "");
    if (c.length < 20) return num.trim();
    return `${c.slice(0, 7)}-${c.slice(7, 9)}.${c.slice(9, 13)}.${c.slice(13, 14)}.${c.slice(14, 16)}.${c.slice(16, 20)}`;
}

async function fetchMovimentacoes(processNumber: string, token: string) {
    const numero = normalizeNum(processNumber);
    const url = `${ESCAVADOR_BASE}/processos/numero_cnj/${encodeURIComponent(numero)}/movimentacoes?limit=100`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            "X-Requested-With": "XMLHttpRequest",
        },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: (body as { error?: string }).error || res.statusText };
    return { data: body as { items: { id: number; data: string; tipo: string; conteudo: string }[] }, error: null };
}

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });

Deno.serve(async (req) => {
    // Validação de env vars — falha imediatamente se não configurado
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const escavadorToken = Deno.env.get("ESCAVADOR_API_TOKEN");

    if (!supabaseUrl || !serviceRoleKey) {
        logStructured("error", "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
        return json({ error: "Variáveis de ambiente Supabase não configuradas" }, 500);
    }

    if (!escavadorToken) {
        logStructured("error", "ESCAVADOR_API_TOKEN não configurado");
        return json({ error: "ESCAVADOR_API_TOKEN não configurado" }, 500);
    }

    // Verificação opcional: se CRON_SECRET estiver definido, exige no header
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret) {
        const authHeader = req.headers.get("Authorization") ?? "";
        const providedSecret = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (providedSecret !== cronSecret) {
            logStructured("warn", "Requisição não autorizada ao cron");
            return json({ error: "Não autorizado" }, 401);
        }
    }

    // Cliente criado dentro do handler — garante env vars válidos no momento do uso
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const runId = crypto.randomUUID();
    logStructured("info", "process-monitor-cron iniciado", { run_id: runId });
    const now = new Date().toISOString();

    const { data: processos } = await supabase
        .from("processos")
        .select("id, number, last_checked_at, owner_id, last_movement")
        .not("number", "is", null);

    if (!processos?.length) {
        logStructured("info", "Nenhum processo para monitorar", { run_id: runId, total_processos: 0 });
        return json({ ok: true, message: "Nenhum processo para monitorar", processed: 0 }, 200);
    }

    const toCheck = processos.filter((p: { last_checked_at: string | null }) => shouldCheckProcess(p.last_checked_at));
    logStructured("info", "Processos elegíveis para consulta", {
        run_id: runId,
        total: processos.length,
        to_check: toCheck.length,
    });
    let consultasOk = 0;
    let atualizacoesEncontradas = 0;
    const errors: { process_number: string; error: string }[] = [];

    for (const proc of toCheck) {
        const { data, error } = await fetchMovimentacoes(proc.number, escavadorToken);

        await supabase.from("process_monitor_logs").insert({
            process_id: proc.id,
            process_number: proc.number,
            log_type: error ? "erro_api" : "consulta_realizada",
            message: error || "Consulta realizada",
            details: error ? { error } : { items_count: data?.items?.length ?? 0 },
            owner_id: proc.owner_id,
        });

        if (error) {
            logStructured("error", "Erro API Escavador", {
                run_id: runId,
                process_id: proc.id,
                process_number: proc.number,
                error,
            });
            errors.push({ process_number: proc.number, error });
            continue;
        }
        logStructured("info", "Consulta realizada", {
            run_id: runId,
            process_id: proc.id,
            process_number: proc.number,
            items_count: data?.items?.length ?? 0,
        });
        consultasOk += 1;

        const items = data?.items ?? [];
        const { data: lastMovements } = await supabase
            .from("process_movements")
            .select("movement_date, external_id")
            .eq("process_id", proc.id)
            .order("movement_date", { ascending: false })
            .limit(1);
        const lastSaved = lastMovements?.[0];
        const lastDate = lastSaved?.movement_date ?? null;
        const lastExternalId = lastSaved?.external_id ?? 0;

        const newRelevant: { id: number; data: string; tipo: string; conteudo: string }[] = [];
        for (const item of items) {
            const itemDate = item.data;
            const isNewer = !lastDate || itemDate > lastDate || (itemDate === lastDate && item.id > lastExternalId);
            if (!isNewer) break;
            if (isRelevantMovement(item.conteudo)) newRelevant.push(item);
        }

        if (newRelevant.length > 0) {
            logStructured("info", "Atualização encontrada", {
                run_id: runId,
                process_id: proc.id,
                process_number: proc.number,
                count: newRelevant.length,
            });
            atualizacoesEncontradas += 1;
            for (const mov of newRelevant) {
                await supabase.from("process_movements").insert({
                    process_id: proc.id,
                    process_number: proc.number,
                    movement_date: mov.data,
                    movement_type: detectMovementType(mov.conteudo),
                    full_text: mov.conteudo,
                    is_relevant: true,
                    external_id: mov.id,
                    owner_id: proc.owner_id,
                });
            }
            const latest = newRelevant[0];
            await supabase
                .from("processos")
                .update({
                    last_movement: latest.conteudo.slice(0, 500),
                    last_checked_at: now,
                    updated_at: now,
                })
                .eq("id", proc.id);

            if (proc.owner_id) {
                await supabase.from("inbox_items").insert({
                    tipo: "Andamento",
                    titulo: `Nova movimentação relevante: ${proc.number}`,
                    descricao: `${newRelevant.length} nova(s) movimentação(ões): ${latest.conteudo.slice(0, 120)}${latest.conteudo.length > 120 ? "…" : ""}`,
                    referencia_id: proc.id,
                    lido: false,
                    prioridade: "Alta",
                    owner_id: proc.owner_id,
                });
            }

            await supabase.from("process_monitor_logs").insert({
                process_id: proc.id,
                process_number: proc.number,
                log_type: "atualizacao_encontrada",
                message: `${newRelevant.length} nova(s) movimentação(ões) relevante(s)`,
                details: { count: newRelevant.length, types: newRelevant.map((m) => detectMovementType(m.conteudo)) },
                owner_id: proc.owner_id,
            });
        } else {
            await supabase
                .from("processos")
                .update({
                    last_checked_at: now,
                    updated_at: now,
                })
                .eq("id", proc.id);
        }

        if (proc.owner_id) {
            await supabase.from("inbox_items").insert({
                tipo: "Sistema",
                titulo: `Consulta processo ${proc.number}`,
                descricao:
                    newRelevant.length > 0
                        ? `${newRelevant.length} nova(s) movimentação(ões) relevante(s) encontrada(s).`
                        : "Consulta realizada. Nenhuma movimentação nova relevante.",
                referencia_id: proc.id,
                lido: false,
                prioridade: newRelevant.length > 0 ? "Alta" : "Normal",
                owner_id: proc.owner_id,
            });
        }
    }

    logStructured("info", "process-monitor-cron concluído", {
        run_id: runId,
        processed: toCheck.length,
        consultas_ok: consultasOk,
        atualizacoes_encontradas: atualizacoesEncontradas,
        errors_count: errors.length,
    });
    if (errors.length > 0) {
        logStructured("warn", "Erros de API por processo", { run_id: runId, errors });
    }
    return json(
        {
            ok: true,
            processed: toCheck.length,
            consultas_ok: consultasOk,
            atualizacoes_encontradas: atualizacoesEncontradas,
            errors: errors.length ? errors : undefined,
        },
        200,
    );
});
