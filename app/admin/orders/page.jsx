'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, Calendar, MapPin, DollarSign, Phone, User } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Use useEffect after all functions are defined
  useEffect(() => {
    console.log('Admin Orders Page: Fetching orders')
    
    // Check if admin client is properly configured
    console.log('Checking admin client configuration...')
    const checkAdminClient = async () => {
      try {
        // Test if admin client can bypass RLS
        const { data: adminTest, error: adminError } = await supabaseAdmin
          .from('orders')
          .select('count')
          .limit(1)
        
        console.log('Admin client test:', {
          success: !adminError,
          error: adminError ? adminError.message : null,
          count: adminTest?.length || 0
        })
      } catch (error) {
        console.error('Admin client test error:', error)
      }
    }
    
    checkAdminClient()
    fetchOrders()
    
    // Debug: Check if we're in admin mode
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single()
          
          console.log('Current user admin status:', profile?.is_admin)
          
          // Direct check of orders table
          console.log('Checking orders table directly...')
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('id, status, user_id')
            .limit(5)
          
          console.log('Direct orders check result:', { 
            count: ordersData?.length || 0,
            orders: ordersData,
            error: ordersError ? ordersError.message : null 
          })
          
          // Try with admin client
          console.log('Checking orders with admin client...')
          const { data: adminOrdersData, error: adminOrdersError } = await supabaseAdmin
            .from('orders')
            .select('id, status, user_id')
            .limit(5)
          
          console.log('Admin orders check result:', { 
            count: adminOrdersData?.length || 0,
            orders: adminOrdersData,
            error: adminOrdersError ? adminOrdersError.message : null 
          })
          
          // Check if we can directly access the database with SQL
          console.log('Attempting direct SQL query...')
          try {
            const { data: sqlData, error: sqlError } = await supabaseAdmin.rpc('get_all_orders_count')
            console.log('SQL query result:', {
              count: sqlData,
              error: sqlError ? sqlError.message : null
            })
          } catch (sqlErr) {
            console.error('SQL query error:', sqlErr)
          }
          
          // Check if the orders table exists
          console.log('Checking if orders table exists...')
          try {
            const { data: tablesData, error: tablesError } = await supabaseAdmin
              .from('pg_tables')
              .select('tablename')
              .eq('schemaname', 'public')
            
            console.log('Tables in public schema:', {
              tables: tablesData?.map(t => t.tablename),
              error: tablesError ? tablesError.message : null
            })
          } catch (tablesErr) {
            console.error('Error checking tables:', tablesErr)
          }
        } else {
          console.log('No active session found')
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
      }
    }
    
    checkAdminStatus()
  }, [])

  // Define fetchOrders function
  const fetchOrders = async () => {
    try {
      const fetchOrders = async () => {
        try {
          setLoading(true)
          console.log('Fetching orders...')
      
          const { data: ordersData, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
      
          if (error) throw error
      
          console.log('Orders fetched successfully:', ordersData)
          setOrders(ordersData || [])
        } catch (error) {
          console.error('Error fetching orders:', error)
          toast.error('Failed to fetch orders. Please try again.')
        } finally {
          setLoading(false)
        }
      }
      
      const timeout = setTimeout(() => {
        setLoading(false)
        toast.error('Orders loading timeout - please refresh the page')
      }, 10000) // 10 second timeout
      
      fetchOrders()
      return () => clearTimeout(timeout)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error(`Error loading orders: ${error.message || 'Unknown error'}`)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Define updateOrderStatus function
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const toastId = toast.loading(`Updating order status to ${newStatus}...`)
      let updateSuccess = false;
      let errorMessage = '';
      
      // Log the environment variables (without exposing sensitive values)
      console.log('Environment check:', {
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      });
      
      // Verify admin client can access orders directly
      try {
        console.log('Verifying admin client access...');
        const { data: verifyData, error: verifyError } = await supabaseAdmin
          .from('orders')
          .select('id')
          .limit(1);
          
        console.log('Admin client verification:', {
          success: !verifyError,
          error: verifyError ? verifyError.message : null,
          hasData: !!verifyData?.length
        });
      } catch (verifyError) {
        console.error('Admin client verification error:', verifyError);
      }
      
      // Try with admin client first
      try {
        console.log('Attempting update with admin client...');
        const result = await supabaseAdmin
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId);
          
        console.log('Admin update result:', {
          error: result.error ? result.error.message : null,
          status: result.status,
          statusText: result.statusText,
          data: result.data
        });
          
        if (!result.error) {
          updateSuccess = true;
          console.log('Updated status using admin client');
        } else {
          errorMessage = result.error.message || 'Unknown error with admin client';
          console.error('Admin client update error:', result.error);
        }
      } catch (adminError) {
        errorMessage = adminError.message || 'Unknown error with admin client';
        console.error('Admin client update error:', adminError);
      }
      
      // If admin client failed, try regular client
      if (!updateSuccess) {
        try {
          console.log('Admin client failed, trying regular client...');
          const result = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);
            
          console.log('Regular client update result:', {
            error: result.error ? result.error.message : null,
            status: result.status,
            statusText: result.statusText,
            data: result.data
          });
            
          if (!result.error) {
            updateSuccess = true;
            console.log('Fallback: Updated status using regular client');
          } else {
            errorMessage = result.error.message || 'Unknown error with regular client';
            console.error('Regular client update error:', result.error);
          }
        } catch (regularError) {
          errorMessage = regularError.message || 'Unknown error with regular client';
          console.error('Regular client update error:', regularError);
        }
      }

      // Show appropriate toast and refresh if successful
      if (updateSuccess) {
        toast.dismiss(toastId);
        toast.success(`Order status updated to ${newStatus}`);
        
        // Update the local state to avoid a full refresh
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        
        // Also refresh orders to get the latest data
        fetchOrders();
      } else {
        toast.dismiss(toastId);
        toast.error(`Failed to update order status: ${errorMessage}`);
      }
    } catch (error) {
      toast.dismiss(toastId);
      console.error('Error updating order status:', error);
      toast.error(`Error updating order status: ${error.message || 'Unknown error'}`);
    }
  }

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Management</h1>
        <p className="text-gray-600">Manage customer orders and update their status</p>
      </div>

      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-gray-600">Orders will appear here when customers make purchases</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => {
                console.log('Manual refresh triggered');
                fetchOrders();
              }}
            >
              Refresh Orders
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(order.status || 'pending')}>
                      {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                    </Badge>
                    
                    <Select 
                      value={order.status || 'pending'} 
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Customer</div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        {order.profiles?.full_name || `User ${order.user_id?.slice(0, 8) || 'Unknown'}`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>
                        {order.profiles?.phone || 'No phone'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Shipping Address</div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-sm">
                        {order.shipping_address || 'No address provided'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-500">Order Summary</div>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span>
                        {order.order_items?.length || 0} items
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">
                        ৳{order.total_amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                {order.order_items ? (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={item.products?.image_urls?.[0] || item.products?.image_url || '/placeholder.jpg'}
                              alt={item.products?.name || 'Product'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {item.products?.name || 'Product'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity} × ৳{item.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              ৳{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                    <h4 className="font-medium text-amber-800 mb-2">Limited Data Available</h4>
                    <p className="text-amber-700 text-sm">Order details are limited. This may be due to a database access issue.</p>
                    <Button 
                      variant="outline" 
                      className="mt-2" 
                      onClick={() => fetchOrders()}
                    >
                      Refresh Order Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}