'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, ArrowLeft, Star, Truck, Shield, RefreshCw } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import ProductReviews from '@/components/products/ProductReviews'

export default function ProductDetailClient({ product }) {
  const [quantity, setQuantity] = useState(1)
  const [currentImage, setCurrentImage] = useState(product.primary_image)
  const { addToCart } = useCart()
  const { user } = useAuth()

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please sign in to add items to cart')
      return
    }

    if (product.stock === 0) {
      toast.error('This item is out of stock')
      return
    }

    if (quantity > product.stock) {
      toast.error(`Only ${product.stock} items available`)
      return
    }

    // Add to cart (the lib version handles quantity automatically)
    const productForCart = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.primary_image
    }
    
    // Add the product once, then update quantity if needed
    addToCart(productForCart)
    if (quantity > 1) {
      // The cart will already have 1, so we need to add (quantity - 1) more
      for (let i = 1; i < quantity; i++) {
        addToCart(productForCart)
      }
    }
    
    toast.success(`Added ${quantity} item(s) to cart!`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/products" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-white shadow-sm">
              <Image
                src={currentImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {product.is_featured && (
                <Badge className="absolute top-4 left-4 bg-amber-600 hover:bg-amber-700">
                  Featured
                </Badge>
              )}
            </div>
            
            {/* Additional Images */}
            {product.image_urls && product.image_urls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.image_urls.map((imgUrl, index) => (
                  <div 
                    key={index} 
                    className={`relative aspect-square overflow-hidden rounded-lg cursor-pointer border-2 ${imgUrl === currentImage ? 'border-amber-500' : 'border-transparent'}`}
                    onClick={() => setCurrentImage(imgUrl)}
                  >
                    <Image
                      src={imgUrl}
                      alt={`${product.name} - view ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 100px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-3">
                {product.categories?.name || 'Furniture'}
              </Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl font-bold text-amber-600">
                  ৳{product.price.toFixed(2)}
                </span>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-gray-600 ml-2">(4.8 rating)</span>
                </div>
              </div>
              {product.description && (
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              )}
            </div>

            {/* Stock and Quantity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Stock:</span>
                <span className={`font-medium ${
                  product.stock > 10 ? 'text-green-600' : 
                  product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                </span>
              </div>

              {product.stock > 0 && (
                <div className="flex items-center space-x-4">
                  <label className="text-gray-700 font-medium">Quantity:</label>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-10 w-10"
                    >
                      -
                    </Button>
                    <span className="px-4 py-2 border-x min-w-[60px] text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="h-10 w-10"
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              size="lg"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-gray-600">Free Shipping</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-gray-600">2 Year Warranty</span>
              </div>
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-5 w-5 text-amber-600" />
                <span className="text-sm text-gray-600">30 Day Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Product Details</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-6">
                {product.description || 'This premium furniture piece combines exceptional craftsmanship with modern design. Made from high-quality materials, it offers both style and durability for your home.'}
              </p>
              <h3 className="text-lg font-semibold mb-3">Specifications</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                  Material: Premium solid wood and high-grade fabrics
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                  Finish: Professional quality with protective coating
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                  Assembly: Professional assembly included with delivery
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                  Care: Easy maintenance with provided care instructions
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Product Reviews */}
        <ProductReviews productId={product.id} />
      </div>
    </div>
  )
}