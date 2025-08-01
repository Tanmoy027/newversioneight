'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingPage } from '@/components/ui/loading'
import { Package, Calendar, MapPin, DollarSign } from 'lucide-react'

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      fetchOrders()
    }
  }, [user, authLoading])

  const fetchOrders = async () => {
    setLoading(true);
    try {
      console.log("Fetching orders for user:", user?.id);
      if (!user?.id) {
        console.log("No user ID available, skipping fetch");
        setLoading(false);
        return;
      }

      // Try RPC function first (if available)
      let { data: rpcOrders, error: rpcError } = await supabase
        .rpc('get_user_orders_with_details', { user_id_param: user.id });

      if (!rpcError && rpcOrders && rpcOrders.length > 0) {
        console.log("Successfully fetched orders via RPC", rpcOrders);
        // Transform the data to match the expected format
        const formattedOrders = rpcOrders.map(order => ({
          ...order,
          order_items: order.items ? order.items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            products: {
              name: item.product_name,
              image_url: item.product_image
            }
          })) : []
        }));
        setOrders(formattedOrders);
        setLoading(false);
        return;
      } else if (rpcError) {
        console.log("RPC query failed, falling back to detailed query:", rpcError);
      }

      // Try detailed query next
      let { data: detailedOrders, error: detailedError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url,
              image_urls
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (detailedError) {
        console.error("Detailed query failed:", detailedError);
        
        // Try simpler query
        let { data: simpleOrders, error: simpleError } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (simpleError) {
          console.error("Simple query failed:", simpleError);
          
          // Last resort: try direct table access
          let { data: directOrders, error: directError } = await supabase
            .from('orders')
            .select()
            .eq('user_id', user.id);
            
          if (directError || !directOrders) {
            console.error("All query methods failed:", directError);
            setOrders([]);
            setLoading(false);
            return;
          }
          
          setOrders(directOrders.map(order => ({ ...order, order_items: [] })));
          setLoading(false);
          return;
        }

        // If we got simple orders, fetch items separately
        if (simpleOrders && simpleOrders.length > 0) {
          const ordersWithItems = await Promise.all(
            simpleOrders.map(async (order) => {
              const { data: items, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                  *,
                  products (
                    name,
                    image_url,
                    image_urls
                  )
                `)
                .eq('order_id', order.id);

              if (itemsError) {
                console.error(`Failed to fetch items for order ${order.id}:`, itemsError);
                return { ...order, order_items: [] };
              }

              return { ...order, order_items: items || [] };
            })
          );

          setOrders(ordersWithItems);
          setLoading(false);
          return;
        }
      } else if (detailedOrders) {
        // Detailed query succeeded
        setOrders(detailedOrders);
        setLoading(false);
        return;
      }

      // If we get here, no orders were found
      console.log("No orders found for user");
      setOrders([]);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setLoading(false);
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || loading) {
    return <LoadingPage />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your orders</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Orders</h1>
          <p className="text-gray-600">Track your furniture orders and delivery status</p>
        </div>

        {orders.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-gray-600">Start shopping to see your orders here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Order #{order.id ? order.id.slice(0, 8) : 'Unknown'}
                    </CardTitle>
                    <Badge className={getStatusColor(order.status || 'pending')}>
                      {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Date not available'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        ৳{(order.total_amount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {order.shipping_address ? `${order.shipping_address.slice(0, 30)}...` : 'Address not available'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Items:</h4>
                    {(order.order_items || []).map((item, index) => (
                      <div key={item.id || `item-${index}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                          <Image
                            src={item.products?.image_urls?.[0] || item.products?.image_url || '/placeholder-furniture.jpg'}
                            alt={item.products?.name || 'Product'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.products?.name || 'Product'}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity || 1} × ৳{(item.price || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ৳{((item.quantity || 1) * (item.price || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
