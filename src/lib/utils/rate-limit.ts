/**
 * Rate Limiter simples em memória
 *
 * IMPORTANTE: Em produção, usar Redis ou outro sistema distribuído
 * Esta implementação em memória só funciona com 1 instância do servidor
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas a cada 5 minutos
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições na janela
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; resetAt: number; remaining: number } {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // Se não existe ou expirou, criar nova entrada
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      allowed: true,
      resetAt: now + config.windowMs,
      remaining: config.maxRequests - 1,
    };
  }

  // Se existe e ainda válida
  entry.count++;
  const allowed = entry.count <= config.maxRequests;

  return {
    allowed,
    resetAt: entry.resetAt,
    remaining: Math.max(0, config.maxRequests - entry.count),
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}
