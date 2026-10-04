import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/ui/Toast';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Analytics from './pages/Analytics';
import Budget from './pages/Budget';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import './styles/global.css';

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="auth-layout"><div style={{ color: 'var(--color-text-tertiary)' }}>Loading...</div></div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (token) return <Navigate to="/" replace />;
  return children;
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <Routes>
        <Route path="/" element={<Dashboard onMenuClick={toggleSidebar} />} />
        <Route path="/expenses" element={<Expenses onMenuClick={toggleSidebar} />} />
        <Route path="/analytics" element={<Analytics onMenuClick={toggleSidebar} />} />
        <Route path="/budget" element={<Budget onMenuClick={toggleSidebar} />} />
        <Route path="/categories" element={<Categories onMenuClick={toggleSidebar} />} />
        <Route path="/reports" element={<Reports onMenuClick={toggleSidebar} />} />
        <Route path="/settings" element={<Settings onMenuClick={toggleSidebar} />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}
