import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider, useCart } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import Header from './components/Header'
import Hero from './components/Hero'
import Products from './components/Products'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import CartSidebar from './components/CartSidebar'
import SearchModal from './components/SearchModal'
import SkinQuiz from './components/SkinQuiz'
import FaceAnalyzer from './components/FaceAnalyzer'
import MobileNav from './components/MobileNav'
import LoadingScreen from './components/LoadingScreen'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminUsers from './pages/admin/AdminUsers'
import AdminOrders from './pages/admin/AdminOrders'
import AdminBanners from './pages/admin/AdminBanners'
import AdminLogin from './pages/admin/AdminLogin'
import AdminPickupPoints from './pages/admin/AdminPickupPoints'
import './App.css'
import './quiz-and-mobile.css'

function AdminGuard({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/admin/login" replace />
  if (user.role !== 'admin') return <Navigate to="/admin/login" replace />
  return children
}

function Shop() {
  const [authOpen, setAuthOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [faceOpen, setFaceOpen] = useState(false)
  const { setOpen: openCart, count } = useCart()

  return (
    <>
      <Header
        cartCount={count}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenCart={() => openCart(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <main>
        <Hero onOpenQuiz={() => setQuizOpen(true)} onOpenFace={() => setFaceOpen(true)} />
        <Products onRequireAuth={() => setAuthOpen(true)} />
      </main>
      <Footer />
      <CartSidebar onRequireAuth={() => setAuthOpen(true)} />
      <MobileNav
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenFace={() => setFaceOpen(true)}
      />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onRequireAuth={() => { setSearchOpen(false); setAuthOpen(true) }}
        />
      )}
      {quizOpen && (
        <SkinQuiz
          onClose={() => setQuizOpen(false)}
          onRequireAuth={() => { setQuizOpen(false); setAuthOpen(true) }}
        />
      )}
      {faceOpen && (
        <FaceAnalyzer
          onClose={() => setFaceOpen(false)}
          onRequireAuth={() => { setFaceOpen(false); setAuthOpen(true) }}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <LoadingScreen />
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Shop />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="pickup-points" element={<AdminPickupPoints />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="orders" element={<AdminOrders />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </BrowserRouter>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
    </LanguageProvider>
  )
}
