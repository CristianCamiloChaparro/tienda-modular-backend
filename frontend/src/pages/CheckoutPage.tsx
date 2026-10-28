import React, { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { pagarCarrito } from '../services/pedidos';
import type { Pedido } from '../types/pedido';
import { erroresDeCampos, formatearPrecio, mensajeDeError } from '../utils/formato';
import {
  detectarMarca,
  estaVencida,
  formatearNumero,
  formatearVencimiento,
  leerVencimiento,
  longitudCvv,
  longitudTarjeta,
  pasaLuhn,
  soloDigitos,
} from '../utils/tarjeta';
import { TarjetaPreview } from '../components/TarjetaPreview/TarjetaPreview';
import { MarcaTarjeta } from '../components/MarcaTarjeta/MarcaTarjeta';
import styles from './CheckoutPage.module.scss';

/** Tarjetas de la pasarela en modo prueba (ver PasarelaPagoSimulada en el backend). */
const TARJETAS_PRUEBA = [
  { etiqueta: 'Aprobada', numero: '4242 4242 4242 4242' },
  { etiqueta: 'Fondos insuficientes', numero: '4000 0000 0000 0002' },
];

/** Vencimiento de prueba: diciembre, dentro de 3 años. */
const VENCE_PRUEBA = `12/${String((new Date().getFullYear() + 3) % 100).padStart(2, '0')}`;

const PASOS = ['Carrito', 'Envío y pago', 'Confirmación'];

const Pasos: React.FC<{ actual: number }> = ({ actual }) => (
  <ol className={styles.pasos} aria-label="Pasos de la compra">
    {PASOS.map((paso, i) => (
      <li
        key={paso}
        className={`${styles.paso} ${i < actual ? styles.pasoHecho : ''} ${i === actual ? styles.pasoActual : ''}`}
        aria-current={i === actual ? 'step' : undefined}
      >
        <span className={styles.pasoNumero}>{i < actual ? '✓' : i + 1}</span>
        {i === 0 && actual > 0 ? <Link to="/carrito">{paso}</Link> : <span>{paso}</span>}
      </li>
    ))}
  </ol>
);

const Candado: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/** Errores del lado del cliente: las mismas reglas que valida la pasarela, para avisar antes de enviar. */
function validarTarjeta(numero: string, vencimiento: string, cvv: string): Record<string, string> {
  const errores: Record<string, string> = {};
  const marca = detectarMarca(numero);
  const digitos = soloDigitos(numero);
  if (digitos.length < longitudTarjeta(marca)) {
    errores['pago.numeroTarjeta'] = 'Faltan dígitos';
  } else if (!pasaLuhn(digitos)) {
    errores['pago.numeroTarjeta'] = 'El número de tarjeta no es válido';
  }
  const fecha = leerVencimiento(vencimiento);
  if (!fecha) {
    errores['pago.anioExpiracion'] = 'Usa el formato MM/AA';
  } else if (estaVencida(fecha.mes, fecha.anio)) {
    errores['pago.anioExpiracion'] = 'La tarjeta está vencida';
  }
  if (cvv.length !== longitudCvv(marca)) {
    errores['pago.cvv'] = `Debe tener ${longitudCvv(marca)} dígitos`;
  }
  return errores;
}

export const CheckoutPage: React.FC = () => {
  const { carrito, recargar } = useCart();
  const { usuario } = useAuth();

  const [direccionEnvio, setDireccionEnvio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [titular, setTitular] = useState(usuario?.nombre.toUpperCase() ?? '');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvv, setCvv] = useState('');
  const [enCvv, setEnCvv] = useState(false);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const bloquePago = useRef<HTMLElement>(null);

  if (pedido) {
    return <Confirmacion pedido={pedido} nombre={usuario?.nombre} />;
  }

  if (!carrito || carrito.items.length === 0) {
    return (
      <div className="container">
        <header className="page-header">
          <h1 className="page-title">Pago</h1>
        </header>
        <div className="vacio">
          <span className="vacio-marca">Pago</span>
          <h2 className="vacio-titulo">No hay productos para pagar</h2>
          <p className="vacio-texto">Tu carrito está vacío. Agrega productos desde el catálogo para continuar.</p>
          <Link to="/" className="btn btn-primary">
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const marca = detectarMarca(numeroTarjeta);
  const erroresLocales = validarTarjeta(numeroTarjeta, vencimiento, cvv);
  const numeroCompleto = soloDigitos(numeroTarjeta).length >= longitudTarjeta(marca);
  const numeroValido = numeroCompleto && !erroresLocales['pago.numeroTarjeta'];

  const tocar = (campo: string) => setTocados((t) => ({ ...t, [campo]: true }));

  const usarTarjetaPrueba = (numero: string) => {
    setNumeroTarjeta(numero);
    if (!titular.trim()) setTitular('TARJETA DE PRUEBA');
    setVencimiento(VENCE_PRUEBA);
    setCvv('123');
    setCampos({});
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (Object.keys(erroresLocales).length > 0) {
      setTocados({ 'pago.numeroTarjeta': true, 'pago.anioExpiracion': true, 'pago.cvv': true });
      setCampos({});
      return;
    }
    const fecha = leerVencimiento(vencimiento)!;
    setEnviando(true);
    setCampos({});
    try {
      const nuevo = await pagarCarrito({
        carritoId: carrito.id,
        direccionEnvio,
        telefono,
        pago: {
          titular,
          numeroTarjeta,
          mesExpiracion: fecha.mes,
          anioExpiracion: fecha.anio,
          cvv,
        },
      });
      setPedido(nuevo);
      window.scrollTo({ top: 0 });
      await recargar();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo procesar el pago'));
      setCampos(erroresDeCampos(err));
      bloquePago.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // El stock pudo cambiar: se refresca el carrito para mostrar la información real.
      await recargar();
    } finally {
      setEnviando(false);
    }
  };

  /** Error del servidor, o el local si el campo ya se tocó. */
  const errorCampo = (campo: string) => campos[campo] ?? (tocados[campo] ? erroresLocales[campo] : undefined);

  const errorDe = (campo: string) => {
    const msg = errorCampo(campo);
    return msg ? (
      <span className="field-error" id={`error-${campo}`}>
        {msg}
      </span>
    ) : null;
  };

  return (
    <div className="container">
      <Pasos actual={1} />
      <header className="page-header">
        <h1 className="page-title">Finalizar compra</h1>
        <p className="page-subtitle">Revisa tu pedido, dinos a dónde enviarlo y paga con tarjeta.</p>
      </header>

      <div className={styles.layout}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.bloque} aria-labelledby="titulo-envio">
            <h2 id="titulo-envio" className={styles.bloqueTitulo}>
              <span className={styles.bloqueNumero}>1</span> Envío
            </h2>
            <div className={styles.envioGrid}>
              <div className="field">
                <label htmlFor="direccion">Dirección de entrega</label>
                <input
                  id="direccion"
                  className="input"
                  value={direccionEnvio}
                  onChange={(e) => setDireccionEnvio(e.target.value)}
                  placeholder="Calle 10 # 20-30, Bogotá"
                  autoComplete="street-address"
                  maxLength={200}
                  required
                  aria-invalid={Boolean(campos.direccionEnvio)}
                />
                {errorDe('direccionEnvio')}
              </div>
              <div className="field">
                <label htmlFor="telefono">Celular</label>
                <input
                  id="telefono"
                  className="input"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="300 123 4567"
                  autoComplete="tel"
                  pattern="[0-9+ ]{7,20}"
                  required
                  aria-invalid={Boolean(campos.telefono)}
                />
                {errorDe('telefono')}
              </div>
            </div>
          </section>

          <section ref={bloquePago} className={styles.bloque} aria-labelledby="titulo-pago">
            <div className={styles.bloqueCabecera}>
              <h2 id="titulo-pago" className={styles.bloqueTitulo}>
                <span className={styles.bloqueNumero}>2</span> Pago
              </h2>
              <span className={styles.seguro}>
                <Candado /> Conexión cifrada
              </span>
            </div>

            <div className={styles.metodo}>
              <span className={styles.metodoRadio} aria-hidden="true" />
              <span className={styles.metodoNombre}>Tarjeta de crédito o débito</span>
              <span className={styles.metodoMarcas}>
                <MarcaTarjeta marca="visa" alto={14} />
                <MarcaTarjeta marca="mastercard" alto={18} />
                <MarcaTarjeta marca="amex" alto={18} />
              </span>
            </div>

            {error && (
              <div className={`alert alert-error ${styles.rechazo}`} role="alert">
                <strong>No pudimos completar el pago.</strong> {error}
              </div>
            )}

            <div className={styles.pagoGrid}>
              <div className={styles.previewCol}>
                <TarjetaPreview
                  numero={numeroTarjeta}
                  titular={titular}
                  vencimiento={vencimiento}
                  cvv={cvv}
                  volteada={enCvv}
                />
                <div className={styles.prueba}>
                  <span className={styles.pruebaTitulo}>Modo prueba · no uses una tarjeta real</span>
                  <div className={styles.pruebaBotones}>
                    {TARJETAS_PRUEBA.map((t) => (
                      <button
                        key={t.numero}
                        type="button"
                        className={styles.pruebaBtn}
                        onClick={() => usarTarjetaPrueba(t.numero)}
                      >
                        <span>{t.etiqueta}</span>
                        <code>•••• {t.numero.slice(-4)}</code>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.campos}>
                <div className="field">
                  <label htmlFor="numero">Número de tarjeta</label>
                  <div className={styles.conIcono}>
                    <input
                      id="numero"
                      className="input"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={numeroTarjeta}
                      onChange={(e) => setNumeroTarjeta(formatearNumero(e.target.value))}
                      onBlur={() => tocar('pago.numeroTarjeta')}
                      placeholder="0000 0000 0000 0000"
                      required
                      aria-invalid={Boolean(errorCampo('pago.numeroTarjeta'))}
                      aria-describedby="error-pago.numeroTarjeta"
                    />
                    <span className={styles.icono}>
                      <MarcaTarjeta marca={marca} alto={marca === 'visa' ? 13 : 18} />
                    </span>
                  </div>
                  {errorDe('pago.numeroTarjeta') ??
                    (numeroValido && <span className={styles.ok}>✓ Número válido</span>)}
                </div>
                <div className="field">
                  <label htmlFor="titular">Nombre en la tarjeta</label>
                  <input
                    id="titular"
                    className="input"
                    value={titular}
                    onChange={(e) => setTitular(e.target.value.toUpperCase())}
                    autoComplete="cc-name"
                    maxLength={100}
                    required
                  />
                  {errorDe('pago.titular')}
                </div>
                <div className={styles.cardRow}>
                  <div className="field">
                    <label htmlFor="vence">Vence</label>
                    <input
                      id="vence"
                      className="input"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={vencimiento}
                      onChange={(e) => setVencimiento(formatearVencimiento(e.target.value))}
                      onBlur={() => tocar('pago.anioExpiracion')}
                      placeholder="MM/AA"
                      required
                      aria-invalid={Boolean(errorCampo('pago.anioExpiracion'))}
                    />
                    {errorDe('pago.anioExpiracion')}
                  </div>
                  <div className="field">
                    <label htmlFor="cvv">CVV</label>
                    <input
                      id="cvv"
                      className="input"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, longitudCvv(marca)))}
                      onFocus={() => setEnCvv(true)}
                      onBlur={() => {
                        setEnCvv(false);
                        tocar('pago.cvv');
                      }}
                      placeholder={marca === 'amex' ? '1234' : '123'}
                      required
                      aria-invalid={Boolean(errorCampo('pago.cvv'))}
                    />
                    {errorDe('pago.cvv')}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <button type="submit" className={`btn btn-primary btn-block ${styles.pagar}`} disabled={enviando}>
            {enviando ? (
              <>
                <span className={styles.spinner} aria-hidden="true" /> Procesando pago...
              </>
            ) : (
              <>
                <Candado /> Pagar {formatearPrecio(carrito.total)}
              </>
            )}
          </button>
          <p className={styles.legal}>
            Solo guardamos la marca y los últimos 4 dígitos de la tarjeta. El número completo y el CVV nunca se
            almacenan.
          </p>
        </form>

        <aside className={styles.resumen} aria-label="Resumen del pedido">
          <h2 className={styles.resumenTitulo}>Tu pedido</h2>
          <ul className={styles.lineas}>
            {carrito.items.map((item) => (
              <li key={item.productoId} className={styles.linea}>
                <span className={styles.miniatura}>
                  {item.imagenUrl && <img src={item.imagenUrl} alt="" loading="lazy" />}
                  <span className={styles.cantidad}>{item.cantidad}</span>
                </span>
                <span className={styles.lineaInfo}>
                  <span className={styles.lineaNombre}>{item.nombre}</span>
                  <span className={styles.lineaMeta}>{formatearPrecio(item.precioUnitario)} c/u</span>
                </span>
                <span className={styles.lineaPrecio}>{formatearPrecio(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className={styles.cuentas}>
            <div>
              <span>Subtotal</span>
              <span>{formatearPrecio(carrito.total)}</span>
            </div>
            <div>
              <span>Envío</span>
              <span className={styles.gratis}>Gratis</span>
            </div>
          </div>
          <div className={styles.total}>
            <span>Total</span>
            <span>{formatearPrecio(carrito.total)}</span>
          </div>
          <Link to="/carrito" className={styles.volver}>
            ← Modificar carrito
          </Link>
        </aside>
      </div>
    </div>
  );
};

const Confirmacion: React.FC<{ pedido: Pedido; nombre?: string }> = ({ pedido, nombre }) => (
  <div className="container">
    <Pasos actual={2} />
    <section className={styles.confirmacion} aria-live="polite">
      <span className={styles.check} aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12.5 10 17 19 7" />
        </svg>
      </span>
      <span className="vacio-marca">Pago aprobado</span>
      <h1 className={styles.confirmacionTitulo}>¡Gracias{nombre ? `, ${nombre.split(' ')[0]}` : ''}! Tu pedido está en camino.</h1>
      <p className={styles.confirmacionTexto}>
        Registramos el pedido <strong>#{pedido.id}</strong>. Puedes seguir su estado en Mis pedidos.
      </p>

      <div className={styles.recibo}>
        <dl className={styles.reciboDatos}>
          <div>
            <dt>Referencia de pago</dt>
            <dd>{pedido.referenciaPago}</dd>
          </div>
          <div>
            <dt>Medio de pago</dt>
            <dd>{pedido.medioPago}</dd>
          </div>
          <div>
            <dt>Envío a</dt>
            <dd>{pedido.direccionEnvio}</dd>
          </div>
        </dl>
        <ul className={styles.reciboItems}>
          {pedido.items.map((i) => (
            <li key={i.productoId}>
              <span>
                {i.cantidad} × {i.nombreProducto}
              </span>
              <span>{formatearPrecio(i.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className={styles.total}>
          <span>Total pagado</span>
          <span>{formatearPrecio(pedido.total)}</span>
        </div>
      </div>

      <div className={styles.confirmacionAcciones}>
        <Link to="/pedidos" state={{ pedidoNuevo: pedido.id }} className="btn btn-primary">
          Ver mis pedidos
        </Link>
        <Link to="/" className="btn btn-secondary">
          Seguir comprando
        </Link>
      </div>
    </section>
  </div>
);
