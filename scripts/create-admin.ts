import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4];

  if (!email || !password) {
    console.error('❌ Uso: npx ts-node scripts/create-admin.ts <email> <senha> [nome]');
    console.log('Exemplo: npx ts-node scripts/create-admin.ts admin@arafacriou.com.br admin123 "Administrador"');
    process.exit(1);
  }

  try {
    console.log(`🔍 Verificando se usuário ${email} já existe...`);
    
    // Verificar se usuário já existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`✅ ${email} já é admin`);
        process.exit(0);
      }

      // Promover usuário existente a admin
      await db
        .update(users)
        .set({ 
          role: 'admin',
          updatedAt: new Date()
        })
        .where(eq(users.email, email));

      console.log(`✅ ${email} promovido a admin com sucesso!`);
      console.log(`🎉 ${existingUser.name || email} agora pode acessar /admin`);
      process.exit(0);
    }

    // Criar novo usuário admin
    console.log(`👤 Criando novo usuário admin: ${email}`);
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db
      .insert(users)
      .values({
        id: `admin-${Date.now()}`,
        email: email,
        name: name || 'Administrador',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log(`📧 Email: ${result[0].email}`);
    console.log(`👤 Nome: ${result[0].name}`);
    console.log(`🔑 Role: ${result[0].role}`);
    console.log(`🎉 Agora você pode fazer login em /admin`);

  } catch (error) {
    console.error('❌ Erro ao criar/promover admin:', error);
    process.exit(1);
  }
}

createAdmin();
