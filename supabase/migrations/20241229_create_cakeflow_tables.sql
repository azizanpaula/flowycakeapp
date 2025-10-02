-- =============================================
-- CAKEFLOW DATABASE MIGRATION
-- Aplicação de Gerenciamento de Usaha Kue
-- =============================================

-- Ekstensi necessária
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA DE PERFIS DE USUÁRIO (INTEGRAÇÃO COM CLERK)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'kasir' CHECK (role IN ('admin', 'kasir', 'staf_dapur')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'kasir';

UPDATE public.profiles
  SET role = COALESCE(role, 'kasir');

DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'kasir', 'staf_dapur'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- Ajustar foreign keys legadas e garantir tipo TEXT em perfis e tabelas relacionadas
-- Remover políticas dependentes de user_id antes de alterar tipos de coluna
DO $$
DECLARE
  pol RECORD;
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.orders', pol.policyname);
    END LOOP;
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
  END IF;

  IF to_regclass('public.production_logs') IS NOT NULL THEN
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'production_logs'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.production_logs', pol.policyname);
    END LOOP;
  END IF;

  IF to_regclass('public.purchase_orders') IS NOT NULL THEN
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'purchase_orders'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.purchase_orders', pol.policyname);
    END LOOP;
  END IF;
END;
$$;

DO $$
BEGIN
  -- Remover foreign keys existentes que referenciam profiles.id
  IF to_regclass('public.orders') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
    EXCEPTION
      WHEN undefined_table THEN NULL;
    END;
  END IF;

  IF to_regclass('public.production_logs') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.production_logs DROP CONSTRAINT IF EXISTS production_logs_user_id_fkey;
    EXCEPTION
      WHEN undefined_table THEN NULL;
    END;
  END IF;

  IF to_regclass('public.purchase_orders') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_user_id_fkey;
    EXCEPTION
      WHEN undefined_table THEN NULL;
    END;
  END IF;

  -- Garantir que colunas user_id usem TEXT
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'user_id'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.orders
      ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'production_logs'
      AND column_name = 'user_id'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.production_logs
      ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'purchase_orders'
      AND column_name = 'user_id'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.purchase_orders
      ALTER COLUMN user_id TYPE TEXT USING user_id::text;
  END IF;

  -- Garantir que profiles.id seja TEXT
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'id'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.profiles
      ALTER COLUMN id TYPE TEXT USING id::text;
  END IF;

  -- Migrar dados legados baseados em user_id quando coluna existir
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'user_id'
  ) THEN
    IF to_regclass('public.orders') IS NOT NULL THEN
      UPDATE public.orders o
      SET user_id = p.user_id
      FROM public.profiles p
      WHERE o.user_id IS NOT NULL
        AND p.id = o.user_id
        AND p.user_id IS NOT NULL;
    END IF;

    IF to_regclass('public.production_logs') IS NOT NULL THEN
      UPDATE public.production_logs pl
      SET user_id = p.user_id
      FROM public.profiles p
      WHERE pl.user_id IS NOT NULL
        AND p.id = pl.user_id
        AND p.user_id IS NOT NULL;
    END IF;

    IF to_regclass('public.purchase_orders') IS NOT NULL THEN
      UPDATE public.purchase_orders po
      SET user_id = p.user_id
      FROM public.profiles p
      WHERE po.user_id IS NOT NULL
        AND p.id = po.user_id
        AND p.user_id IS NOT NULL;
    END IF;

    UPDATE public.profiles
      SET id = user_id
      WHERE user_id IS NOT NULL;

    ALTER TABLE public.profiles ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS user_id;
  END IF;

  -- Recriar constraints com o novo tipo
  IF to_regclass('public.orders') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.orders
        ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.production_logs') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.production_logs
        ADD CONSTRAINT production_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END IF;

  IF to_regclass('public.purchase_orders') IS NOT NULL THEN
    BEGIN
      ALTER TABLE public.purchase_orders
        ADD CONSTRAINT purchase_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
    EXCEPTION
      WHEN undefined_table THEN NULL;
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END;
$$;

DROP INDEX IF EXISTS idx_profiles_user_id;

-- =============================================
-- TABELAS DE INVENTÁRIO E PRODUTOS
-- =============================================

-- Tabela para ingredientes (bahan baku)
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL, -- 'kg', 'gram', 'pcs', 'liter'
    low_stock_threshold NUMERIC(10, 2) DEFAULT 0,
    average_cost NUMERIC(10, 2) DEFAULT 0,
    last_purchase_price NUMERIC(10, 2),
    last_purchase_quantity NUMERIC(10, 3),
    last_purchase_unit TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS last_purchase_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS last_purchase_quantity NUMERIC(10, 3),
  ADD COLUMN IF NOT EXISTS last_purchase_unit TEXT;

-- Tabela para produtos finais (kue)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 0,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para receitas
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    preparation_time INT, -- em minutos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens da receita (relação many-to-many)
CREATE TABLE IF NOT EXISTS public.recipe_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    quantity_needed NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELAS TRANSAÇÃO
-- =============================================

-- Tabela para pedidos (POS)
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES public.profiles(id), -- Kasir que atendeu
    customer_name TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer', 'debit', 'credit')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para itens do pedido
CREATE TABLE IF NOT EXISTS public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    price_per_item NUMERIC(10, 2) NOT NULL, -- Preço na venda
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para registros de produção
CREATE TABLE IF NOT EXISTS public.production_logs (
    id BIGSERIAL PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity_produced INT NOT NULL,
    user_id TEXT REFERENCES public.profiles(id), -- Staf que produziu
    batch_number TEXT UNIQUE,
    production_cost NUMERIC(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para pedidos de compra (suppliers)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    supplier_contact TEXT,
    total_cost NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
    user_id TEXT REFERENCES public.profiles(id), -- Quem registrou
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para itens do pedido de compra
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    cost_per_item NUMERIC(10, 2) NOT NULL,
    total_cost NUMERIC(10, 2) NOT NULL,
    received_quantity INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Função helper para obter role do usuário
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS

-- 1. Perfis: usuários podem ver/editar apenas seu próprio perfil
DO $$
BEGIN
  CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid()::text = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid()::text = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid()::text = id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Anon service can manage profiles" ON public.profiles
    FOR ALL USING (auth.role() = 'anon')
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- 2. Produtos e Ingredientes: todos os usuários autenticados podem ver
DO $$
BEGIN
  CREATE POLICY "Authenticated users can view products" ON public.products
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view ingredients" ON public.ingredients
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view recipes" ON public.recipes
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view recipe items" ON public.recipe_items
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- 3. Apenas Admin pode gerenciar produtos, ingredientes e receitas
DO $$
BEGIN
  CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Anon service can manage products" ON public.products
    FOR ALL USING (auth.role() = 'anon')
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Admins can manage ingredients" ON public.ingredients
    FOR ALL USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Anon service can manage ingredients" ON public.ingredients
    FOR ALL USING (auth.role() = 'anon')
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Admins can manage recipes" ON public.recipes
    FOR ALL USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Anon service can manage recipes" ON public.recipes
    FOR ALL USING (auth.role() = 'anon')
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Admins can manage recipe items" ON public.recipe_items
    FOR ALL USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Anon service can manage recipe items" ON public.recipe_items
    FOR ALL USING (auth.role() = 'anon')
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- 4. Pedidos: Kasir e Admin podem criar
DO $$
BEGIN
  CREATE POLICY "Cashiers and Admins can create orders" ON public.orders
    FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'kasir'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Cashiers and Admins can view orders" ON public.orders
    FOR SELECT USING (public.get_my_role() IN ('admin', 'kasir') OR user_id = auth.uid()::text);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Anon service can manage orders" ON public.orders
    FOR ALL USING (auth.role() = 'anon')
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- 5. Itens do pedido: mesma política dos pedidos
DO $$
BEGIN
  CREATE POLICY "Cashiers and Admins can manage order items" ON public.order_items
    FOR ALL USING (public.get_my_role() IN ('admin', 'kasir'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Anon service can manage order items" ON public.order_items
    FOR ALL USING (auth.role() = 'anon')
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- 6. Produção: Staf Dapur e Admin podem registrar
DO $$
BEGIN
  CREATE POLICY "Kitchen staff and Admins can log production" ON public.production_logs
    FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'staf_dapur'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Kitchen staff and Admins can view production logs" ON public.production_logs
    FOR SELECT USING (public.get_my_role() IN ('admin', 'staf_dapur') OR user_id = auth.uid()::text);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Anon service can manage production logs" ON public.production_logs
    FOR ALL USING (auth.role() = 'anon')
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- 7. Pedidos de compra: Apenas Admin
DO $$
BEGIN
  CREATE POLICY "Admins can manage purchase orders" ON public.purchase_orders
    FOR ALL USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  CREATE POLICY "Admins can manage purchase order items" ON public.purchase_order_items
    FOR ALL USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON public.ingredients(name);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_created_at ON public.production_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ingredients_updated_at ON public.ingredients;
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recipes_updated_at ON public.recipes;
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON public.purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DADOS INICIAIS (SEED DATA)
-- =============================================

-- Perfil demo para desenvolvimento local
INSERT INTO public.profiles (id, full_name, role)
VALUES ('demo-user', 'Demo User', 'admin')
ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;

-- Inserir alguns ingredientes básicos
INSERT INTO public.ingredients (name, current_stock, unit, low_stock_threshold, average_cost) VALUES
('Tepung Terigu', 50.00, 'kg', 10.00, 12000.00),
('Gula Pasir', 25.00, 'kg', 5.00, 15000.00),
('Telur', 100.00, 'pcs', 20.00, 2500.00),
('Mentega', 20.00, 'kg', 5.00, 55000.00),
('Susu Cair', 30.00, 'liter', 5.00, 18000.00),
('Coklat Bubuk', 5.00, 'kg', 1.00, 85000.00),
('Vanilla Essence', 2.00, 'liter', 0.50, 125000.00),
('Ragi', 1.00, 'kg', 0.20, 150000.00)
ON CONFLICT (name) DO NOTHING;

-- Inserir alguns produtos básicos
INSERT INTO public.products (name, price, current_stock, low_stock_threshold, description) VALUES
('Black Forest', 85000.00, 5, 2, 'Kue coklat klasik dengan cherry'),
('Tiramisu', 75000.00, 3, 1, 'Kue Italia dengan mascarpone'),
('Red Velvet', 80000.00, 4, 2, 'Kue merah dengan cream cheese'),
('Brownies', 45000.00, 8, 3, 'Kue coklat lembut'),
('Cupcake Vanilla', 25000.00, 12, 5, 'Cupcake dengan frosting vanilla'),
('Croissant', 18000.00, 15, 5, 'Roti Prancis berlapis')
ON CONFLICT (name) DO NOTHING;
