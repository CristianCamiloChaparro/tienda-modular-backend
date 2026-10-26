import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { pagarCarrito } from '../services/pedidos';
import { erroresDeCampos, formatearPrecio, mensajeDeError } from '../utils/formato';
import styles from './CheckoutPage.module.scss';

const anioActual = new Date().getFullYear();
const ANIOS = Array.from({ length: 10 }, (_, i) => anioActual + i);
const MESES = Array.from({ length: 12 }, (_, i) => i + 1);

/** Agrupa el número de la tarjeta de 4 en 4 mientras se escribe. */
function formatearTarjeta(valor: string): string {
  return valor
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

export const CheckoutPage: React.FC = () => {
  const { carrito, recargar } = useCart();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [direccionEnvio, setDireccionEnvio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [titular, setTitular] = useState(usuario?.nombre.toUpperCase() ?? '');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [mesExpiracion, setMesExpiracion] = useState(12);
  const [anioExpiracion, setAnioExpiracion] = useState(anioActual + 2);
  const [cvv, setCvv] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});

  if (!carrito || carrito.items.length === 0) {
    return (
      <div className="container">
        <header className="page-header">
          <h1 className="page-title">Pago</h1>
        </header>
        <div className={`panel ${styles.empty}`}>
          <p>No hay productos para pagar.</p>
          <Link to="/" className="btn btn-primary">
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setCampos({});
    try {
      const pedido = await pagarCarrito({
        carritoId: carrito.id,
        direccionEnvio,
        telefono,
        pago: { titular, numeroTarjeta, mesExpiracion, anioExpiracion, cvv },
      });
      await recargar();
      navigate('/pedidos', { state: { pedidoNuevo: pedido.id } });
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo procesar el pago'));
      setCampos(erroresDeCampos(err));
      // El stock pudo cambiar: se refresca el carrito para mostrar la información real.
      await recargar();
    } finally {
      setEnviando(false);
    }
  };

  const errorDe = (campo: string) =>
    campos[campo] ? (
      <span className="field-error" id={`error-${campo}`}>
        {campos[campo]}
      </span>
    ) : null;

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Pago</h1>
        <p className="page-subtitle">Completa los datos de envío y paga con tarjeta.</p>
      </header>

      <div className={styles.layout}>
        <form className="panel" onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <h2 className={styles.sectionTitle}>Datos de envío</h2>
          <div className="field">
            <label htmlFor="direccion">Dirección</label>
            <input
              id="direccion"
              className="input"
              value={direccionEnvio}
              onChange={(e) => setDireccionEnvio(e.target.value)}
              placeholder="Calle 10 # 20-30, Bogotá"
              maxLength={200}
              required
              aria-invalid={Boolean(campos.direccionEnvio)}
            />
            {errorDe('direccionEnvio')}
          </div>
          <div className="field">
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              className="input"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="3001234567"
              pattern="[0-9+ ]{7,20}"
              required
              aria-invalid={Boolean(campos.telefono)}
            />
            {errorDe('telefono')}
          </div>

          <h2 className={styles.sectionTitle}>Pago con tarjeta</h2>
          <div className="alert alert-info">
            <strong>Pasarela en modo prueba.</strong> No uses una tarjeta real. Aprobada:{' '}
            <code>4242 4242 4242 4242</code> · Rechazada: <code>4000 0000 0000 0002</code> · Cualquier CVV y
            fecha futura.
          </div>
          <div className="field">
            <label htmlFor="titular">Titular</label>
            <input
              id="titular"
              className="input"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              autoComplete="cc-name"
              maxLength={100}
              required
            />
            {errorDe('pago.titular')}
          </div>
          <div className="field">
            <label htmlFor="numero">Número de tarjeta</label>
            <input
              id="numero"
              className="input"
              inputMode="numeric"
              autoComplete="cc-number"
              value={numeroTarjeta}
              onChange={(e) => setNumeroTarjeta(formatearTarjeta(e.target.value))}
              placeholder="4242 4242 4242 4242"
              required
              aria-invalid={Boolean(campos['pago.numeroTarjeta'])}
            />
            {errorDe('pago.numeroTarjeta')}
          </div>
          <div className={styles.cardRow}>
            <div className="field">
              <label htmlFor="mes">Mes</label>
              <select
                id="mes"
                className="input"
                value={mesExpiracion}
                onChange={(e) => setMesExpiracion(Number(e.target.value))}
              >
                {MESES.map((m) => (
                  <option key={m} value={m}>
                    {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="anio">Año</label>
              <select
                id="anio"
                className="input"
                value={anioExpiracion}
                onChange={(e) => setAnioExpiracion(Number(e.target.value))}
              >
                {ANIOS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
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
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                required
                aria-invalid={Boolean(campos['pago.cvv'])}
              />
              {errorDe('pago.cvv')}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
            {enviando ? 'Procesando pago...' : `Pagar ${formatearPrecio(carrito.total)}`}
          </button>
        </form>

        <aside className={`panel ${styles.summary}`} aria-label="Resumen del pedido">
          <h2 className={styles.sectionTitle}>Tu pedido</h2>
          <ul className={styles.lines}>
            {carrito.items.map((item) => (
              <li key={item.productoId} className={styles.line}>
                <span>
                  {item.cantidad} × {item.nombre}
                </span>
                <span>{formatearPrecio(item.subtotal)}</span>
              </li>
            ))}
          </ul>
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
