import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const supabase = createClient(supabaseUrl, supabaseKey)

export const useRealtimeOrders = (storeSlug = 'siddhi') => {
  const [orders, setOrders] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let subscription = null

    // Fetch initial orders from Supabase
    const fetchOrders = async () => {
      try {
        console.log('🔄 Fetching orders from Supabase...')
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
            *,
            customer:customers(name, phone, email),
            order_items(
              *,
              menu_item:menu_items(name, price)
            )
          `)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching orders from Supabase:', error)
          setIsConnected(false)
        } else {
          console.log('✅ Fetched', ordersData.length, 'orders from Supabase')
          setOrders(ordersData || [])
          setIsConnected(true)
        }
      } catch (err) {
        console.error('Error in fetchOrders:', err)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Set up real-time subscription
    const setupRealtimeSubscription = () => {
      console.log('🔄 Setting up real-time subscription for orders...')
      
      subscription = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('🔄 Real-time order update:', payload)
            // Refetch orders when any order changes
            fetchOrders()
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status)
          setIsConnected(status === 'SUBSCRIBED')
        })
    }

    // Initial fetch
    fetchOrders()
    
    // Set up real-time subscription
    setupRealtimeSubscription()

    // Cleanup
    return () => {
      if (subscription) {
        console.log('🧹 Cleaning up orders subscription')
        supabase.removeChannel(subscription)
      }
    }
  }, [storeSlug])

  return { orders, isConnected, isLoading }
}

export const useRealtimeCustomers = (storeSlug = 'siddhi') => {
  const [customers, setCustomers] = useState([])
  const [statistics, setStatistics] = useState({})
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let subscription = null

    // Fetch customers from Supabase
    const fetchCustomers = async () => {
      try {
        console.log('🔄 Fetching customers from Supabase...')
        const { data: customersData, error } = await supabase
          .from('customers')
          .select(`
            *,
            orders:orders(count)
          `)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching customers from Supabase:', error)
          setIsConnected(false)
        } else {
          console.log('✅ Fetched', customersData.length, 'customers from Supabase')
          
          // Calculate statistics
          const totalCustomers = customersData.length
          const activeCustomers = customersData.filter(c => c.orders && c.orders.length > 0).length
          const newThisMonth = customersData.filter(c => {
            const createdDate = new Date(c.created_at)
            const now = new Date()
            return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
          }).length
          const blockedCustomers = customersData.filter(c => c.is_blocked).length

          setStatistics({
            totalCustomers,
            activeCustomers,
            newThisMonth,
            blockedCustomers,
            growthPercentage: newThisMonth > 0 ? 100 : 0
          })
          
          setCustomers(customersData || [])
          setIsConnected(true)
        }
      } catch (err) {
        console.error('Error in fetchCustomers:', err)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Set up real-time subscription
    const setupRealtimeSubscription = () => {
      console.log('🔄 Setting up real-time subscription for customers...')
      
      subscription = supabase
        .channel('customers-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'customers'
          },
          (payload) => {
            console.log('🔄 Real-time customer update:', payload)
            // Refetch customers when any customer changes
            fetchCustomers()
          }
        )
        .subscribe((status) => {
          console.log('📡 Customer subscription status:', status)
          setIsConnected(status === 'SUBSCRIBED')
        })
    }

    // Initial fetch
    fetchCustomers()
    
    // Set up real-time subscription
    setupRealtimeSubscription()

    // Cleanup
    return () => {
      if (subscription) {
        console.log('🧹 Cleaning up customers subscription')
        supabase.removeChannel(subscription)
      }
    }
  }, [storeSlug])

  return { customers, statistics, isConnected, isLoading }
}

export const useRealtimeCoupons = (storeSlug = 'siddhi') => {
  const [coupons, setCoupons] = useState([])
  const [statistics, setStatistics] = useState({})
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let intervalId = null

    // Fetch coupons from backend API
    const fetchCoupons = async () => {
      try {
        console.log('🔄 Fetching coupons from backend API...')
        const response = await fetch(`${API_BASE_URL}/admin-supabase/coupons?store=${storeSlug}`)
        const data = await response.json()
        
        if (data.success && data.coupons) {
          console.log('✅ Fetched', data.coupons.length, 'coupons from backend API')
          setCoupons(data.coupons)
          if (data.statistics) {
            setStatistics(data.statistics)
          }
          setIsConnected(true)
        } else {
          console.error('Error fetching coupons from API:', data.error)
          setIsConnected(false)
        }
      } catch (err) {
        console.error('Error in fetchCoupons:', err)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchCoupons()

    // Set up polling for real-time updates (every 5 seconds)
    intervalId = setInterval(fetchCoupons, 5000)

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [storeSlug])

  return { coupons, statistics, isConnected, isLoading }
}

export const useRealtimeDashboard = (storeSlug = 'siddhi', timeFilter = 'today') => {
  const [dashboardData, setDashboardData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let subscription = null

    // Calculate date range based on timeFilter
    const getDateRange = () => {
      const now = new Date()
      let startDate, endDate

      switch (timeFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          break
        case 'weekly':
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          startDate = startOfWeek
          endDate = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
          break
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }

      return { startDate, endDate }
    }

    // Fetch dashboard data from Supabase
    const fetchDashboard = async () => {
      try {
        console.log('🔄 Fetching dashboard data from Supabase...', { storeSlug, timeFilter })
        
        const { startDate, endDate } = getDateRange()
        
        // Fetch orders for the time period
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            customer:customers(name, phone, email),
            order_items(
              *,
              menu_item:menu_items(name, price)
            )
          `)
          .gte('created_at', startDate.toISOString())
          .lt('created_at', endDate.toISOString())
          .order('created_at', { ascending: false })

        if (ordersError) {
          console.error('Error fetching orders from Supabase:', ordersError)
          setIsConnected(false)
          return
        }

        // Calculate dashboard metrics
        const totalOrders = ordersData.length
        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.total || 0), 0)
        const pendingOrders = ordersData.filter(order => order.status === 'PENDING').length
        const inKitchenOrders = ordersData.filter(order => order.status === 'PREPARING').length
        const outForDeliveryOrders = ordersData.filter(order => order.status === 'OUT_FOR_DELIVERY').length
        const deliveredOrders = ordersData.filter(order => order.status === 'DELIVERED').length
        const cancelledOrders = ordersData.filter(order => order.status === 'CANCELLED').length

        // Format recent orders
        const recentOrders = ordersData.slice(0, 5).map(order => ({
          id: order.id,
          orderNumber: order.order_number || `ORD${order.id.slice(-8)}`,
          customerName: order.customer?.name || 'Unknown',
          customerPhone: order.customer?.phone || '',
          items: order.order_items?.map(item => 
            `${item.quantity}x ${item.menu_item?.name || 'Item'}`
          ).join(', ') || 'No items',
          total: order.total || 0,
          formattedTotal: new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
          }).format(order.total || 0),
          status: order.status,
          createdAt: order.created_at,
          paymentMethod: order.payment_method || 'UPI'
        }))

        const dashboardData = {
          totalOrders,
          totalRevenue,
          pendingOrders,
          inKitchenOrders,
          outForDeliveryOrders,
          deliveredOrders,
          cancelledOrders,
          recentOrders,
          period: timeFilter,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        }

        console.log('✅ Fetched dashboard data from Supabase:', dashboardData)
        setDashboardData(dashboardData)
        setIsConnected(true)
      } catch (err) {
        console.error('Error in fetchDashboard:', err)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Set up real-time subscription
    const setupRealtimeSubscription = () => {
      console.log('🔄 Setting up real-time subscription for dashboard...')
      
      subscription = supabase
        .channel('dashboard-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('🔄 Real-time dashboard update:', payload)
            // Refetch dashboard when any order changes
            fetchDashboard()
          }
        )
        .subscribe((status) => {
          console.log('📡 Dashboard subscription status:', status)
          setIsConnected(status === 'SUBSCRIBED')
        })
    }

    // Initial fetch
    fetchDashboard()
    
    // Set up real-time subscription
    setupRealtimeSubscription()

    // Cleanup
    return () => {
      if (subscription) {
        console.log('🧹 Cleaning up dashboard subscription')
        supabase.removeChannel(subscription)
      }
    }
  }, [storeSlug, timeFilter])

  return { dashboardData, isConnected, isLoading }
}
