-- Migration: Add Performance Indexes
-- Created: 2025-10-03
-- Purpose: Otimizar queries mais frequentes do e-commerce

-- Índice para busca por slug de produtos (usado em páginas de produto)
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Índice para filtrar produtos por categoria
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Índice para produtos em destaque (featured products na home)
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;

-- Índice para produtos ativos
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;

-- Índice composto para produtos em destaque E ativos (query mais comum)
CREATE INDEX IF NOT EXISTS idx_products_featured_active ON products(is_featured, is_active) WHERE is_featured = true AND is_active = true;

-- Índice para variações de um produto específico
CREATE INDEX IF NOT EXISTS idx_variations_product ON product_variations(product_id);

-- Índice para variações ativas
CREATE INDEX IF NOT EXISTS idx_variations_active ON product_variations(is_active) WHERE is_active = true;

-- Índice para imagens de um produto
CREATE INDEX IF NOT EXISTS idx_images_product ON product_images(product_id);

-- Índice para imagens de uma variação específica
CREATE INDEX IF NOT EXISTS idx_images_variation ON product_images(variation_id);

-- Índice para imagem principal de produto (usado no card de produto)
CREATE INDEX IF NOT EXISTS idx_images_main ON product_images(product_id, is_main) WHERE is_main = true;

-- Índice para valores de atributos por variação
CREATE INDEX IF NOT EXISTS idx_variation_attrs_variation ON variation_attribute_values(variation_id);

-- Índice para valores de atributos por atributo
CREATE INDEX IF NOT EXISTS idx_variation_attrs_attribute ON variation_attribute_values(attribute_id);

-- Índice para arquivos de uma variação
CREATE INDEX IF NOT EXISTS idx_files_variation ON files(variation_id);

-- Índice para arquivos de um produto
CREATE INDEX IF NOT EXISTS idx_files_product ON files(product_id);

-- Índice para busca de usuário por email (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Índice para pedidos de um usuário
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

-- Índice para pedidos por data (relatórios)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Índice para itens de um pedido
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ANALYZE para atualizar estatísticas do PostgreSQL
ANALYZE products;
ANALYZE product_variations;
ANALYZE product_images;
ANALYZE variation_attribute_values;
ANALYZE files;
ANALYZE users;
ANALYZE orders;
ANALYZE order_items;
