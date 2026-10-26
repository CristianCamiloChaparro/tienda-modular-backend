import type { LoginRequest, RegistroRequest, Usuario } from '../types/auth';
import { request } from './http';

/** null si no hay sesión (el backend responde 204). */
export async function obtenerSesion(): Promise<Usuario | null> {
  const usuario = await request<Usuario | undefined>('/auth/me');
  return usuario ?? null;
}

export function iniciarSesion(datos: LoginRequest): Promise<Usuario> {
  return request<Usuario>('/auth/login', { method: 'POST', body: datos });
}

export function registrarse(datos: RegistroRequest): Promise<Usuario> {
  return request<Usuario>('/auth/registro', { method: 'POST', body: datos });
}

export function cerrarSesion(): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST' });
}
