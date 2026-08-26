export * from './auth'
export * from './blocks'
export * from './maintenance'
export * from './analytics'
import api from './http'

export const getWeeklyPlan = (week_start) =>
  api.get('/plans/weekly', { params: week_start ? { week_start } : {} })

export default api