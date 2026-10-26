import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryFilter } from './CategoryFilter';
import type { Categoria } from '../../types/categoria';

describe('CategoryFilter Component', () => {
  const mockCategorias: Categoria[] = [
    { id: 1, nombre: 'Ropa' },
    { id: 2, nombre: 'Accesorios' },
    { id: 3, nombre: 'Hogar' },
  ];

  it('renders "Todos los productos" and all categories', () => {
    const onSelect = vi.fn();
    render(
      <CategoryFilter
        categorias={mockCategorias}
        selectedCategoriaId={null}
        onSelectCategoria={onSelect}
      />
    );

    expect(screen.getByText('Todos los productos')).toBeDefined();
    expect(screen.getByText('Ropa')).toBeDefined();
    expect(screen.getByText('Accesorios')).toBeDefined();
    expect(screen.getByText('Hogar')).toBeDefined();
  });

  it('sets aria-selected="true" for active category', () => {
    const onSelect = vi.fn();
    render(
      <CategoryFilter
        categorias={mockCategorias}
        selectedCategoriaId={2}
        onSelectCategoria={onSelect}
      />
    );

    const activeBtn = screen.getByText('Accesorios');
    expect(activeBtn.getAttribute('aria-selected')).toBe('true');

    const allBtn = screen.getByText('Todos los productos');
    expect(allBtn.getAttribute('aria-selected')).toBe('false');
  });

  it('triggers onSelectCategoria callback when category button is clicked', () => {
    const onSelect = vi.fn();
    render(
      <CategoryFilter
        categorias={mockCategorias}
        selectedCategoriaId={null}
        onSelectCategoria={onSelect}
      />
    );

    fireEvent.click(screen.getByText('Hogar'));
    expect(onSelect).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByText('Todos los productos'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
