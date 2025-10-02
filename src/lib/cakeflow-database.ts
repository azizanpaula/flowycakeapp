// =============================================
// CAKEFLOW DATABASE FUNCTIONS
// Funções específicas para o negócio de bolos
// =============================================

import { createSupabaseServerClient } from "@/lib/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"

type PostgrestErrorLike = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

const reportedSupabaseIssues = new Set<string>();

function reportSupabaseIssue(error: PostgrestErrorLike | null, context: string) {
  if (!error) {
    return;
  }

  const key = `${context}:${error.code ?? error.message ?? "unknown"}`;
  if (reportedSupabaseIssues.has(key)) {
    return;
  }

  reportedSupabaseIssues.add(key);

  if (error.code === "PGRST205") {
    console.warn(`[Supabase] Missing table while querying ${context}. Apply CakeFlow migrations in Supabase.`, error);
    return;
  }

  console.error(`[Supabase] Error in ${context}:`, error);
}

type UnitCategory = 'mass' | 'volume' | 'count'

const MASS_UNITS: Record<string, number> = {
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  kilo: 1000,
  g: 1,
  gram: 1,
  grams: 1,
}

const VOLUME_UNITS: Record<string, number> = {
  l: 1000,
  liter: 1000,
  litre: 1000,
  liters: 1000,
  litres: 1000,
  ml: 1,
  milliliter: 1,
  millilitre: 1,
  milliliters: 1,
  millilitres: 1,
}

function resolveUnit(unitRaw: string | undefined): { category: UnitCategory; multiplier: number } {
  const raw = (unitRaw ?? '').toLowerCase().trim()
  const cleaned = raw.replace(/[0-9.,\s]/g, '')
  const unit = cleaned.length > 0 ? cleaned : raw
  if (!unit) {
    return { category: 'count', multiplier: 1 }
  }

  if (unit in MASS_UNITS) {
    return { category: 'mass', multiplier: MASS_UNITS[unit] }
  }

  if (unit in VOLUME_UNITS) {
    return { category: 'volume', multiplier: VOLUME_UNITS[unit] }
  }

  if (unit.endsWith('kg')) {
    return { category: 'mass', multiplier: 1000 }
  }
  if (unit.endsWith('g') || unit.includes('gram')) {
    return { category: 'mass', multiplier: 1 }
  }
  if (unit.includes('liter') || unit.includes('litre') || unit === 'l') {
    return { category: 'volume', multiplier: 1000 }
  }
  if (unit === 'ml' || unit.includes('millil')) {
    return { category: 'volume', multiplier: 1 }
  }

  return { category: 'count', multiplier: 1 }
}

function normalizePurchaseQuantity(
  purchaseQuantity: number | undefined,
  purchaseUnit: string | undefined,
  baseUnit: string
): number | null {
  if (purchaseQuantity == null || purchaseQuantity <= 0) {
    return null
  }

  const base = resolveUnit(baseUnit)
  const purchase = resolveUnit(purchaseUnit)

  if (base.category !== purchase.category) {
    return purchaseQuantity
  }

  if (base.multiplier === purchase.multiplier) {
    return purchaseQuantity
  }

  return (purchaseQuantity * purchase.multiplier) / base.multiplier
}

// =============================================
// TYPES
// =============================================

export interface Ingredient {
  id: string
  name: string
  current_stock: number
  unit: string
  low_stock_threshold: number
  average_cost: number
  last_purchase_price?: number | null
  last_purchase_quantity?: number | null
  last_purchase_unit?: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  price: number
  current_stock: number
  low_stock_threshold: number
  image_url?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  product_id: string
  name: string
  description?: string
  preparation_time?: number
  created_at: string
  updated_at: string
  product?: Product
}

export interface RecipeItem {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity_needed: number
  unit: string
  created_at: string
  ingredient?: Ingredient
}

export interface Order {
  id: number
  user_id?: string
  customer_name?: string
  total_amount: number
  payment_method: 'cash' | 'qris' | 'transfer' | 'debit' | 'credit'
  status: 'pending' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  user?: {
    full_name?: string
  }
  items?: Array<OrderItem & { product?: Product }>
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: string
  quantity: number
  price_per_item: number
  total_price: number
  created_at: string
  product?: Product
}

export interface ProductionLog {
  id: number
  recipe_id: string
  product_id: string
  quantity_produced: number
  user_id?: string
  batch_number?: string
  production_cost?: number
  notes?: string
  created_at: string
  user?: {
    full_name?: string
  }
  recipe?: Recipe
  product?: Product
}

export interface ProductCostSummary {
  product_id: string
  product_name: string
  hpp_per_unit: number
  selling_price?: number
  gross_profit_per_unit?: number
  gross_margin_percentage?: number
  total_quantity_sold?: number
  total_cogs?: number
}

export interface FinancialReportSummary {
  period_start: string
  period_end: string
  total_revenue: number
  total_cogs: number
  gross_profit: number
  gross_margin: number
  product_costs: ProductCostSummary[]
}

export interface PurchaseOrder {
  id: number
  supplier_name: string
  supplier_contact?: string
  total_cost: number
  status: 'pending' | 'ordered' | 'received' | 'cancelled'
  user_id?: string
  notes?: string
  created_at: string
  updated_at: string
  user?: {
    full_name?: string
  }
}

export interface PurchaseOrderItem {
  id: number
  purchase_order_id: number
  ingredient_id: string
  quantity: number
  cost_per_item: number
  total_cost: number
  received_quantity: number
  created_at: string
  ingredient?: Ingredient
}

// =============================================
// INGREDIENT FUNCTIONS
// =============================================

export async function getIngredients() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching ingredients:', error)
    return []
  }

  return (data ?? []).map((item) => ({
    ...item,
    average_cost: Number(item.average_cost ?? 0),
    last_purchase_price: item.last_purchase_price != null ? Number(item.last_purchase_price) : null,
    last_purchase_quantity: item.last_purchase_quantity != null ? Number(item.last_purchase_quantity) : null,
  })) as Ingredient[]
}

export async function createIngredient(ingredientData: {
  name: string
  current_stock: number
  unit: string
  low_stock_threshold?: number
  purchase_price?: number
  purchase_quantity?: number
  purchase_unit?: string
}) {
  const supabase = await createSupabaseServerClient()

  const normalizedQuantity = normalizePurchaseQuantity(
    ingredientData.purchase_quantity,
    ingredientData.purchase_unit ?? ingredientData.unit,
    ingredientData.unit
  )

  let averageCost = 0
  if (ingredientData.purchase_price != null) {
    if (normalizedQuantity) {
      averageCost = Number((ingredientData.purchase_price / normalizedQuantity).toFixed(4))
    } else {
      averageCost = Number(ingredientData.purchase_price.toFixed(4))
    }
  }

  const { data, error } = await supabase
    .from('ingredients')
    .insert({
      name: ingredientData.name,
      current_stock: ingredientData.current_stock,
      unit: ingredientData.unit,
      low_stock_threshold: ingredientData.low_stock_threshold || 0,
      average_cost: averageCost,
      last_purchase_price: ingredientData.purchase_price,
      last_purchase_quantity: ingredientData.purchase_quantity,
      last_purchase_unit: ingredientData.purchase_unit ?? ingredientData.unit,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating ingredient:', error)
    return null
  }

  return {
    ...data,
    average_cost: Number(data.average_cost ?? 0),
    last_purchase_price: data.last_purchase_price != null ? Number(data.last_purchase_price) : null,
    last_purchase_quantity: data.last_purchase_quantity != null ? Number(data.last_purchase_quantity) : null,
  } as Ingredient
}

async function getIngredientUnit(ingredientId: string, supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('ingredients')
    .select('unit')
    .eq('id', ingredientId)
    .single()

  if (error) {
    console.error('Error fetching ingredient unit:', error)
    return 'pcs'
  }

  return data?.unit ?? 'pcs'
}

export async function updateIngredient(ingredientId: string, updates: {
  name?: string
  current_stock?: number
  unit?: string
  low_stock_threshold?: number
  purchase_price?: number
  purchase_quantity?: number
  purchase_unit?: string
}) {
  const supabase = await createSupabaseServerClient()

  const currentUnit = updates.unit
  let computedAverageCost: number | undefined
  if (
    updates.purchase_price != null &&
    updates.purchase_price >= 0 &&
    updates.purchase_quantity != null &&
    updates.purchase_quantity > 0
  ) {
    const baseUnit = currentUnit ?? (await getIngredientUnit(ingredientId, supabase))
    const normalizedQuantity = normalizePurchaseQuantity(
      updates.purchase_quantity,
      updates.purchase_unit ?? baseUnit,
      baseUnit
    )

    if (normalizedQuantity) {
      computedAverageCost = Number((updates.purchase_price / normalizedQuantity).toFixed(4))
    }
  } else if (updates.purchase_price != null && updates.purchase_price >= 0) {
    computedAverageCost = Number(updates.purchase_price.toFixed(4))
  }

  const payload: Record<string, unknown> = {
    name: updates.name,
    current_stock: updates.current_stock,
    unit: updates.unit,
    low_stock_threshold: updates.low_stock_threshold,
  }

  if (computedAverageCost != null) {
    payload.average_cost = computedAverageCost
  }

  if (updates.purchase_price != null) {
    payload.last_purchase_price = updates.purchase_price
  }

  if (updates.purchase_quantity != null) {
    payload.last_purchase_quantity = updates.purchase_quantity
  }

  if (updates.purchase_unit != null) {
    payload.last_purchase_unit = updates.purchase_unit
  } else if (updates.unit != null && updates.purchase_quantity != null) {
    payload.last_purchase_unit = updates.unit
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key]
    }
  })

  const { data, error } = await supabase
    .from('ingredients')
    .update(payload)
    .eq('id', ingredientId)
    .select()
    .single()

  if (error) {
    console.error('Error updating ingredient:', error)
    return null
  }

  return {
    ...data,
    average_cost: Number(data.average_cost ?? 0),
    last_purchase_price: data.last_purchase_price != null ? Number(data.last_purchase_price) : null,
    last_purchase_quantity: data.last_purchase_quantity != null ? Number(data.last_purchase_quantity) : null,
  } as Ingredient
}

export async function deleteIngredient(ingredientId: string) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('id', ingredientId)

  if (error) {
    console.error('Error deleting ingredient:', error)
    return false
  }

  return true
}

// =============================================
// PRODUCT FUNCTIONS
// =============================================

export async function getProducts() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data as Product[]
}

export async function createProduct(productData: {
  name: string
  price: number
  current_stock: number
  low_stock_threshold?: number
  image_url?: string
  description?: string
}) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: productData.name,
      price: productData.price,
      current_stock: productData.current_stock,
      low_stock_threshold: productData.low_stock_threshold || 0,
      image_url: productData.image_url,
      description: productData.description,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return null
  }

  return data as Product
}

export async function updateProduct(productId: string, updates: {
  name?: string
  price?: number
  current_stock?: number
  low_stock_threshold?: number
  image_url?: string
  description?: string
}) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return null
  }

  return data as Product
}

export async function deleteProduct(productId: string) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    console.error('Error deleting product:', error)
    return false
  }

  return true
}

// =============================================
// RECIPE FUNCTIONS
// =============================================

export async function getRecipes() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      product:products(*)
    `)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching recipes:', error)
    return []
  }

  return data as Recipe[]
}

export async function getRecipeItems(recipeId: string) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('recipe_items')
    .select(`
      *,
      ingredient:ingredients(*)
    `)
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching recipe items:', error)
    return []
  }

  return data as RecipeItem[]
}

export async function createRecipe(recipeData: {
  product_id: string
  name: string
  description?: string
  preparation_time?: number
}) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      product_id: recipeData.product_id,
      name: recipeData.name,
      description: recipeData.description,
      preparation_time: recipeData.preparation_time,
    })
    .select(`
      *,
      product:products(*)
    `)
    .single()

  if (error) {
    console.error('Error creating recipe:', error)
    return null
  }

  return data as Recipe
}

export async function addRecipeItem(recipeItemData: {
  recipe_id: string
  ingredient_id: string
  quantity_needed: number
  unit: string
}) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('recipe_items')
    .insert({
      recipe_id: recipeItemData.recipe_id,
      ingredient_id: recipeItemData.ingredient_id,
      quantity_needed: recipeItemData.quantity_needed,
      unit: recipeItemData.unit,
    })
    .select(`
      *,
      ingredient:ingredients(*)
    `)
    .single()

  if (error) {
    console.error('Error adding recipe item:', error)
    return null
  }

  return data as RecipeItem
}

export async function deleteRecipe(recipeId: string) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId)

  if (error) {
    console.error('Error deleting recipe:', error)
    return false
  }

  return true
}

// =============================================
// ORDER FUNCTIONS (POS)
// =============================================

export async function createOrder(orderData: {
  customer_name?: string
  payment_method: 'cash' | 'qris' | 'transfer' | 'debit' | 'credit'
  notes?: string
  items: Array<{
    product_id: string
    quantity: number
    price_per_item: number
  }>
}, userId?: string): Promise<Order | null> {
  const supabase = await createSupabaseServerClient()

  const userIdValue = userId && /^[0-9a-fA-F-]{36}$/.test(userId) ? userId : null

  // Calculate total
  const totalAmount = orderData.items.reduce((sum, item) =>
    sum + (item.price_per_item * item.quantity), 0
  )

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: userIdValue,
      customer_name: orderData.customer_name,
      total_amount: totalAmount,
      payment_method: orderData.payment_method,
      notes: orderData.notes,
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    return null
  }

  // Create order items and update stock
  for (const item of orderData.items) {
    const totalPrice = item.price_per_item * item.quantity

    // Insert order item
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_per_item: item.price_per_item,
        total_price: totalPrice,
      })

    if (itemError) {
      console.error('Error creating order item:', itemError)
      return null
    }

    // Update product stock
    const { error: stockError } = await supabase.rpc('decrement_product_stock', {
      product_id: item.product_id,
      quantity: item.quantity
    })

    if (stockError) {
      console.error('Error updating product stock:', stockError)
      // Continue anyway - stock update failure shouldn't block order
    }
  }

  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('order_id', order.id)
    .order('created_at', { ascending: true })

  if (itemsError) {
    reportSupabaseIssue(itemsError, 'order_items:after-create')
  }

  return {
    ...order,
    items: (itemsData ?? []) as Array<OrderItem & { product?: Product }>,
  } as Order
}

export async function getOrders(limit?: number) {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('orders')
    .select(`
      *,
      user:profiles(full_name)
    `)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    reportSupabaseIssue(error, 'orders');
    return []
  }

  return data as Order[]
}

export async function getOrderItems(orderId: number) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) {
    reportSupabaseIssue(error, 'order_items');
    return []
  }

  return data as OrderItem[]
}

// =============================================
// PRODUCTION FUNCTIONS
// =============================================

export async function logProduction(productionData: {
  recipe_id: string
  product_id: string
  quantity_produced: number
  batch_number?: string
  notes?: string
}, userId?: string) {
  const supabase = await createSupabaseServerClient()

  // Get recipe items to calculate costs and update ingredient stock
  const recipeItems = await getRecipeItems(productionData.recipe_id)

  let totalCost = 0
  for (const item of recipeItems) {
    const ingredientCost = item.quantity_needed * productionData.quantity_produced * item.ingredient!.average_cost
    totalCost += ingredientCost

    // Update ingredient stock
    const { error: stockError } = await supabase.rpc('decrement_ingredient_stock', {
      ingredient_id: item.ingredient_id,
      quantity: item.quantity_needed * productionData.quantity_produced
    })

    if (stockError) {
      console.error('Error updating ingredient stock:', stockError)
    }
  }

  // Update product stock
  const { error: productStockError } = await supabase.rpc('increment_product_stock', {
    product_id: productionData.product_id,
    quantity: productionData.quantity_produced
  })

  if (productStockError) {
    console.error('Error updating product stock:', productStockError)
  }

  // Create production log
  const { data, error } = await supabase
    .from('production_logs')
    .insert({
      recipe_id: productionData.recipe_id,
      product_id: productionData.product_id,
      quantity_produced: productionData.quantity_produced,
      user_id: userId,
      batch_number: productionData.batch_number,
      production_cost: totalCost,
      notes: productionData.notes,
    })
    .select(`
      *,
      user:profiles(full_name),
      recipe:recipes(name),
      product:products(name)
    `)
    .single()

  if (error) {
    console.error('Error logging production:', error)
    return null
  }

  return data as ProductionLog
}

export async function getProductionLogs(limit?: number) {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('production_logs')
    .select(`
      *,
      user:profiles(full_name),
      recipe:recipes(name),
      product:products(name)
    `)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    reportSupabaseIssue(error, 'production_logs');
    return []
  }

  return data as ProductionLog[]
}

// =============================================
// DASHBOARD STATS
// =============================================

export async function getCakeFlowDashboardStats() {
  const supabase = await createSupabaseServerClient()

  // Get today's date range
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  const [
    products,
    ingredients,
    todayOrders,
    todayRevenue,
    todayProduction
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, current_stock, low_stock_threshold', { count: 'exact' }),
    supabase
      .from('ingredients')
      .select('id, current_stock, low_stock_threshold', { count: 'exact' }),
    supabase
      .from('orders')
      .select('id')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString()),
    supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString()),
    supabase
      .from('production_logs')
      .select('quantity_produced')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())
  ])

  const emptyCollection = { data: [] as Array<{ id: string; current_stock: number | string | null; low_stock_threshold: number | string | null }>, count: 0 }

  const productsData = products.error
    ? (reportSupabaseIssue(products.error, 'products:count'), emptyCollection)
    : {
        data: (products.data ?? []) as Array<{
          id: string
          current_stock: number | string | null
          low_stock_threshold: number | string | null
        }>,
        count: products.count ?? (products.data?.length ?? 0)
      }

  const ingredientsData = ingredients.error
    ? (reportSupabaseIssue(ingredients.error, 'ingredients:count'), emptyCollection)
    : {
        data: (ingredients.data ?? []) as Array<{
          id: string
          current_stock: number | string | null
          low_stock_threshold: number | string | null
        }>,
        count: ingredients.count ?? (ingredients.data?.length ?? 0)
      }

  const totalProductsCount = productsData.count
  const totalIngredientsCount = ingredientsData.count

  const lowStockProductsCount = productsData.data.filter((product) => {
    const stock = Number(product.current_stock ?? 0)
    const threshold = Number(product.low_stock_threshold ?? 0)
    return threshold > 0 && stock <= threshold
  }).length

  const lowStockIngredientsCount = ingredientsData.data.filter((ingredient) => {
    const stock = Number(ingredient.current_stock ?? 0)
    const threshold = Number(ingredient.low_stock_threshold ?? 0)
    return threshold > 0 && stock <= threshold
  }).length

  const todayOrdersCount = todayOrders.error
    ? (reportSupabaseIssue(todayOrders.error, 'orders:today'), 0)
    : todayOrders.data?.length || 0

  const revenue = todayRevenue.error
    ? (reportSupabaseIssue(todayRevenue.error, 'orders:revenue'), 0)
    : (todayRevenue.data?.reduce((sum, order: { total_amount: number }) => sum + order.total_amount, 0) || 0)

  const production = todayProduction.error
    ? (reportSupabaseIssue(todayProduction.error, 'production_logs:today'), 0)
    : (todayProduction.data?.reduce((sum, log: { quantity_produced: number }) => sum + log.quantity_produced, 0) || 0)

  return {
    totalProducts: totalProductsCount,
    totalIngredients: totalIngredientsCount,
    lowStockProducts: lowStockProductsCount,
    lowStockIngredients: lowStockIngredientsCount,
    todayOrders: todayOrdersCount,
    todayRevenue: revenue,
    todayProduction: production
  }
}

export async function getCakeFlowFinancialReport(): Promise<FinancialReportSummary> {
  const supabase = await createSupabaseServerClient()

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const periodStartISO = periodStart.toISOString()
  const periodEndISO = periodEnd.toISOString()

  const [recipesRes, recipeItemsRes, ordersRes, orderItemsRes] = await Promise.all([
    supabase
      .from('recipes')
      .select('id, name, product_id, product:products(name, price)'),
    supabase
      .from('recipe_items')
      .select('recipe_id, quantity_needed, ingredient:ingredients(average_cost)'),
    supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', periodStartISO)
      .lt('created_at', periodEndISO),
    supabase
      .from('order_items')
      .select('product_id, quantity, created_at')
      .gte('created_at', periodStartISO)
      .lt('created_at', periodEndISO),
  ])

  if (recipesRes.error) {
    reportSupabaseIssue(recipesRes.error, 'recipes:financial-report')
  }
  if (recipeItemsRes.error) {
    reportSupabaseIssue(recipeItemsRes.error, 'recipe_items:financial-report')
  }
  if (ordersRes.error) {
    reportSupabaseIssue(ordersRes.error, 'orders:financial-report')
  }
  if (orderItemsRes.error) {
    reportSupabaseIssue(orderItemsRes.error, 'order_items:financial-report')
  }

  const recipes = (recipesRes.data ?? []) as Array<{
    id: string
    name: string
    product_id?: string | null
    product?: { name?: string | null; price?: number | string | null }
  }>

  const recipeItems = (recipeItemsRes.data ?? []) as Array<{
    recipe_id: string
    quantity_needed: number | string | null
    ingredient: { average_cost?: number | string | null } | null
  }>

  const orders = (ordersRes.data ?? []) as Array<{ total_amount: number }>
  const orderItems = (orderItemsRes.data ?? []) as Array<{
    product_id?: string | null
    quantity?: number | string | null
  }>

  const recipeCostMap = new Map<string, number>()
  for (const item of recipeItems) {
    const recipeId = item.recipe_id
    const quantity = Number(item.quantity_needed ?? 0)
    const averageCost = Number(item.ingredient?.average_cost ?? 0)
    const totalCost = quantity * averageCost
    recipeCostMap.set(recipeId, (recipeCostMap.get(recipeId) ?? 0) + totalCost)
  }

  const productCostMap = new Map<string, ProductCostSummary>()
  const productCosts: ProductCostSummary[] = []

  for (const recipe of recipes) {
    const recipeCost = recipeCostMap.get(recipe.id) ?? 0
    const productId = recipe.product_id ?? recipe.id
    const sellingPriceRaw = recipe.product?.price
    const sellingPrice = sellingPriceRaw != null ? Number(sellingPriceRaw) : undefined
    const grossProfitPerUnit = sellingPrice != null ? sellingPrice - recipeCost : undefined
    const grossMarginPercentage =
      sellingPrice && sellingPrice > 0 && grossProfitPerUnit != null
        ? (grossProfitPerUnit / sellingPrice) * 100
        : undefined

    const summary: ProductCostSummary = {
      product_id: productId,
      product_name: recipe.product?.name ?? recipe.name ?? 'Produk',
      hpp_per_unit: Number(recipeCost.toFixed(2)),
      selling_price: sellingPrice != null ? Number(sellingPrice.toFixed(2)) : undefined,
      gross_profit_per_unit:
        grossProfitPerUnit != null ? Number(grossProfitPerUnit.toFixed(2)) : undefined,
      gross_margin_percentage:
        grossMarginPercentage != null ? Number(grossMarginPercentage.toFixed(2)) : undefined,
      total_quantity_sold: 0,
      total_cogs: 0,
    }

    productCosts.push(summary)
    productCostMap.set(productId, summary)
  }

  let totalRevenue = 0
  for (const order of orders) {
    totalRevenue += Number(order.total_amount ?? 0)
  }

  let totalCOGS = 0
  for (const item of orderItems) {
    const productId = item.product_id ?? undefined
    if (!productId) continue
    const summary = productCostMap.get(productId)
    if (!summary) continue
    const quantity = Number(item.quantity ?? 0)
    if (!Number.isFinite(quantity)) continue
    const itemCOGS = quantity * summary.hpp_per_unit
    totalCOGS += itemCOGS
    summary.total_quantity_sold = (summary.total_quantity_sold ?? 0) + quantity
    summary.total_cogs = (summary.total_cogs ?? 0) + itemCOGS
  }

  const grossProfit = totalRevenue - totalCOGS
  const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0

  productCosts.sort((a, b) => a.product_name.localeCompare(b.product_name))

  for (const summary of productCosts) {
    if (summary.total_cogs != null) {
      summary.total_cogs = Number(summary.total_cogs.toFixed(2))
    }
    if (summary.total_quantity_sold != null) {
      summary.total_quantity_sold = Number(summary.total_quantity_sold)
    }
  }

  return {
    period_start: periodStartISO,
    period_end: periodEndISO,
    total_revenue: Number(totalRevenue.toFixed(2)),
    total_cogs: Number(totalCOGS.toFixed(2)),
    gross_profit: Number(grossProfit.toFixed(2)),
    gross_margin: Number(grossMargin.toFixed(4)),
    product_costs: productCosts,
  }
}
