import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { mensajeDeError } from '../utils/formato';
import styles from './AuthPage.module.scss';

export const LoginPage: React.FC = () => {
  const { usuario, login } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const desde = (location.state as { desde?: string } | null)?.desde;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (usuario) {
    return <Navigate to={desde ?? '/'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const u = await login({ email, password });
      notificar(`Bienvenido, ${u.nombre}`);
      navigate(desde ?? (u.rol === 'ADMIN' ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo iniciar sesión'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={`container ${styles.wrapper}`}>
      <form className={`panel ${styles.card}`} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Ingresa para pagar tus compras o administrar la tienda.</p>

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
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className={styles.switch}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" state={location.state}>
            Crea una aquí
          </Link>
        </p>
      </form>
    </div>
  );
};
