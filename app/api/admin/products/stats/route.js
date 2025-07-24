import { supabaseAdmin } from "@/lib/supabase-admin"
import { cachedQuery, createCacheKey, addCacheHeaders } from "@/lib/cache"

export async function GET() {
  try {
    const cacheKey = createCacheKey('products', 'stats')
    
    const result = await cachedQuery(
      cacheKey,
      async () => {
        // Single query to get all products with their stock and featured status
        const { data, error } = await supabaseAdmin
          .from("products")
          .select("stock, is_featured")

        if (error) {
          throw error
        }

        // Calculate all stats from the single result set
        const stats = {
          total: data.length,
          featured: data.filter(p => p.is_featured).length,
          outOfStock: data.filter(p => p.stock === 0).length,
          lowStock: data.filter(p => p.stock > 0 && p.stock <= 5).length,
        }

        return { data: stats }
      },
      300 // Cache for 5 minutes - stats can be slightly stale
    )

    if (result.error) {
      console.error("Database error:", result.error)
      return Response.json(
        {
          success: false,
          error: "Failed to fetch product statistics",
        },
        { status: 500 },
      )
    }

    const response = Response.json({
      success: true,
      data: result.data,
    })

    // Add cache headers - stats can be cached for a few minutes
    return addCacheHeaders(response, 300, 600) // 5 min client, 10 min CDN
  } catch (error) {
    console.error("API error:", error)
    return Response.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
