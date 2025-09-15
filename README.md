# A Rafa Criou - E-commerce de PDFs# 🚀 A Rafa Criou - E-commerce de PDFs

E-commerce moderno para venda de produtos digitais em PDF, desenvolvido com Next.js 15, TypeScript, Tailwind CSS e Shadcn UI.E-commerce moderno para venda de produtos digitais (PDFs) com foco em acessibilidade, migração do WooCommerce e experiência otimizada para público 25-70 anos.

## 🚀 Status do Projeto## 🎨 Identidade Visual

✅ **Base do E-commerce Completamente Funcional**- **Background:** `#F4F4F4`

- **Cor Primária:** `#FED466` (Amarelo)

### ✅ Implementado- **Cor Secundária:** `#FD9555` (Laranja)

- **Tipografia:** ≥16px para acessibilidade

- **Interface completa** com design responsivo e acessível- **Componentes:** Tailwind CSS + Shadcn UI

- **Catálogo de produtos** com busca, filtros e paginação

- **Sistema de carrinho** com localStorage e gerenciamento de estado## 🛠️ Stack Tecnológica

- **Checkout funcional** com formulários e validação

- **Páginas de produto** individuais com variações e galeria- **Framework:** Next.js 15 (App Router)

- **Sistema de navegação** com header responsivo e menu mobile- **Linguagem:** TypeScript

- **Páginas de confirmação** pós-compra- **Estilização:** Tailwind CSS + Shadcn UI

- **Design system** com cores da marca (#FED466, #FD9555, #F4F4F4)- **Banco de Dados:** PostgreSQL + Drizzle ORM

- **Tipografia acessível** (Poppins, ≥16px)- **Autenticação:** Auth.js (NextAuth v5)

- **Storage:** Cloudflare R2 (S3-compatible)

### 🔄 Em Desenvolvimento- **Pagamentos:** Stripe + PayPal + PIX

- **E-mail:** Resend

- Sistema de autenticação completo- **Validação:** Zod

- Integração com banco de dados PostgreSQL

- Gateway de pagamentos real (PIX, cartão, boleto)## 🚀 Quick Start

- Painel administrativo

- Sistema de cupons### 1. Instalação

- Notificações por e-mail

- Downloads seguros com Cloudflare R2```bash

# Clone o repositório

## 🛠️ Tecnologiasgit clone <repository-url>

cd a-rafa-criou

- **Framework:** Next.js 15 (App Router)

- **Linguagem:** TypeScript# Instale as dependências

- **Estilização:** Tailwind CSS + Shadcn UInpm install

- **Banco:** PostgreSQL (Neon) + Drizzle ORM```

- **Autenticação:** Auth.js (em desenvolvimento)

- **Estado:** React Context API + localStorage### 2. Configuração do Ambiente

## 🎨 Design System```bash

# Copie o arquivo de exemplo

### Corescp .env.example .env.local

- **Background:** #F4F4F4

- **Primária:** #FED466 (Amarelo)# Configure as variáveis necessárias no .env.local

- **Secundária:** #FD9555 (Laranja)```

- **Texto:** Tons de cinza

### 3. Banco de Dados

### Tipografia

- **Fonte:** Poppins (weights: 400, 500, 600, 700)```bash

- **Tamanho mínimo:** 16px (acessibilidade)# Configure seu PostgreSQL e atualize DATABASE_URL no .env.local

## 📱 Funcionalidades# Gere e execute as migrations

npm run db:generate

### Catálogonpm run db:migrate

- ✅ Listagem de produtos com imagens

- ✅ Busca por nome/descrição# (Opcional) Abra o Drizzle Studio

- ✅ Filtros por categoria e preçonpm run db:studio

- ✅ Ordenação (preço, nome, popularidade)```

- ✅ Paginação responsiva

### 4. Desenvolvimento

### Produto

- ✅ Galeria de imagens```bash

- ✅ Seleção de variações# Inicie o servidor de desenvolvimento

- ✅ Informações detalhadasnpm run dev

- ✅ Avaliações (interface pronta)```

- ✅ Especificações técnicas

Acesse [http://localhost:3000](http://localhost:3000) para ver o resultado.

### Carrinho

- ✅ Adicionar/remover produtos## 📁 Estrutura do Projeto

- ✅ Atualizar quantidades

- ✅ Persistência com localStorage```

- ✅ Contador no headersrc/

- ✅ Resumo de preços├── app/ # App Router (Next.js 15)

│ ├── api/ # API Routes

### Checkout│ ├── auth/ # Páginas de autenticação

- ✅ Formulário de dados pessoais│ ├── admin/ # Painel administrativo

- ✅ Seleção de forma de pagamento│ ├── produtos/ # Catálogo e PDPs

- ✅ Resumo do pedido│ └── globals.css # Estilos globais

- ✅ Validação de campos├── components/ # Componentes React

- ✅ Simulação de processamento│ └── ui/ # Componentes Shadcn UI

├── lib/ # Utilitários e configurações

### Pós-Compra│ ├── auth/ # Configuração Auth.js

- ✅ Página de confirmação│ ├── db/ # Drizzle ORM e schemas

- ✅ Detalhes do pedido│ └── utils.ts # Funções utilitárias

- ✅ Links de download (simulados)├── hooks/ # Custom React Hooks

- ✅ Informações importantes└── types/ # Definições TypeScript

- ✅ Próximos passos```

## 🏃‍♂️ Como Executar## 🔧 Scripts Disponíveis

`bash`bash

# Instalar dependências# Desenvolvimento

npm installnpm run dev # Servidor de desenvolvimento

npm run build # Build de produção

# Iniciar servidor de desenvolvimentonpm run start # Servidor de produção

npm run dev

# Qualidade de código

# Abrir no navegadornpm run lint # ESLint

http://localhost:3000npm run lint:fix # ESLint com correção automática

````npm run format           # Prettier

npm run format:check     # Verificar formatação

## 📋 Próximos Passosnpm run type-check       # Verificação TypeScript



1. **Autenticação completa** (Auth.js + Drizzle)# Banco de dados

2. **Integração com banco** (CRUD completo)npm run db:generate      # Gerar migrations

3. **Gateway de pagamentos** (Stripe/PagSeguro/PIX)npm run db:migrate       # Executar migrations

4. **Painel administrativo** (gestão de produtos/pedidos)npm run db:studio        # Drizzle Studio

5. **Sistema de e-mails** (confirmações/notificações)npm run db:push          # Push schema direto (dev)

6. **Downloads seguros** (Cloudflare R2 + URLs assinadas)```

7. **Migração WooCommerce** (importação de dados)

8. **Internacionalização** (PT/EN)## 🌟 Funcionalidades Principais

9. **PWA** (app instalável)

10. **Testes automatizados** (Jest/Cypress)### ✅ Implementado (Base)

- [x] Configuração Next.js + TypeScript

## 🎯 Público-Alvo- [x] Tailwind CSS + Shadcn UI com cores customizadas

- [x] Drizzle ORM + PostgreSQL

Pessoas de 25-70 anos interessadas em produtos digitais educacionais, com foco em acessibilidade e experiência intuitiva.- [x] Auth.js com Credentials e Magic Link

- [x] Estrutura de pastas organizada

## 📝 Licença- [x] ESLint + Prettier

- [x] Variáveis de ambiente documentadas

Projeto proprietário - A Rafa Criou
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
````
