import React from 'react';
import { MarcaTarjeta } from '../MarcaTarjeta/MarcaTarjeta';
import { detectarMarca, longitudCvv, longitudTarjeta, soloDigitos } from '../../utils/tarjeta';
import styles from './TarjetaPreview.module.scss';

interface Props {
  numero: string;
  titular: string;
  vencimiento: string;
  cvv: string;
  /** Muestra el reverso mientras se escribe el CVV. */
  volteada: boolean;
}

/** Vista previa de la tarjeta que se actualiza mientras se escribe. Solo es visual (aria-hidden). */
export const TarjetaPreview: React.FC<Props> = ({ numero, titular, vencimiento, cvv, volteada }) => {
  const marca = detectarMarca(numero);
  const digitos = soloDigitos(numero);
  const relleno = digitos.padEnd(longitudTarjeta(marca), '•');
  const grupos =
    marca === 'amex'
      ? [relleno.slice(0, 4), relleno.slice(4, 10), relleno.slice(10)]
      : relleno.match(/.{1,4}/g) ?? [];

  return (
    <div className={`${styles.escena} ${volteada ? styles.volteada : ''}`} aria-hidden="true">
      <div className={styles.tarjeta}>
        <div className={`${styles.cara} ${styles.frente} ${styles[marca]}`}>
          <div className={styles.fila}>
            <span className={styles.chip} />
            <MarcaTarjeta marca={marca} claro alto={26} />
          </div>
          <div className={styles.numero}>
            {grupos.map((g, i) => (
              <span key={i}>{g}</span>
            ))}
          </div>
          <div className={styles.fila}>
            <div>
              <span className={styles.etiqueta}>Titular</span>
              <span className={styles.valor}>{titular.trim() || 'NOMBRE APELLIDO'}</span>
            </div>
            <div className={styles.derecha}>
              <span className={styles.etiqueta}>Vence</span>
              <span className={styles.valor}>{vencimiento || 'MM/AA'}</span>
            </div>
          </div>
        </div>
        <div className={`${styles.cara} ${styles.reverso} ${styles[marca]}`}>
          <span className={styles.banda} />
          <div className={styles.firma}>
            <span className={styles.cvv}>{cvv.padEnd(longitudCvv(marca), '•')}</span>
          </div>
          <span className={styles.nota}>Código de seguridad</span>
        </div>
      </div>
    </div>
  );
};
