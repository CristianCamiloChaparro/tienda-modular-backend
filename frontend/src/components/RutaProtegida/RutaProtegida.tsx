import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface RutaProtegidaProps {
  children: React.ReactNode;
  soloAdmin?: boolean;
}

/**
 * Oculta páginas a quien no tiene sesión o permisos. Es solo comodidad de interfaz:
 * la protección real la hace el backend en cada endpoint.
 */
export const RutaProtegida: React.FC<RutaProtegidaProps> = ({ children, soloAdmin = false }) => {
  const { usuario, cargando, esAdmin } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="container page-header" aria-busy="true">
        Verificando sesión...
      </div>
    );
  }
  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  }
  if (soloAdmin && !esAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
