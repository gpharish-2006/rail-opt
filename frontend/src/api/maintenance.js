import api from './http'

export const getMaintenance = (params = {}) => api.get('/maintenance', { params })
export const createMaintenance = (data) => api.post('/maintenance', data)
export const getUnifiedDefects = (params = {}) => api.get('/maintenance/unified-defects', { params })
export const getAssets = () => api.get('/assets')
export const getTrains = () => api.get('/trains')