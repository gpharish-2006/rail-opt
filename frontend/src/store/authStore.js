import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('railopt_user') || 'null'),
  token: localStorage.getItem('railopt_token') || null,
  isAuthenticated: !!localStorage.getItem('railopt_token'),

  setAuth: (user, token) => {
    localStorage.setItem('railopt_user', JSON.stringify(user))
    localStorage.setItem('railopt_token', token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('railopt_user')
    localStorage.removeItem('railopt_token')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

export default useAuthStore
