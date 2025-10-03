#!/usr/bin/env node
/**
 * Script para aplicar índices de performance no banco de dados
 * Rode com: node scripts/add-indexes.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Conectando ao banco de dados...');
    
    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'drizzle', '0003_add_performance_indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📊 Aplicando índices de performance...');
    
    await pool.query(sql);
    
    console.log('✅ Índices criados com sucesso!');
    console.log('');
    console.log('Índices adicionados:');
    console.log('  - idx_products_slug');
    console.log('  - idx_products_category');
    console.log('  - idx_products_featured');
    console.log('  - idx_products_active');
    console.log('  - idx_products_featured_active');
    console.log('  - idx_variations_product');
    console.log('  - idx_variations_active');
    console.log('  - idx_images_product');
    console.log('  - idx_images_variation');
    console.log('  - idx_images_main');
    console.log('  - idx_variation_attrs_variation');
    console.log('  - idx_variation_attrs_attribute');
    console.log('  - idx_files_variation');
    console.log('  - idx_files_product');
    console.log('  - idx_users_email');
    console.log('  - idx_orders_user');
    console.log('  - idx_orders_created_at');
    console.log('  - idx_order_items_order');
    console.log('');
    console.log('🚀 Performance do site deve estar significativamente melhor!');
    
  } catch (error) {
    console.error('❌ Erro ao criar índices:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
