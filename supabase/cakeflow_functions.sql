-- =============================================
-- CAKEFLOW DATABASE FUNCTIONS
-- Execute este script APÓS o setup inicial
-- =============================================

-- =============================================
-- FUNÇÕES RPC PARA GESTÃO DE ESTOQUE
-- =============================================

-- Função para decrementar estoque de produto
CREATE OR REPLACE FUNCTION decrement_product_stock(product_id UUID, quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET current_stock = current_stock - quantity,
      updated_at = NOW()
  WHERE id = product_id AND current_stock >= quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar estoque de produto
CREATE OR REPLACE FUNCTION increment_product_stock(product_id UUID, quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET current_stock = current_stock + quantity,
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para decrementar estoque de ingrediente
CREATE OR REPLACE FUNCTION decrement_ingredient_stock(ingredient_id UUID, quantity NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.ingredients
  SET current_stock = current_stock - quantity,
      updated_at = NOW()
  WHERE id = ingredient_id AND current_stock >= quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for ingredient %', ingredient_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar estoque de ingrediente
CREATE OR REPLACE FUNCTION increment_ingredient_stock(ingredient_id UUID, quantity NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.ingredients
  SET current_stock = current_stock + quantity,
      updated_at = NOW()
  WHERE id = ingredient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNÇÕES PARA RELATÓRIOS
-- =============================================

-- Função para obter relatório de vendas por período
CREATE OR REPLACE FUNCTION get_sales_report(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE (
  date DATE,
  total_orders BIGINT,
  total_revenue NUMERIC,
  total_items_sold BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(o.created_at) as date,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(SUM(oi.quantity), 0) as total_items_sold
  FROM public.orders o
  LEFT JOIN public.order_items oi ON o.id = oi.order_id
  WHERE o.created_at >= start_date AND o.created_at < end_date
    AND o.status = 'completed'
  GROUP BY DATE(o.created_at)
  ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter relatório de produtos mais vendidos
CREATE OR REPLACE FUNCTION get_top_products_report(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ, limit_count INT DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  total_quantity BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.name as product_name,
    COALESCE(SUM(oi.quantity), 0) as total_quantity,
    COALESCE(SUM(oi.total_price), 0) as total_revenue
  FROM public.products p
  LEFT JOIN public.order_items oi ON p.id = oi.product_id
  LEFT JOIN public.orders o ON oi.order_id = o.id
  WHERE (o.created_at >= start_date AND o.created_at < end_date AND o.status = 'completed')
     OR o.id IS NULL
  GROUP BY p.id, p.name
  ORDER BY total_quantity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter relatório de lucro/prejuízo
CREATE OR REPLACE FUNCTION get_profit_loss_report(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE (
  period TEXT,
  total_revenue NUMERIC,
  total_cost_of_goods NUMERIC,
  gross_profit NUMERIC,
  profit_margin NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(start_date, 'YYYY-MM') as period,
    COALESCE(SUM(o.total_amount), 0) as total_revenue,
    COALESCE(SUM(pl.production_cost), 0) as total_cost_of_goods,
    COALESCE(SUM(o.total_amount), 0) - COALESCE(SUM(pl.production_cost), 0) as gross_profit,
    CASE
      WHEN COALESCE(SUM(o.total_amount), 0) > 0 THEN
        ((COALESCE(SUM(o.total_amount), 0) - COALESCE(SUM(pl.production_cost), 0)) / COALESCE(SUM(o.total_amount), 0)) * 100
      ELSE 0
    END as profit_margin
  FROM public.orders o
  LEFT JOIN public.order_items oi ON o.id = oi.order_id
  LEFT JOIN public.production_logs pl ON oi.product_id = pl.product_id
    AND DATE_TRUNC('month', o.created_at) = DATE_TRUNC('month', pl.created_at)
  WHERE o.created_at >= start_date AND o.created_at < end_date
    AND o.status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'CakeFlow functions created successfully!' as status;
