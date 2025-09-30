/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { drizzle } = require('drizzle-orm/postgres-js');
const { eq } = require('drizzle-orm');
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Schema simplificado para o script
const users = {
  id: 'id',
  email: 'email',
  name: 'name',
  password: 'password',
  role: 'role',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4];

  if (!email || !password) {
    console.error('❌ Uso: node scripts/create-admin.js <email> <senha> [nome]');
    console.log(
      'Exemplo: node scripts/create-admin.js admin@arafacriou.com.br admin123 "Administrador"'
    );
    process.exit(1);
  }

  try {
    // Conectar ao banco
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('❌ DATABASE_URL não encontrada no .env.local');
      process.exit(1);
    }

    const client = postgres(connectionString);
    const db = drizzle(client);

    console.log(`🔍 Verificando se usuário ${email} já existe...`);

    // Verificar se usuário já existe
    const existingUsers = await client`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `;

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      if (existingUser.role === 'admin') {
        console.log(`✅ ${email} já é admin`);
        await client.end();
        process.exit(0);
      }

      // Promover usuário existente a admin
      await client`
        UPDATE users 
        SET role = 'admin', updated_at = NOW() 
        WHERE email = ${email}
      `;

      console.log(`✅ ${email} promovido a admin com sucesso!`);
      console.log(`🎉 ${existingUser.name || email} agora pode acessar /admin`);
      await client.end();
      process.exit(0);
    }

    // Criar novo usuário admin
    console.log(`👤 Criando novo usuário admin: ${email}`);
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await client`
      INSERT INTO users (id, email, name, password, role, created_at, updated_at)
      VALUES (
        ${'admin-' + Date.now()},
        ${email},
        ${name || 'Administrador'},
        ${hashedPassword},
        'admin',
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log(`📧 Email: ${result[0].email}`);
    console.log(`👤 Nome: ${result[0].name}`);
    console.log(`🔑 Role: ${result[0].role}`);
    console.log(`🎉 Agora você pode fazer login em /admin`);

    await client.end();
  } catch (error) {
    console.error('❌ Erro ao criar/promover admin:', error);
    process.exit(1);
  }
}

createAdmin();
