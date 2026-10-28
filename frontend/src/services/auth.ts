import type {
  ConfiguracionDosFactores,
  DosFactoresRequerido,
  LoginRequest,
  RegistroRequest,
  Usuario,
} from '../types/auth';
import { request } from './http';

/** null si no hay sesión (el backend responde 204). */
export async function obtenerSesion(): Promise<Usuario | null> {
  const usuario = await request<Usuario | undefined>('/auth/me');
  return usuario ?? null;
}

/** Devuelve el usuario, o la indicación de que falta el código de la app autenticadora. */
export function iniciarSesion(datos: LoginRequest): Promise<Usuario | DosFactoresRequerido> {
  return request<Usuario | DosFactoresRequerido>('/auth/login', { method: 'POST', body: datos });
}

export function verificarCodigoLogin(codigo: string): Promise<Usuario> {
  return request<Usuario>('/auth/login/2fa', { method: 'POST', body: { codigo } });
}

export function registrarse(datos: RegistroRequest): Promise<Usuario> {
  return request<Usuario>('/auth/registro', { method: 'POST', body: datos });
}

export function cerrarSesion(): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST' });
}

export function solicitarRestablecimiento(email: string): Promise<void> {
  return request<void>('/auth/password/olvido', { method: 'POST', body: { email } });
}

export function restablecerPassword(token: string, password: string): Promise<void> {
  return request<void>('/auth/password/restablecer', { method: 'POST', body: { token, password } });
}

export function cambiarPassword(actual: string, nueva: string): Promise<void> {
  return request<void>('/auth/cuenta/password', { method: 'POST', body: { actual, nueva } });
}

export function iniciarDosFactores(): Promise<ConfiguracionDosFactores> {
  return request<ConfiguracionDosFactores>('/auth/cuenta/2fa/iniciar', { method: 'POST' });
}

export function activarDosFactores(codigo: string): Promise<Usuario> {
  return request<Usuario>('/auth/cuenta/2fa/activar', { method: 'POST', body: { codigo } });
}

export function desactivarDosFactores(codigo: string): Promise<Usuario> {
  return request<Usuario>('/auth/cuenta/2fa/desactivar', { method: 'POST', body: { codigo } });
}

export function esDosFactoresRequerido(r: Usuario | DosFactoresRequerido): r is DosFactoresRequerido {
  return 'requiereDosFactores' in r && r.requiereDosFactores === true;
}
