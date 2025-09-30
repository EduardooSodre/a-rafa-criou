export const up = async () => {
  return `
    -- Tabela attributes
    CREATE TABLE IF NOT EXISTS attributes (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name varchar(255) NOT NULL,
      slug varchar(255) NOT NULL UNIQUE,
      sort_order integer DEFAULT 0,
      is_active boolean DEFAULT true NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    -- Tabela attribute_values
    CREATE TABLE IF NOT EXISTS attribute_values (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      attribute_id uuid NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
      value varchar(255) NOT NULL,
      slug varchar(255) NOT NULL,
      sort_order integer DEFAULT 0,
      is_default boolean DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    -- Relação product_attributes
    CREATE TABLE IF NOT EXISTS product_attributes (
      product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      attribute_id uuid NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, attribute_id)
    );

    -- Relação variation_attribute_values
    CREATE TABLE IF NOT EXISTS variation_attribute_values (
      variation_id uuid NOT NULL REFERENCES product_variations(id) ON DELETE CASCADE,
      attribute_id uuid NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
      value_id uuid NOT NULL REFERENCES attribute_values(id) ON DELETE CASCADE,
      PRIMARY KEY (variation_id, attribute_id, value_id)
    );
  `;
};

export const down = async () => {
  return `
    DROP TABLE IF EXISTS variation_attribute_values;
    DROP TABLE IF EXISTS product_attributes;
    DROP TABLE IF EXISTS attribute_values;
    DROP TABLE IF EXISTS attributes;
  `;
};
