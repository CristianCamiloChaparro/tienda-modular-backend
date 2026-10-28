import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { esDosFactoresRequerido } from '../services/auth';
import type { Usuario } from '../types/auth';
import { CampoPassword } from '../components/CampoPassword/CampoPassword';
import { CodigoVerificacion } from '../components/CodigoVerificacion/CodigoVerificacion';
import { ApiException } from '../services/http';
import { mensajeDeError } from '../utils/formato';
import styles from './AuthPage.module.scss';

export const LoginPage: React.FC = () => {
  const { usuario, login, verificarCodigo } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const estado = location.state as { desde?: string; mensaje?: string } | null;
  const desde = estado?.desde;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [pasoCodigo, setPasoCodigo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (usuario) {
    return <Navigate to={desde ?? '/'} replace />;
  }

  const entrar = (u: Usuario) => {
    notificar(`Bienvenido, ${u.nombre}`);
    navigate(desde ?? (u.rol === 'ADMIN' ? '/admin' : '/'), { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const resultado = await login({ email, password });
      if (esDosFactoresRequerido(resultado)) {
        setPasoCodigo(true);
      } else {
        entrar(resultado);
      }
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo iniciar sesión'));
    } finally {
      setEnviando(false);
    }
  };

  const handleCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      entrar(await verificarCodigo(codigo));
    } catch (err) {
      setCodigo('');
      // 401: la verificación venció; 429: demasiados intentos. En ambos casos se vuelve a pedir la contraseña.
      if (err instanceof ApiException && (err.status === 401 || err.status === 429)) {
        setPasoCodigo(false);
        setPassword('');
      }
      setError(mensajeDeError(err, 'No se pudo verificar el código'));
    } finally {
      setEnviando(false);
    }
  };

  if (pasoCodigo) {
    return (
      <div className={`container ${styles.wrapper}`}>
        <form className={`panel ${styles.card}`} onSubmit={handleCodigo}>
          <span className={styles.icono} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="6" y="2" width="12" height="20" rx="2" />
              <path d="M10 18h4" />
            </svg>
          </span>
          <h1 className={styles.title}>Verificación en dos pasos</h1>
          <p className={styles.subtitle}>
            Abre tu app autenticadora (Google Authenticator, Microsoft Authenticator o Authy) y escribe el código de 6
            dígitos de <strong>Tienda</strong>.
          </p>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <CodigoVerificacion id="codigo" label="Código de verificación" value={codigo} onChange={setCodigo} autoFocus />

          <button type="submit" className="btn btn-primary btn-block" disabled={enviando || codigo.length !== 6}>
            {enviando ? 'Verificando...' : 'Verificar e ingresar'}
          </button>

          <p className={styles.switch}>
            <button
              type="button"
              className={styles.enlace}
              onClick={() => {
                setPasoCodigo(false);
                setCodigo('');
                setError(null);
              }}
            >
              ← Usar otra cuenta
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className={`container ${styles.wrapper}`}>
      <form className={`panel ${styles.card}`} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Ingresa para pagar tus compras o administrar la tienda.</p>

        {estado?.mensaje && !error && (
          <div className="alert alert-success" role="status">
            {estado.mensaje}
          </div>
        )}
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
        <CampoPassword
          id="password"
          label="Contraseña"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <div className={styles.olvide}>
          <Link to="/olvide-contrasena">¿Olvidaste tu contraseña?</Link>
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
