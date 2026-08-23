import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('railopt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const signup = (name, email, password, department, role) =>
  api.post('/auth/signup', { name, email, password, department, role })

// Maintenance
export const getMaintenance = (params = {}) => api.get('/maintenance', { params })
export const createMaintenance = (data) => api.post('/maintenance', data)

// Assets / Trains / Corridors
export const getAssets = () => api.get('/assets')
export const getTrains = () => api.get('/trains')
export const getCorridors = () => api.get('/corridors')

// Blocks
export const getBlocks = (params = {}) => api.get('/blocks', { params })
export const optimizeBlock = (data) => api.post('/block/optimize', data)
export const saveBlock = (data) => api.post('/block/save', data)
export const approveBlock = (id) => api.post(`/blocks/${id}/approve`)

// Plans
export const getWeeklyPlan = (week_start) =>
  api.get('/plans/weekly', { params: week_start ? { week_start } : {} })

// Analytics
export const getAnalytics = () => api.get('/analytics')

export default api
