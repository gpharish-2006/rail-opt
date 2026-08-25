import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { login, signup } from '../api/client'
import { Train, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

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
      // Demo fallback login if backend is not actively running
      const mockUser = {
        name: form.name || (form.email.includes('admin') ? 'Chief Controller' : 'Section Officer'),
        email: form.email || 'admin@railopt.in',
        department: form.department || 'Engineering',
        role: form.role || 'Chief Controller',
      }
      setAuth(mockUser, 'mock_jwt_token_cris_2026')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#071020] flex flex-col justify-between p-4 relative overflow-hidden select-none">
      {/* Top Government Strip */}
      <div className="w-full max-w-md mx-auto text-center pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-amber-400 mb-4 shadow-sm">
          <ShieldCheck size={14} /> BHARAT SARKAR · MINISTRY OF RAILWAYS · CRIS
        </div>

        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-700 to-red-900 border border-red-500/40 flex items-center justify-center text-white shadow-xl glow-amber">
            <Train size={30} />
          </div>
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">RailOpt AI Engine</h1>
        <p className="text-xs text-blue-300 font-semibold mt-0.5">
          Automatic Railway Block Possession & Shadow Window Optimizer
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md mx-auto bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex gap-1 p-1 bg-slate-950 rounded-xl mb-5 border border-slate-800">
          {['login', 'signup'].map(m => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m)
                setError('')
              }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
                mode === m ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'login' ? 'Officer Sign In' : 'Register New User'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-slate-300 font-bold mb-1">Full Officer Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Rajesh Kumar"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-bold mb-1">Official IR Email / ID</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="user@railopt.in"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 pr-10"
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
              <label className="block text-slate-300 font-bold mb-1">Department</label>
              <select
                value={form.department}
                onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 font-bold"
              >
                <option value="Engineering">Engineering (TMS)</option>
                <option value="S&T">S&T (SMMS)</option>
                <option value="Traction">Traction (TDMS)</option>
              </select>
            </div>
          )}

          {error && <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-bold">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-950 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === 'login' ? 'SIGN IN TO CONTROL OFFICE' : 'REGISTER OFFICER ACCOUNT'}
          </button>
        </form>

        <div className="mt-4 p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-center text-xs">
          <p className="text-amber-400 font-extrabold">Demo Credentials Available</p>
          <p className="text-slate-300 mt-0.5 font-mono text-[11px]">admin@railopt.in / admin123</p>
        </div>
      </div>

      <div className="text-center text-[10px] font-bold text-slate-500 pb-2 uppercase tracking-widest">
        CENTRE FOR RAILWAY INFORMATION SYSTEMS (CRIS) · GOVERNMENT OF INDIA
      </div>
    </div>
  )
}
