/**
 * Correlation ID — rastreamento ponta a ponta de operações.
 *
 * Gera um UUID estável por "sessão de operação" (persiste enquanto o módulo
 * está carregado). Use `newCorrelationId()` para iniciar uma nova operação
 * que precisa ser rastreada independentemente.
 *
 * Propagação: inclua via header `X-Correlation-ID` nas chamadas às Edge Functions.
 */

let _currentId: string | null = null;

/** Retorna o correlation ID atual, gerando um novo se necessário. */
export function getCorrelationId(): string {
    if (!_currentId) {
        _currentId = crypto.randomUUID();
    }
    return _currentId;
}

/** Gera e armazena um novo correlation ID (use no início de operações críticas). */
export function newCorrelationId(): string {
    _currentId = crypto.randomUUID();
    return _currentId;
}
