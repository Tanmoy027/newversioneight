import { supabase } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured') === 'true'
    
    const offset = (page - 1) * limit
    
    let query = supabase
      .from("products")
      .select(`
        *,
        categories (
          id,
          name
        )
      `, { count: 'exact' })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && category !== 'all') {
      query = query.eq('category_id', category)
    }

    if (featured) {
      query = query.eq('is_featured', true)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: "Failed to fetch products",
        },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: offset + limit < count,
        hasPrev: page > 1
      }
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