/**
 * Utilitários para formatação de dados do usuário
 */

/**
 * Retorna apenas o primeiro e segundo nome do usuário
 * @param fullName - Nome completo do usuário
 * @returns Primeiro e segundo nome, ou "Usuário" se não houver nome
 */
export function getDisplayName(fullName: string | null | undefined): string {
  if (!fullName) return 'Usuário';

  const nameParts = fullName
    .trim()
    .split(' ')
    .filter(part => part.length > 0);

  if (nameParts.length === 0) return 'Usuário';
  if (nameParts.length === 1) return nameParts[0];

  return `${nameParts[0]} ${nameParts[1]}`;
}

/**
 * Retorna as iniciais do usuário (máximo 2 letras)
 * @param fullName - Nome completo do usuário
 * @returns Iniciais do usuário em maiúsculo
 */
export function getUserInitials(fullName: string | null | undefined): string {
  if (!fullName) return 'U';

  const nameParts = fullName
    .trim()
    .split(' ')
    .filter(part => part.length > 0);

  if (nameParts.length === 0) return 'U';
  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();

  return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
}
