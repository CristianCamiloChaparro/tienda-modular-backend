import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Carrito } from '../types/carrito';
import {
  actualizarItem,
  agregarItem,
  crearCarrito,
  obtenerCarrito,
  quitarItem,
  vaciarCarrito,
} from '../services/carrito';
import { ApiException } from '../services/http';

const CLAVE_CARRITO = 'tienda.carritoId';

interface CartContextValue {
  carrito: Carrito | null;
  cargando: boolean;
  totalUnidades: number;
  agregar: (productoId: number, cantidad?: number) => Promise<void>;
  actualizar: (productoId: number, cantidad: number) => Promise<void>;
  quitar: (productoId: number) => Promise<void>;
  vaciar: () => Promise<void>;
  recargar: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function leerId(): string | null {
  try {
    return localStorage.getItem(CLAVE_CARRITO);
  } catch {
    return null;
  }
}

function guardarId(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(CLAVE_CARRITO, id);
    } else {
      localStorage.removeItem(CLAVE_CARRITO);
    }
  } catch {
    // Almacenamiento no disponible (modo privado): el carrito vive solo en memoria.
  }
}

/**
 * El carrito vive en el backend (identificado por un UUID guardado en el navegador);
 * todos los totales los calcula la API y aquí solo se muestran.
 */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [carrito, setCarrito] = useState<Carrito | null>(null);
  const [cargando, setCargando] = useState(() => leerId() !== null);

  const cargarCarrito = useCallback(async (id: string) => {
    try {
      setCarrito(await obtenerCarrito(id));
    } catch (err) {
      // El carrito guardado ya no existe en el servidor: se olvida.
      if (err instanceof ApiException && err.status === 404) {
        guardarId(null);
        setCarrito(null);
      }
    } finally {
      setCargando(false);
    }
  }, []);

  const recargar = useCallback(async () => {
    const id = leerId();
    if (id) {
      await cargarCarrito(id);
    } else {
      setCarrito(null);
    }
  }, [cargarCarrito]);

  // Recupera el carrito guardado al abrir la aplicación.
  useEffect(() => {
    const id = leerId();
    if (!id) {
      return;
    }
    obtenerCarrito(id)
      .then(setCarrito)
      .catch((err) => {
        if (err instanceof ApiException && err.status === 404) {
          guardarId(null);
        }
      })
      .finally(() => setCargando(false));
  }, []);

  /**
   * Las operaciones se encadenan una tras otra: si el usuario hace clic dos veces seguidas,
   * la segunda espera a la primera. Así no se crean dos carritos ni se muestra una respuesta vieja.
   */
  const cola = useRef<Promise<unknown>>(Promise.resolve());
  const enCola = useCallback(<T,>(operacion: () => Promise<T>): Promise<T> => {
    const resultado = cola.current.then(operacion, operacion);
    cola.current = resultado.catch(() => undefined);
    return resultado;
  }, []);

  /** Devuelve el id del carrito, creándolo si aún no existe. */
  const asegurarCarrito = useCallback(async (): Promise<string> => {
    const id = leerId();
    if (id) {
      return id;
    }
    const nuevo = await crearCarrito();
    guardarId(nuevo.id);
    setCarrito(nuevo);
    return nuevo.id;
  }, []);

  const agregar = useCallback(
    (productoId: number, cantidad = 1) => enCola(async () => {
      let id = await asegurarCarrito();
      try {
        setCarrito(await agregarItem(id, productoId, cantidad));
      } catch (err) {
        // El carrito guardado ya no existe en el servidor: se crea otro y se reintenta.
        if (err instanceof ApiException && err.status === 404 && err.message.startsWith('Carrito')) {
          guardarId(null);
          id = await asegurarCarrito();
          setCarrito(await agregarItem(id, productoId, cantidad));
        } else {
          throw err;
        }
      }
    }),
    [asegurarCarrito, enCola]
  );

  const actualizar = useCallback(
    (productoId: number, cantidad: number) => enCola(async () => {
      const id = leerId();
      if (id) {
        setCarrito(await actualizarItem(id, productoId, cantidad));
      }
    }),
    [enCola]
  );

  const quitar = useCallback(
    (productoId: number) => enCola(async () => {
      const id = leerId();
      if (id) {
        setCarrito(await quitarItem(id, productoId));
      }
    }),
    [enCola]
  );

  const vaciar = useCallback(
    () => enCola(async () => {
      const id = leerId();
      if (id) {
        setCarrito(await vaciarCarrito(id));
      }
    }),
    [enCola]
  );

  const value = useMemo(
    () => ({
      carrito,
      cargando,
      totalUnidades: carrito?.totalUnidades ?? 0,
      agregar,
      actualizar,
      quitar,
      vaciar,
      recargar,
    }),
    [carrito, cargando, agregar, actualizar, quitar, vaciar, recargar]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// eslint-disable-next-line react/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de <CartProvider>');
  }
  return ctx;
}
