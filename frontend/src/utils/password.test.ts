import { describe, expect, it } from 'vitest';
import { passwordValida } from './password';

describe('passwordValida', () => {
  it('pide 8 caracteres, una letra y un número, como el backend', () => {
    expect(passwordValida('Clave1234')).toBe(true);
    expect(passwordValida('Clave12')).toBe(false);
    expect(passwordValida('ClaveSinNumero')).toBe(false);
    expect(passwordValida('12345678')).toBe(false);
    expect(passwordValida('a1'.repeat(37))).toBe(false);
  });
});
