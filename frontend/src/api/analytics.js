import api from './http'

export const getAnalytics = () => api.get('/analytics')
export const getCorridors = () => api.get('/corridors')