# 🚀 A Rafa Criou - E-commerce de PDFs

E-commerce moderno para venda de produtos digitais (PDFs) com foco em acessibilidade, migração do WooCommerce e experiência otimizada para público 25-70 anos.

## 🎨 Identidade Visual

- **Background:** `#F4F4F4`
- **Cor Primária:** `#FED466` (Amarelo)
- **Cor Secundária:** `#FD9555` (Laranja)
- **Tipografia:** ≥16px para acessibilidade
- **Componentes:** Tailwind CSS + Shadcn UI

## 🛠️ Stack Tecnológica

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS + Shadcn UI
- **Banco de Dados:** PostgreSQL + Drizzle ORM
- **Autenticação:** Auth.js (NextAuth v5)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Pagamentos:** Stripe + PayPal + PIX
- **E-mail:** Resend
- **Validação:** Zod

## 🚀 Quick Start

### 1. Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd a-rafa-criou

# Instale as dependências
npm install
```

### 2. Configuração do Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Configure as variáveis necessárias no .env.local
```

### 3. Banco de Dados

```bash
# Configure seu PostgreSQL e atualize DATABASE_URL no .env.local

# Gere e execute as migrations
npm run db:generate
npm run db:migrate

# (Opcional) Abra o Drizzle Studio
npm run db:studio
```

### 4. Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver o resultado.

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 15)
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticação
│   ├── admin/             # Painel administrativo
│   ├── produtos/          # Catálogo e PDPs
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   └── ui/               # Componentes Shadcn UI
├── lib/                   # Utilitários e configurações
│   ├── auth/             # Configuração Auth.js
│   ├── db/               # Drizzle ORM e schemas
│   └── utils.ts          # Funções utilitárias
├── hooks/                 # Custom React Hooks
└── types/                 # Definições TypeScript
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run start            # Servidor de produção

# Qualidade de código
npm run lint             # ESLint
npm run lint:fix         # ESLint com correção automática
npm run format           # Prettier
npm run format:check     # Verificar formatação
npm run type-check       # Verificação TypeScript

# Banco de dados
npm run db:generate      # Gerar migrations
npm run db:migrate       # Executar migrations
npm run db:studio        # Drizzle Studio
npm run db:push          # Push schema direto (dev)
```

## 🌟 Funcionalidades Principais

### ✅ Implementado (Base)
- [x] Configuração Next.js + TypeScript
- [x] Tailwind CSS + Shadcn UI com cores customizadas
- [x] Drizzle ORM + PostgreSQL
- [x] Auth.js com Credentials e Magic Link
- [x] Estrutura de pastas organizada
- [x] ESLint + Prettier
- [x] Variáveis de ambiente documentadas

### 🔄 Em Desenvolvimento
- [ ] Esquemas completos do banco (produtos, pedidos, cupons)
- [ ] Páginas de autenticação (login, cadastro, reset)
- [ ] Catálogo de produtos e PDPs
- [ ] Sistema de checkout
- [ ] Painel administrativo
- [ ] Entrega automática de PDFs

### 📋 Roadmap
- [ ] Migração WooCommerce
- [ ] Sistema de cupons
- [ ] CMS embutido
- [ ] Notificações externas (WhatsApp, SMS)
- [ ] Sistema de afiliação
- [ ] Traduções de PDFs
- [ ] Proteção avançada de PDFs
- [ ] PWA
- [ ] i18n (PT/EN)

## 🔐 Configurações de Segurança

### Variáveis Sensíveis
Todas as variáveis sensíveis estão documentadas no `.env.example`. Nunca commite o arquivo `.env.local`.

### Rate Limiting
- Login: 5 tentativas por minuto
- Downloads: Configurável por usuário
- APIs: 60 requests por minuto

### Proteção de PDFs
- URLs assinadas com TTL curto (15 min)
- Watermark dinâmica com dados do comprador
- Limite de re-downloads
- Logs completos de acesso

## 🌍 Configurações de Localização

### Moedas Suportadas
- BRL (Real Brasileiro) - Padrão
- USD (Dólar Americano)
- EUR (Euro)

### Idiomas
- PT (Português) - Padrão
- EN (Inglês)

## 📊 Monitoramento

O projeto está preparado para integração com:
- Google Analytics
- Sentry (Error Tracking)
- Hotjar (User Experience)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário da Rafa Criou.

## 📞 Suporte

Para questões técnicas ou suporte, entre em contato através dos canais oficiais.

---

**Desenvolvido com ❤️ para A Rafa Criou**
