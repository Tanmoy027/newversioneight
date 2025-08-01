'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useAuth } from '@/hooks/useAuth'
import { supabase, safeQuery, ensureUserProfile } from '@/lib/supabase'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'


export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal, getCartItemsCount } = useCart()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
const [shippingAddress, setShippingAddress] = useState('')
const [phone, setPhone] = useState('')

useEffect(() => {
  const fetchProfile = async () => {
    try {
      const { data, error } = await safeQuery(async () => 
        supabase.from('profiles').select('phone, address').eq('id', user.id).single()
      )
      if (error) throw error;
      if (data) {
        setPhone(data.phone || '')
        setShippingAddress(data.address || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data')
    }
  }
  if (user) fetchProfile()
}, [user])

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to checkout')
      return
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    if (!shippingAddress.trim()) {
      toast.error('Please enter your shipping address')
      return
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    setIsLoading(true)

    try {
      // Ensure user profile exists
console.log('Ensuring user profile exists...')
let profileExists;
try {
  profileExists = await safeQuery(async () => await ensureUserProfile(user))
} catch (error) {
  throw new Error('Failed to ensure user profile: ' + error.message)
}
if (!profileExists) {
  throw new Error('Failed to create or verify user profile')
}
console.log('User profile verified')

      // Update user profile with phone and address
console.log('Updating profile...')
const { error: profileUpdateError } = await safeQuery(async () => 
  supabase.from('profiles').update({ phone, address: shippingAddress }).eq('id', user.id)
)
if (profileUpdateError) {
  console.error('Profile update error:', profileUpdateError)
  throw new Error(`Failed to update profile: ${profileUpdateError.message}`)
}
console.log('Profile updated successfully')
      
      // Create order
console.log('Creating order...')
const { data: order, error: orderError } = await safeQuery(async () => 
  supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total_amount: getCartTotal(),
      shipping_address: shippingAddress,
      status: 'processing'
    })
    .select()
    .single()
)

if (orderError) {
  console.error('Order creation error:', orderError)
  throw new Error(`Failed to create order: ${orderError.message}`)
}
console.log('Order created:', order.id)

      // Create order items
const orderItems = cartItems.map(item => ({
  order_id: order.id,
  product_id: item.id,
  quantity: item.quantity,
  price: item.price
}))
console.log('Creating order items...')
const { error: itemsError } = await safeQuery(async () => 
  supabase
    .from('order_items')
    .insert(orderItems)
)

if (itemsError) {
  console.error('Order items creation error:', itemsError)
  throw new Error(`Failed to create order items: ${itemsError.message}`)
}
console.log('Order items created')

      // Clear cart and show success
      clearCart()
      toast.success('Order placed successfully!')
      
      // Redirect to orders page
      window.location.href = '/orders'
    } catch (error) {
      console.error('Error placing order:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      })
      toast.error(`Failed to place order: ${error.message || 'Unknown error'}. Please check console for details.`)
    } finally {
      setIsLoading(false)
      console.log('Checkout process completed')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your cart</p>
            <Link href="/auth">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-4">Add some furniture to get started</p>
            <Link href="/products">
              <Button className="w-full">Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <Image
                        src={item.primary_image || item.image_url || '/placeholder-furniture.jpg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-amber-600 font-medium">৳{item.price.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold">৳{(item.price * item.quantity).toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 mt-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({getCartItemsCount()} items)</span>
                  <span>৳{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>৳{getCartTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Shipping Address *</Label>
                      <Textarea
                        id="address"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Enter your complete shipping address..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading || !shippingAddress.trim()}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    size="lg"
                  >
                    {isLoading ? 'Processing...' : 'Place Order'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Debug Component */}
           
          </div>
        </div>
      </div>
    </div>
  )
}
