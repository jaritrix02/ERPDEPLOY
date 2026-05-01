import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login, clearError } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck, Sun, Moon, ArrowRight } from 'lucide-react'
import api from '../../services/api'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, token } = useSelector(s => s.auth)
  const [form, setForm] = useState({ email: 'admin@nexuserp.com', password: 'ChangeMe123!' })
  const [show, setShow] = useState(false)
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleDark = () => {
    setIsDark(prev => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('theme', next ? 'dark' : 'light')
      return next
    })
  }
  
  useEffect(() => { if (token) navigate('/') }, [token])
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()) } }, [error])

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Email and password are required')
    dispatch(login(form))
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!form.email) {
      toast.error('Please enter your email address first.');
      return;
    }
    
    const toastId = toast.loading('Sending request...');
    try {
      const response = await api.post('/auth/forgot-password', { email: form.email });
      if (response.data.success) {
        toast.success(`Reset request sent for ${form.email}`, { id: toastId });
      } else {
        toast.error(response.data.message || 'Failed to send request.', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error.', { id: toastId });
    }
  }

  const demoLogins = [
    { label: 'Admin',    email: 'admin@nexuserp.com' },
    { label: 'HOD',      email: 'hod@nexuserp.com' },
    { label: 'Purchase', email: 'purchase@nexuserp.com' },
    { label: 'Store',    email: 'store@nexuserp.com' },
    { label: 'HR',       email: 'hr@nexuserp.com' },
    { label: 'QC',       email: 'qc@nexuserp.com' },
    { label: 'Gate',     email: 'gate@nexuserp.com' },
    { label: 'Sales',    email: 'sales@nexuserp.com' },
    { label: 'Maint.',   email: 'maintenance@nexuserp.com' },
  ]

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
      
      {/* Dark Mode Toggle */}
      <button onClick={toggleDark} 
        className="absolute top-6 right-6 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm text-gray-600 dark:text-gray-300 transition-colors z-50">
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-600 mb-4 shadow-sm text-white">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Nucork ERP</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Industrial Resource Management</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="name@nucork.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</label>
                <button type="button" onClick={handleForgotPassword} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Forgot Password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type={show ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShow(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 text-center mb-4 uppercase tracking-widest">Demo Roles</p>
            <div className="grid grid-cols-3 gap-2">
              {demoLogins.map(d => (
                <button key={d.label}
                  onClick={() => setForm({ email: d.email, password: 'ChangeMe123!' })}
                  className="px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors uppercase truncate">
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
