import { describe, expect, it } from 'vitest';
import {
  detectarMarca,
  estaVencida,
  formatearNumero,
  formatearVencimiento,
  leerVencimiento,
  pasaLuhn,
} from './tarjeta';

describe('ayudas de tarjeta', () => {
  it('detecta la marca por el inicio del número', () => {
    expect(detectarMarca('4242 4242')).toBe('visa');
    expect(detectarMarca('5555')).toBe('mastercard');
    expect(detectarMarca('2223')).toBe('mastercard');
    expect(detectarMarca('3782')).toBe('amex');
    expect(detectarMarca('6011')).toBe('desconocida');
  });

  it('agrupa el número según la marca y corta los dígitos sobrantes', () => {
    expect(formatearNumero('42424242424242429999')).toBe('4242 4242 4242 4242');
    expect(formatearNumero('378282246310005')).toBe('3782 822463 10005');
    expect(formatearNumero('4a2-4')).toBe('424');
  });

  it('valida con Luhn igual que la pasarela', () => {
    expect(pasaLuhn('4242 4242 4242 4242')).toBe(true);
    expect(pasaLuhn('4000 0000 0000 0002')).toBe(true);
    expect(pasaLuhn('4242 4242 4242 4241')).toBe(false);
    expect(pasaLuhn('4242')).toBe(false);
  });

  it('lee el vencimiento MM/AA', () => {
    expect(formatearVencimiento('1228')).toBe('12/28');
    expect(leerVencimiento('12/28')).toEqual({ mes: 12, anio: 2028 });
    expect(leerVencimiento('13/28')).toBeNull();
    expect(leerVencimiento('1/28')).toBeNull();
  });

  it('marca como vencida una fecha anterior al mes actual', () => {
    const hoy = new Date(2026, 9, 28);
    expect(estaVencida(9, 2026, hoy)).toBe(true);
    expect(estaVencida(10, 2026, hoy)).toBe(false);
    expect(estaVencida(1, 2027, hoy)).toBe(false);
  });
});
