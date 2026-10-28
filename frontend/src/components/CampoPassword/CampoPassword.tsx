import React, { useState } from 'react';
import { REQUISITOS_PASSWORD } from '../../utils/password';
import styles from './CampoPassword.module.scss';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  autoComplete: 'current-password' | 'new-password';
  error?: string;
  /** Muestra la lista de requisitos debajo (para contraseñas nuevas). */
  conRequisitos?: boolean;
  autoFocus?: boolean;
}

const Ojo: React.FC<{ tachado: boolean }> = ({ tachado }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {tachado && <path d="M4 4l16 16" />}
  </svg>
);

export const CampoPassword: React.FC<Props> = ({
  id,
  label,
  value,
  onChange,
  autoComplete,
  error,
  conRequisitos = false,
  autoFocus,
}) => {
  const [visible, setVisible] = useState(false);
  const descripcion = [conRequisitos && `${id}-requisitos`, error && `${id}-error`].filter(Boolean).join(' ');

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={styles.envoltura}>
        <input
          id={id}
          className="input"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={72}
          required
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={descripcion || undefined}
        />
        <button
          type="button"
          className={styles.ver}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          <Ojo tachado={visible} />
        </button>
      </div>
      {conRequisitos && (
        <ul className={styles.requisitos} id={`${id}-requisitos`}>
          {REQUISITOS_PASSWORD.map((r) => {
            const ok = r.cumple(value);
            return (
              <li key={r.texto} className={ok ? styles.cumple : ''}>
                <span aria-hidden="true">{ok ? '✓' : '·'}</span> {r.texto}
                <span className="visually-hidden">{ok ? ' (cumple)' : ' (pendiente)'}</span>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
};
