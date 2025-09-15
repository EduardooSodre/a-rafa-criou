import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Configuração da conexão com o banco
const connectionString = process.env.DATABASE_URL!;

// Cliente postgres para queries com configuração SSL adequada para Neon
const client = postgres(connectionString, {
  max: 1,
  ssl: true, // Força SSL para Neon
  prepare: false, // Desabilita prepared statements para Neon
});

// Instância do Drizzle
export const db = drizzle(client, { schema });

// Exportar cliente para uso direto se necessário
export { client };
