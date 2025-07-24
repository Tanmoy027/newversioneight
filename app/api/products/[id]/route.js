import { supabase } from '@/lib/supabase'

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(request, { params }) {
  const { id } = params

  if (!uuidRegex.test(id)) {
    return Response.json(
      {
        success: false,
        error: "Invalid product ID format",
      },
      { status: 400 },
    )
  }

  try {
    console.log(`API: Fetching product ${id}`)
    
    // Use the configured supabase client

    // Try to fetch product with categories
    let productData = null
    
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (
            id,
            name,
            description
          )
        `)
        .eq("id", id)
        .maybeSingle()

      if (error) {
        console.error('Product query error:', error)
        throw error
      }

      productData = data
    } catch (err) {
      console.warn('Join query failed, trying separate queries:', err)
      
      // Fallback: separate queries
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      if (productError) {
        console.error('Product fetch error:', productError)
        throw productError
      }

      if (product) {
        const { data: category } = await supabase
          .from("categories") 
          .select("id, name, description")
          .eq("id", product.category_id)
          .maybeSingle()

        productData = {
          ...product,
          categories: category
        }
      }
    }

    if (!productData) {
      return Response.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 },
      )
    }

    console.log(`API: Product ${id} fetched successfully`)
    
    // Return without caching to ensure fresh data
    return Response.json({
      success: true,
      data: productData,
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error("API error:", error)
    return Response.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 },
    )
  }
}