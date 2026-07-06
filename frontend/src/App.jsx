import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/admin/ProtectedRoute'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import LocationsPage from './pages/LocationsPage'
import AcademyPage from './pages/AcademyPage'
import LoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import LocationsManage from './pages/admin/LocationsManage'
import LocationCategory from './pages/admin/LocationCategory'
import HomepageEdit from './pages/admin/HomepageEdit'
import AboutPageEdit from './pages/admin/AboutPageEdit'
import AcademyPageEdit from './pages/admin/AcademyPageEdit'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="locations" element={<LocationsPage />} />
            <Route path="locations/:category" element={<LocationsPage />} />
            <Route path="academy" element={<AcademyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <Navigate to="/admin" replace />
          } />
          <Route path="/admin/locations" element={
            <ProtectedRoute><LocationsManage /></ProtectedRoute>
          } />
          <Route path="/admin/locations/:category" element={
            <ProtectedRoute><LocationCategory /></ProtectedRoute>
          } />
          <Route path="/admin/homepage" element={
            <ProtectedRoute><HomepageEdit /></ProtectedRoute>
          } />
          <Route path="/admin/about" element={
            <ProtectedRoute><AboutPageEdit /></ProtectedRoute>
          } />
          <Route path="/admin/academy" element={
            <ProtectedRoute><AcademyPageEdit /></ProtectedRoute>
          } />
          <Route path="/admin/*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
