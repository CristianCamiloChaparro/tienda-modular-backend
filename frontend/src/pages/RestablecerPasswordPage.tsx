import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { restablecerPassword } from '../services/auth';
import { CampoPassword } from '../components/CampoPassword/CampoPassword';
import { passwordValida } from '../utils/password';
import { erroresDeCampos, mensajeDeError } from '../utils/formato';
import styles from './AuthPage.module.scss';

export const RestablecerPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});

  if (!token) {
    return (
      <div className="container">
        <div className="vacio" style={{ marginTop: 32 }}>
          <span className="vacio-marca">Enlace incompleto</span>
          <h1 className="vacio-titulo">Este enlace no es válido</h1>
          <p className="vacio-texto">Abre el enlace completo que llegó a tu correo, o pide uno nuevo.</p>
          <Link to="/olvide-contrasena" className="btn btn-primary">
            Pedir un enlace nuevo
          </Link>
        </div>
      </div>
    );
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
      await restablecerPassword(token, password);
      navigate('/login', { replace: true, state: { mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' } });
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo cambiar la contraseña'));
      setCampos(erroresDeCampos(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={`container ${styles.wrapper}`}>
      <form className={`panel ${styles.card}`} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Nueva contraseña</h1>
        <p className={styles.subtitle}>Elige una contraseña que no uses en otros sitios.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}{' '}
            {campos.token && <Link to="/olvide-contrasena">Pedir un enlace nuevo</Link>}
          </div>
        )}

        <CampoPassword
          id="password"
          label="Contraseña nueva"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={campos.password}
          conRequisitos
          autoFocus
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
          {enviando ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  );
};
