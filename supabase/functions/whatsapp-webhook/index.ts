// Supabase Edge Function: WhatsApp Webhook Receiver
// Deploy: supabase functions deploy whatsapp-webhook
//
// This handles incoming webhooks from all 3 providers:
// - Meta Cloud API (com verificação de assinatura x-hub-signature-256)
// - Z-API
// - Evolution API
//
// Env vars:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injetados)
//   WHATSAPP_VERIFY_TOKEN  — token de verificação Meta (GET hub.verify_token)
//   WHATSAPP_APP_SECRET    — segredo do app Meta para verificar assinatura HMAC-SHA256
//
// It inserts messages into whatsapp_messages table,
// which triggers auto CRM lead creation.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Verifica assinatura HMAC-SHA256 enviada pela Meta Cloud API. */
async function verifyMetaSignature(body: string, signature: string | null, appSecret: string): Promise<boolean> {
    if (!signature) return false;
    const expected = signature.startsWith("sha256=") ? signature.slice(7) : signature;
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(appSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
    const computed = Array.from(new Uint8Array(sigBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return computed === expected;
}

Deno.serve(async (req) => {
    // Handle Meta Cloud API verification (GET)
    if (req.method === "GET") {
        const url = new URL(req.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === Deno.env.get("WHATSAPP_VERIFY_TOKEN")) {
            return new Response(challenge, { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
    }

    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    // Lê o body como texto (necessário para verificar assinatura antes de parsear)
    const rawBody = await req.text();

    let body: Record<string, unknown>;
    try {
        body = JSON.parse(rawBody);
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const provider = (req.headers.get("x-provider") ?? "") || detectProvider(body);

    // Verificação de assinatura obrigatória para Meta Cloud API
    if (provider === "cloud_api") {
        const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
        if (appSecret) {
            const signature = req.headers.get("x-hub-signature-256");
            const isValid = await verifyMetaSignature(rawBody, signature, appSecret);
            if (!isValid) {
                console.error(
                    JSON.stringify({
                        ts: new Date().toISOString(),
                        level: "warn",
                        fn: "whatsapp-webhook",
                        message: "Assinatura Meta inválida — requisição rejeitada",
                    }),
                );
                return new Response(JSON.stringify({ error: "Assinatura inválida" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }
    }

    // Cria cliente Supabase dentro do handler (sem assertions !)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
        console.error(
            JSON.stringify({
                ts: new Date().toISOString(),
                level: "error",
                fn: "whatsapp-webhook",
                message: "Supabase env vars não configurados",
            }),
        );
        return new Response(JSON.stringify({ error: "Configuração do servidor incompleta" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
        let messages: { phone: string; name: string; text: string }[] = [];

        if (provider === "cloud_api") {
            const entries = (body?.entry as unknown[]) ?? [];
            for (const entry of entries) {
                const e = entry as Record<string, unknown>;
                for (const change of (e.changes as unknown[]) ?? []) {
                    const ch = change as Record<string, unknown>;
                    const value = ch.value as Record<string, unknown> | undefined;
                    for (const msg of (value?.messages as unknown[]) ?? []) {
                        const m = msg as Record<string, unknown>;
                        const contacts = (value?.contacts as { wa_id: string; profile?: { name?: string } }[]) ?? [];
                        const contact = contacts.find((c) => c.wa_id === m.from);
                        messages.push({
                            phone: m.from as string,
                            name: contact?.profile?.name || (m.from as string),
                            text: ((m.text as Record<string, unknown>)?.body as string) || "[mídia]",
                        });
                    }
                }
            }
        } else if (provider === "z_api") {
            const text = body.text as Record<string, unknown> | undefined;
            if (text?.message) {
                messages.push({
                    phone: body.phone as string,
                    name: (body.senderName as string) || (body.phone as string),
                    text: text.message as string,
                });
            }
        } else if (provider === "evolution_api") {
            const data = body.data as Record<string, unknown> | undefined;
            const message = data?.message as Record<string, unknown> | undefined;
            const key = data?.key as Record<string, unknown> | undefined;
            if (message?.conversation) {
                messages.push({
                    phone: ((key?.remoteJid as string) ?? "").replace("@s.whatsapp.net", ""),
                    name: (data?.pushName as string) || "",
                    text: message.conversation as string,
                });
            }
        }

        // Busca o admin para associar as mensagens — sem fallback undefined
        const { data: admin, error: adminError } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", "admin")
            .limit(1)
            .single();

        if (adminError || !admin?.id) {
            console.warn(
                JSON.stringify({
                    ts: new Date().toISOString(),
                    level: "warn",
                    fn: "whatsapp-webhook",
                    message: "Nenhum admin encontrado — mensagens ignoradas",
                    count: messages.length,
                }),
            );
            return new Response(JSON.stringify({ success: true, count: 0, warning: "Nenhum admin configurado" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        // Insere mensagens
        for (const msg of messages) {
            await supabase.from("whatsapp_messages").insert({
                owner_id: admin.id,
                contact_phone: msg.phone,
                contact_name: msg.name,
                message_text: msg.text,
                direction: "incoming",
                status: "received",
            });
        }

        return new Response(JSON.stringify({ success: true, count: messages.length }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(
            JSON.stringify({
                ts: new Date().toISOString(),
                level: "error",
                fn: "whatsapp-webhook",
                message: "Webhook error",
                error: (err as Error).message,
            }),
        );
        return new Response(JSON.stringify({ error: (err as Error).message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});

function detectProvider(body: Record<string, unknown>): string {
    if (body?.entry) return "cloud_api";
    if (body?.phone && body?.text) return "z_api";
    const data = body?.data as Record<string, unknown> | undefined;
    if (data?.key) return "evolution_api";
    return "unknown";
}
