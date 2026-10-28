/** Ayudas del formulario de pago: las mismas reglas que valida la pasarela en el backend. */

export type MarcaTarjeta = 'visa' | 'mastercard' | 'amex' | 'desconocida';

export const NOMBRE_MARCA: Record<MarcaTarjeta, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  desconocida: 'Tarjeta',
};

export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function detectarMarca(numero: string): MarcaTarjeta {
  const d = soloDigitos(numero);
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  return 'desconocida';
}

/** Longitud esperada del número según la marca (Amex usa 15 dígitos). */
export function longitudTarjeta(marca: MarcaTarjeta): number {
  return marca === 'amex' ? 15 : 16;
}

export function longitudCvv(marca: MarcaTarjeta): number {
  return marca === 'amex' ? 4 : 3;
}

/** Agrupa el número mientras se escribe: 4-4-4-4, o 4-6-5 para Amex. */
export function formatearNumero(valor: string): string {
  const marca = detectarMarca(valor);
  const d = soloDigitos(valor).slice(0, longitudTarjeta(marca));
  if (marca === 'amex') {
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10)].filter(Boolean).join(' ');
  }
  return d.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function pasaLuhn(numero: string): boolean {
  const d = soloDigitos(numero);
  if (d.length < 13) return false;
  let suma = 0;
  let duplicar = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let digito = Number(d[i]);
    if (duplicar) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    suma += digito;
    duplicar = !duplicar;
  }
  return suma % 10 === 0;
}

/** Escribe el vencimiento como MM/AA. */
export function formatearVencimiento(valor: string): string {
  const d = soloDigitos(valor).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

/** Convierte MM/AA en mes y año completos, o null si está incompleto o el mes no existe. */
export function leerVencimiento(valor: string): { mes: number; anio: number } | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(valor);
  if (!m) return null;
  const mes = Number(m[1]);
  if (mes < 1 || mes > 12) return null;
  return { mes, anio: 2000 + Number(m[2]) };
}

export function estaVencida(mes: number, anio: number, hoy = new Date()): boolean {
  return anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1);
}
