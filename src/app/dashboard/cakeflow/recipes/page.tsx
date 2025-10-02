import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RecipeForm } from "@/components/cakeflow/recipe-form"
import { getRecipes, getRecipeItems, getProducts, getIngredients } from "@/lib/cakeflow-database"
import { ChefHat, Clock, PlusCircle } from "lucide-react"

async function RecipesContent() {
  const [recipes, products, ingredients] = await Promise.all([
    getRecipes(),
    getProducts(),
    getIngredients(),
  ])

  const recipeItemsMap = new Map<string, Awaited<ReturnType<typeof getRecipeItems>>>();

  const recipeItemsEntries = await Promise.all(
    recipes.map(async (recipe) => {
      const items = await getRecipeItems(recipe.id)
      return [recipe.id, items] as const
    })
  )

  recipeItemsEntries.forEach(([id, items]) => {
    recipeItemsMap.set(id, items)
  })

  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
  }))

  const ingredientOptions = ingredients.map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    unit: ingredient.unit,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Tambah Resep Baru
            </CardTitle>
            <CardDescription>
              Catat komposisi resep beserta bahan dan takarannya.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecipeForm products={productOptions} ingredients={ingredientOptions} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              Resep Produksi
            </CardTitle>
            <CardDescription>
              Komposisi resep untuk setiap produk siap jual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Belum ada resep. Gunakan formulir di sebelah kiri untuk menambahkan resep pertama.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipes.map((recipe) => {
                  const items = recipeItemsMap.get(recipe.id) ?? []

                  return (
                    <Card key={recipe.id} className="border">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">
                              {recipe.name}
                            </h3>
                            {recipe.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {recipe.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {recipe.preparation_time ? `${recipe.preparation_time} menit` : 'Waktu tidak ada'}
                          </Badge>
                        </div>

                        <div className="rounded-md border p-3 bg-muted/40">
                          <p className="text-sm font-medium mb-2">Bahan yang dibutuhkan</p>
                          {items.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Bahan belum ditambahkan.
                            </p>
                          ) : (
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {items.map((item) => (
                                <li key={item.id} className="flex items-center justify-between">
                                  <span>{item.ingredient?.name || 'Bahan'}</span>
                                  <span>
                                    {item.quantity_needed} {item.unit}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Produk: <span className="font-medium">{recipe.product?.name || 'Tidak terkait produk'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function RecipesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <RecipesContent />
      </Suspense>
    </div>
  )
}
