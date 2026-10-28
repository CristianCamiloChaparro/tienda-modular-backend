import React from 'react';
import styles from './CodigoVerificacion.module.scss';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  error?: string;
  autoFocus?: boolean;
}

/** Campo para el código de 6 dígitos de la app autenticadora. */
export const CodigoVerificacion: React.FC<Props> = ({ id, label, value, onChange, error, autoFocus }) => (
  <div className="field">
    <label htmlFor={id}>{label}</label>
    <input
      id={id}
      className={`input ${styles.codigo}`}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      placeholder="000000"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      required
      autoFocus={autoFocus}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error && (
      <span className="field-error" id={`${id}-error`}>
        {error}
      </span>
    )}
  </div>
);
