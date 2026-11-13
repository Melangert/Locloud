import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Cloud } from 'lucide-react'
import { getErrorMessage, login } from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await login(username.trim(), password)
      localStorage.setItem('token', data.access_token)
      navigate('/drive')
    } catch (loginError) {
      setError(getErrorMessage(loginError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-decoration"><div className="orb orb-one" /><div className="orb orb-two" /><span>Private storage, beautifully simple.</span></div>
      <section className="login-card">
        <div className="login-brand"><div className="brand-mark"><Cloud size={21} /></div><strong>Locloud</strong></div>
        <div><p className="eyebrow">Welcome back</p><h1>Your files, your cloud.</h1><p className="login-copy">Sign in to pick up where you left off.</p></div>
        <form onSubmit={handleSubmit}>
          <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
          {error && <div className="alert error">{error}</div>}
          <button className="button button-primary button-wide" disabled={loading}>{loading ? 'Signing in…' : <>Sign in <ArrowRight size={17} /></>}</button>
        </form>
      </section>
    </main>
  )
}
