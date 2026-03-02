/**
 * permissions.ts — Mapa central de permissões por role e módulo.
 *
 * Define as permissões padrão de cada role para cada módulo da aplicação.
 * Os overrides por usuário ficam na tabela `user_permissions` e têm prioridade
 * (gerenciados pelo admin na página Equipe via `useUpdatePermission`).
 *
 * Hierarquia:
 *   1. Admin → acesso total a tudo (sem override)
 *   2. Lawyer → defaults abaixo, substituíveis pelo admin via user_permissions
 */

export type AppRole = "admin" | "lawyer";

export type AppModule =
    | "processos"
    | "agenda"
    | "pecas"
    | "crm"
    | "financeiro"
    | "documentos"
    | "publicacoes"
    | "relatorios"
    | "configuracoes"
    | "equipe"
    | "calculadora";

export interface ModulePermissions {
    /** Pode visualizar o módulo (ver menu, acessar rota). */
    canView: boolean;
    /** Pode criar e editar registros no módulo. */
    canEdit: boolean;
    /** Pode excluir registros no módulo. */
    canDelete: boolean;
}

/**
 * Permissões padrão por role para cada módulo.
 * Lawyers partem de canView=true para módulos operacionais (processos, agenda, etc.)
 * e canView=false para módulos sensíveis (financeiro, equipe, relatorios).
 * O admin pode conceder acesso adicional via user_permissions.
 */
export const DEFAULT_PERMISSIONS: Record<AppRole, Record<AppModule, ModulePermissions>> = {
    admin: {
        processos: { canView: true, canEdit: true, canDelete: true },
        agenda: { canView: true, canEdit: true, canDelete: true },
        pecas: { canView: true, canEdit: true, canDelete: true },
        crm: { canView: true, canEdit: true, canDelete: true },
        financeiro: { canView: true, canEdit: true, canDelete: true },
        documentos: { canView: true, canEdit: true, canDelete: true },
        publicacoes: { canView: true, canEdit: true, canDelete: true },
        relatorios: { canView: true, canEdit: true, canDelete: false },
        configuracoes: { canView: true, canEdit: true, canDelete: false },
        equipe: { canView: true, canEdit: true, canDelete: true },
        calculadora: { canView: true, canEdit: true, canDelete: true },
    },
    lawyer: {
        processos: { canView: true, canEdit: true, canDelete: false },
        agenda: { canView: true, canEdit: true, canDelete: true },
        pecas: { canView: true, canEdit: true, canDelete: false },
        crm: { canView: true, canEdit: true, canDelete: false },
        financeiro: { canView: false, canEdit: false, canDelete: false },
        documentos: { canView: true, canEdit: true, canDelete: false },
        publicacoes: { canView: true, canEdit: false, canDelete: false },
        relatorios: { canView: false, canEdit: false, canDelete: false },
        configuracoes: { canView: true, canEdit: true, canDelete: false },
        equipe: { canView: false, canEdit: false, canDelete: false },
        calculadora: { canView: true, canEdit: true, canDelete: false },
    },
};

/** Retorna as permissões padrão para um role+módulo (sem overrides por usuário). */
export function getDefaultPermissions(role: AppRole | null, module: AppModule): ModulePermissions {
    if (!role) return { canView: false, canEdit: false, canDelete: false };
    return DEFAULT_PERMISSIONS[role][module];
}
