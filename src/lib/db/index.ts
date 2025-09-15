import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Desabilitar warning de conexão SSL em desenvolvimento
const connectionString = process.env.DATABASE_URL!;

// Cliente postgres para queries
const client = postgres(connectionString, { 
  max: 1,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false 
});

// Instância do Drizzle
export const db = drizzle(client, { schema });

// Exportar cliente para uso direto se necessário
export { client };