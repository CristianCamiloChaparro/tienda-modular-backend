import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import styles from './Toast.module.scss';

type TipoToast = 'exito' | 'error' | 'info';

interface Toast {
  id: number;
  texto: string;
  tipo: TipoToast;
}

interface ToastContextValue {
  notificar: (texto: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const siguienteId = useRef(1);

  const notificar = useCallback((texto: string, tipo: TipoToast = 'exito') => {
    const id = siguienteId.current++;
    setToasts((actuales) => [...actuales, { id, texto, tipo }]);
    window.setTimeout(() => {
      setToasts((actuales) => actuales.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ notificar }), [notificar]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.tipo]}`} role="status">
            {t.texto}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  // Fuera del proveedor (p. ej. en pruebas de componentes aislados) no hace nada.
  return ctx ?? { notificar: () => undefined };
}
