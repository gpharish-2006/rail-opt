import api from './http'

export const getBlocks = (params = {}) => api.get('/blocks', { params })
export const optimizeBlock = (data) => api.post('/block/optimize', data)
export const saveBlock = (data) => api.post('/block/save', data)
export const approveBlock = (id) => api.post(`/blocks/${id}/approve`)
export const reschedule = (data) => api.post('/optimizer/reschedule', data)