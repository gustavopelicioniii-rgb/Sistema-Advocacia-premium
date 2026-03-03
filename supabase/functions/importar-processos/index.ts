import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

interface ProcessoData {
    oab_estado: string;
    oab_numero: string;
    user_id?: string;
}

interface EscavadorResponse {
    processos?: Array<{
        numero_processo: string;
        tribunal: string;
        ultima_movimentacao: string;
        data_ultima_movimentacao: string;
    }>;
    error?: string;
}

// Headers CORS para permitir chamadas do frontend
const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders, status: 204 });
    }

    try {
        // Validar método HTTP
        if (req.method !== "POST") {
            return new Response(
                JSON.stringify({
                    error: "Method not allowed. Use POST.",
                }),
                {
                    status: 405,
                    headers: corsHeaders,
                },
            );
        }

        // Parse request body
        const body = (await req.json()) as ProcessoData;

        // Validar inputs obrigatórios
        if (!body.oab_estado || !body.oab_numero) {
            return new Response(
                JSON.stringify({
                    error: "Missing required fields: oab_estado, oab_numero",
                }),
                {
                    status: 400,
                    headers: corsHeaders,
                },
            );
        }

        // Obter token da variável de ambiente
        const escavadorToken = Deno.env.get("ESCAVADOR_TOKEN");
        if (!escavadorToken) {
            console.error("ESCAVADOR_TOKEN não configurado");
            return new Response(
                JSON.stringify({
                    error: "Token Escavador não configurado no servidor",
                }),
                {
                    status: 500,
                    headers: corsHeaders,
                },
            );
        }

        // Chamar API Escavador
        const escavadorUrl = `https://api.escavador.com/api/v2/advogado/processos?oab_estado=${encodeURIComponent(body.oab_estado)}&oab_numero=${encodeURIComponent(body.oab_numero)}`;

        const escavadorResponse = await fetch(escavadorUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${escavadorToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!escavadorResponse.ok) {
            console.error(`Escavador API error: ${escavadorResponse.status}`);
            return new Response(
                JSON.stringify({
                    error: `Escavador API error: ${escavadorResponse.status}`,
                    details: await escavadorResponse.text(),
                }),
                {
                    status: escavadorResponse.status,
                    headers: corsHeaders,
                },
            );
        }

        const escavadorData = (await escavadorResponse.json()) as EscavadorResponse;

        // Se há processos, salvar no Supabase
        if (escavadorData.processos && escavadorData.processos.length > 0) {
            try {
                const supabaseUrl = Deno.env.get("SUPABASE_URL");
                const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

                if (!supabaseUrl || !supabaseServiceKey) {
                    throw new Error("Supabase credentials not configured");
                }

                const supabase = createClient(supabaseUrl, supabaseServiceKey);

                // Preparar dados para inserção
                const processosParaInserir = escavadorData.processos.map((processo) => ({
                    numero_processo: processo.numero_processo,
                    tribunal: processo.tribunal,
                    ultima_movimentacao: processo.ultima_movimentacao,
                    ultima_movimentacao_data: processo.data_ultima_movimentacao,
                    last_checked_at: new Date().toISOString(),
                    ativo: true,
                    user_id: body.user_id || null,
                }));

                // Inserir processos (upsert para evitar duplicatas)
                const { error: insertError } = await supabase.from("processos").upsert(processosParaInserir, {
                    onConflict: "numero_processo",
                });

                if (insertError) {
                    console.error("Database insert error:", insertError);
                    return new Response(
                        JSON.stringify({
                            error: "Erro ao salvar processos no banco de dados",
                            details: insertError.message,
                        }),
                        {
                            status: 500,
                            headers: corsHeaders,
                        },
                    );
                }

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: `${escavadorData.processos.length} processo(s) importado(s) com sucesso`,
                        processos_importados: escavadorData.processos.length,
                    }),
                    {
                        status: 200,
                        headers: corsHeaders,
                    },
                );
            } catch (dbError) {
                console.error("Database operation error:", dbError);
                return new Response(
                    JSON.stringify({
                        error: "Erro ao processar dados no banco",
                        details: dbError instanceof Error ? dbError.message : String(dbError),
                    }),
                    {
                        status: 500,
                        headers: corsHeaders,
                    },
                );
            }
        }

        // Se não há processos
        return new Response(
            JSON.stringify({
                success: true,
                message: "Nenhum processo encontrado para este OAB",
                processos_importados: 0,
            }),
            {
                status: 200,
                headers: corsHeaders,
            },
        );
    } catch (error) {
        console.error("Unexpected error:", error);
        return new Response(
            JSON.stringify({
                error: "Erro inesperado",
                details: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: corsHeaders,
            },
        );
    }
});
