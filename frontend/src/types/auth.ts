export type Rol = 'ADMIN' | 'CLIENTE';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  dosFactoresActivo: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegistroRequest {
  nombre: string;
  email: string;
  password: string;
}

/** Respuesta del login cuando la cuenta pide el código de la app autenticadora (HTTP 202). */
export interface DosFactoresRequerido {
  requiereDosFactores: true;
  mensaje: string;
}

export interface ConfiguracionDosFactores {
  secreto: string;
  otpauthUrl: string;
}
