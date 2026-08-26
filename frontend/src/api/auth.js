import api from './http'

export const login = (email, password) => api.post('/auth/login', { email, password })
export const signup = (name, email, password, department, role) =>
  api.post('/auth/signup', { name, email, password, department, role })
export const getSession = () => api.get('/auth/session')