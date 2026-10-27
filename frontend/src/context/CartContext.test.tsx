import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import React, { useEffect } from 'react';
import { CartProvider, useCart } from './CartContext';
import * as carritoApi from '../services/carrito';
import type { Carrito } from '../types/carrito';

const carrito = (unidades: number): Carrito => ({ id: 'c1', items: [], totalUnidades: unidades, total: 0 });

const sonda: { ctx?: ReturnType<typeof useCart> } = {};
const Sonda: React.FC = () => {
  const valor = useCart();
  useEffect(() => {
    sonda.ctx = valor;
  });
  return null;
};

describe('CartContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('dos clics seguidos usan un solo carrito y muestran la última respuesta aunque llegue antes la primera', async () => {
    const crear = vi.spyOn(carritoApi, 'crearCarrito').mockResolvedValue(carrito(0));
    let resolverPrimera: (c: Carrito) => void = () => undefined;
    vi.spyOn(carritoApi, 'agregarItem')
      .mockImplementationOnce(() => new Promise((r) => (resolverPrimera = r)))
      .mockResolvedValueOnce(carrito(2));

    render(
      <CartProvider>
        <Sonda />
      </CartProvider>
    );

    let primera: Promise<void> = Promise.resolve();
    let segunda: Promise<void> = Promise.resolve();
    await act(async () => {
      primera = sonda.ctx!.agregar(1);
      segunda = sonda.ctx!.agregar(2);
    });
    await act(async () => {
      resolverPrimera(carrito(1));
      await primera;
      await segunda;
    });

    expect(crear).toHaveBeenCalledTimes(1);
    expect(sonda.ctx!.totalUnidades).toBe(2);
  });
});
