import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  decimal,
  boolean,
  json,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// AUTENTICAÇÃO (Auth.js compatible)
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified'),
  image: text('image'),
  password: text('password'), // Para auth com credentials
  role: varchar('role', { length: 20 }).notNull().default('customer'), // admin, member, customer
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  account => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires').notNull(),
  },
  vt => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ============================================================================
// E-COMMERCE CORE
// ============================================================================

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  parentId: uuid('parent_id'), // Para subcategorias - self-reference
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  shortDescription: text('short_description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id),
  isActive: boolean('is_active').default(true).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productVariations = pgTable('product_variations', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  variationId: uuid('variation_id').references(() => productVariations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(), // bytes
  path: text('path').notNull(), // caminho no R2
  hash: varchar('hash', { length: 64 }), // SHA-256 para verificação
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productImages = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  variationId: uuid('variation_id').references(() => productVariations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(), // bytes
  data: text('data').notNull(), // imagem em base64
  alt: varchar('alt', { length: 255 }), // texto alternativo para acessibilidade
  sortOrder: integer('sort_order').default(0),
  isMain: boolean('is_main').default(false), // imagem principal do produto/variação
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// PEDIDOS
// ============================================================================

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id),
  email: varchar('email', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, processing, completed, cancelled, refunded
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('BRL'),
  paymentProvider: varchar('payment_provider', { length: 50 }), // stripe, paypal, pix
  paymentId: varchar('payment_id', { length: 255 }), // ID do pagamento no provider
  paymentStatus: varchar('payment_status', { length: 50 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  variationId: uuid('variation_id').references(() => productVariations.id),
  name: varchar('name', { length: 255 }).notNull(), // snapshot do nome
  price: decimal('price', { precision: 10, scale: 2 }).notNull(), // snapshot do preço
  quantity: integer('quantity').notNull().default(1),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// DOWNLOADS E ACESSO
// ============================================================================

export const downloads = pgTable('downloads', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id),
  fileId: uuid('file_id')
    .notNull()
    .references(() => files.id),
  ip: varchar('ip', { length: 45 }),
  userAgent: text('user_agent'),
  downloadedAt: timestamp('downloaded_at').defaultNow().notNull(),
});

// ============================================================================
// CUPONS
// ============================================================================

export const coupons = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull(), // percent, fixed
  value: decimal('value', { precision: 10, scale: 2 }).notNull(),
  minSubtotal: decimal('min_subtotal', { precision: 10, scale: 2 }),
  maxUses: integer('max_uses'),
  maxUsesPerUser: integer('max_uses_per_user').default(1),
  usedCount: integer('used_count').default(0),
  appliesTo: varchar('applies_to', { length: 20 }).notNull().default('all'), // all, products, variations
  stackable: boolean('stackable').default(false),
  isActive: boolean('is_active').default(true).notNull(),
  startsAt: timestamp('starts_at'),
  endsAt: timestamp('ends_at'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const couponProducts = pgTable(
  'coupon_products',
  {
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
  },
  table => ({
    pk: primaryKey({ columns: [table.couponId, table.productId] }),
  })
);

export const couponVariations = pgTable(
  'coupon_variations',
  {
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    variationId: uuid('variation_id')
      .notNull()
      .references(() => productVariations.id, { onDelete: 'cascade' }),
  },
  table => ({
    pk: primaryKey({ columns: [table.couponId, table.variationId] }),
  })
);

export const couponRedemptions = pgTable('coupon_redemptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  couponId: uuid('coupon_id')
    .notNull()
    .references(() => coupons.id),
  userId: text('user_id').references(() => users.id),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id),
  amountDiscounted: decimal('amount_discounted', { precision: 10, scale: 2 }).notNull(),
  usedAt: timestamp('used_at').defaultNow().notNull(),
});

// ============================================================================
// CMS EMBUTIDO
// ============================================================================

export const contentPages = pgTable(
  'content_pages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 100 }).notNull(), // home, sobre, contato, etc
    lang: varchar('lang', { length: 2 }).notNull().default('pt'), // pt, en
    isActive: boolean('is_active').default(true),
    updatedBy: text('updated_by').references(() => users.id),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => ({
    uniqueSlugLang: unique().on(table.slug, table.lang),
  })
);

export const contentBlocks = pgTable('content_blocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: uuid('page_id')
    .notNull()
    .references(() => contentPages.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 100 }).notNull(), // hero_title, hero_subtitle, etc
  type: varchar('type', { length: 20 }).notNull(), // text, richtext, image, list
  valueJson: json('value_json').notNull(),
  sortOrder: integer('sort_order').default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contentVersions = pgTable('content_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  blockId: uuid('block_id')
    .notNull()
    .references(() => contentBlocks.id, { onDelete: 'cascade' }),
  valueJson: json('value_json').notNull(),
  savedBy: text('saved_by').references(() => users.id),
  savedAt: timestamp('saved_at').defaultNow().notNull(),
});

// ============================================================================
// SEO E REDIRECIONAMENTOS
// ============================================================================

export const urlMap = pgTable('url_map', {
  id: uuid('id').defaultRandom().primaryKey(),
  oldUrl: text('old_url').notNull(),
  newUrl: text('new_url').notNull(),
  statusCode: integer('status_code').notNull().default(301),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// CONVITES PARA MEMBROS
// ============================================================================

export const invites = pgTable('invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // admin, member
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  usedBy: text('used_by').references(() => users.id),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// RELAÇÕES (Drizzle Relations)
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  orders: many(orders),
  downloads: many(downloads),
  invitesCreated: many(invites, { relationName: 'inviteCreator' }),
  inviteUsed: many(invites, { relationName: 'inviteUser' }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  variations: many(productVariations),
  files: many(files),
  images: many(productImages),
  orderItems: many(orderItems),
  couponProducts: many(couponProducts),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productVariationsRelations = relations(productVariations, ({ one, many }) => ({
  product: one(products, { fields: [productVariations.productId], references: [products.id] }),
  files: many(files),
  images: many(productImages),
  orderItems: many(orderItems),
  couponVariations: many(couponVariations),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  downloads: many(downloads),
  couponRedemptions: many(couponRedemptions),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  variation: one(productVariations, {
    fields: [orderItems.variationId],
    references: [productVariations.id],
  }),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  product: one(products, { fields: [files.productId], references: [products.id] }),
  variation: one(productVariations, {
    fields: [files.variationId],
    references: [productVariations.id],
  }),
  downloads: many(downloads),
}));

// ============================================================================
// ATRIBUTOS E VARIAÇÕES (NORMALIZADO)
// ============================================================================

export const attributes = pgTable('attributes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const attributeValues = pgTable('attribute_values', {
  id: uuid('id').defaultRandom().primaryKey(),
  attributeId: uuid('attribute_id')
    .notNull()
    .references(() => attributes.id, { onDelete: 'cascade' }),
  value: varchar('value', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  sortOrder: integer('sort_order').default(0),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productAttributes = pgTable(
  'product_attributes',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    attributeId: uuid('attribute_id')
      .notNull()
      .references(() => attributes.id, { onDelete: 'cascade' }),
  },
  table => ({
    pk: primaryKey({ columns: [table.productId, table.attributeId] }),
  })
);

export const variationAttributeValues = pgTable(
  'variation_attribute_values',
  {
    variationId: uuid('variation_id')
      .notNull()
      .references(() => productVariations.id, { onDelete: 'cascade' }),
    attributeId: uuid('attribute_id')
      .notNull()
      .references(() => attributes.id, { onDelete: 'cascade' }),
    valueId: uuid('value_id')
      .notNull()
      .references(() => attributeValues.id, { onDelete: 'cascade' }),
  },
  table => ({
    pk: primaryKey({ columns: [table.variationId, table.attributeId, table.valueId] }),
  })
);

export const attributesRelations = relations(attributes, ({ many }) => ({
  values: many(attributeValues),
  productAttributes: many(productAttributes),
}));

export const attributeValuesRelations = relations(attributeValues, ({ one }) => ({
  attribute: one(attributes, {
    fields: [attributeValues.attributeId],
    references: [attributes.id],
  }),
}));

export const productAttributesRelations = relations(productAttributes, ({ one }) => ({
  product: one(products, { fields: [productAttributes.productId], references: [products.id] }),
  attribute: one(attributes, {
    fields: [productAttributes.attributeId],
    references: [attributes.id],
  }),
}));

export const variationAttributeValuesRelations = relations(variationAttributeValues, ({ one }) => ({
  variation: one(productVariations, {
    fields: [variationAttributeValues.variationId],
    references: [productVariations.id],
  }),
  attribute: one(attributes, {
    fields: [variationAttributeValues.attributeId],
    references: [attributes.id],
  }),
  value: one(attributeValues, {
    fields: [variationAttributeValues.valueId],
    references: [attributeValues.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  variation: one(productVariations, {
    fields: [productImages.variationId],
    references: [productVariations.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  products: many(couponProducts),
  variations: many(couponVariations),
  redemptions: many(couponRedemptions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
