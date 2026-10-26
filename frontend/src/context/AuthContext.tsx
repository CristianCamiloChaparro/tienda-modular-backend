import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { LoginRequest, RegistroRequest, Usuario } from '../types/auth';
import { cerrarSesion, iniciarSesion, obtenerSesion, registrarse } from '../services/auth';

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  esAdmin: boolean;
  login: (datos: LoginRequest) => Promise<Usuario>;
  registro: (datos: RegistroRequest) => Promise<Usuario>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Recupera la sesión existente (cookie HttpOnly) al abrir la aplicación.
  useEffect(() => {
    let activo = true;
    obtenerSesion()
      .then((u) => activo && setUsuario(u))
      .catch(() => activo && setUsuario(null))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  const login = useCallback(async (datos: LoginRequest) => {
    const u = await iniciarSesion(datos);
    setUsuario(u);
    return u;
  }, []);

  const registro = useCallback(async (datos: RegistroRequest) => {
    const u = await registrarse(datos);
    setUsuario(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await cerrarSesion();
    setUsuario(null);
  }, []);

  const value = useMemo(
    () => ({ usuario, cargando, esAdmin: usuario?.rol === 'ADMIN', login, registro, logout }),
    [usuario, cargando, login, registro, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
