import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingState } from './LoadingState/LoadingState';
import { ErrorState } from './ErrorState/ErrorState';
import { EmptyState } from './EmptyState/EmptyState';

describe('Visual States', () => {
  describe('LoadingState', () => {
    it('renders skeleton items and loading announcement', () => {
      render(<LoadingState count={4} />);
      expect(
        screen.getByText('Cargando catálogo de productos...')
      ).toBeDefined();
    });
  });

  describe('ErrorState', () => {
    it('renders connection error details, backend URL, and triggers onRetry', () => {
      const onRetry = vi.fn();
      render(
        <ErrorState
          message="Failed to fetch from backend"
          onRetry={onRetry}
          retrying={false}
        />
      );

      expect(
        screen.getByText('Error de conexión con el backend')
      ).toBeDefined();
      expect(screen.getByText('http://localhost:8080')).toBeDefined();
      expect(screen.getByText('Failed to fetch from backend')).toBeDefined();

      const retryButton = screen.getByRole('button', {
        name: /reintentar/i,
      });
      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyState', () => {
    it('renders category name and triggers onResetFilter', () => {
      const onReset = vi.fn();
      render(
        <EmptyState
          categoryName="Deportes"
          onResetFilter={onReset}
        />
      );

      expect(screen.getByText('No se encontraron productos')).toBeDefined();
      expect(screen.getByText(/Deportes/)).toBeDefined();

      const resetButton = screen.getByRole('button', {
        name: /ver todos los productos/i,
      });
      fireEvent.click(resetButton);
      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });
});
