/** Reglas iguales a las del backend (RegistroRequest): 8 a 72 caracteres, una letra y un número. */
export const REQUISITOS_PASSWORD = [
  { texto: 'Mínimo 8 caracteres', cumple: (p: string) => p.length >= 8 && p.length <= 72 },
  { texto: 'Al menos una letra', cumple: (p: string) => /[A-Za-z]/.test(p) },
  { texto: 'Al menos un número', cumple: (p: string) => /\d/.test(p) },
];

export function passwordValida(p: string): boolean {
  return REQUISITOS_PASSWORD.every((r) => r.cumple(p));
}
