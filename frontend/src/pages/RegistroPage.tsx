import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CampoPassword } from '../components/CampoPassword/CampoPassword';
import { passwordValida } from '../utils/password';
import { erroresDeCampos, mensajeDeError } from '../utils/formato';
import styles from './AuthPage.module.scss';

export const RegistroPage: React.FC = () => {
  const { usuario, registro } = useAuth();
  const { notificar } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const desde = (location.state as { desde?: string } | null)?.desde;

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});

  if (usuario) {
    return <Navigate to={desde ?? '/'} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValida(password)) {
      setCampos({ password: 'La contraseña no cumple los requisitos' });
      return;
    }
    if (password !== confirmacion) {
      setCampos({ confirmacion: 'Las contraseñas no coinciden' });
      return;
    }
    setEnviando(true);
    setError(null);
    setCampos({});
    try {
      const u = await registro({ nombre, email, password });
      notificar(`Cuenta creada. ¡Bienvenido, ${u.nombre}!`);
      navigate(desde ?? '/', { replace: true });
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo crear la cuenta'));
      setCampos(erroresDeCampos(err));
    } finally {
      setEnviando(false);
    }
  };

  const errorDe = (campo: string) =>
    campos[campo] ? <span className="field-error">{campos[campo]}</span> : null;

  return (
    <div className={`container ${styles.wrapper}`}>
      <form className={`panel ${styles.card}`} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>Regístrate para pagar tus compras y ver tu historial de pedidos.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="field">
          <label htmlFor="nombre">Nombre completo</label>
          <input
            id="nombre"
            className="input"
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={100}
            required
            aria-invalid={Boolean(campos.nombre)}
          />
          {errorDe('nombre')}
        </div>
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
            aria-invalid={Boolean(campos.email)}
          />
          {errorDe('email')}
        </div>
        <CampoPassword
          id="password"
          label="Contraseña"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={campos.password}
          conRequisitos
        />
        <CampoPassword
          id="confirmacion"
          label="Confirmar contraseña"
          value={confirmacion}
          onChange={setConfirmacion}
          autoComplete="new-password"
          error={campos.confirmacion}
        />

        <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
          {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className={styles.switch}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" state={location.state}>
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
};
