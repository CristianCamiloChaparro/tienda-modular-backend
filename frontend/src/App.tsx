import React from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header/Header';
import { RutaProtegida } from './components/RutaProtegida/RutaProtegida';
import { CatalogoPage } from './pages/CatalogoPage';
import { CarritoPage } from './pages/CarritoPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage } from './pages/LoginPage';
import { RegistroPage } from './pages/RegistroPage';
import { MisPedidosPage } from './pages/MisPedidosPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OlvidePasswordPage } from './pages/OlvidePasswordPage';
import { RestablecerPasswordPage } from './pages/RestablecerPasswordPage';
import { CuentaPage } from './pages/CuentaPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminProductosPage } from './pages/admin/AdminProductosPage';
import { AdminCategoriasPage } from './pages/admin/AdminCategoriasPage';
import { AdminPedidosPage } from './pages/admin/AdminPedidosPage';
import { API_BASE_URL } from './services/http';
import styles from './App.module.scss';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <div className={styles.app}>
              <Header />

              <main className={styles.main}>
                <Routes>
                  <Route path="/" element={<CatalogoPage />} />
                  <Route path="/carrito" element={<CarritoPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/registro" element={<RegistroPage />} />
                  <Route path="/olvide-contrasena" element={<OlvidePasswordPage />} />
                  <Route path="/restablecer" element={<RestablecerPasswordPage />} />
                  <Route
                    path="/cuenta"
                    element={
                      <RutaProtegida>
                        <CuentaPage />
                      </RutaProtegida>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <RutaProtegida>
                        <CheckoutPage />
                      </RutaProtegida>
                    }
                  />
                  <Route
                    path="/pedidos"
                    element={
                      <RutaProtegida>
                        <MisPedidosPage />
                      </RutaProtegida>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <RutaProtegida soloAdmin>
                        <AdminLayout />
                      </RutaProtegida>
                    }
                  >
                    <Route index element={<AdminProductosPage />} />
                    <Route path="categorias" element={<AdminCategoriasPage />} />
                    <Route path="pedidos" element={<AdminPedidosPage />} />
                  </Route>
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              <footer className={styles.footer}>
                <div className={`container ${styles.footerInner}`}>
                  <div>
                    <span className={styles.footerBrand}>Tienda</span>
                    <p className={styles.footerText}>
                      Proyecto de aula · Gustavo Andrés Núñez Vega y Cristian Camilo Chaparro
                    </p>
                  </div>
                  <nav className={styles.footerLinks} aria-label="Enlaces del pie de página">
                    <Link to="/">Catálogo</Link>
                    <Link to="/carrito">Carrito</Link>
                    <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noreferrer">
                      Documentación de la API
                    </a>
                  </nav>
                </div>
              </footer>
            </div>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
