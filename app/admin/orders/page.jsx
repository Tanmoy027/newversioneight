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
      // Try to fetch orders with admin client first with full details
      console.log('Attempting to fetch orders with admin client...')
      
      // First, let's check if we can access the orders table at all
      const tableCheck = await supabaseAdmin
        .from('orders')
        .select('count')
        .single()
      
      console.log('Orders table check:', {
        count: tableCheck?.data?.count,
        error: tableCheck?.error
      })
      
      // Try using the stored procedure if it exists
      try {
        console.log('Attempting to use stored procedure...')
        const { data: countData, error: countError } = await supabaseAdmin.rpc('get_all_orders_count')
        
        if (!countError) {
          console.log('Orders count from stored procedure:', countData)
          
          // If we have orders, try to fetch them using the stored procedure
          if (countData > 0) {
            // Try to use the get_all_orders_with_details function first if it exists
            try {
              const { data: detailedData, error: detailedError } = await supabaseAdmin.rpc('get_all_orders_with_details')
              
              if (!detailedError && detailedData && detailedData.length > 0) {
                console.log('Successfully fetched orders with details using stored procedure:', {
                  count: detailedData.length
                })
                
                // Format the data to match our expected structure
                const formattedOrders = detailedData.map(order => ({
                  ...order,
                  profiles: {
                    full_name: order.customer_name,
                    phone: order.customer_phone
                  },
                  order_items: order.items ? order.items.map(item => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                    order_id: order.id,
                    products: {
                      name: item.product_name,
                      image_url: item.product_image
                    }
                  })) : []
                }))
                
                setOrders(formattedOrders)
                toast.success(`Loaded ${formattedOrders.length} orders with complete details`)
                setLoading(false)
                return
              }
            } catch (detailedError) {
              console.log('Detailed procedure not available, falling back to basic procedure')
            }
            
            // Fall back to the basic get_all_orders function
            const { data: procData, error: procError } = await supabaseAdmin.rpc('get_all_orders')
            
            if (!procError && procData && procData.length > 0) {
              console.log('Successfully fetched orders using stored procedure:', {
                count: procData.length
              })
              
              // Now fetch related data
              const userIds = procData.map(order => order.user_id).filter(Boolean)
              const orderIds = procData.map(order => order.id)
              
              // Get profiles
              const { data: profilesData } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, phone')
                .in('id', userIds)
              
              // Get order items with products
              const { data: orderItemsData } = await supabaseAdmin
                .from('order_items')
                .select(`
                  *,
                  products (
                    name,
                    image_url,
                    image_urls
                  )
                `)
                .in('order_id', orderIds)
              
              // Combine the data
              const ordersWithDetails = procData.map(order => ({
                ...order,
                profiles: profilesData?.find(p => p.id === order.user_id) || null,
                order_items: orderItemsData?.filter(item => item.order_id === order.id) || []
              }))
              
              setOrders(ordersWithDetails)
              toast.success(`Loaded ${ordersWithDetails.length} orders using stored procedure`)
              setLoading(false)
              return
            }
          }
        }
      } catch (procError) {
        console.error('Error using stored procedure:', procError)
      }
      
      // Now try the detailed query
      const result = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          profiles(full_name, phone),
          order_items (
            *,
            products (
              name,
              image_url,
              image_urls
            )
          )
        `)
        .order('created_at', { ascending: false })

      console.log('Admin fetch result:', {
        count: result?.data?.length || 0,
        error: result?.error,
        data: result?.data
      })
      
      // Log the raw data for inspection
      console.log('Raw orders data:', JSON.stringify(result?.data || []))

      // If admin fetch fails or returns no data, try a simpler query
      if (result.error || !result.data || result.data.length === 0) {
        console.log('Admin fetch failed or returned no data, trying simpler query')
        
        // Try a very basic query first
        console.log('Trying basic query with no joins...')
        let basicResult;
        try {
          basicResult = await supabaseAdmin
            .from('orders')
            .select('id, status, user_id, created_at, total_amount, shipping_address')
            .order('created_at', { ascending: false })
            
          console.log('Basic query result:', {
            count: basicResult?.data?.length || 0,
            error: basicResult?.error,
            data: basicResult?.data
          })
        } catch (basicQueryError) {
          console.error('Error with basic query:', basicQueryError)
          basicResult = { error: basicQueryError, data: null }
        }
        
        // If basic query works, use that data
        if (!basicResult.error && basicResult.data && basicResult.data.length > 0) {
          toast.info(`Found ${basicResult.data.length} orders with basic information`)
          
          // Try to enhance the data with user information
          try {
            const userIds = basicResult.data.map(order => order.user_id).filter(Boolean)
            if (userIds.length > 0) {
              const { data: profilesData } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, phone')
                .in('id', userIds)
              
              const orderIds = basicResult.data.map(order => order.id)
              const { data: orderItemsData } = await supabaseAdmin
                .from('order_items')
                .select(`
                  *,
                  products (
                    name,
                    image_url,
                    image_urls
                  )
                `)
                .in('order_id', orderIds)

              if (profilesData && profilesData.length > 0) {
                // Attach profiles to orders
                const enhancedOrders = basicResult.data.map(order => ({
                  ...order,
                  profiles: profilesData.find(p => p.id === order.user_id) || null,
                  order_items: orderItemsData?.filter(item => item.order_id === order.id) || []
                }))
                setOrders(enhancedOrders)
                toast.success(`Enhanced order data with user information for ${profilesData.length} users`)
                setLoading(false)
                return
              }
            }
          } catch (profileError) {
            console.error('Error fetching profiles for basic query:', profileError)
          }
          
          // If we couldn't enhance with profiles, just use the basic data
          setOrders(basicResult.data)
          setLoading(false)
          return
        }
        
        // If basic query fails, try the regular simple query
        let simpleResult;
        try {
          simpleResult = await supabaseAdmin
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })

          console.log('Simple query result:', {
            count: simpleResult?.data?.length || 0,
            error: simpleResult?.error,
            data: simpleResult?.data
          })
        } catch (simpleQueryError) {
          console.error('Error with simple query:', simpleQueryError)
          simpleResult = { error: simpleQueryError, data: null }
        }

        // If we have orders but no details, we'll show them with limited info
        if (!simpleResult.error && simpleResult.data && simpleResult.data.length > 0) {
          toast.info(`Found ${simpleResult.data.length} orders with limited details. Attempting to fetch additional information.`)
          
          // Try to fetch at least some user information for these orders
          try {
            const userIds = simpleResult.data.map(order => order.user_id).filter(Boolean)
            if (userIds.length > 0) {
              const { data: profilesData } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, phone')
                .in('id', userIds)
              
              const orderIds = simpleResult.data.map(order => order.id)
              const { data: orderItemsData } = await supabaseAdmin
                .from('order_items')
                .select(`
                  *,
                  products (
                    name,
                    image_url,
                    image_urls
                  )
                `)
                .in('order_id', orderIds)
              
              let ordersWithLimitedDetails = simpleResult.data.map(order => ({
                ...order,
                profiles: profilesData?.find(p => p.id === order.user_id) || null,
                order_items: orderItemsData?.filter(item => item.order_id === order.id) || []
              }))
              
              if (profilesData && profilesData.length > 0) {
                toast.success(`Enhanced order data with user information for ${profilesData.length} users`)
              } else {
                toast.warning('Could not retrieve user information for orders')
              }
              
              console.log('Orders loaded with limited details. Some information may be missing.')
              setOrders(ordersWithLimitedDetails)
            }
          } catch (profileError) {
            console.error('Error fetching profiles:', profileError)
            toast.error(`Error fetching user profiles: ${profileError.message || 'Unknown error'}`)
          }
          
          console.log('Orders loaded with limited details. Some information may be missing.')
          setOrders(ordersWithLimitedDetails)
        } else {
          // Last resort: try to query orders directly with regular client
          try {
            console.log('Attempting to fetch orders with regular client as last resort...')
            const regularResult = await supabase
              .from('orders')
              .select('*')
              .order('created_at', { ascending: false })
              
            if (!regularResult.error && regularResult.data && regularResult.data.length > 0) {
              toast.info(`Found ${regularResult.data.length} orders using regular client`)
              setOrders(regularResult.data)
              setLoading(false)
              return
            } else {
              console.log('Regular client query failed or returned no data:', regularResult.error)
              toast.error('No orders found in the database after multiple attempts')
              setOrders([])
            }
          } catch (regularError) {
            console.error('Error with regular client query:', regularError)
            toast.error('No orders found in the database after multiple attempts')
            setOrders([])
          }
        }
      } else {
        // We have full order details
        setOrders(result.data)
        if (result.data.length > 0) {
          toast.success(`Loaded ${result.data.length} orders successfully`)
        } else {
          toast.info('No orders found in the database')
        }
      }
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
      <div className="flex items-center justify-center h-96">
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