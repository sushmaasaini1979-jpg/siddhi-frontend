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
    let intervalId = null

    // Fetch orders from backend API
    const fetchOrders = async () => {
      try {
        console.log('🔄 Fetching orders from backend API...')
        const response = await fetch(`${API_BASE_URL}/admin-supabase/orders?store=${storeSlug}`)
        const data = await response.json()
        
        if (data.success && data.orders) {
          console.log('✅ Fetched', data.orders.length, 'orders from backend API')
          setOrders(data.orders)
          setIsConnected(true)
        } else {
          console.error('Error fetching orders from API:', data.error)
          setIsConnected(false)
        }
      } catch (err) {
        console.error('Error in fetchOrders:', err)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchOrders()

    // Set up polling for real-time updates (every 5 seconds)
    intervalId = setInterval(fetchOrders, 5000)

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
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
    let intervalId = null

    // Fetch customers from backend API
    const fetchCustomers = async () => {
      try {
        console.log('🔄 Fetching customers from backend API...')
        const response = await fetch(`${API_BASE_URL}/admin-supabase/customers?store=${storeSlug}`)
        const data = await response.json()
        
        if (data.success && data.customers) {
          console.log('✅ Fetched', data.customers.length, 'customers from backend API')
          setCustomers(data.customers)
          if (data.statistics) {
            setStatistics(data.statistics)
          }
          setIsConnected(true)
        } else {
          console.error('Error fetching customers from API:', data.error)
          setIsConnected(false)
        }
      } catch (err) {
        console.error('Error in fetchCustomers:', err)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchCustomers()

    // Set up polling for real-time updates (every 5 seconds)
    intervalId = setInterval(fetchCustomers, 5000)

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
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
    let intervalId = null

    // Fetch dashboard data from backend API
    const fetchDashboard = async () => {
      try {
        console.log('🔄 Fetching dashboard data from backend API...', { storeSlug, timeFilter })
        const response = await fetch(`${API_BASE_URL}/admin-supabase/dashboard?store=${storeSlug}&period=${timeFilter}`)
        const data = await response.json()
        
        if (data.success && data.data) {
          console.log('✅ Fetched dashboard data from backend API')
          setDashboardData(data.data)
          setIsConnected(true)
        } else {
          console.error('Error fetching dashboard from API:', data.error)
          setIsConnected(false)
        }
      } catch (err) {
        console.error('Error in fetchDashboard:', err)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchDashboard()

    // Set up polling for real-time updates (every 5 seconds)
    intervalId = setInterval(fetchDashboard, 5000)

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [storeSlug, timeFilter])

  return { dashboardData, isConnected, isLoading }
}
