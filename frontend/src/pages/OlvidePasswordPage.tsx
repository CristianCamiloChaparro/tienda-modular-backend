import React, { useState } from 'react';
import { Link } from 'react-router';
import { solicitarRestablecimiento } from '../services/auth';
import { erroresDeCampos, mensajeDeError } from '../utils/formato';
import styles from './AuthPage.module.scss';

export const OlvidePasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await solicitarRestablecimiento(email.trim());
      setEnviado(true);
    } catch (err) {
      setError(erroresDeCampos(err).email ?? mensajeDeError(err, 'No se pudo enviar la solicitud'));
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className={`container ${styles.wrapper}`}>
        <div className={`panel ${styles.card} ${styles.enviado}`} role="status">
          <span className={styles.icono} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </span>
          <h1 className={styles.title}>Revisa tu correo</h1>
          <p className={styles.subtitle}>
            Si existe una cuenta con <strong>{email.trim()}</strong>, te enviamos un enlace para crear una contraseña
            nueva. Vence en 30 minutos. Si no lo ves, busca en la carpeta de spam.
          </p>
          <Link to="/login" className="btn btn-primary btn-block">
            Volver a iniciar sesión
          </Link>
          <p className={styles.switch}>
            ¿No llegó?{' '}
            <button type="button" className={styles.enlace} onClick={() => setEnviado(false)}>
              Enviar de nuevo
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`container ${styles.wrapper}`}>
      <form className={`panel ${styles.card}`} onSubmit={handleSubmit}>
        <h1 className={styles.title}>¿Olvidaste tu contraseña?</h1>
        <p className={styles.subtitle}>
          Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva.
        </p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={150}
            required
            autoFocus
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar enlace'}
        </button>

        <p className={styles.switch}>
          <Link to="/login">← Volver a iniciar sesión</Link>
        </p>
      </form>
    </div>
  );
};
