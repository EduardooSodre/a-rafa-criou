import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const result = await db
      .insert(users)
      .values({
        id: 'admin-1',
        email: 'admin@arafacriou.com.br',
        name: 'Administrador',
        password: hashedPassword,
        role: 'admin',
      })
      .returning();

    console.log('✅ Usuário administrador criado:', result[0]);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  }
}

createAdmin().then(() => process.exit(0));
