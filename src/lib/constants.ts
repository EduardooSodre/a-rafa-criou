// Constantes da aplicação A Rafa Criou

// Cores da identidade visual
export const COLORS = {
  background: '#F4F4F4',
  primary: '#FED466',
  secondary: '#FD9555',
  foreground: '#171717',
} as const;

// Configurações de acessibilidade
export const ACCESSIBILITY = {
  minFontSize: 16, // px
  lineHeight: 1.6,
  contrastRatio: 4.5, // WCAG AA
} as const;

// Configurações de rate limiting
export const RATE_LIMITS = {
  login: 5, // tentativas por minuto
  passwordReset: 3, // tentativas por minuto
  download: 10, // downloads por minuto
  api: 60, // requests por minuto
} as const;

// Configurações de PDF
export const PDF_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFormats: ['pdf'] as const,
  linkExpirationMinutes: 15,
  maxDownloadsPerDay: 5,
} as const;

// Moedas suportadas
export const CURRENCIES = {
  BRL: { symbol: 'R$', code: 'BRL', name: 'Real Brasileiro' },
  USD: { symbol: '$', code: 'USD', name: 'Dólar Americano' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro' },
} as const;

// Idiomas suportados
export const LANGUAGES = {
  pt: { code: 'pt', name: 'Português', flag: '🇧🇷' },
  en: { code: 'en', name: 'English', flag: '🇺🇸' },
} as const;

// Roles de usuário
export const USER_ROLES = {
  admin: { label: 'Administrador', permissions: ['all'] },
  member: { label: 'Membro', permissions: ['read', 'edit_drafts'] },
  customer: { label: 'Cliente', permissions: ['read_own'] },
} as const;

// Status de pedido
export const ORDER_STATUS = {
  pending: 'Pendente',
  processing: 'Processando',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
} as const;

// Canais de notificação
export const NOTIFICATION_CHANNELS = {
  email: { name: 'E-mail', required: true },
  whatsapp: { name: 'WhatsApp', required: false },
  sms: { name: 'SMS', required: false },
  push: { name: 'Push', required: false },
} as const;

// Providers de pagamento
export const PAYMENT_PROVIDERS = {
  stripe: { name: 'Cartão de Crédito', icon: '💳' },
  paypal: { name: 'PayPal', icon: '🅿️' },
  pix: { name: 'PIX', icon: '📱' },
} as const;

// Regex patterns
export const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+55\s?)?(\d{2}\s?)?(\d{4,5})-?(\d{4})$/,
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

// Configurações de SEO
export const SEO = {
  defaultTitle: 'A Rafa Criou - E-commerce de PDFs',
  titleTemplate: '%s | A Rafa Criou',
  defaultDescription: 'Loja online de produtos digitais em PDF com foco em acessibilidade e experiência do usuário.',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  twitterHandle: '@arafacriou',
} as const;