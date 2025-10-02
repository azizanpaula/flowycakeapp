-- =============================================
-- CAKEFLOW DATABASE SETUP
-- Execute este script no SQL Editor do Supabase Dashboard
-- =============================================

-- Ekstensi necessária
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA DE PERFIS DE USUÁRIO (INTEGRAÇÃO COM CLERK)
-- =============================================
DROP TABLE IF EXISTS public.purchase_order_items CASCADE;
DROP TABLE IF EXISTS public.purchase_orders CASCADE;
DROP TABLE IF EXISTS public.production_logs CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.recipe_items CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.ingredients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'kasir' CHECK (role IN ('admin', 'kasir', 'staf_dapur')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABELAS DE INVENTÁRIO E PRODUTOS
-- =============================================

-- Tabela para ingredientes (bahan baku)
CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL, -- 'kg', 'gram', 'pcs', 'liter'
    low_stock_threshold NUMERIC(10, 2) DEFAULT 0,
    average_cost NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para produtos finais (kue)
CREATE TABLE public.products (
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
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    preparation_time INT, -- em minutos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens da receita (relação many-to-many)
CREATE TABLE public.recipe_items (
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
CREATE TABLE public.orders (
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
CREATE TABLE public.order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    price_per_item NUMERIC(10, 2) NOT NULL, -- Preço na venda
    total_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para registros de produção
CREATE TABLE public.production_logs (
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
CREATE TABLE public.purchase_orders (
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
CREATE TABLE public.purchase_order_items (
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
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid()::text = id);

-- 2. Produtos e Ingredientes: todos os usuários autenticados podem ver
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
CREATE POLICY "Authenticated users can view products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view ingredients" ON public.ingredients;
CREATE POLICY "Authenticated users can view ingredients" ON public.ingredients
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view recipes" ON public.recipes;
CREATE POLICY "Authenticated users can view recipes" ON public.recipes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view recipe items" ON public.recipe_items;
CREATE POLICY "Authenticated users can view recipe items" ON public.recipe_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Apenas Admin pode gerenciar produtos, ingredientes e receitas
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage ingredients" ON public.ingredients;
CREATE POLICY "Admins can manage ingredients" ON public.ingredients
  FOR ALL USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage recipes" ON public.recipes;
CREATE POLICY "Admins can manage recipes" ON public.recipes
  FOR ALL USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage recipe items" ON public.recipe_items;
CREATE POLICY "Admins can manage recipe items" ON public.recipe_items
  FOR ALL USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- 4. Pedidos: Kasir e Admin podem criar
DROP POLICY IF EXISTS "Cashiers and Admins can create orders" ON public.orders;
CREATE POLICY "Cashiers and Admins can create orders" ON public.orders
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'kasir'));

DROP POLICY IF EXISTS "Cashiers and Admins can view orders" ON public.orders;
CREATE POLICY "Cashiers and Admins can view orders" ON public.orders
  FOR SELECT USING (public.get_my_role() IN ('admin', 'kasir') OR user_id = auth.uid()::text);

-- 5. Itens do pedido: mesma política dos pedidos
DROP POLICY IF EXISTS "Cashiers and Admins can manage order items" ON public.order_items;
CREATE POLICY "Cashiers and Admins can manage order items" ON public.order_items
  FOR ALL USING (public.get_my_role() IN ('admin', 'kasir'));

-- 6. Produção: Staf Dapur e Admin podem registrar
DROP POLICY IF EXISTS "Kitchen staff and Admins can log production" ON public.production_logs;
CREATE POLICY "Kitchen staff and Admins can log production" ON public.production_logs
  FOR INSERT WITH CHECK (public.get_my_role() IN ('admin', 'staf_dapur'));

DROP POLICY IF EXISTS "Kitchen staff and Admins can view production logs" ON public.production_logs;
CREATE POLICY "Kitchen staff and Admins can view production logs" ON public.production_logs
  FOR SELECT USING (public.get_my_role() IN ('admin', 'staf_dapur') OR user_id = auth.uid()::text);

-- 7. Pedidos de compra: Apenas Admin
DROP POLICY IF EXISTS "Admins can manage purchase orders" ON public.purchase_orders;
CREATE POLICY "Admins can manage purchase orders" ON public.purchase_orders
  FOR ALL USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Admins can manage purchase order items" ON public.purchase_order_items;
CREATE POLICY "Admins can manage purchase order items" ON public.purchase_order_items
  FOR ALL USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

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

-- Limpar dados existentes primeiro
DELETE FROM public.purchase_order_items;
DELETE FROM public.purchase_orders;
DELETE FROM public.production_logs;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.recipe_items;
DELETE FROM public.recipes;
DELETE FROM public.products;
DELETE FROM public.ingredients;

-- Criar perfil demo padrão para desenvolvimento local
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
('Ragi', 1.00, 'kg', 0.20, 150000.00);

-- Inserir alguns produtos básicos
INSERT INTO public.products (name, price, current_stock, low_stock_threshold, description) VALUES
('Black Forest', 85000.00, 5, 2, 'Kue coklat klasik dengan cherry'),
('Tiramisu', 75000.00, 3, 1, 'Kue Italia dengan mascarpone'),
('Red Velvet', 80000.00, 4, 2, 'Kue merah dengan cream cheese'),
('Brownies', 45000.00, 8, 3, 'Kue coklat lembut'),
('Cupcake Vanilla', 25000.00, 12, 5, 'Cupcake dengan frosting vanilla'),
('Croissant', 18000.00, 15, 5, 'Roti Prancis berlapis');

-- Mensagem de sucesso
SELECT 'CakeFlow database setup completed successfully!' as status;
