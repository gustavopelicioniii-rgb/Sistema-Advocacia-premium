/**
 * Edge Function: escavador-callback
 * Webhook receiver para callbacks da API v2 do Escavador.
 *
 * Fluxo:
 * 1. Escavador envia POST quando finaliza atualização de um processo
 * 2. Valida Authorization header contra ESCAVADOR_CALLBACK_TOKEN
 * 3. Registra em escavador_callback_logs
 * 4. Se SUCESSO: extrai movimentações, compara hash, insere novas, notifica
 * 5. Se ERRO: registra e alerta
 * 6. Retorna 200 (Escavador espera 2xx)
 *
 * Env: ESCAVADOR_CALLBACK_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Deploy: supabase functions deploy escavador-callback --no-verify-jwt
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RELEVANT_KEYWORDS = ["Sentença", "Decisão", "Decisão interlocutória", "Despacho", "Publicação", "Intimação"];

// Rate limit: máximo 100 callbacks/minuto
const rateLimitWindow = 60_000;
let rateLimitCount = 0;
let rateLimitResetAt = Date.now() + rateLimitWindow;

function checkRateLimit(): boolean {
    const now = Date.now();
    if (now > rateLimitResetAt) {
        rateLimitCount = 0;
        rateLimitResetAt = now + rateLimitWindow;
    }
    rateLimitCount++;
    return rateLimitCount <= 100;
}

function logStructured(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) {
    const payload = { ts: new Date().toISOString(), level, fn: "escavador-callback", message, ...meta };
    if (level === "error") console.error(JSON.stringify(payload));
    else console.log(JSON.stringify(payload));
}

function normalizeNum(num: string): string {
    const c = num.replace(/\D/g, "");
    if (c.length < 20) return num.trim();
    return `${c.slice(0, 7)}-${c.slice(7, 9)}.${c.slice(9, 13)}.${c.slice(13, 14)}.${c.slice(14, 16)}.${c.slice(16, 20)}`;
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

async function fetchMovimentacoesAPI(numeroCnj: string, token: string): Promise<EscavadorMovimentacao[] | null> {
    const numero = normalizeNum(numeroCnj);
    const url = `https://api.escavador.com/api/v2/processos/numero_cnj/${encodeURIComponent(numero)}/movimentacoes`;

    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
        });

        if (!res.ok) {
            logStructured("warn", `Erro ao buscar movimentações na API: ${res.status}`);
            return null;
        }

        const body = await res.json();
        // A API retorna as movimentações em body.items (paginado) ou direto se for o endpoint de status?
        // No V2 docs, /movimentacoes retorna { "items": [...] }
        return body.items || [];
    } catch (err) {
        logStructured("error", "Exception ao buscar movimentações na API", { error: String(err) });
        return null;
    }
}

async function computeHash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });

interface EscavadorMovimentacao {
    id: number;
    data: string;
    tipo: string;
    conteudo: string;
}

interface EscavadorInstancia {
    movimentacoes?: EscavadorMovimentacao[];
}

interface CallbackPayload {
    event: string; // V2 usa "event"
    evento?: string; // Fallback
    uuid: string;
    atualizacao?: {
        // V2 usa "atualizacao"
        id: number;
        status: string;
        numero_cnj: string;
        resultado?: {
            instancias?: EscavadorInstancia[];
        };
    };
    resultado?: {
        // Estrutura alternativa/legada
        numero_processo: string;
        status: string;
        resposta?: {
            instancias?: EscavadorInstancia[];
        };
    };
}

Deno.serve(async (req) => {
    // Apenas POST
    if (req.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
    }

    // Rate limit check
    if (!checkRateLimit()) {
        logStructured("warn", "Rate limit exceeded");
        return json({ error: "Too many requests" }, 429);
    }

    // Validar env vars
    const callbackToken = Deno.env.get("ESCAVADOR_CALLBACK_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
        logStructured("error", "Supabase env vars não configurados");
        return json({ error: "Server configuration error" }, 500);
    }

    if (!callbackToken) {
        logStructured("error", "ESCAVADOR_CALLBACK_TOKEN não configurado");
        return json({ error: "Server configuration error" }, 500);
    }

    // Validar Authorization header (Simples comparação — Escavador envia o token direto)
    const authHeader = req.headers.get("Authorization") ?? "";
    const providedToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

    if (providedToken !== callbackToken) {
        logStructured("warn", "Token de callback inválido", {
            header: authHeader.slice(0, 10) + "...",
            match: false,
        });
        return json({ error: "Unauthorized" }, 401);
    }

    // Parse payload
    let payload: CallbackPayload;
    try {
        payload = (await req.json()) as CallbackPayload;
    } catch {
        logStructured("error", "Invalid JSON payload");
        return json({ error: "Invalid JSON" }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const now = new Date().toISOString();

    const callbackId = payload.atualizacao?.id ?? (payload as any).id;
    const evento = payload.event ?? payload.evento ?? "unknown";
    const statusGeral = payload.atualizacao?.status ?? (payload as any).status;

    const numeroCnj = payload.atualizacao?.numero_cnj
        ? normalizeNum(payload.atualizacao.numero_cnj)
        : payload.resultado?.numero_processo
          ? normalizeNum(payload.resultado.numero_processo)
          : null;

    logStructured("info", "Callback recebido", {
        callback_id: callbackId,
        callback_uuid: payload.uuid,
        evento: evento,
        status: statusGeral,
        numero_cnj: numeroCnj,
        v2: !!payload.atualizacao,
    });

    // Verificar callback duplicado
    if (payload.uuid) {
        const { data: existing } = await supabase
            .from("escavador_callback_logs")
            .select("id")
            .eq("callback_uuid", payload.uuid)
            .limit(1);

        if (existing && existing.length > 0) {
            logStructured("info", "Callback duplicado ignorado", { callback_uuid: payload.uuid });
            // Registrar como duplicado
            await supabase.from("escavador_callback_logs").insert({
                callback_id: callbackId,
                callback_uuid: payload.uuid,
                evento: evento,
                status: statusGeral,
                numero_cnj: numeroCnj,
                payload: payload as unknown as Record<string, unknown>,
                processing_result: "duplicate",
                processed_at: now,
            });
            return json({ ok: true, result: "duplicate" }, 200);
        }
    }

    // Registrar callback no log
    const logEntry = {
        callback_id: callbackId,
        callback_uuid: payload.uuid,
        evento: evento,
        status: statusGeral,
        numero_cnj: numeroCnj,
        payload: payload as unknown as Record<string, unknown>,
        processing_result: "processing" as string,
        error_message: null as string | null,
        processed_at: null as string | null,
    };

    const { data: logRow } = await supabase.from("escavador_callback_logs").insert(logEntry).select("id").single();

    const logId = logRow?.id;

    try {
        const resultadoStatus = (payload.atualizacao?.status ?? payload.resultado?.status ?? "SUCESSO").toUpperCase();

        // Buscar processo no banco
        let processo = null;
        if (numeroCnj) {
            // Buscar pelo number primeiro, depois fallback para numero_processo
            const { data: byNumber } = await supabase
                .from("processos")
                .select("id, number, owner_id, ultima_movimentacao_hash")
                .eq("number", numeroCnj)
                .limit(1);

            processo = byNumber?.[0] ?? null;

            if (!processo) {
                const { data: byNumeroProcesso } = await supabase
                    .from("processos")
                    .select("id, number, owner_id, ultima_movimentacao_hash")
                    .eq("numero_processo", numeroCnj)
                    .limit(1);

                processo = byNumeroProcesso?.[0] ?? null;
            }
        }

        if (!processo) {
            logStructured("warn", "Processo não encontrado no banco", { numero_cnj: numeroCnj });
            await updateCallbackLog(supabase, logId, "ignored", "Processo não encontrado no banco", now);
            return json({ ok: true, result: "ignored", reason: "process_not_found" }, 200);
        }

        if (resultadoStatus === "SUCESSO") {
            // Extrair movimentações de todas as instâncias
            // No V2 (sua imagem): payload.atualizacao.resultado.instancias
            // No Legado: payload.resultado.resposta.instancias
            const instancias =
                payload.atualizacao?.resultado?.instancias ?? payload.resultado?.resposta?.instancias ?? [];
            const todasMovimentacoes: EscavadorMovimentacao[] = [];

            for (const inst of instancias) {
                if (inst.movimentacoes) {
                    todasMovimentacoes.push(...inst.movimentacoes);
                }
            }

            // Se não vieram movimentações no callback (comum no V2), buscar via API
            if (todasMovimentacoes.length === 0 && numeroCnj) {
                logStructured("info", "Buscando movimentações na API (não vieram no callback)", {
                    numero_cnj: numeroCnj,
                });
                const escavadorToken = Deno.env.get("ESCAVADOR_API_TOKEN") || Deno.env.get("ESCAVADOR_TOKEN");
                if (escavadorToken) {
                    const fetchedMovements = await fetchMovimentacoesAPI(numeroCnj, escavadorToken);
                    if (fetchedMovements && fetchedMovements.length > 0) {
                        todasMovimentacoes.push(...fetchedMovements);
                    }
                }
            }

            // Ordenar por data desc
            todasMovimentacoes.sort((a, b) => {
                const dateA = a.data ?? "0000-00-00";
                const dateB = b.data ?? "0000-00-00";
                if (dateA > dateB) return -1;
                if (dateA < dateB) return 1;
                return (b.id || 0) - (a.id || 0);
            });

            if (todasMovimentacoes.length === 0) {
                logStructured("info", "Nenhuma movimentação encontrada após fetch", { processo_id: processo.id });
                await supabase
                    .from("processos")
                    .update({
                        status_atualizacao: "SUCCESS",
                        ultima_verificacao: now,
                        updated_at: now,
                    })
                    .eq("id", processo.id);
                await updateCallbackLog(supabase, logId, "processed", "Sem movimentações novas", now);
                return json({ ok: true, result: "processed", movements: 0 }, 200);
            }

            // Gerar hash da movimentação mais recente
            const latest = todasMovimentacoes[0];
            const hashInput = `${numeroCnj}|${latest.data}|${latest.conteudo}`;
            const newHash = await computeHash(hashInput);

            // Comparar com hash salvo
            if (newHash === processo.ultima_movimentacao_hash) {
                logStructured("info", "Hash idêntico — sem mudanças reais", { processo_id: processo.id });
                await supabase
                    .from("processos")
                    .update({
                        status_atualizacao: "SUCCESS",
                        ultima_verificacao: now,
                        updated_at: now,
                    })
                    .eq("id", processo.id);
                await updateCallbackLog(supabase, logId, "duplicate", "Hash de movimentação idêntico", now);
                return json({ ok: true, result: "no_changes" }, 200);
            }

            // Inserir novas movimentações (ON CONFLICT DO NOTHING via unique constraint)
            let insertedCount = 0;
            const relevantMovements: EscavadorMovimentacao[] = [];

            for (const mov of todasMovimentacoes) {
                const isRelevant = isRelevantMovement(mov.conteudo);
                const { error: insertError } = await supabase.from("process_movements").insert({
                    process_id: processo.id,
                    process_number: numeroCnj,
                    movement_date: mov.data,
                    movement_type: detectMovementType(mov.conteudo),
                    full_text: mov.conteudo,
                    is_relevant: isRelevant,
                    external_id: mov.id,
                    owner_id: processo.owner_id,
                });

                if (!insertError) {
                    insertedCount++;
                    if (isRelevant) relevantMovements.push(mov);
                }
                // ON CONFLICT → insertError com code 23505, silenciosamente ignorado
            }

            // Atualizar processo
            await supabase
                .from("processos")
                .update({
                    status_atualizacao: "SUCCESS",
                    ultima_movimentacao_hash: newHash,
                    ultima_verificacao: now,
                    last_movement: latest.conteudo.slice(0, 500),
                    last_checked_at: now,
                    updated_at: now,
                })
                .eq("id", processo.id);

            // Log de monitoramento
            await supabase.from("process_monitor_logs").insert({
                process_id: processo.id,
                process_number: numeroCnj,
                log_type: insertedCount > 0 ? "atualizacao_encontrada" : "callback_recebido",
                message:
                    insertedCount > 0
                        ? `${insertedCount} nova(s) movimentação(ões) via callback`
                        : "Callback processado — movimentações já existentes",
                details: {
                    source: "callback",
                    callback_id: callbackId,
                    total_movimentacoes: todasMovimentacoes.length,
                    inserted: insertedCount,
                    relevant: relevantMovements.length,
                },
                owner_id: processo.owner_id,
            });

            // Notificação inbox se há movimentações relevantes novas
            if (relevantMovements.length > 0 && processo.owner_id) {
                const latestRelevant = relevantMovements[0];
                await supabase.from("inbox_items").insert({
                    tipo: "Andamento",
                    titulo: `Nova movimentação relevante: ${numeroCnj}`,
                    descricao: `${relevantMovements.length} nova(s) movimentação(ões): ${latestRelevant.conteudo.slice(0, 120)}${latestRelevant.conteudo.length > 120 ? "…" : ""}`,
                    referencia_id: processo.id,
                    lido: false,
                    prioridade: "Alta",
                    owner_id: processo.owner_id,
                });
            }

            logStructured("info", "Callback processado com sucesso", {
                processo_id: processo.id,
                inserted: insertedCount,
                relevant: relevantMovements.length,
            });

            await updateCallbackLog(supabase, logId, "processed", null, now);
            return json({ ok: true, result: "processed", movements_inserted: insertedCount }, 200);
        } else if (resultadoStatus === "NAO_ENCONTRADO" || resultadoStatus === "NOT_FOUND") {
            await supabase
                .from("processos")
                .update({
                    status_atualizacao: "NOT_FOUND",
                    ultima_verificacao: now,
                    updated_at: now,
                })
                .eq("id", processo.id);

            await supabase.from("process_monitor_logs").insert({
                process_id: processo.id,
                process_number: numeroCnj,
                log_type: "callback_recebido",
                message: "Processo não encontrado no Escavador",
                details: { source: "callback", callback_id: callbackId, status: resultadoStatus },
                owner_id: processo.owner_id,
            });

            await updateCallbackLog(supabase, logId, "processed", "Processo não encontrado no Escavador", now);
            return json({ ok: true, result: "not_found" }, 200);
        } else {
            // ERRO ou status desconhecido
            await supabase
                .from("processos")
                .update({
                    status_atualizacao: "ERROR",
                    ultima_verificacao: now,
                    updated_at: now,
                })
                .eq("id", processo.id);

            await supabase.from("process_monitor_logs").insert({
                process_id: processo.id,
                process_number: numeroCnj,
                log_type: "erro_api",
                message: `Callback com status: ${resultadoStatus ?? statusGeral}`,
                details: { source: "callback", callback_id: callbackId, status: resultadoStatus },
                owner_id: processo.owner_id,
            });

            await updateCallbackLog(supabase, logId, "error", `Status: ${resultadoStatus ?? statusGeral}`, now);
            return json({ ok: true, result: "error_logged" }, 200);
        }
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        logStructured("error", "Erro ao processar callback", { error: errorMsg, callback_id: callbackId });
        await updateCallbackLog(supabase, logId, "error", errorMsg, now);
        // Retornar 200 para o Escavador não reenviar
        return json({ ok: false, error: "Internal processing error" }, 200);
    }
});

async function updateCallbackLog(
    supabase: ReturnType<typeof createClient>,
    logId: string | undefined,
    result: string,
    errorMessage: string | null,
    processedAt: string,
) {
    if (!logId) return;
    await supabase
        .from("escavador_callback_logs")
        .update({
            processing_result: result,
            error_message: errorMessage,
            processed_at: processedAt,
        })
        .eq("id", logId);
}
