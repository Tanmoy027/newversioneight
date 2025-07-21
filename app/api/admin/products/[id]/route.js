import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request, { params }) {
  try {
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return Response.json(
        {
          success: false,
          error: "Invalid product ID format",
        },
        { status: 400 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: "Product not found",
        },
        { status: 404 },
      )
    }

    return Response.json({
      success: true,
      data,
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

export async function PUT(request, { params }) {
  try {
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return Response.json(
        {
          success: false,
          error: "Invalid product ID format",
        },
        { status: 400 },
      )
    }

    const formData = await request.formData()

    // Extract form fields to match database schema
    const productData = {
      name: formData.get("name"),
      description: formData.get("description"),
      price: Number.parseFloat(formData.get("price")),
      stock: Number.parseInt(formData.get("stock")) || 0,
      is_featured: formData.get("is_featured") === "true",
    }

    // Handle category - expect category_id from form or convert category name
    const categoryInput = formData.get("category_id") || formData.get("category")
    if (categoryInput) {
      // If it's a UUID, use it directly; otherwise, look up by name
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (uuidRegex.test(categoryInput)) {
        productData.category_id = categoryInput
      } else {
        // Look up category by name
        const { data: categoryData } = await supabaseAdmin
          .from("categories")
          .select("id")
          .eq("name", categoryInput)
          .single()
        
        if (categoryData) {
          productData.category_id = categoryData.id
        }
      }
    }

    // Handle single image upload/update (your schema only supports one image_url)
    const imageFile = formData.get("image") || formData.get("image_0")

    if (imageFile && imageFile.size > 0) {
      const fileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

      try {
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from("productimage")
          .upload(fileName, imageFile, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("Upload error:", uploadError)
          return Response.json(
            {
              success: false,
              error: `Failed to upload image: ${uploadError.message}`,
            },
            { status: 500 },
          )
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from("productimage").getPublicUrl(fileName)

        productData.image_url = publicUrl
      } catch (uploadError) {
        console.error("Image upload error:", uploadError)
        return Response.json(
          {
            success: false,
            error: "Failed to upload image",
          },
          { status: 500 },
        )
      }
    } else {
      // Keep existing image or use provided URL
      const imageUrl = formData.get("image_url")
      if (imageUrl) {
        productData.image_url = imageUrl
      }
      // If no new image provided, don't update image_url (keep existing)
    }

    // Update product in database
    const { data, error } = await supabaseAdmin
      .from("products")
      .update(productData)
      .eq("id", id)
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: `Failed to update product: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
      data,
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

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return Response.json(
        {
          success: false,
          error: "Invalid product ID format",
        },
        { status: 400 },
      )
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id)

    if (error) {
      console.error("Database error:", error)
      return Response.json(
        {
          success: false,
          error: `Failed to delete product: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return Response.json({
      success: true,
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
