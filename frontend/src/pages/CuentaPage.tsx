import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  activarDosFactores,
  cambiarPassword,
  desactivarDosFactores,
  iniciarDosFactores,
} from '../services/auth';
import { ApiException } from '../services/http';
import type { ConfiguracionDosFactores } from '../types/auth';
import { CampoPassword } from '../components/CampoPassword/CampoPassword';
import { passwordValida } from '../utils/password';
import { CodigoVerificacion } from '../components/CodigoVerificacion/CodigoVerificacion';
import { erroresDeCampos, mensajeDeError } from '../utils/formato';
import styles from './CuentaPage.module.scss';

/** Si el servidor cerró la sesión por demasiados intentos (429), se vuelve al login. */
function useSesionCerrada() {
  const { actualizarUsuario } = useAuth();
  const navigate = useNavigate();
  return (err: unknown): boolean => {
    if (err instanceof ApiException && (err.status === 429 || err.status === 401)) {
      actualizarUsuario(null);
      navigate('/login', { replace: true, state: { desde: '/cuenta' } });
      return true;
    }
    return false;
  };
}

const CambioPassword: React.FC = () => {
  const { notificar } = useToast();
  const sesionCerrada = useSesionCerrada();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [campos, setCampos] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValida(nueva)) {
      setCampos({ nueva: 'La contraseña no cumple los requisitos' });
      return;
    }
    if (nueva !== confirmacion) {
      setCampos({ confirmacion: 'Las contraseñas no coinciden' });
      return;
    }
    setEnviando(true);
    setCampos({});
    try {
      await cambiarPassword(actual, nueva);
      setActual('');
      setNueva('');
      setConfirmacion('');
      notificar('Contraseña actualizada');
    } catch (err) {
      if (sesionCerrada(err)) {
        notificar(mensajeDeError(err), 'error');
        return;
      }
      const errores = erroresDeCampos(err);
      setCampos(Object.keys(errores).length ? errores : { actual: mensajeDeError(err) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className={styles.bloque} aria-labelledby="titulo-password">
      <div className={styles.bloqueTexto}>
        <h2 id="titulo-password" className={styles.bloqueTitulo}>
          Contraseña
        </h2>
        <p className={styles.bloqueAyuda}>
          Para cambiarla te pedimos la actual. Si no la recuerdas, cierra sesión y usa{' '}
          <Link to="/olvide-contrasena">¿Olvidaste tu contraseña?</Link>
        </p>
      </div>
      <form className={styles.formulario} onSubmit={handleSubmit}>
        <CampoPassword
          id="actual"
          label="Contraseña actual"
          value={actual}
          onChange={setActual}
          autoComplete="current-password"
          error={campos.actual}
        />
        <CampoPassword
          id="nueva"
          label="Contraseña nueva"
          value={nueva}
          onChange={setNueva}
          autoComplete="new-password"
          error={campos.nueva}
          conRequisitos
        />
        <CampoPassword
          id="confirmar"
          label="Confirmar contraseña nueva"
          value={confirmacion}
          onChange={setConfirmacion}
          autoComplete="new-password"
          error={campos.confirmacion}
        />
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </section>
  );
};

const DosFactores: React.FC = () => {
  const { usuario, actualizarUsuario } = useAuth();
  const { notificar } = useToast();
  const sesionCerrada = useSesionCerrada();
  const [config, setConfig] = useState<ConfiguracionDosFactores | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [desactivando, setDesactivando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const activo = usuario?.dosFactoresActivo ?? false;

  useEffect(() => {
    if (!config) return;
    let vigente = true;
    QRCode.toDataURL(config.otpauthUrl, { width: 200, margin: 1, color: { dark: '#1c1a17', light: '#fffdf9' } })
      .then((url) => vigente && setQr(url))
      .catch(() => vigente && setQr(null));
    return () => {
      vigente = false;
    };
  }, [config]);

  const fallo = (err: unknown) => {
    if (sesionCerrada(err)) {
      notificar(mensajeDeError(err), 'error');
      return;
    }
    setCodigo('');
    setError(erroresDeCampos(err).codigo ?? mensajeDeError(err));
  };

  const empezar = async () => {
    setEnviando(true);
    setError(undefined);
    try {
      setConfig(await iniciarDosFactores());
    } catch (err) {
      fallo(err);
    } finally {
      setEnviando(false);
    }
  };

  const activar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(undefined);
    try {
      actualizarUsuario(await activarDosFactores(codigo));
      setConfig(null);
      setQr(null);
      setCodigo('');
      notificar('Verificación en dos pasos activada');
    } catch (err) {
      fallo(err);
    } finally {
      setEnviando(false);
    }
  };

  const desactivar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(undefined);
    try {
      actualizarUsuario(await desactivarDosFactores(codigo));
      setDesactivando(false);
      setCodigo('');
      notificar('Verificación en dos pasos desactivada', 'info');
    } catch (err) {
      fallo(err);
    } finally {
      setEnviando(false);
    }
  };

  const claveAgrupada = config?.secreto.match(/.{1,4}/g)?.join(' ');

  return (
    <section className={styles.bloque} aria-labelledby="titulo-2fa">
      <div className={styles.bloqueTexto}>
        <h2 id="titulo-2fa" className={styles.bloqueTitulo}>
          Verificación en dos pasos
          <span className={`${styles.estado} ${activo ? styles.estadoActivo : ''}`}>
            {activo ? 'Activa' : 'Inactiva'}
          </span>
        </h2>
        <p className={styles.bloqueAyuda}>
          Además de la contraseña, al iniciar sesión te pediremos un código de 6 dígitos que cambia cada 30 segundos
          en tu celular. Así nadie entra a tu cuenta aunque conozca tu contraseña.
        </p>
      </div>

      <div className={styles.formulario}>
        {activo && !desactivando && (
          <div className={styles.activa}>
            <p>
              Tu cuenta está protegida. Cada vez que inicies sesión necesitarás el código de tu app autenticadora.
            </p>
            <button type="button" className="btn btn-secondary" onClick={() => setDesactivando(true)}>
              Desactivar
            </button>
          </div>
        )}

        {activo && desactivando && (
          <form onSubmit={desactivar}>
            <p className={styles.paso}>Para desactivarla, confirma con un código actual de tu app.</p>
            <CodigoVerificacion id="codigo-desactivar" label="Código" value={codigo} onChange={setCodigo} error={error} autoFocus />
            <div className={styles.acciones}>
              <button type="submit" className="btn btn-danger" disabled={enviando || codigo.length !== 6}>
                {enviando ? 'Desactivando...' : 'Desactivar'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setDesactivando(false);
                  setCodigo('');
                  setError(undefined);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {!activo && !config && (
          <div>
            {error && (
              <div className="alert alert-error" role="alert">
                {error}
              </div>
            )}
            <button type="button" className="btn btn-primary" onClick={empezar} disabled={enviando}>
              {enviando ? 'Preparando...' : 'Configurar verificación en dos pasos'}
            </button>
          </div>
        )}

        {!activo && config && (
          <form onSubmit={activar} className={styles.configurar}>
            <ol className={styles.pasos}>
              <li>
                <strong>Instala una app autenticadora</strong> en tu celular: Google Authenticator, Microsoft
                Authenticator o Authy.
              </li>
              <li>
                <strong>Escanea este código QR</strong> desde la app (botón «+» o «Agregar cuenta»).
                <div className={styles.qrFila}>
                  {qr ? (
                    <img src={qr} alt="Código QR para la app autenticadora" width={168} height={168} className={styles.qr} />
                  ) : (
                    <div className={styles.qr} aria-busy="true" />
                  )}
                  <div className={styles.clave}>
                    <span>¿No puedes escanear? Escribe esta clave:</span>
                    <code>{claveAgrupada}</code>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        navigator.clipboard
                          ?.writeText(config.secreto)
                          .then(() => notificar('Clave copiada', 'info'))
                          .catch(() => undefined)
                      }
                    >
                      Copiar clave
                    </button>
                  </div>
                </div>
              </li>
              <li>
                <strong>Escribe el código de 6 dígitos</strong> que muestra la app para confirmar.
                <CodigoVerificacion id="codigo-activar" label="Código" value={codigo} onChange={setCodigo} error={error} />
              </li>
            </ol>
            <div className={styles.acciones}>
              <button type="submit" className="btn btn-primary" disabled={enviando || codigo.length !== 6}>
                {enviando ? 'Activando...' : 'Activar'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setConfig(null);
                  setQr(null);
                  setCodigo('');
                  setError(undefined);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
};

export const CuentaPage: React.FC = () => {
  const { usuario } = useAuth();
  if (!usuario) return null;

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Mi cuenta</h1>
        <p className="page-subtitle">Tus datos y la seguridad de tu cuenta.</p>
      </header>

      <div className={styles.lista}>
        <section className={styles.bloque} aria-labelledby="titulo-datos">
          <div className={styles.bloqueTexto}>
            <h2 id="titulo-datos" className={styles.bloqueTitulo}>
              Datos
            </h2>
            <p className={styles.bloqueAyuda}>
              {usuario.rol === 'ADMIN' ? 'Cuenta de administrador.' : 'Cuenta de cliente.'}{' '}
              <Link to="/pedidos">Ver mis pedidos</Link>
            </p>
          </div>
          <dl className={styles.datos}>
            <div>
              <dt>Nombre</dt>
              <dd>{usuario.nombre}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{usuario.email}</dd>
            </div>
          </dl>
        </section>
        <CambioPassword />
        <DosFactores />
      </div>
    </div>
  );
};
