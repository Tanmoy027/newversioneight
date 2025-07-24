import { supabase } from '@/lib/supabase'
import ProductsClient from './ProductsClient'

// Server-side data fetching - reliable like trendy section
async function getProducts() {
  try {
    console.log('Server: Fetching products and categories')
    
    // Fetch products and categories in parallel
    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false }),
      
      supabase
        .from('categories')
        .select('id, name')
        .order('name')
    ])

    let products = []
    let categories = []

    if (productsResult.data) {
      // Normalize products like trendy section
      products = productsResult.data.map(product => ({
        id: product.id,
        name: product.name || 'Unnamed Product',
        description: product.description || 'No description available',
        price: product.price || 0,
        stock: product.stock || 0,
        image_url: product.image_url || '/placeholder-furniture.jpg',
        is_featured: product.is_featured || false,
        category_id: product.category_id,
        created_at: product.created_at,
        categories: product.categories || { name: 'Furniture' }
      }))
    }

    if (categoriesResult.data) {
      categories = categoriesResult.data
    }

    console.log(`Server: Fetched ${products.length} products and ${categories.length} categories`)
    
    return { products, categories }
    
  } catch (error) {
    console.error('Server: Error fetching data:', error)
    return { products: [], categories: [] }
  }
}

export default async function ProductsPage({ searchParams }) {
  // Fetch data server-side - always reliable
  const { products, categories } = await getProducts()
  
  // Get initial category from URL
  const initialCategory = searchParams?.category || 'all'

  return (
    <ProductsClient 
      initialProducts={products}
      categories={categories}
      initialCategory={initialCategory}
    />
  )
}