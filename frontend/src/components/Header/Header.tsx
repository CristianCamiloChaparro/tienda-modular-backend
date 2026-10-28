import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import styles from './Header.module.scss';

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

export const Header: React.FC = () => {
  const { usuario, esAdmin, logout } = useAuth();
  const { totalUnidades } = useCart();
  const { notificar } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Primero se sale de la página actual: si es protegida, no debe recordarse como destino tras el próximo login.
    navigate('/');
    try {
      await logout();
      notificar('Sesión cerrada', 'info');
    } catch {
      notificar('No se pudo cerrar la sesión', 'error');
    }
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.brand} aria-label="Tienda, inicio">
          <span className={styles.wordmark}>Tienda</span>
        </Link>

        <nav className={styles.nav} aria-label="Navegación principal">
          <NavLink to="/" end className={claseEnlace}>
            Catálogo
          </NavLink>
          {usuario && (
            <NavLink to="/pedidos" className={claseEnlace}>
              Mis pedidos
            </NavLink>
          )}
          {esAdmin && (
            <NavLink to="/admin" className={claseEnlace}>
              Administrar
            </NavLink>
          )}
        </nav>

        <div className={styles.actions}>
          <Link to="/carrito" className={styles.cartLink} aria-label={`Carrito, ${totalUnidades} productos`}>
            Carrito
            <span className={`${styles.cartCount} ${totalUnidades > 0 ? styles.cartCountActive : ''}`}>
              {totalUnidades}
            </span>
          </Link>

          {usuario ? (
            <div className={styles.user}>
              <span className={styles.userName} title={usuario.email}>
                {usuario.nombre}
                {esAdmin && <span className={styles.roleBadge}>Admin</span>}
              </span>
              <button type="button" className={styles.textLink} onClick={handleLogout}>
                Salir
              </button>
            </div>
          ) : (
            <div className={styles.user}>
              <Link to="/login" className={styles.textLink}>
                Ingresar
              </Link>
              <Link to="/registro" className={`btn btn-primary btn-sm ${styles.registerBtn}`}>
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
