import React from 'react';
import { NavLink, Outlet } from 'react-router';
import styles from './Admin.module.scss';

const claseTab = ({ isActive }: { isActive: boolean }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`;

export const AdminLayout: React.FC = () => (
  <div className="container">
    <header className="page-header">
      <h1 className="page-title">Panel de administrador</h1>
      <p className="page-subtitle">Gestiona el catálogo y los pedidos de la tienda.</p>
    </header>
    <nav className={styles.tabs} aria-label="Secciones del panel">
      <NavLink to="/admin" end className={claseTab}>
        Productos
      </NavLink>
      <NavLink to="/admin/categorias" className={claseTab}>
        Categorías
      </NavLink>
      <NavLink to="/admin/pedidos" className={claseTab}>
        Pedidos
      </NavLink>
    </nav>
    <Outlet />
  </div>
);
