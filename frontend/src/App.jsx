import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Drive from './pages/Drive'

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/drive"
          element={
            <PrivateRoute>
              <Drive />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/drive" />} />
      </Routes>
    </BrowserRouter>
  )
}

