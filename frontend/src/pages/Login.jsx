import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const data = await login(username, password)
      localStorage.setItem('token', data.access_token)
      navigate('/drive')
    } catch {
      setError('Invalid credentials')
    }
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', height: '100vh',
      backgroundColor: '#f8f9fa', fontFamily: 'Google Sans, Roboto, sans-serif'
    }}>
      <div style={{
        background: 'white', padding: 40, borderRadius: 8,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', width: 360,
        display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{ fontSize: 24, fontWeight: 400, color: '#202124' }}>Locloud</h1>
          <p style={{ color: '#5f6368', fontSize: 14 }}>Sign in to your storage</p>
        </div>
        {error && <p style={{ color: '#d93025', fontSize: 14 }}>{error}</p>}
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            padding: '12px 16px', border: '1px solid #dadce0',
            borderRadius: 4, fontSize: 16, outline: 'none'
          }}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            padding: '12px 16px', border: '1px solid #dadce0',
            borderRadius: 4, fontSize: 16, outline: 'none'
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            padding: '12px 16px', backgroundColor: '#1a73e8',
            color: 'white', border: 'none', borderRadius: 4,
            fontSize: 16, cursor: 'pointer', fontWeight: 500
          }}
        >
          Sign in
        </button>
      </div>
    </div>
  )
}