# Como Criar um Administrador

## 🔐 Métodos para Setar um Admin

### 1. **Via Script (Recomendado para primeira configuração)**

Use o script `create-admin.ts` para criar ou promover usuários a administrador:

```bash
# Criar novo usuário admin
npx ts-node scripts/create-admin.ts admin@arafacriou.com.br senha123 "Administrador"

# Promover usuário existente
npx ts-node scripts/create-admin.ts usuario@example.com senha123
```

**Parâmetros:**

- `email`: Email do usuário (obrigatório)
- `senha`: Senha para o usuário (obrigatório)
- `nome`: Nome de exibição (opcional, padrão: "Administrador")

**O que o script faz:**

- ✅ Verifica se o usuário já existe
- ✅ Se existir, promove a admin
- ✅ Se não existir, cria novo usuário admin
- ✅ Hash seguro da senha com bcrypt
- ✅ Validações de segurança

### 2. **Via Interface Admin (Para admins existentes)**

Acesse `/admin/usuarios` para gerenciar usuários:

1. **Faça login** como administrador
2. **Vá para** `/admin/usuarios`
3. **Digite sua senha** de confirmação
4. **Clique em promover** usuário desejado

**Recursos da interface:**

- 🔍 Busca por nome/email
- 🛡️ Confirmação por senha
- 👥 Lista todos os usuários
- ⚡ Ações rápidas (promover/demover)
- 🔒 Proteções de segurança

### 3. **Via API (Para integrações)**

**Endpoint:** `POST /api/admin/promote-user`

**Payload:**

```json
{
  "email": "usuario@example.com",
  "action": "promote", // ou "demote"
  "adminPassword": "senha_do_admin_atual"
}
```

**Exemplo com curl:**

```bash
curl -X POST http://localhost:3000/api/admin/promote-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novo-admin@example.com",
    "action": "promote",
    "adminPassword": "sua_senha_admin"
  }'
```

## 🚀 Configuração Inicial

### Primeira Vez - Criar Admin Principal

```bash
# 1. Instalar dependências (se necessário)
npm install bcryptjs @types/bcryptjs

# 2. Criar primeiro admin
npx ts-node scripts/create-admin.ts admin@arafacriou.com.br minhasenha123 "Super Admin"

# 3. Fazer login no sistema
# Acesse: http://localhost:3000/auth/login
# Email: admin@arafacriou.com.br
# Senha: minhasenha123

# 4. Acessar área admin
# Acesse: http://localhost:3000/admin
```

## 🔒 Segurança

### Proteções Implementadas

- **Validação de senha**: Admin atual deve confirmar senha
- **Role checking**: Apenas admins podem promover outros
- **Hashing seguro**: Senhas com bcrypt (12 rounds)
- **Logs de auditoria**: Todas as ações são registradas
- **Prevenção auto-demoção**: Admin principal não pode ser removido

### Roles Disponíveis

- **`admin`**: Acesso total à área administrativa
- **`member`**: Acesso a recursos de membro
- **`customer`**: Acesso básico de cliente

## 📋 Verificação

Para verificar se o admin foi criado com sucesso:

### Via Script

```bash
# O script informa o resultado na execução
npx ts-node scripts/create-admin.ts admin@arafacriou.com.br senha123
# ✅ admin@arafacriou.com.br já é admin (se já existir)
# ✅ admin@arafacriou.com.br promovido a admin com sucesso! (se foi promovido)
```

### Via Interface

1. Acesse `/admin/usuarios`
2. Verifique a badge "Admin" ao lado do usuário
3. Badge vermelha = Admin confirmado

### Via Banco de Dados

```sql
-- Verificar diretamente no PostgreSQL
SELECT email, name, role, created_at
FROM users
WHERE role = 'admin';
```

## 🆘 Problemas Comuns

### "Usuário não encontrado"

- O usuário precisa se cadastrar primeiro na plataforma
- Use email exato (case-sensitive)

### "Unauthorized" na API

- Verifique se você está logado como admin
- Confirme a senha do admin atual

### Script não executa

```bash
# Instalar ts-node se necessário
npm install -g ts-node

# Ou usar npx
npx ts-node scripts/create-admin.ts
```

### Esqueci a senha do admin

```bash
# Resetar senha do admin
npx ts-node scripts/create-admin.ts admin@arafacriou.com.br novasenha123
```

## 📝 Logs

Todas as operações de admin são logadas no console:

- ✅ Criações bem-sucedidas
- ❌ Erros e validações
- 🔍 Tentativas de acesso
- 🛡️ Confirmações de segurança
