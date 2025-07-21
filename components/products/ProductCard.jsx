"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Eye } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { toast } from "sonner"

export default function ProductCard({ product }) {
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { addToCart } = useCart()

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (product.stock <= 0) {
      toast.error("Product is out of stock")
      return
    }

    setIsLoading(true)
    try {
      await addToCart(product)
      toast.success("Added to cart!")
    } catch (error) {
      toast.error("Failed to add to cart")
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getImageSrc = () => {
    if (imageError) return "/placeholder.svg?height=300&width=300"
    if (product.image_url) {
      return product.image_url
    }
    return "/placeholder.svg?height=300&width=300"
  }

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={getImageSrc() || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_featured && <Badge className="bg-amber-500 hover:bg-amber-600">Featured</Badge>}
            {product.stock <= 0 && <Badge variant="destructive">Out of Stock</Badge>}
            {product.stock > 0 && product.stock <= 5 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Low Stock
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Add to wishlist functionality
                toast.success("Added to wishlist!")
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Quick view functionality
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          {/* Add to Cart Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={handleAddToCart}
              disabled={isLoading || product.stock <= 0}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Adding...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </div>
              )}
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-amber-600 transition-colors">
                {product.name}
              </h3>
            </div>

            <p className="text-xs text-gray-600 line-clamp-1">{product.categories?.name}</p>

            <div className="flex items-center justify-between">
              <p className="font-bold text-lg text-amber-600">{formatPrice(product.price)}</p>

              {product.stock > 0 && <p className="text-xs text-gray-500">{product.stock} in stock</p>}
            </div>

            {product.description && <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Named export for compatibility
export { ProductCard }
