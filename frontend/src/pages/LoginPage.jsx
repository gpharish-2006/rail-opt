import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { login, signup } from '../api/client'
import { Train, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', department: 'Engineering', role: 'engineer' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      let res
      if (mode === 'login') {
        res = await login(form.email, form.password)
      } else {
        res = await signup(form.name, form.email, form.password, form.department, form.role)
      }
      const { user, token } = res.data
      setAuth(user, token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (label, name, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-2">{label}</label>
      <input
        type={type === 'password' && showPass ? 'text' : type}
        value={form[name]}
        onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
        placeholder={placeholder || label}
        required
        className="w-full bg-white/5 border border-blue-900/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white/8 transition-all"
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-800/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 glow-blue mb-4">
            <Train size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">RailOpt AI</h1>
          <p className="text-blue-400 text-sm">AI-Powered Block Planning · Indian Railways</p>
          <p className="text-slate-500 text-xs mt-1">Smart India Hackathon 2026</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-blue-900/30">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  mode === m
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && field('Full Name', 'name', 'text', 'Rajesh Kumar')}
            {field('Email Address', 'email', 'email', 'user@railopt.in')}

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-blue-900/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Department</label>
                <select
                  value={form.department}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  className="w-full bg-white/5 border border-blue-900/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="S&T">S&T (Signal & Telecom)</option>
                  <option value="Traction">Traction</option>
                </select>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded-xl transition-all glow-blue flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-center">
            <p className="text-blue-400 text-xs font-medium">Demo Credentials</p>
            <p className="text-slate-300 text-xs mt-1">
              admin@railopt.in / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
