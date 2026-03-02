/**
 * usePermissions — Hook unificado de permissões por módulo.
 *
 * Combina permissões padrão por role (`permissions.ts`) com overrides por
 * usuário da tabela `user_permissions` (gerenciados na página Equipe).
 *
 * Admin sempre tem acesso total, independente de overrides.
 * Lawyer parte dos defaults e pode ter acesso adicional concedido pelo admin.
 *
 * Uso:
 *   const { canView, canEdit, canDelete } = usePermissions('processos');
 */

import { useAuth } from "@/contexts/AuthContext";
import { useMyPermissions } from "@/hooks/useTeam";
import { getDefaultPermissions, type AppModule, type ModulePermissions } from "@/lib/permissions";
import type { AppRole } from "@/lib/permissions";

export function usePermissions(module: AppModule): ModulePermissions {
    const { role } = useAuth();
    const { isAdmin, byModule } = useMyPermissions();

    // Admin tem acesso total sem consultar overrides
    if (isAdmin) {
        return { canView: true, canEdit: true, canDelete: true };
    }

    const dbPerm = byModule(module);
    const defaultPerm = getDefaultPermissions(role as AppRole | null, module);

    return {
        // Override do banco tem prioridade; fallback para default do role
        canView: dbPerm.can_view ?? defaultPerm.canView,
        canEdit: dbPerm.can_edit ?? defaultPerm.canEdit,
        // canDelete não tem override por usuário — segue o default do role
        canDelete: defaultPerm.canDelete,
    };
}
