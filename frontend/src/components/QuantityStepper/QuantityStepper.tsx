import React from 'react';
import styles from './QuantityStepper.module.scss';

interface QuantityStepperProps {
  cantidad: number;
  maximo: number;
  disabled?: boolean;
  etiqueta: string;
  onChange: (cantidad: number) => void;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  cantidad,
  maximo,
  disabled = false,
  etiqueta,
  onChange,
}) => {
  return (
    <div className={styles.stepper} role="group" aria-label={`Cantidad de ${etiqueta}`}>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(cantidad - 1)}
        disabled={disabled || cantidad <= 1}
        aria-label="Disminuir cantidad"
      >
        −
      </button>
      <span className={styles.value} aria-live="polite">
        {cantidad}
      </span>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(cantidad + 1)}
        disabled={disabled || cantidad >= maximo}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  );
};
