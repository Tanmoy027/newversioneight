import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    // Get total products count
    const { count: totalCount, error: totalError } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })

    if (totalError) {
      console.error("Error fetching total count:", totalError)
      return Response.json(
        {
          success: false,
          error: "Failed to fetch product statistics",
        },
        { status: 500 },
      )
    }

    // Get featured products count
    const { count: featuredCount, error: featuredError } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_featured", true)

    if (featuredError) {
      console.error("Error fetching featured count:", featuredError)
    }

    // Get out of stock products count
    const { count: outOfStockCount, error: outOfStockError } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("stock", 0)

    if (outOfStockError) {
      console.error("Error fetching out of stock count:", outOfStockError)
    }

    // Get low stock products count (stock <= 5 but > 0)
    const { count: lowStockCount, error: lowStockError } = await supabaseAdmin
      .from("products")
      .select("*", { count: "exact", head: true })
      .gt("stock", 0)
      .lte("stock", 5)

    if (lowStockError) {
      console.error("Error fetching low stock count:", lowStockError)
    }

    const stats = {
      total: totalCount || 0,
      featured: featuredCount || 0,
      outOfStock: outOfStockCount || 0,
      lowStock: lowStockCount || 0,
    }

    return Response.json({
      success: true,
      data: stats,
    })
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
