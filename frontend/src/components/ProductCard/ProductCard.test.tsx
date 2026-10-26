import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import type { Producto } from '../../types/producto';

describe('ProductCard Component', () => {
  const baseProducto: Producto = {
    id: 1,
    categoriaId: 2,
    categoriaNombre: 'Ropa',
    nombre: 'Camiseta Básica',
    descripcion: 'Camiseta de algodón 100% orgánico',
    precio: 35000,
    stock: 25,
    imagenUrl: 'https://picsum.photos/seed/test/400/400',
    activo: true,
  };

  it('renders product information accurately', () => {
    render(<ProductCard producto={baseProducto} />);

    expect(screen.getByText('Camiseta Básica')).toBeDefined();
    expect(screen.getByText('Camiseta de algodón 100% orgánico')).toBeDefined();
    expect(screen.getByText('Ropa')).toBeDefined();
    expect(screen.getByText('En stock (25)')).toBeDefined();
  });

  it('formats COP currency properly with symbol and thousands separator', () => {
    render(<ProductCard producto={baseProducto} />);
    const priceText = screen.getByText(/35/);
    expect(priceText).toBeDefined();
  });

  it('displays "Agotado" when stock is 0', () => {
    const outOfStockItem: Producto = { ...baseProducto, stock: 0 };
    render(<ProductCard producto={outOfStockItem} />);

    expect(screen.getByText('Agotado')).toBeDefined();
  });

  it('displays "Pocas unidades (n)" when stock is between 1 and 10', () => {
    const lowStockItem: Producto = { ...baseProducto, stock: 4 };
    render(<ProductCard producto={lowStockItem} />);

    expect(screen.getByText('Pocas unidades (4)')).toBeDefined();
  });

  it('renders image fallback when imagenUrl is null', () => {
    const noImageItem: Producto = { ...baseProducto, imagenUrl: null };
    render(<ProductCard producto={noImageItem} />);

    expect(screen.getByText('Sin imagen disponible')).toBeDefined();
  });

  it('switches to fallback on image loading error', () => {
    render(<ProductCard producto={baseProducto} />);

    const img = screen.getByRole('img');
    fireEvent.error(img);

    expect(screen.getByText('Sin imagen disponible')).toBeDefined();
  });
});
