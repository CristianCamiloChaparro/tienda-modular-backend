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
        <Link to="/" className={styles.brand}>
          <div className={styles.iconWrapper} aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div className={styles.textGroup}>
            <span className={styles.title}>Tienda en Línea Modular</span>
            <span className={styles.subtitle}>Catálogo, carrito y pagos en línea</span>
          </div>
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
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            {totalUnidades > 0 && <span className={styles.cartBadge}>{totalUnidades}</span>}
          </Link>

          {usuario ? (
            <div className={styles.user}>
              <span className={styles.userName} title={usuario.email}>
                {usuario.nombre}
                {esAdmin && <span className={styles.roleBadge}>Admin</span>}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Salir
              </button>
            </div>
          ) : (
            <div className={styles.user}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Ingresar
              </Link>
              <Link to="/registro" className="btn btn-primary btn-sm">
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
